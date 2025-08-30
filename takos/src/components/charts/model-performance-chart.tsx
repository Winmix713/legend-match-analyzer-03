import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Mock data
const data = [
  { name: "1X2", accuracy: 76, roi: 8.4 },
  { name: "O/U", accuracy: 72, roi: 6.2 },
  { name: "BTTS", accuracy: 78, roi: 12.5 },
  { name: "HT/FT", accuracy: 64, roi: 15.8 },
];

export const ModelPerformanceChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--heroui-primary))" />
        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--heroui-success))" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="accuracy" name="Accuracy (%)" fill="hsl(var(--heroui-primary))" />
        <Bar yAxisId="right" dataKey="roi" name="ROI (%)" fill="hsl(var(--heroui-success))" />
      </BarChart>
    </ResponsiveContainer>
  );
};