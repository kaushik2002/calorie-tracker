from typing import List, Literal
from pydantic import BaseModel


class RecipeIngredient(BaseModel):
    name: str
    quantity: str


class ExtraIngredient(BaseModel):
    name: str
    quantity: str
    why: str


class Recipe(BaseModel):
    name: str
    description: str
    servings: int
    prepTime: str
    cookTime: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    caloriesPerServing: int
    ingredients: List[RecipeIngredient]
    steps: List[str]


class EnhancedRecipe(Recipe):
    extraIngredients: List[ExtraIngredient]


class RecipeAnalysisResponse(BaseModel):
    ingredientsIdentified: List[str]
    recipes: List[Recipe]
    enhancedRecipes: List[EnhancedRecipe]
