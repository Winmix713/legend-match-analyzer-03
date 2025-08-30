import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";

// Mock data
const data = [
  { id: 1, match: "Arsenal vs Chelsea", date: "2023-10-15", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 78 },
  { id: 2, match: "Liverpool vs Man City", date: "2023-10-16", prediction: "Draw", actual: "Away Win", accuracy: false, confidence: 62 },
  { id: 3, match: "Man United vs Tottenham", date: "2023-10-17", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 74 },
  { id: 4, match: "Newcastle vs Aston Villa", date: "2023-10-18", prediction: "Home Win", actual: "Away Win", accuracy: false, confidence: 68 },
  { id: 5, match: "Brighton vs West Ham", date: "2023-10-19", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 82 },
  { id: 6, match: "Barcelona vs Real Madrid", date: "2023-10-20", prediction: "Draw", actual: "Draw", accuracy: true, confidence: 58 },
  { id: 7, match: "Atletico Madrid vs Sevilla", date: "2023-10-21", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 76 },
  { id: 8, match: "Valencia vs Villarreal", date: "2023-10-22", prediction: "Away Win", actual: "Draw", accuracy: false, confidence: 64 },
  { id: 9, match: "Real Sociedad vs Athletic Bilbao", date: "2023-10-23", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 70 },
  { id: 10, match: "Real Betis vs Getafe", date: "2023-10-24", prediction: "Home Win", actual: "Home Win", accuracy: true, confidence: 80 },
];

export const RecentPredictionsTable = () => {
  return (
    <Table 
      removeWrapper 
      aria-label="Recent Predictions"
      classNames={{
        th: "bg-default-100"
      }}
    >
      <TableHeader>
        <TableColumn>Match</TableColumn>
        <TableColumn>Date</TableColumn>
        <TableColumn>Prediction</TableColumn>
        <TableColumn>Actual</TableColumn>
        <TableColumn>Accuracy</TableColumn>
        <TableColumn>Confidence</TableColumn>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.match}</TableCell>
            <TableCell>{row.date}</TableCell>
            <TableCell>{row.prediction}</TableCell>
            <TableCell>{row.actual}</TableCell>
            <TableCell>
              <Chip 
                color={row.accuracy ? "success" : "danger"} 
                variant="flat"
                size="sm"
              >
                {row.accuracy ? "Correct" : "Incorrect"}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip 
                color={row.confidence > 75 ? "success" : row.confidence > 65 ? "primary" : "warning"} 
                variant="flat"
                size="sm"
              >
                {row.confidence}%
              </Chip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};