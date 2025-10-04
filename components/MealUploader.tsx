import React, { useState, useRef, useEffect } from 'react';
import type { Meal, MealAnalysis } from '../types';
import { analyzeMealImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { Card } from './common/Card';
import { Spinner } from './common/Spinner';

interface MealUploaderProps {
  onMealAdd: (meal: Meal) => void;
}

interface AnalysisResultProps {
  analysis: MealAnalysis;
  imageUrl: string;
  onConfirm: (name: string, finalAnalysis: MealAnalysis) => void;
  onCancel: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, imageUrl, onConfirm, onCancel }) => {
    const [mealName, setMealName] = useState('My Meal');
    const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis>(analysis);

    useEffect(() => {
        setCurrentAnalysis(analysis);
    }, [analysis]);
    
    const handleRemoveItem = (itemIndex: number) => {
        const updatedItems = currentAnalysis.items.filter((_, index) => index !== itemIndex);
        const updatedCalories = updatedItems.reduce((total, item) => total + item.calories, 0);

        setCurrentAnalysis({
            totalCalories: updatedCalories,
            items: updatedItems,
        });
    };
    
    return (
        <div className="mt-6">
            <h3 className="font-bold text-lg text-zinc-800 dark:text-white">AI Meal Analysis</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">You can remove items to refine the calorie count.</p>
            <img src={imageUrl} alt="Meal" className="rounded-lg mt-4 max-h-60 w-full object-cover" />
            <div className="text-center my-4">
                <p className="text-5xl font-bold text-teal-500">{currentAnalysis.totalCalories}</p>
                <p className="text-zinc-500 dark:text-zinc-400">Total Estimated Calories</p>
            </div>
            <ul className="space-y-2">
                {currentAnalysis.items.map((item, index) => (
                    <li key={index} className="p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex justify-between items-center group transition-colors">
                        <div>
                            <div className="font-semibold text-zinc-700 dark:text-zinc-200">{item.name} - ~{item.calories} kcal</div>
                            {item.avoidable && <p className="text-sm text-orange-600 dark:text-orange-400">Suggestion: {item.alternative || 'Consider a healthier option.'}</p>}
                        </div>
                        <button onClick={() => handleRemoveItem(index)} className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 font-bold text-2xl px-2 transition-all opacity-0 group-hover:opacity-100" aria-label={`Remove ${item.name}`}>&times;</button>
                    </li>
                ))}
            </ul>
             <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Give this meal a name" className="w-full mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
            <div className="flex justify-end space-x-3 mt-4">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors">Cancel</button>
                <button onClick={() => onConfirm(mealName, currentAnalysis)} className="px-4 py-2 rounded-lg text-white bg-teal-500 hover:bg-teal-600 transition-colors">Add to Journal</button>
            </div>
        </div>
    );
};


export const MealUploader: React.FC<MealUploaderProps> = ({ onMealAdd }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const base64Image = await fileToBase64(file);
      setImage(base64Image);
      const result = await analyzeMealImage(base64Image, file.type);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = (name: string, finalAnalysis: MealAnalysis) => {
    if (finalAnalysis && image) {
      const newMeal: Meal = {
        id: new Date().toISOString(),
        name: name,
        calories: finalAnalysis.totalCalories,
        imageUrl: image,
        analysis: finalAnalysis,
        timestamp: new Date().toISOString(),
      };
      onMealAdd(newMeal);
      resetState();
    }
  };
  
  const resetState = () => {
    setAnalysis(null);
    setImage(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Track a Meal</h2>
      <p className="text-zinc-500 dark:text-zinc-400 mt-1">Upload a photo of your meal for AI analysis.</p>
      <div className="mt-4">
        <label htmlFor="file-upload" className="sr-only">Choose a file</label>
        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" ref={fileInputRef} disabled={isLoading}/>
      </div>
      {isLoading && <div className="flex justify-center mt-6"><Spinner className="w-8 h-8"/></div>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {analysis && image && <AnalysisResult analysis={analysis} imageUrl={image} onConfirm={handleConfirm} onCancel={resetState} />}
    </Card>
  );
};