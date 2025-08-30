import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Mock data - would be fetched from Supabase in a real implementation
const data = [
  { name: "1X2", accuracy: 68.4, expected: 72.1 },
  { name: "O/U", accuracy: 72.3, expected: 69.8 },
  { name: "BTTS", accuracy: 76.5, expected: 74.2 },
  { name: "HT/FT", accuracy: 58.7, expected: 62.5 },
];

export const PredictionAccuracyByMarketChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
        <Legend />
        <Bar dataKey="accuracy" name="Actual Accuracy" fill="hsl(var(--heroui-primary))" />
        <Bar dataKey="expected" name="Expected Accuracy" fill="hsl(var(--heroui-secondary-200))" />
      </BarChart>
    </ResponsiveContainer>
  );
};