from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserInDB(BaseModel):
    id: str
    username: str
    passwordHash: str
    createdAt: str
    pk: str
