import os
import json
from openai import AzureOpenAI
from fastapi import HTTPException
from models.meal import AIAnalysisResponse
from models.recipe import RecipeAnalysisResponse

_client = None

SYSTEM_PROMPT = """You are a precise nutrition analyst. Analyze the food provided and return ONLY valid JSON with no markdown, no backticks, no commentary — just the raw JSON object.
Use this exact structure:
{
  "description": "conversational description of what you see/read",
  "items": [{"name": "food item name", "portion": "estimated portion size", "calories": integer}],
  "totalCalories": integer,
  "pros": ["one positive health aspect"],
  "cons": ["one negative health aspect"],
  "funFact": "a specific, slightly humorous or surprising nutrition fact about this exact meal"
}
Be accurate with calorie estimates. If uncertain, use midpoint value. List each distinct food item separately."""


def _get_client() -> AzureOpenAI:
    global _client
    if _client is None:
        _client = AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        )
    return _client


def _parse_response(raw: str) -> AIAnalysisResponse:
    raw = raw.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(raw)
        return AIAnalysisResponse(**data)
    except (json.JSONDecodeError, Exception):
        raise HTTPException(status_code=422, detail="Could not parse AI response")


def analyze_image(blob_url: str) -> AIAnalysisResponse:
    client = _get_client()
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_IMAGE_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this food image and return the nutrition breakdown as JSON."},
                    {"type": "image_url", "image_url": {"url": blob_url}},
                ],
            },
        ],
        max_tokens=1000,
    )
    return _parse_response(response.choices[0].message.content)


def analyze_text(description: str) -> AIAnalysisResponse:
    client = _get_client()
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_TEXT_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Analyze this food description and return the nutrition breakdown as JSON:\n\n{description}",
            },
        ],
        max_tokens=1000,
    )
    return _parse_response(response.choices[0].message.content)


RECIPE_SYSTEM_PROMPT = """You are a creative chef and nutritionist. Analyze the provided ingredients and suggest healthy, delicious recipes.
Return ONLY valid JSON with no markdown, no backticks, no commentary — just the raw JSON object.
Use this exact structure:
{
  "ingredientsIdentified": ["ingredient1", "ingredient2"],
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief appetizing one-sentence description",
      "servings": 4,
      "prepTime": "15 min",
      "cookTime": "30 min",
      "difficulty": "Easy",
      "caloriesPerServing": 350,
      "ingredients": [{"name": "ingredient", "quantity": "amount"}],
      "steps": ["Step 1 description", "Step 2 description"]
    }
  ],
  "enhancedRecipes": [
    {
      "name": "Recipe Name",
      "description": "Brief appetizing one-sentence description",
      "servings": 4,
      "prepTime": "20 min",
      "cookTime": "45 min",
      "difficulty": "Medium",
      "caloriesPerServing": 450,
      "extraIngredients": [{"name": "ingredient", "quantity": "amount", "why": "brief reason this elevates the dish"}],
      "ingredients": [{"name": "ingredient", "quantity": "amount"}],
      "steps": ["Step 1 description", "Step 2 description"]
    }
  ]
}
Provide exactly 3 recipes in each section. Be specific with quantities. difficulty must be exactly "Easy", "Medium", or "Hard"."""


def _parse_recipe_response(raw: str) -> RecipeAnalysisResponse:
    raw = raw.strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(raw)
        return RecipeAnalysisResponse(**data)
    except (json.JSONDecodeError, Exception):
        raise HTTPException(status_code=422, detail="Could not parse recipe AI response")


def analyze_recipes_from_image(blob_url: str) -> RecipeAnalysisResponse:
    client = _get_client()
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_IMAGE_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": RECIPE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Identify the ingredients in this image and suggest recipes as JSON."},
                    {"type": "image_url", "image_url": {"url": blob_url}},
                ],
            },
        ],
        max_tokens=2500,
    )
    return _parse_recipe_response(response.choices[0].message.content)


def analyze_recipes_from_text(description: str) -> RecipeAnalysisResponse:
    client = _get_client()
    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_TEXT_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": RECIPE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"I have these ingredients: {description}\n\nSuggest recipes as JSON.",
            },
        ],
        max_tokens=2500,
    )
    return _parse_recipe_response(response.choices[0].message.content)
