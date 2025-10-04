
import React, { useState } from 'react';
import type { UserProfile, DietPlan } from '../types';
import { calculateBMI, getBMICategory } from '../utils/helpers';
import { generateDietPlan } from '../services/geminiService';
import { Card } from './common/Card';
import { Spinner } from './common/Spinner';

interface ProfileSetupProps {
  onProfileCreated: (profile: UserProfile, plan: DietPlan) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileCreated }) => {
  const [formData, setFormData] = useState({ name: '', age: '', height: '', weight: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const { name, age, height, weight } = formData;
    if (!name || !age || !height || !weight) {
      setError('All fields are required.');
      return;
    }

    setIsLoading(true);
    try {
      const userProfile: UserProfile = {
        name,
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
        bmi: calculateBMI(parseInt(weight), parseInt(height)),
        bmiCategory: getBMICategory(calculateBMI(parseInt(weight), parseInt(height))),
      };
      const dietPlan = await generateDietPlan(userProfile);
      onProfileCreated(userProfile, dietPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome to SmartDiet</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Let's set up your profile to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input type="text" name="name" placeholder="Your Name" onChange={handleChange} value={formData.name} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
            <input type="number" name="age" placeholder="Age" onChange={handleChange} value={formData.age} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
            <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} value={formData.height} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
            <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} value={formData.weight} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-md hover:bg-emerald-600 transition duration-300 disabled:bg-emerald-300 flex items-center justify-center">
            {isLoading ? <Spinner /> : 'Create Profile & Generate Plan'}
          </button>
        </form>
      </Card>
    </div>
  );
};
