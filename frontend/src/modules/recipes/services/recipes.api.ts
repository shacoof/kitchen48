/**
 * Recipes API Service
 * Handles all recipe-related API calls
 */

const API_BASE = '/api';

// Types
export type TimeUnit = 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';

export interface StepIngredient {
  id: string;
  name: string;
  amount: string | null;
  order: number;
  stepId: string;
  masterIngredientId: string | null;
}

export interface Step {
  id: string;
  slug: string | null;
  instruction: string;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  workTime: number | null;
  workTimeUnit: TimeUnit | null;
  waitTime: number | null;
  waitTimeUnit: TimeUnit | null;
  recipeId: string;
  ingredients: StepIngredient[];
}

export interface RecipeAuthor {
  id: string;
  nickname: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePicture?: string | null;
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
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: RecipeAuthor;
  steps: Step[];
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

// Input types
export interface CreateStepIngredientInput {
  name: string;
  amount?: string | null;
  order?: number;
  masterIngredientId?: string | null;
}

export interface CreateStepInput {
  slug?: string | null;
  instruction: string;
  order: number;
  duration?: number | null;
  videoUrl?: string | null;
  workTime?: number | null;
  workTimeUnit?: TimeUnit | null;
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
  isPublished?: boolean;
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
export interface ApiResponse<T = void> {
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

export interface StepResponse {
  recipe: {
    id: string;
    title: string;
    slug: string;
    author: RecipeAuthor;
  };
  step: Step;
  totalSteps: number;
  stepIndex: number;
}

export interface IngredientsSearchResponse {
  ingredients: MasterIngredient[];
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
      console.error('API request failed:', error);
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
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/recipes/${id}`);
  }

  /**
   * Get recipe by semantic URL (nickname/slug)
   */
  async getRecipeBySemanticUrl(nickname: string, recipeSlug: string): Promise<RecipeResponse & ApiResponse> {
    return this.request<RecipeResponse>(`/users/${nickname}/recipes/${recipeSlug}`);
  }

  /**
   * Get step by semantic URL
   */
  async getStepBySemanticUrl(
    nickname: string,
    recipeSlug: string,
    stepSlug: string
  ): Promise<StepResponse & ApiResponse> {
    return this.request<StepResponse>(`/users/${nickname}/recipes/${recipeSlug}/${stepSlug}`);
  }

  /**
   * Get user's recipes by nickname
   */
  async getUserRecipes(nickname: string): Promise<{ recipes: RecipeListItem[] } & ApiResponse> {
    return this.request<{ recipes: RecipeListItem[] }>(`/users/${nickname}/recipes`);
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
