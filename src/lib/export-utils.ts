import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Match, StatisticsResult } from '@/types';

// Create type aliases for better semantic meaning in export context
export type MatchData = Match;
export type TeamStatistics = StatisticsResult;

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeMetadata?: boolean;
  title?: string;
  author?: string;
  includeCharts?: boolean;
}

export interface ExportMetadata {
  exportDate: string;
  exportTime: string;
  title: string;
  author?: string;
  dataSource: string;
  filters?: Record<string, any>;
}

function generateMetadata(options: Partial<ExportMetadata> = {}): ExportMetadata {
  const now = new Date();
  return {
    exportDate: now.toLocaleDateString(),
    exportTime: now.toLocaleTimeString(),
    title: options.title || 'Football Statistics Export',
    author: options.author || 'Football Stats App',
    dataSource: 'Football Statistics Application',
    filters: options.filters || {},
  };
}

export async function exportToPDF(
  data: MatchData[],
  statistics: TeamStatistics | null,
  options: ExportOptions
): Promise<void> {
  const pdf = new jsPDF();
  const metadata = generateMetadata({ title: options.title, author: options.author });

  // Add title
  pdf.setFontSize(20);
  pdf.text(metadata.title, 20, 20);

  // Add metadata if requested
  if (options.includeMetadata) {
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${metadata.exportDate} at ${metadata.exportTime}`, 20, 35);
    pdf.text(`Author: ${metadata.author}`, 20, 45);
  }

  let yPosition = options.includeMetadata ? 60 : 40;

  // Add statistics summary if available
  if (statistics) {
    pdf.setFontSize(14);
    pdf.text('Statistics Summary', 20, yPosition);
    yPosition += 10;

    const statsData = [
      ['Total Matches', statistics.total_matches.toString()],
      ['Home Wins', statistics.home_wins.toString()],
      ['Away Wins', statistics.away_wins.toString()],
      ['Draws', statistics.draws.toString()],
      ['Home Goals', statistics.home_goals.toString()],
      ['Away Goals', statistics.away_goals.toString()],
      ['Average Goals per Match', statistics.average_goals_per_match.toFixed(1)],
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 20;
  }

  // Add matches table
  if (data.length > 0) {
    pdf.setFontSize(14);
    pdf.text('Match Details', 20, yPosition);
    yPosition += 10;

    const matchData = data.map(match => [
      match.match_time,
      match.home_team,
      match.away_team,
      `${match.full_time_home_goals} - ${match.full_time_away_goals}`,
      match.league || 'N/A',
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: [['Time', 'Home Team', 'Away Team', 'Score', 'League']],
      body: matchData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  // Save the PDF
  const filename = `football-stats-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

export function exportToCSV(
  data: MatchData[],
  statistics: TeamStatistics | null,
  options: ExportOptions
): void {
  const metadata = generateMetadata({ title: options.title, author: options.author });
  let csvContent = '';

  // Add metadata as comments if requested
  if (options.includeMetadata) {
    csvContent += `# ${metadata.title}\n`;
    csvContent += `# Generated on: ${metadata.exportDate} at ${metadata.exportTime}\n`;
    csvContent += `# Author: ${metadata.author}\n`;
    csvContent += `# Data Source: ${metadata.dataSource}\n\n`;
  }

  // Add statistics summary
  if (statistics) {
    csvContent += 'Statistics Summary\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Matches,${statistics.total_matches}\n`;
    csvContent += `Home Wins,${statistics.home_wins}\n`;
    csvContent += `Away Wins,${statistics.away_wins}\n`;
    csvContent += `Draws,${statistics.draws}\n`;
    csvContent += `Home Goals,${statistics.home_goals}\n`;
    csvContent += `Away Goals,${statistics.away_goals}\n`;
    csvContent += `Average Goals per Match,${statistics.average_goals_per_match.toFixed(1)}\n\n`;
  }

  // Add matches data
  if (data.length > 0) {
    csvContent += 'Match Details\n';
    csvContent += 'Time,Home Team,Away Team,Home Score,Away Score,League,Season\n';
    
    data.forEach(match => {
      const row = [
        match.match_time,
        `"${match.home_team}"`,
        `"${match.away_team}"`,
        match.full_time_home_goals,
        match.full_time_away_goals,
        `"${match.league || 'N/A'}"`,
        `"${match.season || 'N/A'}"`,
      ].join(',');
      csvContent += row + '\n';
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = `football-stats-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(
  data: MatchData[],
  statistics: TeamStatistics | null,
  options: ExportOptions
): void {
  const metadata = generateMetadata({ title: options.title, author: options.author });
  
  const exportData = {
    ...(options.includeMetadata && { metadata }),
    statistics,
    matches: data,
    exportOptions: options,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = `football-stats-${new Date().toISOString().split('T')[0]}.json`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateShareableLink(
  homeTeam: string,
  awayTeam: string,
  filters?: Record<string, any>
): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  
  params.set('home', homeTeam);
  params.set('away', awayTeam);
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  
  return `${baseUrl}?${params.toString()}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    return new Promise<void>((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('Failed to copy to clipboard'));
      }
      document.body.removeChild(textArea);
    });
  }
}