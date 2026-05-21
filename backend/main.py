from dotenv import load_dotenv
load_dotenv()

import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, meals, upload, recipes

app = FastAPI(title="CalorieSnap API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(meals.router)
app.include_router(upload.router)
app.include_router(recipes.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
