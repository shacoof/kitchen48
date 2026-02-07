/**
 * RecipeStepPage — Recipe Steps Screen (View + Edit modes)
 * Two-pane layout: step navigator (left) + step detail/editor (right).
 * View mode: read-only with timer widget.
 * Edit mode (author only): inline editing with auto-save.
 * Accessible via /:nickname/:recipeSlug/:stepSlug
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  recipesApi,
  Recipe,
  Step,
  TimeUnit,
  CreateStepInput,
  UpdateStepInput,
  MasterIngredient,
} from '../services/recipes.api';
import { formatQuantity } from '../../../utils/measurement';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('RecipeStepPage');

// ============================================================================
// Constants
// ============================================================================

const FRACTION_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '—', value: 0 },
  { label: '\u215B', value: 0.125 },  // ⅛
  { label: '\u00BC', value: 0.25 },   // ¼
  { label: '\u2153', value: 0.333 },  // ⅓
  { label: '\u00BD', value: 0.5 },    // ½
  { label: '\u2154', value: 0.667 },  // ⅔
  { label: '\u00BE', value: 0.75 },   // ¾
];

const FRACTION_TOLERANCE = 0.02;

const UNIVERSAL_UNITS = ['cups', 'tbsp', 'tsp', 'pieces', 'pinch', 'cloves', 'slices', 'whole', 'bunch'];
const METRIC_UNITS = ['g', 'kg', 'ml', 'l'];
const IMPERIAL_UNITS = ['oz', 'lb', 'fl_oz'];

const METRIC_WEIGHT_VOLUME = new Set(['g', 'kg', 'ml', 'l']);

const AUTO_SAVE_DELAY = 1500;

// ============================================================================
// Helpers
// ============================================================================

function formatTime(value: number | null, unit: string | null): string {
  if (!value || !unit) return '';
  const labels: Record<string, string> = { SECONDS: 'sec', MINUTES: 'min', HOURS: 'hr', DAYS: 'days' };
  return `${value} ${labels[unit] || unit.toLowerCase()}`;
}

function toSeconds(value: number | null, unit: string | null): number {
  if (!value || !unit) return 0;
  switch (unit) {
    case 'SECONDS': return value;
    case 'MINUTES': return value * 60;
    case 'HOURS': return value * 3600;
    case 'DAYS': return value * 86400;
    default: return value;
  }
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getUnitsForSystem(system: string | null): string[] {
  const units = [...UNIVERSAL_UNITS];
  if (system === 'imperial') units.push(...IMPERIAL_UNITS);
  else units.push(...METRIC_UNITS); // default to metric
  return units;
}

/** Parse a decimal quantity into whole + best-matching fraction */
function parseToWholeFraction(qty: number | null): { whole: string; fraction: number } {
  if (qty === null || qty === 0) return { whole: '0', fraction: 0 };
  const w = Math.floor(qty);
  const frac = qty - w;
  if (frac < FRACTION_TOLERANCE) return { whole: String(w), fraction: 0 };
  const match = FRACTION_OPTIONS.find((f) => f.value > 0 && Math.abs(f.value - frac) < FRACTION_TOLERANCE);
  if (match) return { whole: String(w), fraction: match.value };
  return { whole: String(Number(qty.toFixed(3))), fraction: 0 };
}

// ============================================================================
// Edit State Types
// ============================================================================

interface IngredientEdit {
  id?: string;
  whole: string;
  fraction: number;
  unit: string;
  name: string;
  masterIngredientId: string | null;
}

interface StepEdit {
  title: string;
  instruction: string;
  videoUrl: string;
  prepTime: string;
  prepTimeUnit: TimeUnit;
  waitTime: string;
  waitTimeUnit: TimeUnit;
  ingredients: IngredientEdit[];
}

