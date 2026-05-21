# CalorieSnap

A mobile-first AI-powered health app with two features:

- **Calorie Tracker** — Log meals via photo or text. AI returns a full nutritional breakdown (items, calories, pros, cons, fun fact). Confirm before saving. View history by day or calendar.
- **Healthy Recipes** — Photo or describe what's in your kitchen. AI suggests recipes you can make right now, plus a "Level Up Your Meal" section showing what to buy to make something exceptional.

Built with FastAPI, Azure OpenAI (gpt-4.1 + gpt-4.1-mini), Cosmos DB, Azure Blob Storage, and React Native (Expo).

---

## Backend Setup

### Prerequisites
- Python 3.11+
- Azure resources configured (see checklist below)

### Steps

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # Fill in your Azure credentials
uvicorn main:app --reload
```

API docs available at: http://localhost:8000/docs

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`

### Steps

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

> **Important**: Update `services/api.ts` `BASE_URL` to your backend IP if running on a physical device (replace `localhost` with your machine's local IP, e.g. `http://192.168.1.x:8000`).

---

## Azure Resource Setup Checklist

- [ ] **Azure OpenAI** — Create resource, deploy `gpt-4.1` (image/vision) and `gpt-4.1-mini` (text). Both are used for meal analysis and recipe generation.
- [ ] **Azure Cosmos DB** — Create NoSQL account, database `calorietracker`, containers:
  - `users` — partition key: `/id`
  - `meals` — partition key: `/userId`
- [ ] **Azure Blob Storage** — Create storage account, container `meal-images` (Hot tier, Blob access). Used for both meal photos and ingredient photos.
- [ ] Fill in `backend/.env` with all credentials

---

## Environment Variables (backend/.env)

```
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_IMAGE_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_TEXT_DEPLOYMENT=gpt-4.1-mini
COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/
COSMOS_KEY=<key>
COSMOS_DATABASE=calorietracker
COSMOS_USERS_CONTAINER=users
COSMOS_MEALS_CONTAINER=meals
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER=meal-images
JWT_SECRET=<strong-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
```
