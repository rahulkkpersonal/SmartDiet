
export interface UserProfile {
  name: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  bmi: number;
  bmiCategory: string;
}

export interface DietPlan {
  dailyCalorieGoal: number;
  macroBreakdown: {
    protein: number; // in grams
    carbs: number; // in grams
    fat: number; // in grams
  };
  mealSuggestions: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
}

export interface MealAnalysis {
  totalCalories: number;
  items: AnalyzedItem[];
}

export interface AnalyzedItem {
  name:string;
  calories: number;
  avoidable: boolean;
  alternative?: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  imageUrl?: string; // base64 string
  analysis?: MealAnalysis;
  timestamp: string;
}

export interface WeightEntry {
  date: string; // ISO string
  weight: number; // in kg
  bmi: number;
}

export enum AppView {
  ProfileSetup = 'PROFILE_SETUP',
  Dashboard = 'DASHBOARD',
  Progress = 'PROGRESS',
}