function stepToEdit(step: Step): StepEdit {
  return {
    title: step.title || '',
    instruction: step.instruction,
    videoUrl: step.videoUrl || '',
    prepTime: step.prepTime?.toString() || '',
    prepTimeUnit: step.prepTimeUnit || 'MINUTES',
    waitTime: step.waitTime?.toString() || '',
    waitTimeUnit: step.waitTimeUnit || 'MINUTES',
    ingredients: step.ingredients.map((i) => {
      const { whole, fraction } = parseToWholeFraction(i.quantity);
      return {
        id: i.id,
        whole,
        fraction,
        unit: i.unit || '',
        name: i.name,
        masterIngredientId: i.masterIngredientId,
      };
    }),
  };
}

function editToStepInput(edit: StepEdit, order: number): UpdateStepInput {
  return {
    title: edit.title || null,
    instruction: edit.instruction,
    order,
    videoUrl: edit.videoUrl || null,
    prepTime: edit.prepTime ? parseInt(edit.prepTime) : null,
    prepTimeUnit: edit.prepTime ? edit.prepTimeUnit : null,
    waitTime: edit.waitTime ? parseInt(edit.waitTime) : null,
    waitTimeUnit: edit.waitTime ? edit.waitTimeUnit : null,
    ingredients: edit.ingredients
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        name: i.name.trim(),
        quantity: combineQuantity(i.whole, i.fraction),
        unit: i.unit || null,
        order: idx,
        masterIngredientId: i.masterIngredientId,
      })),
  };
}

function combineQuantity(whole: string, fraction: number): number | null {
  const w = parseFloat(whole) || 0;
  const total = w + fraction;
  return total > 0 ? total : null;
}

// ============================================================================
// Main Component
// ============================================================================

