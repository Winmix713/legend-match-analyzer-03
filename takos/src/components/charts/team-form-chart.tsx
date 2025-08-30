import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Mock data - would be dynamic based on team selection
const data = [
  { match: "vs CHE (H)", goals: 2, xG: 1.8, result: "W" },
  { match: "vs MCI (A)", goals: 0, xG: 0.7, result: "L" },
  { match: "vs TOT (H)", goals: 3, xG: 2.5, result: "W" },
  { match: "vs LIV (A)", goals: 1, xG: 1.2, result: "D" },
  { match: "vs MUN (H)", goals: 2, xG: 1.9, result: "W" },
  { match: "vs NEW (A)", goals: 1, xG: 1.4, result: "L" },
  { match: "vs AVL (H)", goals: 3, xG: 2.7, result: "W" },
  { match: "vs WHU (A)", goals: 2, xG: 1.6, result: "W" },
  { match: "vs BHA (H)", goals: 1, xG: 1.8, result: "D" },
  { match: "vs CRY (A)", goals: 2, xG: 1.5, result: "W" },
];

interface TeamFormChartProps {
  teamId: string;
}

export const TeamFormChart: React.FC<TeamFormChartProps> = ({ teamId }) => {
  // In a real implementation, we would fetch data based on teamId
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="match" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="goals" name="Goals Scored" stroke="hsl(var(--heroui-primary))" fill="hsl(var(--heroui-primary-100))" />
        <Area type="monotone" dataKey="xG" name="Expected Goals (xG)" stroke="hsl(var(--heroui-secondary))" fill="hsl(var(--heroui-secondary-100))" />
      </AreaChart>
    </ResponsiveContainer>
  );
};