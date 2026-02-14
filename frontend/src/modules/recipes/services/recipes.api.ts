/**
 * Recipes API Service
 * Handles all recipe-related API calls
 */

import { createLogger } from '../../../lib/logger';

const API_BASE = '/api';
const logger = createLogger('RecipesApi');

// Types
export type TimeUnit = 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';

export interface StepIngredient {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  order: number;
  stepId: string;
  masterIngredientId: string | null;
}

export interface MediaAssetRef {
  id: string;
  type: string;
  url: string | null;
  thumbnailUrl: string | null;
  status: string;
  durationSeconds: number | null;
}

export interface Step {
  id: string;
  slug: string | null;
  title: string | null;
  instruction: string;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  prepTime: number | null;
  prepTimeUnit: TimeUnit | null;
  waitTime: number | null;
  waitTimeUnit: TimeUnit | null;
  recipeId: string;
  imageId: string | null;
  image: MediaAssetRef | null;
  videoId: string | null;
  video: MediaAssetRef | null;
  ingredients: StepIngredient[];
}

export interface RecipeAuthor {
  id: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePicture?: string | null;
}

export interface DietaryTag {
  id: string;
  tag: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  heroImageId: string | null;
  heroImage: MediaAssetRef | null;
  introVideoId: string | null;
  introVideo: MediaAssetRef | null;
  isPublished: boolean;
  measurementSystem: string | null;
  difficulty: string | null;
  cuisine: string | null;
  mealType: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: RecipeAuthor;
  steps: Step[];
  dietaryTags?: DietaryTag[];
}

export interface RecipeListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  author: RecipeAuthor;
  _count: {
    steps: number;
  };
}

export interface MasterIngredient {
  id: string;
  name: string;
}

export interface AggregatedIngredient {
  name: string;
  totalQuantity: number | null;
  unit: string | null;
  masterIngredientId: string | null;
  stepReferences: Array<{
    stepId: string;
    stepOrder: number;
    stepTitle: string | null;
  }>;
}

// Input types
export interface CreateStepIngredientInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  order?: number;
  masterIngredientId?: string | null;
}

export interface CreateStepInput {
  slug?: string | null;
  title?: string | null;
  instruction: string;
  order: number;
  duration?: number | null;
  videoUrl?: string | null;
  imageId?: string | null;
  videoId?: string | null;
  prepTime?: number | null;
  prepTimeUnit?: TimeUnit | null;
  waitTime?: number | null;
  waitTimeUnit?: TimeUnit | null;
  ingredients?: CreateStepIngredientInput[];
}

export interface CreateRecipeInput {
  title: string;
  slug: string;
  description?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  heroImageId?: string | null;
  introVideoId?: string | null;
  isPublished?: boolean;
  measurementSystem?: string | null;
  difficulty?: string | null;
  cuisine?: string | null;
  mealType?: string | null;
  dietaryTags?: string[];
  steps?: CreateStepInput[];
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {}
export interface UpdateStepInput extends Partial<CreateStepInput> {
  id?: string;
}

export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  authorId?: string;
  isPublished?: boolean;
  search?: string;
}

// Response types
export interface ApiResponse {
  success?: boolean;
  error?: string;
  details?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface RecipeListResponse {
  recipes: RecipeListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface RecipeResponse {
  recipe: Recipe;
}

export interface IngredientsSearchResponse {
  ingredients: MasterIngredient[];
}

export interface IngredientSummaryResponse {
  ingredients: AggregatedIngredient[];
}

class RecipesApi {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T & ApiResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true } as T & ApiResponse;
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          ...data,
          success: false,
          error: data.error || 'Request failed',
        } as T & ApiResponse;
      }

      return { ...data, success: true } as T & ApiResponse;
    } catch (error) {
      logger.error(`API request failed: ${error}`);
      return {
        success: false,
        error: 'Network error. Please try again.',
      } as T & ApiResponse;
    }
  }

  /**
   * List recipes with pagination and filtering
   */
  async getRecipes(params: RecipeQueryParams = {}): Promise<RecipeListResponse & ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.authorId) searchParams.set('authorId', params.authorId);
    if (params.isPublished !== undefined) searchParams.set('isPublished', String(params.isPublished));
    if (params.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.request<RecipeListResponse>(`/recipes${query ? `?${query}` : ''}`);
  }

  /**
   * Get current user's recipes (includes unpublished)
   */
  async getMyRecipes(nickname: string): Promise<{ recipes: RecipeListItem[] } & ApiResponse> {
    return this.request<{ recipes: RecipeListItem[] }>(`/recipes/by-user/${encodeURIComponent(nickname)}`);
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${id}`);
  }

  /**
   * Get recipe by semantic URL (nickname/slug)
   */
  async getRecipeBySemanticUrl(nickname: string, recipeSlug: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/by-url/${encodeURIComponent(nickname)}/${encodeURIComponent(recipeSlug)}`);
  }

  /**
   * Get aggregated ingredient summary for a recipe
   */
  async getIngredientSummary(recipeId: string): Promise<IngredientSummaryResponse & ApiResponse> {
    return this.request<IngredientSummaryResponse>(`/recipes/${recipeId}/ingredient-summary`);
  }

  /**
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeInput): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeInput): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<ApiResponse> {
    return this.request(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Bookmark a recipe
   */
  async saveRecipe(recipeId: string): Promise<ApiResponse> {
    return this.request(`/recipes/${recipeId}/save`, {
      method: 'POST',
    });
  }

  /**
   * Remove bookmark from a recipe
   */
  async unsaveRecipe(recipeId: string): Promise<ApiResponse> {
    return this.request(`/recipes/${recipeId}/save`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a recipe
   */
  async duplicateRecipe(recipeId: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/duplicate`, {
      method: 'POST',
    });
  }

  /**
   * Toggle publish status
   */
  async togglePublish(recipeId: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/publish`, {
      method: 'PATCH',
    });
  }

  /**
   * Reorder steps
   */
  async reorderSteps(recipeId: string, stepIds: string[]): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/steps/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ stepIds }),
    });
  }

  /**
   * Add a step to a recipe
   */
  async addStep(recipeId: string, data: CreateStepInput): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a step
   */
  async updateStep(recipeId: string, stepId: string, data: UpdateStepInput): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a step
   */
  async deleteStep(recipeId: string, stepId: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${recipeId}/steps/${stepId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search master ingredients for autocomplete
   */
  async searchIngredients(query: string): Promise<IngredientsSearchResponse & ApiResponse> {
    return this.request<IngredientsSearchResponse>(`/recipes/search-ingredients?q=${encodeURIComponent(query)}`);
  }

  /**
   * Generate a URL-friendly slug from a title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  }
}

export const recipesApi = new RecipesApi();
export default recipesApi;
