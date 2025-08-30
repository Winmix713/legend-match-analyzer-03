import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Mock data
const data = [
  { name: "Week 1", "1X2": 72, "O/U": 68, "BTTS": 75, "HT/FT": 62 },
  { name: "Week 2", "1X2": 68, "O/U": 72, "BTTS": 70, "HT/FT": 58 },
  { name: "Week 3", "1X2": 74, "O/U": 76, "BTTS": 72, "HT/FT": 64 },
  { name: "Week 4", "1X2": 70, "O/U": 74, "BTTS": 78, "HT/FT": 66 },
  { name: "Week 5", "1X2": 76, "O/U": 70, "BTTS": 74, "HT/FT": 60 },
  { name: "Week 6", "1X2": 78, "O/U": 72, "BTTS": 76, "HT/FT": 68 },
  { name: "Week 7", "1X2": 74, "O/U": 78, "BTTS": 72, "HT/FT": 64 },
  { name: "Week 8", "1X2": 80, "O/U": 76, "BTTS": 78, "HT/FT": 70 },
];

export const PredictionAccuracyChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
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
        <YAxis domain={[50, 100]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="1X2" stroke="hsl(var(--heroui-primary))" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="O/U" stroke="hsl(var(--heroui-secondary))" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="BTTS" stroke="hsl(var(--heroui-success))" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="HT/FT" stroke="hsl(var(--heroui-warning))" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};