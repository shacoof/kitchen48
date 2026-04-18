#!/usr/bin/env python3
"""
Export all production recipes as kitchen48-recipe.yaml folders.

Each recipe becomes a folder named {nickname}-{slug}/ containing:
  - kitchen48-recipe.yaml      (full recipe metadata, schema v1.0)
  - hero.jpg                   (if recipe has hero image)
  - intro.mp4                  (if recipe has intro video and download succeeds)
  - step-{N}.jpg               (per-step image, if any)
  - step-{N}-video.mp4         (per-step video, if any and download succeeds)

Two modes:
  1. Local only (default) — generate folders in --staging-dir; you upload manually
  2. Drive upload — pass --folder-id to also push to a Drive folder
     (requires gcloud auth application-default login with drive.file scope)

Idempotent: when uploading to Drive, skips a recipe if the named folder already exists.

Prerequisites:
  - cloud-sql-proxy on port 5434 (auto-started if /home/owner/cloud-sql-proxy exists)

Usage:
  # Local only — drop folders into ./recipe-export/
  ./scripts/export-recipes-to-drive.py --staging-dir ./recipe-export

  # First test with a few
  ./scripts/export-recipes-to-drive.py --staging-dir ./recipe-export --limit 3

  # Also upload to Drive
  ./scripts/export-recipes-to-drive.py --staging-dir ./recipe-export --folder-id <DRIVE_ID>
"""
from __future__ import annotations

import argparse
import logging
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import psycopg
import requests
import yaml
from google.auth import default as google_auth_default
from google.auth.transport.requests import Request as GoogleAuthRequest
from googleapiclient.discovery import build as build_drive_service
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

PROD_DB_URL = "postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod"
CLOUD_SQL_PROXY = "/home/owner/cloud-sql-proxy"
CLOUD_SQL_INSTANCE = "kitchen48-app-1769028672:us-central1:kitchen48-db"
PROXY_PORT = 5434
SCHEMA_VERSION = "1.0"
DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder"
HTTP_TIMEOUT_SECONDS = 60
HTTP_RETRY_COUNT = 3

# Drive API scope. drive.file lets the app manage only files it created —
# minimum privilege. Cloud SQL proxy uses separate `gcloud auth` creds, not ADC.
DRIVE_SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("export")

# --------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------

@dataclass
class Ingredient:
    name: str
    quantity: Optional[float]
    unit: Optional[str]
    order: int

@dataclass
class Step:
    order: int
    title: Optional[str]
    instruction: str
    prep_time: Optional[int]
    prep_time_unit: Optional[str]
    wait_time: Optional[int]
    wait_time_unit: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    ingredients: list[Ingredient] = field(default_factory=list)

@dataclass
class Recipe:
    id: str
    title: str
    slug: str
    nickname: str
    description: Optional[str]
    servings: Optional[int]
    measurement_system: str
    difficulty: Optional[str]
    cuisine: Optional[str]
    meal_type: Optional[str]
    is_published: bool
    hero_image_url: Optional[str]
    intro_video_url: Optional[str]
    dietary_tags: list[str] = field(default_factory=list)
    steps: list[Step] = field(default_factory=list)

    @property
    def folder_name(self) -> str:
        return f"{self.nickname}-{self.slug}"

# --------------------------------------------------------------------------
# Cloud SQL proxy
# --------------------------------------------------------------------------

