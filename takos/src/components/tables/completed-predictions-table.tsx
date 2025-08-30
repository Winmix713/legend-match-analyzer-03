import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Prediction } from "../../lib/supabase";
import { useTranslation } from "../../hooks/use-translation";

interface CompletedPredictionsTableProps {
  predictions: Prediction[];
  formatDate: (dateString: string) => string;
}

export const CompletedPredictionsTable: React.FC<CompletedPredictionsTableProps> = ({ 
  predictions,
  formatDate
}) => {
  const { t } = useTranslation();

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-default-500" role="status" aria-live="polite">
        <Icon icon="lucide:info" className="text-4xl mb-2" />
        <p>{t('resultsFeedback.completedResults.noResults')}</p>
      </div>
    );
  }

  return (
    <Table 
      removeWrapper 
      aria-label={t('resultsFeedback.completedResults.title')}
      classNames={{
        th: "bg-default-100"
      }}
    >
      <TableHeader>
        <TableColumn>{t('tables.match')}</TableColumn>
        <TableColumn>{t('tables.date')}</TableColumn>
        <TableColumn>{t('tables.market')}</TableColumn>
        <TableColumn>{t('tables.prediction')}</TableColumn>
        <TableColumn>{t('tables.actualResult')}</TableColumn>
        <TableColumn>{t('tables.accuracy')}</TableColumn>
        <TableColumn>{t('tables.confidence')}</TableColumn>
        <TableColumn>{t('tables.roi')}</TableColumn>
      </TableHeader>
      <TableBody>
        {predictions.map((prediction) => (
          <TableRow key={prediction.id}>
            <TableCell>{prediction.match}</TableCell>
            <TableCell>{formatDate(prediction.date)}</TableCell>
            <TableCell>{prediction.market}</TableCell>
            <TableCell>{prediction.prediction}</TableCell>
            <TableCell>{prediction.actual_result}</TableCell>
            <TableCell>
              <Chip 
                color={prediction.is_correct ? "success" : "danger"} 
                variant="flat"
                size="sm"
                aria-label={prediction.is_correct ? t('tables.correct') : t('tables.incorrect')}
              >
                {prediction.is_correct ? t('tables.correct') : t('tables.incorrect')}
              </Chip>
            </TableCell>
            <TableCell>{prediction.confidence}%</TableCell>
            <TableCell>
              <span className={prediction.is_correct ? 'text-success' : 'text-danger'}>
                {prediction.is_correct 
                  ? `+${((prediction.odds - 1) * 100).toFixed(2)}%` 
                  : '-100.00%'}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
