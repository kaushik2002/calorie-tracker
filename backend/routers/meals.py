import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from models.meal import MealLog, MealLabelUpdate, AnalyzeImageRequest, AnalyzeTextRequest
from services import cosmos_service, ai_service
from auth.jwt_handler import get_current_user

router = APIRouter(tags=["meals"])


def get_meal_label(local_hour: int) -> str:
    if 5 <= local_hour < 11:
        return "Breakfast"
    if 11 <= local_hour < 15:
        return "Lunch"
    if 15 <= local_hour < 18:
        return "Evening Snack"
    if 18 <= local_hour < 22:
        return "Dinner"
    return "Late Night"


@router.get("/meals/today")
async def get_today_meals(localDate: str, user_id: str = Depends(get_current_user)):
    return cosmos_service.get_meals_by_date(user_id, localDate)


@router.get("/meals/date/{date}")
async def get_meals_by_date(date: str, user_id: str = Depends(get_current_user)):
    return cosmos_service.get_meals_by_date(user_id, date)


@router.get("/meals/{meal_id}")
async def get_meal(meal_id: str, user_id: str = Depends(get_current_user)):
    meal = cosmos_service.get_meal_by_id(meal_id, user_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.post("/meals/log")
async def log_meal(body: MealLog, user_id: str = Depends(get_current_user)):
    meal_id = str(uuid.uuid4())
    label = body.label
    if label == "auto":
        try:
            ts = datetime.fromisoformat(body.timestamp.replace("Z", "+00:00"))
            label = get_meal_label(ts.hour)
        except Exception:
            label = "Meal"

    meal_doc = {
        "id": meal_id,
        "pk": user_id,
        "userId": user_id,
        "date": body.date,
        "timestamp": body.timestamp,
        "label": label,
        "inputType": body.inputType,
        "imageUrl": body.imageUrl,
        "aiDescription": body.aiDescription,
        "userEditedDescription": body.userEditedDescription,
        "items": [item.model_dump() for item in body.items],
        "totalCalories": body.totalCalories,
        "pros": body.pros,
        "cons": body.cons,
        "funFact": body.funFact,
    }
    return cosmos_service.create_meal(meal_doc)


@router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: str, user_id: str = Depends(get_current_user)):
    meal = cosmos_service.get_meal_by_id(meal_id, user_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    cosmos_service.delete_meal(meal_id, user_id)
    return {"message": "Meal deleted"}


@router.patch("/meals/{meal_id}/label")
async def update_label(meal_id: str, body: MealLabelUpdate, user_id: str = Depends(get_current_user)):
    meal = cosmos_service.get_meal_by_id(meal_id, user_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    updated = cosmos_service.update_meal_label(meal_id, user_id, body.label)
    return updated


@router.post("/analyze/image")
async def analyze_image(body: AnalyzeImageRequest, _: str = Depends(get_current_user)):
    return ai_service.analyze_image(body.blobUrl)


@router.post("/analyze/text")
async def analyze_text(body: AnalyzeTextRequest, _: str = Depends(get_current_user)):
    return ai_service.analyze_text(body.description)
