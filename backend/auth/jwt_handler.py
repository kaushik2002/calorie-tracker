import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", "24")))
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        os.getenv("JWT_SECRET"),
        algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
    )


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=[os.getenv("JWT_ALGORITHM", "HS256")],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    payload = verify_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
