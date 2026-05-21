export interface MealItem {
  name: string;
  portion: string;
  calories: number;
}

export interface Meal {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  label: string;
  inputType: 'image' | 'text';
  imageUrl?: string | null;
  aiDescription: string;
  userEditedDescription?: string | null;
  items: MealItem[];
  totalCalories: number;
  pros: string[];
  cons: string[];
  funFact: string;
}

export interface AIAnalysisResponse {
  description: string;
  items: MealItem[];
  totalCalories: number;
  pros: string[];
  cons: string[];
  funFact: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
}

export interface ExtraIngredient {
  name: string;
  quantity: string;
  why: string;
}

export interface Recipe {
  name: string;
  description: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  caloriesPerServing: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface EnhancedRecipe extends Recipe {
  extraIngredients: ExtraIngredient[];
}

export interface RecipeAnalysisResponse {
  ingredientsIdentified: string[];
  recipes: Recipe[];
  enhancedRecipes: EnhancedRecipe[];
}
