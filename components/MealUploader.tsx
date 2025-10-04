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
        <div className="mt-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">AI Meal Analysis</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">You can remove items to refine the calorie count.</p>
            <img src={imageUrl} alt="Meal" className="rounded-lg mt-2 max-h-60 w-full object-cover" />
            <div className="text-center my-4">
                <p className="text-4xl font-bold text-emerald-500">{currentAnalysis.totalCalories}</p>
                <p className="text-slate-500 dark:text-slate-400">Total Estimated Calories</p>
            </div>
            <ul className="space-y-2">
                {currentAnalysis.items.map((item, index) => (
                    <li key={index} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md flex justify-between items-center group">
                        <div>
                            <div className="font-semibold text-slate-700 dark:text-slate-200">{item.name} - ~{item.calories} kcal</div>
                            {item.avoidable && <p className="text-sm text-amber-600 dark:text-amber-400">Suggestion: {item.alternative || 'Consider a healthier option.'}</p>}
                        </div>
                        <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-bold text-xl px-2 transition-colors opacity-0 group-hover:opacity-100" aria-label={`Remove ${item.name}`}>&times;</button>
                    </li>
                ))}
            </ul>
             <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Give this meal a name" className="w-full mt-4 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <div className="flex justify-end space-x-2 mt-4">
                <button onClick={onCancel} className="px-4 py-2 rounded-md text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                <button onClick={() => onConfirm(mealName, currentAnalysis)} className="px-4 py-2 rounded-md text-white bg-emerald-500 hover:bg-emerald-600">Add to Journal</button>
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
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Track a Meal</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-1">Upload a photo of your meal for AI analysis.</p>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mt-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" ref={fileInputRef} disabled={isLoading}/>
      {isLoading && <div className="flex justify-center mt-4"><Spinner /></div>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {analysis && image && <AnalysisResult analysis={analysis} imageUrl={image} onConfirm={handleConfirm} onCancel={resetState} />}
    </Card>
  );
};