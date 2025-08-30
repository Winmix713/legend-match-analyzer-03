import React from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

// Mock data - would be dynamic based on team selection
const data = [
  { subject: "Goals Scored", team: 2.4, opponent: 1.8 },
  { subject: "Goals Conceded", team: 1.2, opponent: 1.6 },
  { subject: "Possession", team: 58, opponent: 52 },
  { subject: "Shots", team: 14.5, opponent: 12.2 },
  { subject: "Shots on Target", team: 5.8, opponent: 4.3 },
  { subject: "Corners", team: 6.2, opponent: 5.1 },
  { subject: "Expected Goals", team: 2.1, opponent: 1.5 },
];

interface HeadToHeadChartProps {
  teamId: string;
}

export const HeadToHeadChart: React.FC<HeadToHeadChartProps> = ({ teamId }) => {
  // In a real implementation, we would fetch data based on teamId
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis />
        <Radar name="Arsenal" dataKey="team" stroke="hsl(var(--heroui-primary))" fill="hsl(var(--heroui-primary))" fillOpacity={0.6} />
        <Radar name="Opponents (Avg)" dataKey="opponent" stroke="hsl(var(--heroui-danger))" fill="hsl(var(--heroui-danger))" fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
};