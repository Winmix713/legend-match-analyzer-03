import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Prediction, Outcome } from "../../lib/supabase";
import { useTranslation } from "../../hooks/use-translation";
import { MARKET_OUTCOMES } from "../../config/market-config";

interface PendingPredictionsTableProps {
  predictions: Prediction[];
  updating: number | null;
  onResultUpdate: (prediction: Prediction, result: Outcome) => void;
  formatDate: (dateString: string) => string;
}

export const PendingPredictionsTable: React.FC<PendingPredictionsTableProps> = ({ 
  predictions, 
  updating, 
  onResultUpdate,
  formatDate
}) => {
  const { t } = useTranslation();

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-default-500" role="status" aria-live="polite">
        <Icon icon="lucide:check-circle" className="text-4xl mb-2" />
        <p>{t('resultsFeedback.pendingResults.noResults')}</p>
      </div>
    );
  }

  return (
    <Table 
      removeWrapper 
      aria-label={t('resultsFeedback.pendingResults.title')}
      classNames={{
        th: "bg-default-100"
      }}
    >
      <TableHeader>
        <TableColumn>{t('tables.match')}</TableColumn>
        <TableColumn>{t('tables.date')}</TableColumn>
        <TableColumn>{t('tables.market')}</TableColumn>
        <TableColumn>{t('tables.prediction')}</TableColumn>
        <TableColumn>{t('tables.confidence')}</TableColumn>
        <TableColumn>{t('tables.odds')}</TableColumn>
        <TableColumn>{t('tables.expectedROI')}</TableColumn>
        <TableColumn>{t('tables.actualResult')}</TableColumn>
      </TableHeader>
      <TableBody>
        {predictions.map((prediction) => (
          <TableRow key={prediction.id}>
            <TableCell>{prediction.match}</TableCell>
            <TableCell>{formatDate(prediction.date)}</TableCell>
            <TableCell>{prediction.market}</TableCell>
            <TableCell>{prediction.prediction}</TableCell>
            <TableCell>
              <Chip 
                color={prediction.confidence > 75 ? "success" : prediction.confidence > 65 ? "primary" : "warning"} 
                variant="flat"
                size="sm"
              >
                {prediction.confidence}%
              </Chip>
            </TableCell>
            <TableCell>{prediction.odds.toFixed(2)}</TableCell>
            <TableCell>
              <span className={prediction.expected_roi >= 0 ? 'text-success' : 'text-danger'}>
                {prediction.expected_roi >= 0 ? '+' : ''}{prediction.expected_roi.toFixed(2)}%
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                {MARKET_OUTCOMES[prediction.market]?.map((outcome) => (
                  <Button 
                    key={outcome}
                    size="sm" 
                    color={outcome === prediction.prediction ? "success" : "default"}
                    variant="flat"
                    isLoading={updating === prediction.id}
                    onPress={() => onResultUpdate(prediction, outcome)}
                    aria-label={`${t('tables.actualResult')}: ${outcome}`}
                  >
                    {outcome}
                  </Button>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
