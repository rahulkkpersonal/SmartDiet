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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-zinc-200/50 dark:border-zinc-700/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-teal-500">SmartDiet Tracker</h1>
            <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
              {['Dashboard', 'Progress'].map(view => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeView === view ? 'bg-white text-teal-600 shadow-sm dark:bg-zinc-700 dark:text-teal-300' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
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
                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Today's Summary</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Hello, {profile.name}! Here's your progress for today.</p>
                    <div className="mt-4">
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-4xl text-teal-500">{caloriesConsumed}</span>
                            <span className="text-zinc-500 dark:text-zinc-400">/ {plan.dailyCalorieGoal} kcal</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-4 mt-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-4 rounded-full transition-all duration-500" style={{ width: `${Math.min(calorieProgress, 100)}%` }}></div>
                        </div>
                    </div>
                </Card>
                <MealUploader onMealAdd={handleAddMeal} />
            </div>
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Today's Log</h3>
                {todaysMeals.length > 0 ? (
                  <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                    {todaysMeals.map(meal => (
                      <li key={meal.id} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                          <div>
                            <p className="font-semibold">{meal.name}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <span className="font-bold text-teal-500">{meal.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-center py-8">No meals logged yet today.</p>
                )}
              </Card>
              <Card>
                 <h3 className="text-lg font-bold text-zinc-800 dark:text-white">AI Diet Plan</h3>
                 <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <p><strong className="text-zinc-800 dark:text-zinc-100 font-semibold">Breakfast:</strong> {plan.mealSuggestions.breakfast}</p>
                    <p><strong className="text-zinc-800 dark:text-zinc-100 font-semibold">Lunch:</strong> {plan.mealSuggestions.lunch}</p>
                    <p><strong className="text-zinc-800 dark:text-zinc-100 font-semibold">Dinner:</strong> {plan.mealSuggestions.dinner}</p>
                    <p><strong className="text-zinc-800 dark:text-zinc-100 font-semibold">Snacks:</strong> {plan.mealSuggestions.snacks}</p>
                 </div>
              </Card>
            </div>
          </div>
        )}
        
        {activeView === 'Progress' && (
            <div className="space-y-6">
                <Card>
                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Track Your Weight</h2>
                    <form onSubmit={handleAddWeight} className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder={`Current weight: ${profile.weight} kg`} className="w-full sm:w-auto flex-grow px-4 py-2 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
                        <button type="submit" className="w-full sm:w-auto bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300">Log New Weight</button>
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