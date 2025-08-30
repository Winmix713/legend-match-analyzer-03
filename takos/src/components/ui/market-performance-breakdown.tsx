import React from "react";
import { Progress } from "@heroui/react";
import { useTranslation } from "../../hooks/use-translation";

interface MarketPerformanceBreakdownProps {
  marketAccuracy: {
    '1X2': number;
    'O/U': number;
    'BTTS': number;
    'HT/FT': number;
  };
}

export const MarketPerformanceBreakdown: React.FC<MarketPerformanceBreakdownProps> = ({ marketAccuracy }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">{t('markets.1X2')}</span>
          <span>{marketAccuracy['1X2'].toFixed(1)}%</span>
        </div>
        <Progress 
          value={marketAccuracy['1X2']} 
          color="primary" 
          aria-label={t('markets.1X2')} 
        />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">{t('markets.O/U')}</span>
          <span>{marketAccuracy['O/U'].toFixed(1)}%</span>
        </div>
        <Progress 
          value={marketAccuracy['O/U']} 
          color="secondary" 
          aria-label={t('markets.O/U')} 
        />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">{t('markets.BTTS')}</span>
          <span>{marketAccuracy['BTTS'].toFixed(1)}%</span>
        </div>
        <Progress 
          value={marketAccuracy['BTTS']} 
          color="success" 
          aria-label={t('markets.BTTS')} 
        />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-medium">{t('markets.HT/FT')}</span>
          <span>{marketAccuracy['HT/FT'].toFixed(1)}%</span>
        </div>
        <Progress 
          value={marketAccuracy['HT/FT']} 
          color="warning" 
          aria-label={t('markets.HT/FT')} 
        />
      </div>
    </div>
  );
};
