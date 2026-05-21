from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services import blob_service
from auth.jwt_handler import get_current_user

router = APIRouter(prefix="/upload", tags=["upload"])


class PresignedUrlRequest(BaseModel):
    filename: str


@router.post("/presigned-url")
async def get_presigned_url(body: PresignedUrlRequest, _: str = Depends(get_current_user)):
    return blob_service.generate_upload_sas(body.filename)
