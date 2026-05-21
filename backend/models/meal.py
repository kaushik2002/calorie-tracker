from pydantic import BaseModel
from typing import List, Optional


class MealItem(BaseModel):
    name: str
    portion: str
    calories: int


class AIAnalysisResponse(BaseModel):
    description: str
    items: List[MealItem]
    totalCalories: int
    pros: List[str]
    cons: List[str]
    funFact: str


class MealLog(BaseModel):
    userId: Optional[str] = None
    date: str
    timestamp: str
    label: str
    inputType: str
    imageUrl: Optional[str] = None
    aiDescription: str
    userEditedDescription: Optional[str] = None
    items: List[MealItem]
    totalCalories: int
    pros: List[str]
    cons: List[str]
    funFact: str


class MealLabelUpdate(BaseModel):
    label: str


class AnalyzeImageRequest(BaseModel):
    blobUrl: str


class AnalyzeTextRequest(BaseModel):
    description: str
