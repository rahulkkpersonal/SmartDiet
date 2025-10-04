
import React, { useState, useMemo } from 'react';
import type { UserProfile, DietPlan, Meal, WeightEntry, AppView } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ProfileSetup } from './components/ProfileSetup';
import { Card } from './components/common/Card';
import { MealUploader } from './components/MealUploader';
import { ProgressChart } from './components/ProgressChart';
import { calculateBMI } from './utils/helpers';

const App: React.FC = () => {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>('userProfile', null);
  const [plan, setPlan] = useLocalStorage<DietPlan | null>('dietPlan', null);
  const [meals, setMeals] = useLocalStorage<Meal[]>('meals', []);
  const [weightHistory, setWeightHistory] = useLocalStorage<WeightEntry[]>('weightHistory', []);
  
  const [activeView, setActiveView] = useState('Dashboard');
  const [newWeight, setNewWeight] = useState('');

  const handleProfileCreated = (createdProfile: UserProfile, createdPlan: DietPlan) => {
    setProfile(createdProfile);
    setPlan(createdPlan);
    setWeightHistory([{ 
        date: new Date().toISOString(), 
        weight: createdProfile.weight,
        bmi: createdProfile.bmi
    }]);
  };

  const handleAddMeal = (meal: Meal) => {
    setMeals(prevMeals => [...prevMeals, meal]);
  };
  
  const handleAddWeight = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(profile && newWeight) {
        const weight = parseFloat(newWeight);
        const newEntry: WeightEntry = {
            date: new Date().toISOString(),
            weight: weight,
            bmi: calculateBMI(weight, profile.height)
        }
        setWeightHistory(prev => [...prev, newEntry]);
        // Also update current profile weight
        setProfile({...profile, weight: weight, bmi: newEntry.bmi});
        setNewWeight('');
    }
  }

  const todaysMeals = useMemo(() => {
    const today = new Date().toDateString();
    return meals.filter(meal => new Date(meal.timestamp).toDateString() === today);
  }, [meals]);

  const caloriesConsumed = useMemo(() => {
    return todaysMeals.reduce((total, meal) => total + meal.calories, 0);
  }, [todaysMeals]);

  if (!profile || !plan) {
    return <ProfileSetup onProfileCreated={handleProfileCreated} />;
  }

  const calorieProgress = plan.dailyCalorieGoal > 0 ? (caloriesConsumed / plan.dailyCalorieGoal) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-emerald-500">SmartDiet Tracker</h1>
            <div className="flex space-x-4">
              {['Dashboard', 'Progress'].map(view => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeView === view ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'Dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Today's Summary</h2>
                    <p className="text-slate-500 dark:text-slate-400">Hello, {profile.name}! Here's your progress for today.</p>
                    <div className="mt-4">
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-3xl text-emerald-500">{caloriesConsumed}</span>
                            <span className="text-slate-500 dark:text-slate-400">/ {plan.dailyCalorieGoal} kcal</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                            <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(calorieProgress, 100)}%` }}></div>
                        </div>
                    </div>
                </Card>
                <MealUploader onMealAdd={handleAddMeal} />
            </div>
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Today's Log</h3>
                {todaysMeals.length > 0 ? (
                  <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                    {todaysMeals.map(meal => (
                      <li key={meal.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                          <div>
                            <p className="font-semibold">{meal.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(meal.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <span className="font-bold text-emerald-500">{meal.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-slate-500 dark:text-slate-400">No meals logged yet today.</p>
                )}
              </Card>
              <Card>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Diet Plan</h3>
                 <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p><strong className="text-slate-800 dark:text-slate-100">Breakfast:</strong> {plan.mealSuggestions.breakfast}</p>
                    <p><strong className="text-slate-800 dark:text-slate-100">Lunch:</strong> {plan.mealSuggestions.lunch}</p>
                    <p><strong className="text-slate-800 dark:text-slate-100">Dinner:</strong> {plan.mealSuggestions.dinner}</p>
                    <p><strong className="text-slate-800 dark:text-slate-100">Snacks:</strong> {plan.mealSuggestions.snacks}</p>
                 </div>
              </Card>
            </div>
          </div>
        )}
        
        {activeView === 'Progress' && (
            <div className="space-y-6">
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Track Your Weight</h2>
                    <form onSubmit={handleAddWeight} className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder={`Current weight: ${profile.weight} kg`} className="w-full sm:w-auto flex-grow px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                        <button type="submit" className="w-full sm:w-auto bg-emerald-500 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-600 transition duration-300">Log New Weight</button>
                    </form>
                </Card>
                <ProgressChart weightHistory={weightHistory} />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