def ensure_proxy_running() -> None:
    """Start cloud-sql-proxy on PROXY_PORT if not already listening."""
    try:
        out = subprocess.run(
            ["lsof", "-i", f":{PROXY_PORT}"],
            capture_output=True,
            text=True,
        )
        if out.returncode == 0 and out.stdout.strip():
            log.info(f"cloud-sql-proxy already running on port {PROXY_PORT}")
            return
    except FileNotFoundError:
        pass

    if not Path(CLOUD_SQL_PROXY).exists():
        log.error(f"cloud-sql-proxy not found at {CLOUD_SQL_PROXY}")
        log.error("Install it or start the proxy manually.")
        sys.exit(1)

    log.info("Starting cloud-sql-proxy...")
    subprocess.Popen(
        [
            CLOUD_SQL_PROXY,
            CLOUD_SQL_INSTANCE,
            "--port", str(PROXY_PORT),
            "--address", "0.0.0.0",
            "--gcloud-auth",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    # Wait briefly for the port to come up
    for _ in range(15):
        time.sleep(1)
        try:
            with psycopg.connect(PROD_DB_URL, connect_timeout=2):
                log.info("cloud-sql-proxy is ready")
                return
        except psycopg.OperationalError:
            continue
    log.error("cloud-sql-proxy did not become ready in 15s")
    sys.exit(1)

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------

RECIPE_QUERY = """
SELECT
    r.id, r.title, r.slug, r.description, r.servings, r.measurement_system,
    r.difficulty, r.cuisine, r.meal_type, r.is_published,
    r.image_url AS legacy_image_url,
    r.video_url AS legacy_video_url,
    hero.url AS hero_image_url,
    intro.url AS intro_video_url,
    u.nickname AS nickname
FROM recipes r
JOIN users u ON u.id = r.author_id
LEFT JOIN media_assets hero  ON hero.id  = r.hero_image_id
LEFT JOIN media_assets intro ON intro.id = r.intro_video_id
ORDER BY r.created_at;
"""

DIETARY_TAGS_QUERY = """
SELECT recipe_id, tag FROM recipe_dietary_tags WHERE recipe_id = ANY(%s);
"""

STEPS_QUERY = """
SELECT
    s.id, s.recipe_id, s."order" AS order_, s.title, s.instruction,
    s.prep_time, s.prep_time_unit::text, s.wait_time, s.wait_time_unit::text,
    img.url AS image_url, vid.url AS video_url
FROM recipe_steps s
LEFT JOIN media_assets img ON img.id = s.image_id
LEFT JOIN media_assets vid ON vid.id = s.video_id
WHERE s.recipe_id = ANY(%s)
ORDER BY s.recipe_id, s."order";
"""

INGREDIENTS_QUERY = """
SELECT step_id, name, quantity, unit, "order" AS order_
FROM step_ingredients
WHERE step_id = ANY(%s)
ORDER BY step_id, "order";
"""

def fetch_recipes(limit: Optional[int]) -> list[Recipe]:
    with psycopg.connect(PROD_DB_URL) as conn, conn.cursor() as cur:
        cur.execute(RECIPE_QUERY)
        rows = cur.fetchall()
        if limit is not None:
            rows = rows[:limit]

        recipes: dict[str, Recipe] = {}
        for r in rows:
            (
                rid, title, slug, description, servings, measurement_system,
                difficulty, cuisine, meal_type, is_published,
                legacy_image_url, legacy_video_url,
                hero_image_url, intro_video_url, nickname,
            ) = r
            recipes[rid] = Recipe(
                id=rid,
                title=title,
                slug=slug,
                nickname=nickname or "anonymous",
                description=description,
                servings=servings,
                measurement_system=measurement_system or "metric",
                difficulty=difficulty,
                cuisine=cuisine,
                meal_type=meal_type,
                is_published=is_published,
                hero_image_url=hero_image_url or legacy_image_url,
                intro_video_url=intro_video_url or legacy_video_url,
            )

        recipe_ids = list(recipes.keys())
        if not recipe_ids:
            return []

        # Dietary tags
        cur.execute(DIETARY_TAGS_QUERY, (recipe_ids,))
        for recipe_id, tag in cur.fetchall():
            recipes[recipe_id].dietary_tags.append(tag)

        # Steps
        cur.execute(STEPS_QUERY, (recipe_ids,))
        step_rows = cur.fetchall()
        steps_by_id: dict[str, Step] = {}
        for s in step_rows:
            (
                step_id, recipe_id, order_, s_title, instruction,
                prep_time, prep_time_unit, wait_time, wait_time_unit,
                s_image_url, s_video_url,
            ) = s
            step = Step(
                order=order_,
                title=s_title,
                instruction=instruction or "",
                prep_time=prep_time,
                prep_time_unit=prep_time_unit,
                wait_time=wait_time,
                wait_time_unit=wait_time_unit,
                image_url=s_image_url,
                video_url=s_video_url,
            )
            steps_by_id[step_id] = step
            recipes[recipe_id].steps.append(step)

        # Ingredients
        if steps_by_id:
            cur.execute(INGREDIENTS_QUERY, (list(steps_by_id.keys()),))
            for step_id, name, quantity, unit, order_ in cur.fetchall():
                steps_by_id[step_id].ingredients.append(
                    Ingredient(
                        name=name,
                        quantity=float(quantity) if quantity is not None else None,
                        unit=unit,
                        order=order_,
                    )
                )

    return list(recipes.values())

# --------------------------------------------------------------------------
# YAML generation
# --------------------------------------------------------------------------

def recipe_to_yaml_dict(recipe: Recipe, hero_filename: Optional[str],
                        step_files: dict[int, dict[str, Optional[str]]]) -> dict:
    """Build the dict that becomes kitchen48-recipe.yaml.

    Videos are NOT downloaded — instead we record the source URL under
    introVideoSourceUrl / step.videoSourceUrl so the link is preserved for
    later download (when ffmpeg/yt-dlp is available, or once Cloudflare
    Stream downloads are enabled).
    """
    doc: dict[str, Any] = {
        "version": SCHEMA_VERSION,
        "title": recipe.title,
        "isPublished": recipe.is_published,
    }
    if recipe.description: doc["description"] = recipe.description
    if recipe.servings is not None: doc["servings"] = recipe.servings
    doc["measurementSystem"] = recipe.measurement_system
    if recipe.difficulty: doc["difficulty"] = recipe.difficulty
    if recipe.cuisine: doc["cuisine"] = recipe.cuisine
    if recipe.meal_type: doc["mealType"] = recipe.meal_type
    if recipe.dietary_tags: doc["dietaryTags"] = sorted(recipe.dietary_tags)
    if hero_filename: doc["heroImage"] = hero_filename
    if recipe.intro_video_url: doc["introVideoSourceUrl"] = recipe.intro_video_url

    doc["steps"] = []
    for step in sorted(recipe.steps, key=lambda s: s.order):
        files = step_files.get(step.order, {})
        step_doc: dict[str, Any] = {
            "order": step.order,
            "instruction": step.instruction,
        }
        if step.title: step_doc["title"] = step.title
        if step.prep_time is not None:
            step_doc["prepTime"] = step.prep_time
            step_doc["prepTimeUnit"] = step.prep_time_unit or "MINUTES"
        if step.wait_time is not None:
            step_doc["waitTime"] = step.wait_time
            step_doc["waitTimeUnit"] = step.wait_time_unit or "MINUTES"
        if files.get("image"): step_doc["image"] = files["image"]
        if step.video_url: step_doc["videoSourceUrl"] = step.video_url
        step_doc["ingredients"] = [
            {
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "order": ing.order,
            }
            for ing in sorted(step.ingredients, key=lambda i: i.order)
        ]
        doc["steps"].append(step_doc)
    return doc

# --------------------------------------------------------------------------
# Media download
# --------------------------------------------------------------------------

def http_get_with_retry(url: str) -> Optional[bytes]:
    for attempt in range(1, HTTP_RETRY_COUNT + 1):
        try:
            resp = requests.get(url, timeout=HTTP_TIMEOUT_SECONDS, stream=True)
            if resp.status_code == 200:
                return resp.content
            log.warning(f"  GET {url} → {resp.status_code} (attempt {attempt})")
        except requests.RequestException as e:
            log.warning(f"  GET {url} failed: {e} (attempt {attempt})")
        time.sleep(2 ** attempt)
    return None

def download_image(url: str, dest: Path) -> bool:
    data = http_get_with_retry(url)
    if data is None: return False
    dest.write_bytes(data)
    return True

def file_extension_from_url(url: str, fallback: str) -> str:
    # Strip query string
    clean = url.split("?", 1)[0]
    suffix = Path(clean).suffix.lower()
    if suffix and len(suffix) <= 5:
        return suffix
    return fallback

# --------------------------------------------------------------------------
# Recipe folder build
# --------------------------------------------------------------------------

def build_recipe_folder(recipe: Recipe, root: Path) -> Path:
    """Create a local folder with YAML + images for one recipe. Returns the folder path.

    Videos are intentionally not downloaded — their source URLs are recorded
    in the YAML instead (introVideoSourceUrl / step.videoSourceUrl).
    """
    folder = root / recipe.folder_name
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)

    hero_filename: Optional[str] = None
    step_files: dict[int, dict[str, Optional[str]]] = {}

    if recipe.hero_image_url:
        ext = file_extension_from_url(recipe.hero_image_url, ".jpg")
        target = folder / f"hero{ext}"
        if download_image(recipe.hero_image_url, target):
            hero_filename = target.name
        else:
            log.warning(f"  Hero image download failed for {recipe.folder_name}")

    for step in sorted(recipe.steps, key=lambda s: s.order):
        files: dict[str, Optional[str]] = {"image": None}
        n = step.order + 1  # human-friendly numbering (1-based)
        if step.image_url:
            ext = file_extension_from_url(step.image_url, ".jpg")
            target = folder / f"step-{n}{ext}"
            if download_image(step.image_url, target):
                files["image"] = target.name
        step_files[step.order] = files

    yaml_doc = recipe_to_yaml_dict(recipe, hero_filename, step_files)
    (folder / "kitchen48-recipe.yaml").write_text(
        yaml.safe_dump(yaml_doc, sort_keys=False, allow_unicode=True, width=120),
        encoding="utf-8",
    )
    return folder

# --------------------------------------------------------------------------
# Google Drive
# --------------------------------------------------------------------------

def get_drive_service():
    creds, _ = google_auth_default(scopes=DRIVE_SCOPES)
    if not creds.valid:
        creds.refresh(GoogleAuthRequest())
    return build_drive_service("drive", "v3", credentials=creds, cache_discovery=False)

def find_existing_folder(svc, parent_id: str, name: str) -> Optional[str]:
    q = (
        f"'{parent_id}' in parents and "
        f"mimeType = '{DRIVE_FOLDER_MIME}' and "
        f"name = '{name.replace(chr(39), chr(92) + chr(39))}' and "
        f"trashed = false"
    )
    res = svc.files().list(
        q=q,
        fields="files(id,name)",
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()
    files = res.get("files", [])
    return files[0]["id"] if files else None

def create_drive_folder(svc, parent_id: str, name: str) -> str:
    res = svc.files().create(
        body={"name": name, "mimeType": DRIVE_FOLDER_MIME, "parents": [parent_id]},
        fields="id",
        supportsAllDrives=True,
    ).execute()
    return res["id"]

def upload_file_to_drive(svc, parent_id: str, local_path: Path) -> None:
    media = MediaFileUpload(str(local_path), resumable=True)
    svc.files().create(
        body={"name": local_path.name, "parents": [parent_id]},
        media_body=media,
        fields="id",
        supportsAllDrives=True,
    ).execute()

def upload_recipe_folder(svc, parent_id: str, local_folder: Path) -> tuple[str, bool]:
    """Returns (drive_folder_id, was_created). If folder already existed, was_created=False."""
    existing = find_existing_folder(svc, parent_id, local_folder.name)
    if existing:
        return existing, False
    drive_id = create_drive_folder(svc, parent_id, local_folder.name)
    for f in sorted(local_folder.iterdir()):
        if f.is_file():
            upload_file_to_drive(svc, drive_id, f)
    return drive_id, True

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--folder-id",
        default=None,
        help="Google Drive folder ID. If omitted, only local folders are generated.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of recipes (for testing).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build folders locally but skip Drive upload.",
    )
    parser.add_argument(
        "--staging-dir",
        default="./recipe-export",
        help="Local output directory (default: ./recipe-export).",
    )
    args = parser.parse_args()

    staging = Path(args.staging_dir).resolve()
    staging.mkdir(parents=True, exist_ok=True)

    ensure_proxy_running()

    log.info("Querying production database...")
    recipes = fetch_recipes(args.limit)
    log.info(f"Fetched {len(recipes)} recipe(s)")

    drive_svc = None
    if args.folder_id and not args.dry_run:
        log.info("Connecting to Google Drive...")
        drive_svc = get_drive_service()

    created = 0
    skipped = 0
    failed = 0

    for i, recipe in enumerate(recipes, 1):
        prefix = f"[{i}/{len(recipes)}]"
        log.info(f"{prefix} {recipe.folder_name} ({'published' if recipe.is_published else 'draft'})")

        # If not dry run, check if Drive folder already exists — skip download too
        if drive_svc is not None:
            existing = find_existing_folder(drive_svc, args.folder_id, recipe.folder_name)
            if existing:
                log.info(f"  → already in Drive, skipping")
                skipped += 1
                continue

        try:
            folder = build_recipe_folder(recipe, staging)
            log.info(f"  built local folder ({sum(1 for _ in folder.iterdir())} files)")
        except Exception as e:
            log.error(f"  build failed: {e}")
            failed += 1
            continue

        if drive_svc is not None:
            try:
                _, was_created = upload_recipe_folder(drive_svc, args.folder_id, folder)
                if was_created:
                    log.info("  uploaded to Drive")
                    created += 1
                else:
                    skipped += 1
            except HttpError as e:
                log.error(f"  Drive upload failed: {e}")
                failed += 1

    log.info("=" * 60)
    log.info(f"Done. Created: {created}  Skipped: {skipped}  Failed: {failed}")
    log.info(f"Folders are at: {staging}")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
