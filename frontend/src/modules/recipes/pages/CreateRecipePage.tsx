/**
 * CreateRecipePage
 * Create or edit a recipe
 * Accessible via /recipes/new or /recipes/:id/edit
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { recipesApi, CreateRecipeInput, CreateStepInput } from '../services/recipes.api';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('CreateRecipePage');

interface StepFormData {
  id?: string;
  instruction: string;
  workTime: string;
  workTimeUnit: string;
  waitTime: string;
  waitTimeUnit: string;
  videoUrl: string;
  ingredients: Array<{ name: string; amount: string }>;
}

const emptyStep: StepFormData = {
  instruction: '',
  workTime: '',
  workTimeUnit: 'MINUTES',
  waitTime: '',
  waitTimeUnit: 'MINUTES',
  videoUrl: '',
  ingredients: [],
};

export function CreateRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [steps, setSteps] = useState<StepFormData[]>([{ ...emptyStep }]);

  // Load existing recipe for edit mode
  useEffect(() => {
    if (isEdit && id) {
      const fetchRecipe = async () => {
        setLoading(true);
        const result = await recipesApi.getRecipeById(id);

        if (result.error) {
          logger.warning(`Failed to load recipe for edit: ${result.error}`);
          setError('Failed to load recipe');
        } else if (result.recipe) {
          const r = result.recipe;
          setTitle(r.title);
          setSlug(r.slug);
          setDescription(r.description || '');
          setPrepTime(r.prepTime?.toString() || '');
          setCookTime(r.cookTime?.toString() || '');
          setServings(r.servings?.toString() || '');
          setImageUrl(r.imageUrl || '');
          setVideoUrl(r.videoUrl || '');
          setIsPublished(r.isPublished);
          setSteps(
            r.steps.length > 0
              ? r.steps.map((s) => ({
                  id: s.id,
                  instruction: s.instruction,
                  workTime: s.workTime?.toString() || '',
                  workTimeUnit: s.workTimeUnit || 'MINUTES',
                  waitTime: s.waitTime?.toString() || '',
                  waitTimeUnit: s.waitTimeUnit || 'MINUTES',
                  videoUrl: s.videoUrl || '',
                  ingredients: s.ingredients.map((i) => ({
                    name: i.name,
                    amount: i.amount || '',
                  })),
                }))
              : [{ ...emptyStep }]
          );
        }

        setLoading(false);
      };

      fetchRecipe();
    }
  }, [isEdit, id]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit && title) {
      setSlug(recipesApi.generateSlug(title));
    }
  }, [title, isEdit]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const addStep = () => {
    setSteps([...steps, { ...emptyStep }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof StepFormData, value: unknown) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const addIngredient = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].ingredients.push({ name: '', amount: '' });
    setSteps(newSteps);
  };

  const updateIngredient = (
    stepIndex: number,
    ingIndex: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    const newSteps = [...steps];
    newSteps[stepIndex].ingredients[ingIndex][field] = value;
    setSteps(newSteps);
  };

  const removeIngredient = (stepIndex: number, ingIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].ingredients = newSteps[stepIndex].ingredients.filter(
      (_, i) => i !== ingIndex
    );
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Build steps data
    const stepsData: CreateStepInput[] = steps.map((s, index) => ({
      instruction: s.instruction,
      order: index,
      workTime: s.workTime ? parseInt(s.workTime) : null,
      workTimeUnit: s.workTime ? (s.workTimeUnit as 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS') : null,
      waitTime: s.waitTime ? parseInt(s.waitTime) : null,
      waitTimeUnit: s.waitTime ? (s.waitTimeUnit as 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS') : null,
      videoUrl: s.videoUrl || null,
      ingredients: s.ingredients
        .filter((i) => i.name.trim())
        .map((i, ingIndex) => ({
          name: i.name.trim(),
          amount: i.amount.trim() || null,
          order: ingIndex,
        })),
    }));

    const recipeData: CreateRecipeInput = {
      title,
      slug,
      description: description || null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      isPublished,
      steps: stepsData,
    };

    try {
      let result;
      if (isEdit && id) {
        result = await recipesApi.updateRecipe(id, recipeData);
      } else {
        result = await recipesApi.createRecipe(recipeData);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.recipe) {
        // Navigate to the recipe page
        navigate(`/${user?.nickname}/${result.recipe.slug}`);
      }
    } catch (err) {
      logger.error(`Error saving recipe: ${err}`);
      setError('Failed to save recipe');
    }

    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {isEdit ? 'Edit Recipe' : 'Create New Recipe'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={80}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="My Delicious Recipe"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">/{user?.nickname}/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    required
                    maxLength={80}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                    placeholder="my-delicious-recipe"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="Tell us about your recipe..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intro Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-accent-orange border-gray-300 rounded focus:ring-accent-orange"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Publish recipe (make it visible to everyone)
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Steps</h2>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1 text-accent-orange hover:underline"
              >
                <span className="material-symbols-outlined">add</span>
                Add Step
              </button>
            </div>

            <div className="space-y-6">
              {steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-accent-orange text-white rounded-full flex items-center justify-center font-bold">
                        {stepIndex + 1}
                      </div>
                      <span className="font-medium text-gray-700">Step {stepIndex + 1}</span>
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(stepIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions *
                      </label>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => updateStep(stepIndex, 'instruction', e.target.value)}
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        placeholder="Describe this step..."
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Work Time
                        </label>
                        <input
                          type="number"
                          value={step.workTime}
                          onChange={(e) => updateStep(stepIndex, 'workTime', e.target.value)}
                          min={0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={step.workTimeUnit}
                          onChange={(e) => updateStep(stepIndex, 'workTimeUnit', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        >
                          <option value="SECONDS">Seconds</option>
                          <option value="MINUTES">Minutes</option>
                          <option value="HOURS">Hours</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Wait Time
                        </label>
                        <input
                          type="number"
                          value={step.waitTime}
                          onChange={(e) => updateStep(stepIndex, 'waitTime', e.target.value)}
                          min={0}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={step.waitTimeUnit}
                          onChange={(e) => updateStep(stepIndex, 'waitTimeUnit', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        >
                          <option value="SECONDS">Seconds</option>
                          <option value="MINUTES">Minutes</option>
                          <option value="HOURS">Hours</option>
                          <option value="DAYS">Days</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Step Video URL
                      </label>
                      <input
                        type="url"
                        value={step.videoUrl}
                        onChange={(e) => updateStep(stepIndex, 'videoUrl', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    {/* Ingredients */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Ingredients for this step
                        </label>
                        <button
                          type="button"
                          onClick={() => addIngredient(stepIndex)}
                          className="text-sm text-accent-orange hover:underline"
                        >
                          + Add Ingredient
                        </button>
                      </div>
                      {step.ingredients.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No ingredients added</p>
                      ) : (
                        <div className="space-y-2">
                          {step.ingredients.map((ing, ingIndex) => (
                            <div key={ingIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={ing.amount}
                                onChange={(e) =>
                                  updateIngredient(stepIndex, ingIndex, 'amount', e.target.value)
                                }
                                className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-accent-orange focus:border-transparent text-sm"
                                placeholder="Amount"
                              />
                              <input
                                type="text"
                                value={ing.name}
                                onChange={(e) =>
                                  updateIngredient(stepIndex, ingIndex, 'name', e.target.value)
                                }
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-accent-orange focus:border-transparent text-sm"
                                placeholder="Ingredient name"
                              />
                              <button
                                type="button"
                                onClick={() => removeIngredient(stepIndex, ingIndex)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateRecipePage;