export function RecipeStepPage() {
  const { nickname, recipeSlug, stepSlug } = useParams<{
    nickname: string;
    recipeSlug: string;
    stepSlug: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('recipes');

  // Core state
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode: view or edit
  const initialMode = searchParams.get('mode') === 'edit' ? 'edit' : 'view';
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);

  // Edit state
  const [editState, setEditState] = useState<StepEdit | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer state: { stepId: remainingSeconds }
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Ingredient autocomplete
  const [, setAcQuery] = useState('');
  const [acResults, setAcResults] = useState<MasterIngredient[]>([]);
  const [acActiveIdx, setAcActiveIdx] = useState<{ step: number; ing: number } | null>(null);
  const acTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Completed steps tracking (view mode)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isAuthor = user && recipe && user.id === recipe.authorId;
  const steps = recipe?.steps || [];
  const activeStep = steps[activeStepIdx] || null;
  const progress = steps.length > 0 ? Math.round(((activeStepIdx + 1) / steps.length) * 100) : 0;

  // Mobile step strip ref for scroll-snap
  const stripRef = useRef<HTMLDivElement>(null);

  // ──────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!nickname || !recipeSlug) {
      setError('Invalid URL');
      setLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug);

      if (result.error) {
        logger.warning(`Failed to load recipe: ${result.error}`);
        setError(result.error.includes('not found') ? 'not_found' : 'error');
        setLoading(false);
        return;
      }

      if (result.recipe) {
        setRecipe(result.recipe);

        // Resolve initial step from URL
        if (stepSlug && result.recipe.steps.length > 0) {
          const idx = result.recipe.steps.findIndex((s) => s.slug === stepSlug);
          const numMatch = stepSlug.match(/^step(\d+)$/);
          const foundIdx = idx >= 0 ? idx : numMatch ? parseInt(numMatch[1]) - 1 : 0;
          setActiveStepIdx(Math.max(0, Math.min(foundIdx, result.recipe.steps.length - 1)));
        }
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [nickname, recipeSlug]); // Only refetch on recipe change, not step change

  // Sync edit state when active step or mode changes
  useEffect(() => {
    if (mode === 'edit' && activeStep) {
      setEditState(stepToEdit(activeStep));
      setSaveStatus('idle');
    }
  }, [mode, activeStepIdx, activeStep?.id]);

  // ──────────────────────────────────────────────────────────────────────
  // Timer Tick
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const hasActive = Object.values(prev).some((r) => r > 0);
        if (!hasActive) return prev;
        const next: Record<string, number> = {};
        for (const [key, val] of Object.entries(prev)) {
          next[key] = Math.max(0, val - 1);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Auto-Save (Edit mode)
  // ──────────────────────────────────────────────────────────────────────

  const saveStep = useCallback(async (stepId: string, data: StepEdit, order: number) => {
    if (!recipe) return;
    setSaveStatus('saving');
    const input = editToStepInput(data, order);
    const result = await recipesApi.updateStep(recipe.id, stepId, input);
    if (result.recipe) {
      setRecipe(result.recipe);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } else {
      logger.error(`Failed to save step: ${result.error}`);
      setSaveStatus('error');
    }
  }, [recipe]);

  const triggerAutoSave = useCallback((data: StepEdit) => {
    if (!activeStep) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveStep(activeStep.id, data, activeStepIdx);
    }, AUTO_SAVE_DELAY);
  }, [activeStep, activeStepIdx, saveStep]);

  const updateEditField = useCallback(<K extends keyof StepEdit>(field: K, value: StepEdit[K]) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      triggerAutoSave(next);
      return next;
    });
  }, [triggerAutoSave]);

  // ──────────────────────────────────────────────────────────────────────
  // Ingredient Autocomplete
  // ──────────────────────────────────────────────────────────────────────

  const searchIngredients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAcResults([]);
      return;
    }
    const result = await recipesApi.searchIngredients(query);
    if (result.ingredients) {
      setAcResults(result.ingredients);
    }
  }, []);

  const handleIngredientNameChange = useCallback((ingIdx: number, value: string) => {
    if (!editState) return;
    const newIngs = [...editState.ingredients];
    newIngs[ingIdx] = { ...newIngs[ingIdx], name: value, masterIngredientId: null };
    const next = { ...editState, ingredients: newIngs };
    setEditState(next);
    triggerAutoSave(next);
    setAcActiveIdx({ step: activeStepIdx, ing: ingIdx });
    setAcQuery(value);

    if (acTimerRef.current) clearTimeout(acTimerRef.current);
    acTimerRef.current = setTimeout(() => searchIngredients(value), 300);
  }, [editState, activeStepIdx, triggerAutoSave, searchIngredients]);

  const selectAutocomplete = useCallback((ingIdx: number, mi: MasterIngredient) => {
    if (!editState) return;
    const newIngs = [...editState.ingredients];
    newIngs[ingIdx] = { ...newIngs[ingIdx], name: mi.name, masterIngredientId: mi.id };
    const next = { ...editState, ingredients: newIngs };
    setEditState(next);
    triggerAutoSave(next);
    setAcResults([]);
    setAcActiveIdx(null);
  }, [editState, triggerAutoSave]);

  // ──────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────

  const goToStep = useCallback((idx: number) => {
    if (idx < 0 || idx >= steps.length) return;
    // Mark current step as completed when moving forward
    if (idx > activeStepIdx) {
      setCompletedSteps((prev) => new Set(prev).add(activeStepIdx));
    }
    setActiveStepIdx(idx);
    const slug = steps[idx]?.slug || `step${idx + 1}`;
    navigate(`/${nickname}/${recipeSlug}/${slug}${mode === 'edit' ? '?mode=edit' : ''}`, { replace: true });

    // Scroll mobile strip to active
    if (stripRef.current) {
      const pill = stripRef.current.children[idx] as HTMLElement;
      pill?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [steps, activeStepIdx, nickname, recipeSlug, mode, navigate]);

  // ──────────────────────────────────────────────────────────────────────
  // Step CRUD (Edit mode)
  // ──────────────────────────────────────────────────────────────────────

  const handleAddStep = async () => {
    if (!recipe) return;
    const newStep: CreateStepInput = {
      instruction: '',
      order: steps.length,
      prepTime: null,
      prepTimeUnit: null,
      waitTime: null,
      waitTimeUnit: null,
      ingredients: [],
    };
    const result = await recipesApi.addStep(recipe.id, newStep);
    if (result.recipe) {
      setRecipe(result.recipe);
      setActiveStepIdx(result.recipe.steps.length - 1);
    }
  };

  const handleDeleteStep = async () => {
    if (!recipe || !activeStep) return;
    if (!confirm(t('steps.confirm_delete_step'))) return;
    const result = await recipesApi.deleteStep(recipe.id, activeStep.id);
    if (result.recipe) {
      setRecipe(result.recipe);
      setActiveStepIdx(Math.min(activeStepIdx, result.recipe.steps.length - 1));
    }
  };

  const handleMoveStep = async (direction: -1 | 1) => {
    if (!recipe) return;
    const newIdx = activeStepIdx + direction;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const newOrder = [...steps];
    const [moved] = newOrder.splice(activeStepIdx, 1);
    newOrder.splice(newIdx, 0, moved);
    const result = await recipesApi.reorderSteps(recipe.id, newOrder.map((s) => s.id));
    if (result.recipe) {
      setRecipe(result.recipe);
      setActiveStepIdx(newIdx);
    }
  };

  // ──────────────────────────────────────────────────────────────────────
  // Ingredient Edit Helpers
  // ──────────────────────────────────────────────────────────────────────

  const updateIngredientField = useCallback((ingIdx: number, field: keyof IngredientEdit, value: string | number | null) => {
    if (!editState) return;
    const newIngs = [...editState.ingredients];
    newIngs[ingIdx] = { ...newIngs[ingIdx], [field]: value };
    const next = { ...editState, ingredients: newIngs };
    setEditState(next);
    triggerAutoSave(next);
  }, [editState, triggerAutoSave]);

  const addIngredient = useCallback(() => {
    if (!editState) return;
    const next = {
      ...editState,
      ingredients: [...editState.ingredients, { whole: '', fraction: 0, unit: '', name: '', masterIngredientId: null }],
    };
    setEditState(next);
  }, [editState]);

  const removeIngredient = useCallback((ingIdx: number) => {
    if (!editState) return;
    const next = {
      ...editState,
      ingredients: editState.ingredients.filter((_, i) => i !== ingIdx),
    };
    setEditState(next);
    triggerAutoSave(next);
  }, [editState, triggerAutoSave]);

  // ──────────────────────────────────────────────────────────────────────
  // Timer Controls
  // ──────────────────────────────────────────────────────────────────────

  const startTimer = useCallback((stepId: string, step: Step) => {
    const secs = toSeconds(step.waitTime, step.waitTimeUnit);
    if (secs <= 0) return;
    setTimers((prev) => ({ ...prev, [stepId]: secs }));
  }, []);

  const stopTimer = useCallback((stepId: string) => {
    setTimers((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  }, []);

  // Active timers count (for badge)
  const activeTimerCount = useMemo(
    () => Object.values(timers).filter((r) => r > 0).length,
    [timers]
  );

  // Available units for this recipe
  const availableUnits = useMemo(
    () => getUnitsForSystem(recipe?.measurementSystem || null),
    [recipe?.measurementSystem]
  );

  // ──────────────────────────────────────────────────────────────────────
  // Render: Loading / Error States
  // ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">{t('steps.loading')}</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🍳</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {error === 'not_found' ? t('steps.not_found') : t('steps.error')}
        </h1>
        <p className="text-gray-600">
          {error === 'not_found' ? t('steps.not_found_message') : t('steps.error_message')}
        </p>
        <div className="flex gap-4 mt-4">
          <Link to={`/${nickname}/${recipeSlug}`} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            {t('steps.view_recipe')}
          </Link>
          <Link to="/" className="px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90">
            {t('steps.go_home')}
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Render: Main Layout
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* ── Header ── */}
      <header className="bg-primary text-white py-3 px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-display font-bold">
              Kitchen<span className="text-accent-orange">48</span>
            </Link>
            <Link
              to={`/${nickname}/${recipeSlug}`}
              className="hidden sm:flex items-center gap-1 text-white/70 hover:text-white text-sm"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {recipe.title}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Save status (edit mode) */}
            {mode === 'edit' && (
              <span className={`text-xs ${
                saveStatus === 'saving' ? 'text-yellow-300' :
                saveStatus === 'saved' ? 'text-green-300' :
                saveStatus === 'error' ? 'text-red-300' : 'text-white/50'
              }`}>
                {saveStatus === 'saving' ? t('steps.saving') :
                 saveStatus === 'saved' ? t('steps.saved') :
                 saveStatus === 'error' ? t('steps.save_error') : ''}
              </span>
            )}

            {/* Active timers badge */}
            {activeTimerCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                <span className="material-symbols-outlined text-sm">timer</span>
                {activeTimerCount}
              </span>
            )}

            {/* Mode toggle (author only) */}
            {isAuthor && (
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setMode('view')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mode === 'view' ? 'bg-white text-primary font-medium' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t('steps.mode_view')}
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mode === 'edit' ? 'bg-white text-primary font-medium' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t('steps.mode_edit')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Step Strip ── */}
      <div className="lg:hidden bg-white border-b px-4 py-2 overflow-x-auto flex-shrink-0">
        <div
          ref={stripRef}
          className="flex gap-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                idx === activeStepIdx
                  ? 'bg-accent-orange text-white'
                  : completedSteps.has(idx)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ scrollSnapAlign: 'center' }}
            >
              {completedSteps.has(idx) && idx !== activeStepIdx && (
                <span className="material-symbols-outlined text-xs mr-0.5">check</span>
              )}
              {idx + 1}
            </button>
          ))}
          {mode === 'edit' && (
            <button
              onClick={handleAddStep}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-accent-orange hover:bg-gray-200"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* ── Two-Pane Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Step Navigator (desktop only) */}
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-1">
            {steps.map((s, idx) => {
              const title = s.title || s.instruction.slice(0, 40) + (s.instruction.length > 40 ? '...' : '');
              const isActive = idx === activeStepIdx;
              const isComplete = completedSteps.has(idx);

              return (
                <button
                  key={s.id}
                  onClick={() => goToStep(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                    isActive
                      ? 'bg-accent-orange/10 border border-accent-orange/30'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Step number or checkmark */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-accent-orange text-white'
                      : isComplete
                      ? 'bg-accent-green text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isComplete && !isActive ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {title || `Step ${idx + 1}`}
                    </p>
                    {s.prepTime && s.prepTimeUnit && (
                      <span className="text-xs text-gray-400">
                        {formatTime(s.prepTime, s.prepTimeUnit)}
                      </span>
                    )}
                  </div>

                  {/* Edit mode: move/delete */}
                  {mode === 'edit' && isActive && (
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveStep(-1); }}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">keyboard_arrow_up</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveStep(1); }}
                        disabled={idx === steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add Step button (edit mode) */}
          {mode === 'edit' && (
            <div className="p-4 border-t mt-auto">
              <button
                onClick={handleAddStep}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-accent-orange border border-accent-orange/30 rounded-lg hover:bg-accent-orange/5 text-sm font-medium"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                {t('steps.add_step')}
              </button>
            </div>
          )}
        </aside>

        {/* Right Pane: Step Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="material-symbols-outlined text-6xl mb-4">restaurant_menu</span>
              <p>{t('steps.no_steps_yet')}</p>
              {mode === 'edit' && (
                <button
                  onClick={handleAddStep}
                  className="mt-4 px-6 py-2 bg-accent-orange text-white rounded-lg"
                >
                  {t('steps.add_step')}
                </button>
              )}
            </div>
          ) : activeStep && mode === 'view' ? (
            /* ─── VIEW MODE ─── */
            <div className="max-w-3xl mx-auto">
              {/* Step Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {activeStep.title
                    ? t('steps.step_title', { n: activeStepIdx + 1, title: activeStep.title })
                    : t('steps.step_n', { n: activeStepIdx + 1 })}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                  {activeStep.prepTime && activeStep.prepTimeUnit && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">timer</span>
                      {t('steps.prep_time')}: {formatTime(activeStep.prepTime, activeStep.prepTimeUnit)}
                    </span>
                  )}
                  {activeStep.waitTime && activeStep.waitTimeUnit && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">hourglass_empty</span>
                      {t('steps.wait_time')}: {formatTime(activeStep.waitTime, activeStep.waitTimeUnit)}
                    </span>
                  )}
                </div>
              </div>

              {/* Step Video */}
              {activeStep.videoUrl && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <a
                    href={activeStep.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent-orange hover:underline font-medium"
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                    {t('steps.video')}
                  </a>
                </div>
              )}

              {/* Instructions */}
              <div className="mb-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                  {activeStep.instruction}
                </p>
              </div>

              {/* Ingredients */}
              {activeStep.ingredients.length > 0 && (
                <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">grocery</span>
                    {t('steps.ingredients_for_step')}
                  </h3>
                  <ul className="space-y-2">
                    {activeStep.ingredients.map((ing) => (
                      <li key={ing.id} className="flex items-baseline gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                        <span>
                          <span className="font-medium text-amber-800">
                            {formatQuantity(ing.quantity, ing.unit)}
                          </span>
                          {' '}{ing.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timer Widget */}
              {activeStep.waitTime && activeStep.waitTimeUnit && (
                <div className="mb-6 p-5 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">timer</span>
                        {t('steps.wait_time')}
                      </h3>
                      <p className="text-3xl font-mono font-bold text-gray-800">
                        {timers[activeStep.id] !== undefined
                          ? formatTimer(timers[activeStep.id])
                          : formatTimer(toSeconds(activeStep.waitTime, activeStep.waitTimeUnit))}
                      </p>
                      {timers[activeStep.id] === 0 && (
                        <p className="text-accent-orange font-semibold mt-1 animate-pulse">
                          {t('steps.timer_done')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {timers[activeStep.id] === undefined || timers[activeStep.id] === 0 ? (
                        <button
                          onClick={() => startTimer(activeStep.id, activeStep)}
                          className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium text-sm hover:bg-green-600"
                        >
                          {t('steps.timer_start')}
                        </button>
                      ) : (
                        <button
                          onClick={() => stopTimer(activeStep.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600"
                        >
                          {t('steps.timer_stop')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeStep && mode === 'edit' && editState ? (
            /* ─── EDIT MODE ─── */
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Step Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                  {t('steps.step_n', { n: activeStepIdx + 1 })}
                </h2>
                {steps.length > 1 && (
                  <button
                    onClick={handleDeleteStep}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    {t('steps.delete_step')}
                  </button>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('steps.step_title', { n: activeStepIdx + 1, title: '' }).replace(': ', '')} — Title
                </label>
                <input
                  type="text"
                  value={editState.title}
                  onChange={(e) => updateEditField('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder={t('steps.title_placeholder')}
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('steps.instructions')} *
                </label>
                <textarea
                  value={editState.instruction}
                  onChange={(e) => updateEditField('instruction', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder={t('steps.instruction_placeholder')}
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('steps.video')}
                </label>
                <input
                  type="url"
                  value={editState.videoUrl}
                  onChange={(e) => updateEditField('videoUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder={t('steps.video_placeholder')}
                />
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('steps.prep_time')}</label>
                  <input
                    type="number"
                    value={editState.prepTime}
                    onChange={(e) => updateEditField('prepTime', e.target.value)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('steps.unit')}</label>
                  <select
                    value={editState.prepTimeUnit}
                    onChange={(e) => updateEditField('prepTimeUnit', e.target.value as TimeUnit)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  >
                    <option value="SECONDS">Seconds</option>
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('steps.wait_time')}</label>
                  <input
                    type="number"
                    value={editState.waitTime}
                    onChange={(e) => updateEditField('waitTime', e.target.value)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('steps.unit')}</label>
                  <select
                    value={editState.waitTimeUnit}
                    onChange={(e) => updateEditField('waitTimeUnit', e.target.value as TimeUnit)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  >
                    <option value="SECONDS">Seconds</option>
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                    <option value="DAYS">Days</option>
                  </select>
                </div>
              </div>

              {/* ── Ingredients Editor ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">{t('steps.ingredients_for_step')}</label>
                  <button
                    onClick={addIngredient}
                    className="text-sm text-accent-orange hover:underline font-medium"
                  >
                    + {t('steps.add_ingredient')}
                  </button>
                </div>

                {editState.ingredients.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">{t('steps.no_ingredients')}</p>
                ) : (
                  <div className="space-y-3">
                    {editState.ingredients.map((ing, ingIdx) => {
                      const showFraction = !METRIC_WEIGHT_VOLUME.has(ing.unit);

                      return (
                        <div key={ingIdx} className="flex flex-wrap gap-2 items-start p-3 bg-gray-50 rounded-lg">
                          {/* Whole number */}
                          <div className="w-16">
                            <label className="block text-xs text-gray-500 mb-0.5">{t('steps.whole')}</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={ing.whole}
                              onChange={(e) => updateIngredientField(ingIdx, 'whole', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                              placeholder="0"
                            />
                          </div>

                          {/* Fraction dropdown (hidden for metric weight/volume) */}
                          {showFraction && (
                            <div className="w-16">
                              <label className="block text-xs text-gray-500 mb-0.5">{t('steps.fraction')}</label>
                              <select
                                value={ing.fraction}
                                onChange={(e) => updateIngredientField(ingIdx, 'fraction', parseFloat(e.target.value))}
                                className="w-full px-1 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                              >
                                {FRACTION_OPTIONS.map((f) => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Unit dropdown */}
                          <div className="w-20">
                            <label className="block text-xs text-gray-500 mb-0.5">{t('steps.unit')}</label>
                            <select
                              value={ing.unit}
                              onChange={(e) => updateIngredientField(ingIdx, 'unit', e.target.value)}
                              className="w-full px-1 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                            >
                              <option value="">—</option>
                              {availableUnits.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>

                          {/* Ingredient name with autocomplete */}
                          <div className="flex-1 min-w-[140px] relative">
                            <label className="block text-xs text-gray-500 mb-0.5">{t('steps.ingredient_name')}</label>
                            <input
                              type="text"
                              value={ing.name}
                              onChange={(e) => handleIngredientNameChange(ingIdx, e.target.value)}
                              onBlur={() => setTimeout(() => setAcActiveIdx(null), 200)}
                              onFocus={() => {
                                if (ing.name.length >= 2) {
                                  setAcActiveIdx({ step: activeStepIdx, ing: ingIdx });
                                  searchIngredients(ing.name);
                                }
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                              placeholder={t('steps.ingredient_name')}
                            />
                            {/* Autocomplete dropdown */}
                            {acActiveIdx?.step === activeStepIdx && acActiveIdx?.ing === ingIdx && acResults.length > 0 && (
                              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {acResults.map((mi) => (
                                  <button
                                    key={mi.id}
                                    onMouseDown={() => selectAutocomplete(ingIdx, mi)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent-orange/10 transition-colors"
                                  >
                                    {mi.name}
                                  </button>
                                ))}
                              </div>
                            )}
                            {ing.masterIngredientId && (
                              <span className="absolute right-2 top-[22px] text-xs text-green-500">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                              </span>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => removeIngredient(ingIdx)}
                            className="mt-5 text-red-400 hover:text-red-600"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      {steps.length > 0 && (
        <footer className="bg-white border-t py-3 px-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => goToStep(activeStepIdx - 1)}
              disabled={activeStepIdx === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                activeStepIdx === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="hidden sm:inline">{t('steps.previous')}</span>
            </button>

            {/* Progress */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">
                {t('steps.progress', {
                  current: activeStepIdx + 1,
                  total: steps.length,
                  percent: progress,
                })}
              </span>
              <div className="w-32 md:w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-orange rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => goToStep(activeStepIdx + 1)}
              disabled={activeStepIdx === steps.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                activeStepIdx === steps.length - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'bg-accent-orange text-white hover:bg-opacity-90'
              }`}
            >
              <span className="hidden sm:inline">{t('steps.next')}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default RecipeStepPage;
