# CalorieSnap — CLAUDE.md

## Project Overview
A mobile-first calorie tracking app with two core features:
1. **Calorie Tracking** — Log meals via food photo or text description. AI analyzes the food, returns a structured breakdown, and the user confirms before logging. All data is scoped per-day (12AM–11:59PM local time). No meal limit per day.
2. **Healthy Recipes** — Users photograph or describe their available ingredients; AI returns a structured list of recipes that can be made immediately, plus an "enhanced" section of recipes that need a few extra ingredients to make something truly exceptional.

---

## Tech Stack

### Frontend
- **Framework**: React Native with Expo (SDK 51+)
- **Styling**: NativeWind v4 (Tailwind for React Native)
- **State**: Zustand
- **Navigation**: Expo Router (file-based routing)
- **Image Handling**: expo-image-picker + expo-image-manipulator (compress to <500KB before upload)
- **Secure Storage**: expo-secure-store (JWT token storage — never AsyncStorage)
- **HTTP Client**: axios with interceptors for JWT injection
- **Calendar**: react-native-calendars
- **Icons**: @expo/vector-icons (Ionicons)
- **Theme**: Dark mode ONLY — no toggle, no light mode

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Auth**: JWT (python-jose) + bcrypt password hashing (passlib)
- **Database Client**: azure-cosmos (Cosmos DB SDK)
- **Azure OpenAI**: openai Python SDK (>=1.0.0) pointed at Azure endpoint
- **Blob Storage**: azure-storage-blob
- **CORS**: FastAPI CORSMiddleware — allow all origins in dev
- **Deployment**: Azure Web App (Linux, Python 3.11)

### Azure Resources
- **Azure OpenAI**: Two deployments —
  - `gpt-4.1` → image analysis (vision, most powerful)
  - `gpt-4.1-mini` → text description analysis (lightweight, fast)
- **Azure Cosmos DB**: NoSQL, two containers: `users`, `meals`
- **Azure Blob Storage**: Container `meal-images`, Hot tier
- **Azure Web App**: B1 tier for FastAPI backend
- **Azure Key Vault**: Secrets in production (optional for MVP, use .env locally)

---

## Environment Variables (Backend .env)

```
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_IMAGE_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_TEXT_DEPLOYMENT=gpt-4.1-mini
COSMOS_ENDPOINT=https://<your-account>.documents.azure.com:443/
COSMOS_KEY=<your-key>
COSMOS_DATABASE=calorietracker
COSMOS_USERS_CONTAINER=users
COSMOS_MEALS_CONTAINER=meals
AZURE_STORAGE_CONNECTION_STRING=<your-connection-string>
AZURE_STORAGE_CONTAINER=meal-images
JWT_SECRET=<strong-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
```

---

## Project Structure

```
calorietracker/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env
│   ├── routers/
│   │   ├── auth.py              # /auth/register, /auth/login
│   │   ├── meals.py             # /meals/* endpoints
│   │   ├── upload.py            # /upload/presigned-url
│   │   └── recipes.py           # /recipes/analyze/image, /recipes/analyze/text
│   ├── services/
│   │   ├── ai_service.py        # Azure OpenAI calls (meal + recipe analysis)
│   │   ├── cosmos_service.py    # Cosmos DB CRUD helpers
│   │   └── blob_service.py      # Blob Storage SAS URL generation
│   ├── models/
│   │   ├── user.py              # Pydantic models for User
│   │   ├── meal.py              # Pydantic models for Meal
│   │   └── recipe.py            # Pydantic models for Recipe analysis
│   └── auth/
│       └── jwt_handler.py       # JWT create/verify
│
└── frontend/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   ├── (app)/
    │   │   ├── _layout.tsx      # Protected layout — tabs: Home | Log | Recipes
    │   │   ├── index.tsx        # Home screen (today's log)
    │   │   ├── recipes.tsx      # Healthy recipes screen (ingredient → recipe AI)
    │   │   ├── calendar.tsx     # Calendar history (accessible from home header, not tab)
    │   │   └── meal/
    │   │       ├── [id].tsx     # Meal detail screen
    │   │       └── log.tsx      # Log meal flow (multi-step)
    │   └── _layout.tsx          # Root layout
    ├── components/
    │   ├── MealCard.tsx
    │   ├── CalorieBadge.tsx
    │   ├── AiDescriptionEditor.tsx
    │   └── ConfirmationModal.tsx
    ├── store/
    │   ├── authStore.ts
    │   └── mealStore.ts
    ├── services/
    │   └── api.ts               # axios instance + all API calls
    ├── types/
    │   └── index.ts             # Meal, Recipe, and AI response types
    └── constants/
        └── theme.ts             # colors, spacing, typography
```

