import React from "react";
import { Progress } from "@heroui/react";
import { useTranslation } from "../../hooks/use-translation";

export const LearningMetrics: React.FC = () => {
  const { t } = useTranslation();

  const metrics = [
    {
      label: t('resultsFeedback.learning.metricLabels.improvement'),
      value: 62,
      improvement: '+12.4%'
    },
    {
      label: t('resultsFeedback.learning.metricLabels.errorReduction'),
      value: 48,
      improvement: '+8.7%'
    },
    {
      label: t('resultsFeedback.learning.metricLabels.roiOptimization'),
      value: 75,
      improvement: '+15.2%'
    },
    {
      label: t('resultsFeedback.learning.metricLabels.confidenceCalibration'),
      value: 52,
      improvement: '+9.3%'
    }
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => (
        <div key={index}>
          <div className="flex justify-between mb-1">
            <span className="text-small">{metric.label}</span>
            <span className="text-small text-success">{metric.improvement}</span>
          </div>
          <Progress 
            value={metric.value} 
            color="success" 
            aria-label={metric.label} 
            aria-valuetext={`${metric.value}%, improvement: ${metric.improvement}`}
          />
        </div>
      ))}
    </div>
  );
};
