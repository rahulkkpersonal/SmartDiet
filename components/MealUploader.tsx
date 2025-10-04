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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
    }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
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

  const triggerFileInput = () => {
      if (!isLoading) {
          fileInputRef.current?.click();
      }
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Track a Meal</h2>
      <p className="text-zinc-500 dark:text-zinc-400 mt-1">Upload a photo for AI-powered analysis.</p>
      
      {analysis && image ? (
          <AnalysisResult analysis={analysis} imageUrl={image} onConfirm={handleConfirm} onCancel={resetState} />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center mt-6 h-48">
            <Spinner className="w-10 h-10"/>
            <p className="text-zinc-500 dark:text-zinc-400 mt-3">Analyzing your meal...</p>
        </div>
      ) : error ? (
         <div className="mt-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="font-semibold">Oops! Something went wrong.</p>
            <p className="text-sm">{error}</p>
            <button onClick={resetState} className="mt-3 px-4 py-1.5 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors">Try again</button>
        </div>
      ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`mt-6 p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-300 group ${isDragging ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-zinc-300 dark:border-zinc-600 hover:border-teal-400 dark:hover:border-teal-600'}`}
            role="button"
            aria-label="Upload meal image"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput(); }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              disabled={isLoading}
            />
            <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 text-zinc-400 dark:text-zinc-500 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3" />
              </svg>
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">Drag & drop an image here</p>
              <p className="text-sm">or click to select a file</p>
            </div>
          </div>
      )}
    </Card>
  );
};