---

## Data Models

### User (Cosmos DB `users` container)
```json
{
  "id": "uuid",
  "username": "string (plain text)",
  "passwordHash": "string (bcrypt)",
  "createdAt": "ISO datetime",
  "pk": "userId"
}
```

### Meal (Cosmos DB `meals` container)
```json
{
  "id": "uuid",
  "userId": "uuid",
  "date": "YYYY-MM-DD",
  "timestamp": "ISO datetime (local)",
  "label": "Breakfast | Lunch | Evening Snack | Dinner | Late Night | (user-edited)",
  "inputType": "image | text",
  "imageUrl": "string | null",
  "aiDescription": "string",
  "userEditedDescription": "string | null",
  "items": [{"name": "string", "portion": "string", "calories": 0}],
  "totalCalories": 0,
  "pros": ["string"],
  "cons": ["string"],
  "funFact": "string",
  "pk": "userId"
}
```
Partition key for `meals`: `/userId`

---

## API Endpoints

```
POST   /auth/register            → {username, password} → {userId, username}
POST   /auth/login               → {username, password} → {access_token, token_type}
GET    /meals/today              → [] meals for today (user from JWT)
GET    /meals/date/{YYYY-MM-DD}  → [] meals for a specific date
GET    /meals/{meal_id}          → single meal detail
POST   /meals/log                → save confirmed meal
DELETE /meals/{meal_id}          → delete a meal log
POST   /analyze/image            → {blobUrl} → AI structured response
POST   /analyze/text             → {description} → AI structured response
POST   /upload/presigned-url     → {filename} → {uploadUrl, blobUrl}
POST   /recipes/analyze/image    → {blobUrl} → RecipeAnalysisResponse (requires JWT)
POST   /recipes/analyze/text     → {description} → RecipeAnalysisResponse (requires JWT)
PATCH  /user/preferences         → update user settings (future use)
```

---

## Recipe Feature Spec

### Recipe Screen Flow
1. Step 1: User chooses photo or text input
2. Step 2: Input (image upload via same SAS flow, or text description)
3. Step 3: Results — two sections:
   - **Ready to Cook** — recipes using exactly the listed ingredients
   - **Level Up Your Meal** — recipes requiring a few extra ingredients (shown with what to buy and why)
4. Tapping any recipe card opens a full-screen modal with: badges (servings/time/difficulty/calories), description, extra ingredients to buy (enhanced only), full ingredients list, and numbered method steps
5. Recipe data is **not persisted** — stateless, re-analyzed each session

### Recipe AI Response Model (`RecipeAnalysisResponse`)
```json
{
  "ingredientsIdentified": ["string"],
  "recipes": [
    {
      "name": "string",
      "description": "string",
      "servings": 4,
      "prepTime": "15 min",
      "cookTime": "30 min",
      "difficulty": "Easy | Medium | Hard",
      "caloriesPerServing": 350,
      "ingredients": [{"name": "string", "quantity": "string"}],
      "steps": ["string"]
    }
  ],
  "enhancedRecipes": [
    {
      "name": "string",
      "description": "string",
      "servings": 4,
      "prepTime": "20 min",
      "cookTime": "45 min",
      "difficulty": "Medium",
      "caloriesPerServing": 450,
      "extraIngredients": [{"name": "string", "quantity": "string", "why": "string"}],
      "ingredients": [{"name": "string", "quantity": "string"}],
      "steps": ["string"]
    }
  ]
}
```

