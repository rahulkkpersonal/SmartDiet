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
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center">
            <div className="mx-auto h-12 w-12 text-teal-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.503l1.23-2.257-1.23-2.257a.375.375 0 01.557-.503l5.603 3.113z" />
                </svg>
            </div>
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-white mt-4">Welcome to SmartDiet</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Let's set up your profile to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input type="text" name="name" placeholder="Your Name" onChange={handleChange} value={formData.name} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
            <input type="number" name="age" placeholder="Age" onChange={handleChange} value={formData.age} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
            <input type="number" name="height" placeholder="Height (cm)" onChange={handleChange} value={formData.height} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
            <input type="number" name="weight" placeholder="Weight (kg)" onChange={handleChange} value={formData.weight} className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" required />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-all duration-300 disabled:bg-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transform hover:-translate-y-0.5">
            {isLoading ? <Spinner /> : 'Create Profile & Generate Plan'}
          </button>
        </form>
      </Card>
    </div>
  );
};