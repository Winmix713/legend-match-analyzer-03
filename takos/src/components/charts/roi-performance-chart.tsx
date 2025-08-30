import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";

// Mock data - would be fetched from Supabase in a real implementation
const data = [
  { date: "2023-09", expectedROI: 8.2, actualROI: 6.8 },
  { date: "2023-10", expectedROI: 7.5, actualROI: 9.2 },
  { date: "2023-11", expectedROI: 9.1, actualROI: 8.4 },
  { date: "2023-12", expectedROI: 10.5, actualROI: 12.3 },
  { date: "2024-01", expectedROI: 8.7, actualROI: 7.6 },
  { date: "2024-02", expectedROI: 9.4, actualROI: 10.8 },
  { date: "2024-03", expectedROI: 11.2, actualROI: 9.7 },
];

export const ROIPerformanceChart = () => {
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
        />
        <YAxis />
        <Tooltip 
          formatter={(value) => `${value.toFixed(2)}%`}
          labelFormatter={formatDate}
        />
        <Legend />
        <ReferenceLine y={0} stroke="#666" />
        <Line 
          type="monotone" 
          dataKey="expectedROI" 
          name="Expected ROI" 
          stroke="hsl(var(--heroui-primary))" 
          activeDot={{ r: 8 }} 
        />
        <Line 
          type="monotone" 
          dataKey="actualROI" 
          name="Actual ROI" 
          stroke="hsl(var(--heroui-success))" 
          activeDot={{ r: 8 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};