import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WeightEntry } from '../types';
import { Card } from './common/Card';

interface ProgressChartProps {
  weightHistory: WeightEntry[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ weightHistory }) => {
  const formattedData = weightHistory.map(entry => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (weightHistory.length < 2) {
    return (
        <Card>
            <h3 className="font-bold text-zinc-800 dark:text-white">Weight Trend</h3>
            <div className="h-64 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 text-zinc-400 dark:text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m-5-1.5l1 1.5m0 0l.5 1.5m-5-1.5l.5 1.5m7.5-3l-4.5-6.375" />
                    </svg>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">Log at least two weight entries to see your progress chart.</p>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-bold text-zinc-800 dark:text-white mb-4">Weight & BMI Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'BMI', angle: -90, position: 'insideRight' }} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem'
                }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={2} name="Weight (kg)" />
            <Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={2} name="BMI" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};