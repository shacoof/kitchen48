-- AlterTable
ALTER TABLE "users" ADD COLUMN     "intro_video_id" TEXT,
ADD COLUMN     "profile_photo_id" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profile_photo_id_fkey" FOREIGN KEY ("profile_photo_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intro_video_id_fkey" FOREIGN KEY ("intro_video_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
