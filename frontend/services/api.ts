import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Meal, AIAnalysisResponse, RecipeAnalysisResponse } from '../types';

const BASE_URL = 'https://caloriesnap-api.azurewebsites.net';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string) {
  const res = await api.post('/auth/login', { username, password });
  await SecureStore.setItemAsync('jwt_token', res.data.access_token);
  return res.data;
}

export async function register(username: string, password: string) {
  const res = await api.post('/auth/register', { username, password });
  return res.data;
}

export async function getTodayMeals(localDate: string): Promise<Meal[]> {
  const res = await api.get(`/meals/today?localDate=${localDate}`);
  return res.data;
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const res = await api.get(`/meals/date/${date}`);
  return res.data;
}

export async function getMealById(id: string): Promise<Meal> {
  const res = await api.get(`/meals/${id}`);
  return res.data;
}

export async function logMeal(mealData: Omit<Meal, 'id' | 'userId'>): Promise<Meal> {
  const res = await api.post('/meals/log', mealData);
  return res.data;
}

export async function deleteMeal(id: string): Promise<void> {
  await api.delete(`/meals/${id}`);
}

export async function updateMealLabel(id: string, label: string): Promise<Meal> {
  const res = await api.patch(`/meals/${id}/label`, { label });
  return res.data;
}

export async function getPresignedUrl(filename: string): Promise<{ uploadUrl: string; blobUrl: string }> {
  const res = await api.post('/upload/presigned-url', { filename });
  return res.data;
}

export async function analyzeImage(blobUrl: string): Promise<AIAnalysisResponse> {
  const res = await api.post('/analyze/image', { blobUrl });
  return res.data;
}

export async function analyzeText(description: string): Promise<AIAnalysisResponse> {
  const res = await api.post('/analyze/text', { description });
  return res.data;
}

export async function analyzeRecipesFromImage(blobUrl: string): Promise<RecipeAnalysisResponse> {
  const res = await api.post('/recipes/analyze/image', { blobUrl });
  return res.data;
}

export async function analyzeRecipesFromText(description: string): Promise<RecipeAnalysisResponse> {
  const res = await api.post('/recipes/analyze/text', { description });
  return res.data;
}

export async function uploadImageToBlob(sasUrl: string, imageUri: string): Promise<void> {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  await fetch(sasUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' },
    body: blob,
  });
}
