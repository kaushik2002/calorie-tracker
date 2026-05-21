import uuid
import logging
import traceback
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from models.user import UserRegister, UserLogin
from services import cosmos_service
from auth.jwt_handler import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register")
async def register(body: UserRegister):
    try:
        logger.info(f"[REGISTER] Attempt for username: {body.username!r}")

        existing = cosmos_service.get_user_by_username(body.username)
        if existing:
            logger.info(f"[REGISTER] Username already taken: {body.username!r}")
            raise HTTPException(status_code=409, detail="Username already taken")

        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "username": body.username,
            "passwordHash": pwd_context.hash(body.password),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "pk": user_id,
        }
        cosmos_service.create_user(user_doc)
        logger.info(f"[REGISTER] Success for username: {body.username!r}, id: {user_id}")
        return {"userId": user_id, "username": body.username}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REGISTER] FAILED for username: {body.username!r}")
        logger.error(f"[REGISTER] Error type: {type(e).__name__}")
        logger.error(f"[REGISTER] Error message: {str(e)}")
        logger.error(f"[REGISTER] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration error: {type(e).__name__}: {str(e)}")


@router.post("/login")
async def login(body: UserLogin):
    try:
        logger.info(f"[LOGIN] Attempt for username: {body.username!r}")

        user = cosmos_service.get_user_by_username(body.username)
        if not user:
            logger.info(f"[LOGIN] Username not found: {body.username!r}")
            raise HTTPException(status_code=401, detail="Invalid username or password")

        if not pwd_context.verify(body.password, user["passwordHash"]):
            logger.info(f"[LOGIN] Wrong password for username: {body.username!r}")
            raise HTTPException(status_code=401, detail="Invalid username or password")

        token = create_access_token({"sub": user["id"], "username": user["username"]})
        logger.info(f"[LOGIN] Success for username: {body.username!r}")
        return {"access_token": token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LOGIN] FAILED for username: {body.username!r}")
        logger.error(f"[LOGIN] Error type: {type(e).__name__}")
        logger.error(f"[LOGIN] Error message: {str(e)}")
        logger.error(f"[LOGIN] Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Login error: {type(e).__name__}: {str(e)}")