### Recipe AI Models Used
- Image input: `gpt-4.1` (vision deployment) — same as meal image analysis
- Text input: `gpt-4.1-mini` — same as meal text analysis
- Token budget: 2500 (recipes are longer responses than meal analysis)
- Both endpoints require JWT auth

---

## AI Service Spec

### Image Analysis (`gpt-4.1` deployment)
- Input: blob URL of food image
- System prompt must return ONLY valid JSON — no markdown, no preamble

```
System: You are a precise nutrition analyst. Analyze the food in this image.
Return ONLY valid JSON with this exact structure:
{
  "description": "brief conversational description of what you see",
  "items": [{"name": "...", "portion": "...", "calories": 0}],
  "totalCalories": 0,
  "pros": ["short health positive"],
  "cons": ["short health negative"],
  "funFact": "a specific, slightly humorous nutrition fact about this exact meal"
}
Be accurate with calorie estimates. Use midpoint if uncertain. Never add commentary outside JSON.
```

### Text Analysis (`gpt-4.1-mini` deployment)
- Input: user's text description of food
- Same system prompt and response structure as image analysis
- No image in the request body

### Re-analysis (after user edits description)
- Use `gpt-4.1-mini` (text path) with the edited text as input
- Same structured JSON output

---

## Meal Label Auto-Assignment (Backend Logic)
```python
def get_meal_label(local_hour: int) -> str:
    if 5 <= local_hour < 11:   return "Breakfast"
    if 11 <= local_hour < 15:  return "Lunch"
    if 15 <= local_hour < 18:  return "Evening Snack"
    if 18 <= local_hour < 22:  return "Dinner"
    return "Late Night"
```
Users can rename the label from the meal detail screen. Store the edited label in Cosmos DB.

---

## Day Boundary Rule
- All meal queries filter by `date == YYYY-MM-DD` derived from the **client's local timestamp**
- Frontend always sends `timestamp` (ISO string with local offset) when logging a meal
- Backend extracts `date` from this timestamp and stores it separately for efficient querying
- "Today" always means the calendar day in the user's local timezone

---

## Authentication Flow
1. Register: hash password with `bcrypt`, store `{username, passwordHash}` in Cosmos DB
2. Login: fetch user by username, verify hash → issue JWT (24h expiry)
3. Every protected request: FastAPI dependency `get_current_user` validates Bearer token
4. Frontend: store JWT in `expo-secure-store`, attach via axios interceptor, redirect to login on 401

---

## Image Upload Flow
1. Frontend picks image via `expo-image-picker`
2. Compress to max 500KB via `expo-image-manipulator`
3. Call `POST /upload/presigned-url` → get SAS upload URL + final blob URL
4. Frontend uploads image directly to Azure Blob Storage using the SAS URL (PUT request)
5. Frontend sends blob URL to `POST /analyze/image`
6. Backend passes blob URL to Azure OpenAI `gpt-4.1` — no re-downloading through server

---

## UI Design Rules
- **Dark mode only** — background `#0A0A0A`, surface `#141414`, elevated `#1E1E1E`
- **Accent color**: `#22C55E` (green — represents health/calories positively)
- **Danger/warning**: `#EF4444` (red — for cons, over-limit indicators)
- **Text**: `#F5F5F5` primary, `#A3A3A3` secondary, `#525252` muted
- **Font**: Use `expo-font` to load `SpaceGrotesk` for headings, `Inter` for body — or system default as fallback
- Mobile-first, all touch targets minimum 44x44px
- Bottom tab bar: Home, Log Meal (center CTA button), Calendar
- No light mode toggle anywhere in the app

---

## Screen Breakdown

### Login Screen
- Logo + app name at top
- Username input (plain text keyboard)
- Password input (secureTextEntry)
- Login button
- "Create Account" link → Register screen
- Show error message on failed auth

