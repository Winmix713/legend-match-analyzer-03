import React from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "../../hooks/use-translation";

export const FeedbackLoopProcess: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: "lucide:list",
      title: t('resultsFeedback.learning.steps.prediction.title'),
      description: t('resultsFeedback.learning.steps.prediction.description')
    },
    {
      icon: "lucide:check-circle",
      title: t('resultsFeedback.learning.steps.recording.title'),
      description: t('resultsFeedback.learning.steps.recording.description')
    },
    {
      icon: "lucide:bar-chart-2",
      title: t('resultsFeedback.learning.steps.analysis.title'),
      description: t('resultsFeedback.learning.steps.analysis.description')
    },
    {
      icon: "lucide:refresh-cw",
      title: t('resultsFeedback.learning.steps.retraining.title'),
      description: t('resultsFeedback.learning.steps.retraining.description')
    }
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="bg-primary-100 p-2 rounded-medium">
            <Icon icon={step.icon} className="text-primary text-xl" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{step.title}</p>
            <p className="text-small text-default-500">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
