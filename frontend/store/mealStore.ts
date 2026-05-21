import { create } from 'zustand';
import * as api from '../services/api';
import { Meal } from '../types';

interface MealStore {
  todayMeals: Meal[];
  selectedDateMeals: Meal[];
  selectedMeal: Meal | null;
  isLoading: boolean;
  fetchTodayMeals: () => Promise<void>;
  fetchMealsByDate: (date: string) => Promise<void>;
  fetchMealById: (id: string) => Promise<void>;
  logMeal: (mealData: Omit<Meal, 'id' | 'userId'>) => Promise<Meal>;
  deleteMeal: (id: string) => Promise<void>;
  updateLabel: (id: string, label: string) => Promise<void>;
}

function getLocalDate() {
  return new Date().toLocaleDateString('en-CA');
}

export const useMealStore = create<MealStore>((set, get) => ({
  todayMeals: [],
  selectedDateMeals: [],
  selectedMeal: null,
  isLoading: false,

  fetchTodayMeals: async () => {
    set({ isLoading: true });
    try {
      const meals = await api.getTodayMeals(getLocalDate());
      set({ todayMeals: meals, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMealsByDate: async (date: string) => {
    set({ isLoading: true });
    try {
      const meals = await api.getMealsByDate(date);
      set({ selectedDateMeals: meals, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMealById: async (id: string) => {
    set({ isLoading: true });
    try {
      const meal = await api.getMealById(id);
      set({ selectedMeal: meal, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  logMeal: async (mealData) => {
    const meal = await api.logMeal(mealData);
    set((state) => ({ todayMeals: [...state.todayMeals, meal] }));
    return meal;
  },

  deleteMeal: async (id: string) => {
    await api.deleteMeal(id);
    set((state) => ({
      todayMeals: state.todayMeals.filter((m) => m.id !== id),
      selectedDateMeals: state.selectedDateMeals.filter((m) => m.id !== id),
    }));
  },

  updateLabel: async (id: string, label: string) => {
    const updated = await api.updateMealLabel(id, label);
    set((state) => ({
      todayMeals: state.todayMeals.map((m) => (m.id === id ? updated : m)),
      selectedDateMeals: state.selectedDateMeals.map((m) => (m.id === id ? updated : m)),
      selectedMeal: state.selectedMeal?.id === id ? updated : state.selectedMeal,
    }));
  },
}));
