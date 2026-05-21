import logging
import traceback
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services import ai_service
from auth.jwt_handler import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["recipes"])


class ImageAnalyzeRequest(BaseModel):
    blobUrl: str


class TextAnalyzeRequest(BaseModel):
    description: str


@router.post("/analyze/image")
def analyze_recipes_image(body: ImageAnalyzeRequest, _: dict = Depends(get_current_user)):
    try:
        logger.info("[RECIPES] Image analysis request")
        result = ai_service.analyze_recipes_from_image(body.blobUrl)
        logger.info(f"[RECIPES] Image analysis success — {len(result.recipes)} recipes returned")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[RECIPES] Image analysis failed: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Recipe analysis error: {type(e).__name__}: {str(e)}")


@router.post("/analyze/text")
def analyze_recipes_text(body: TextAnalyzeRequest, _: dict = Depends(get_current_user)):
    try:
        logger.info(f"[RECIPES] Text analysis request: {body.description[:60]!r}")
        result = ai_service.analyze_recipes_from_text(body.description)
        logger.info(f"[RECIPES] Text analysis success — {len(result.recipes)} recipes returned")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[RECIPES] Text analysis failed: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Recipe analysis error: {type(e).__name__}: {str(e)}")
