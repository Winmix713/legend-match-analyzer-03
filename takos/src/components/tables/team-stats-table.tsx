import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

// Mock data - would be dynamic based on team selection
const data = [
  { category: "Overall", played: 38, won: 27, drawn: 6, lost: 5, gf: 89, ga: 29, gd: 60, points: 87, ppg: 2.29 },
  { category: "Home", played: 19, won: 15, drawn: 3, lost: 1, gf: 53, ga: 12, gd: 41, points: 48, ppg: 2.53 },
  { category: "Away", played: 19, won: 12, drawn: 3, lost: 4, gf: 36, ga: 17, gd: 19, points: 39, ppg: 2.05 },
  { category: "vs Top 6", played: 10, won: 6, drawn: 2, lost: 2, gf: 18, ga: 8, gd: 10, points: 20, ppg: 2.00 },
  { category: "vs Bottom 6", played: 12, won: 10, drawn: 1, lost: 1, gf: 32, ga: 6, gd: 26, points: 31, ppg: 2.58 },
];

interface TeamStatsTableProps {
  teamId: string;
}

export const TeamStatsTable: React.FC<TeamStatsTableProps> = ({ teamId }) => {
  // In a real implementation, we would fetch data based on teamId
  
  return (
    <Table 
      removeWrapper 
      aria-label="Team Statistics"
      classNames={{
        th: "bg-default-100"
      }}
    >
      <TableHeader>
        <TableColumn>Category</TableColumn>
        <TableColumn>P</TableColumn>
        <TableColumn>W</TableColumn>
        <TableColumn>D</TableColumn>
        <TableColumn>L</TableColumn>
        <TableColumn>GF</TableColumn>
        <TableColumn>GA</TableColumn>
        <TableColumn>GD</TableColumn>
        <TableColumn>Pts</TableColumn>
        <TableColumn>PPG</TableColumn>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index} className={index === 0 ? "font-semibold" : ""}>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.played}</TableCell>
            <TableCell>{row.won}</TableCell>
            <TableCell>{row.drawn}</TableCell>
            <TableCell>{row.lost}</TableCell>
            <TableCell>{row.gf}</TableCell>
            <TableCell>{row.ga}</TableCell>
            <TableCell>{row.gd}</TableCell>
            <TableCell>{row.points}</TableCell>
            <TableCell>{row.ppg}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};