### Register Screen
- Username input
- Password input
- Confirm Password input
- Create Account button → auto-login on success

### Home Screen (Today)
- Header: date + logout icon (top right) + calendar icon (top right)
- Large calorie total at top: "X kcal today"
- Progress bar or ring showing total vs a soft 2000kcal reference
- List of today's meals as cards (label, time, calorie count, small thumbnail if image)
- FAB (floating action button) at bottom center: "+" to log a meal
- Tap meal card → Meal Detail Screen

### Log Meal Flow (multi-step, single screen with steps)
- Step 1: Choose input type — two large cards: "📷 Take Photo" | "✏️ Describe Meal"
- Step 2a (Image): Camera/gallery picker → upload → loading state "Analyzing your meal..."
- Step 2b (Text): Large text area → "Analyze" button → loading state
- Step 3: AI Description Review — show AI's description text in editable field
  - "Looks right ✓ Accept" button (green)
  - User can edit the text inline before accepting
  - "Re-analyze" button appears only if text was edited
- Step 4: Calorie Summary — show full breakdown: items list, total calories, pros/cons, fun fact
  - "Confirm & Log" button (green)
  - "Cancel" button (ghost/outline)
- On Confirm: save to DB, navigate back to Home, refresh meal list
- On Cancel: return to Step 1 (nothing logged)

### Meal Detail Screen
- Food image (if available) full-width at top with gradient overlay
- Meal label (editable — tap to rename)
- Time logged
- Total calories (large, prominent)
- Items breakdown list (name, portion, calories per item)
- Pros section (green checkmarks)
- Cons section (red X marks)
- Fun fact card (subtle, slightly playful style)
- Delete meal option (trash icon, confirm dialog before delete)

### Calendar Screen
- Full-month calendar (react-native-calendars)
- Tap a date → shows that day's total calories + meal list below
- Highlight days that have logged meals
- **Not a tab** — accessible via the calendar icon in the Home screen header only

### Recipes Screen (tab: leaf icon)
- Step 1: Choose photo or text input
- Step 2: Capture/upload photo (same SAS flow as meal images) or type ingredient list
- Step 3: Two-section results:
  - **Ready to Cook** — recipes from available ingredients only
  - **Level Up Your Meal** — recipes with a few extra purchase suggestions
- Tap any recipe card → full-screen modal with complete details
- Stateless — no DB storage, pure AI response

---

## Key Constraints & Rules
1. Never store images as base64 in Cosmos DB — always use Blob Storage URLs
2. JWT must be stored in expo-secure-store, never AsyncStorage
3. Passwords stored as bcrypt hashes only, never plain text
4. Always validate JWT on every protected endpoint via FastAPI Depends
5. Image compression must happen before upload (client-side) — target <500KB
6. The `date` field in meals must be derived from client's local timestamp, not server UTC
7. Meal confirmation is the ONLY action that writes to Cosmos DB — cancel means nothing is saved
8. No dark/light mode toggle — always dark
9. Re-analysis after user edit must use the text endpoint (gpt-4.1-mini), not vision endpoint
10. All AI responses must be parsed as strict JSON — handle parsing errors gracefully with user-friendly message

---

## Error Handling Patterns
- Network errors: show toast "Connection error, please try again"
- AI parsing failure: show "Couldn't analyze the meal, please try describing it in text"
- Auth errors (401): clear token, redirect to login
- Upload failures: show "Image upload failed" with retry option
- All async calls wrapped in try/catch with loading states

---

## Development Order (Recommended)
1. Backend: Auth (register/login/JWT) + Cosmos DB connection
2. Backend: Meal CRUD endpoints
3. Backend: Blob Storage upload + presigned URL endpoint
4. Backend: AI service (text analysis first, then image)
5. Frontend: Auth screens (login/register)
6. Frontend: Home screen with mock data
7. Frontend: Log meal flow (text path first)
8. Frontend: Image upload + vision path
9. Frontend: Meal detail screen
10. Frontend: Calendar screen
11. Polish: animations, loading states, error handling