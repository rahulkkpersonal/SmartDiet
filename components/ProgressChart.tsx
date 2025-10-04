
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
            <h3 className="font-bold text-slate-800 dark:text-white">Weight Trend</h3>
            <div className="h-64 flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">Log at least two weight entries to see your progress chart.</p>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-bold text-slate-800 dark:text-white mb-4">Weight & BMI Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'BMI', angle: -90, position: 'insideRight' }} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem'
                }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} name="Weight (kg)" />
            <Line yAxisId="right" type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={2} name="BMI" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
