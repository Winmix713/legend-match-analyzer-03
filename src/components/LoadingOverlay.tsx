
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
  progress?: number;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  className?: string;
  variant?: 'fullscreen' | 'inline' | 'modal';
  priority?: 'low' | 'normal' | 'high';
}

export const LoadingOverlay = ({
  isVisible,
  message = "Töltés...",
  submessage,
  progress,
  showProgress = false,
  showEstimatedTime = false,
  className,
  variant = 'inline',
  priority = 'normal'
}: LoadingOverlayProps) => {
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      setEstimatedTime(null);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Calculate estimated time based on progress
      if (showEstimatedTime && progress && progress > 10) {
        const estimated = Math.floor((elapsed * 100) / progress) - elapsed;
        setEstimatedTime(Math.max(0, estimated));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, progress, showEstimatedTime]);

  if (!isVisible) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} másodperc`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressMessage = () => {
    if (progress !== undefined) {
      if (progress < 25) return "Kapcsolódás...";
      if (progress < 50) return "Adatok betöltése...";
      if (progress < 75) return "Feldolgozás...";
      return "Befejezés...";
    }
    return message;
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'z-50 bg-background/90';
      case 'low':
        return 'z-10 bg-background/60';
      default:
        return 'z-30 bg-background/80';
    }
  };

  if (variant === 'fullscreen') {
    return (
      <div className={cn(
        "fixed inset-0 backdrop-blur-sm flex items-center justify-center",
        getPriorityStyles(),
        className
      )}>
        <Card className="glass p-6 max-w-sm w-full mx-4">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            
            <div className="space-y-2">
              <h3 className="text-base font-medium text-foreground">
                {getProgressMessage()}
              </h3>
              {submessage && (
                <p className="text-sm text-muted-foreground">
                  {submessage}
                </p>
              )}
            </div>

            {showProgress && progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-xs text-muted-foreground">
                  {progress.toFixed(0)}% kész
                </p>
              </div>
            )}

            {elapsedTime > 5 && (
              <p className="text-xs text-muted-foreground">
                Eltelt idő: {formatTime(elapsedTime)}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn(
        "fixed inset-0 backdrop-blur-sm flex items-center justify-center",
        getPriorityStyles(),
        className
      )}>
        <div className="glass rounded-xl p-4 max-w-xs w-full mx-4 animate-scaleIn">
          <div className="text-center space-y-3">
            <LoadingSpinner size="md" />
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {getProgressMessage()}
              </p>
              {submessage && (
                <p className="text-xs text-muted-foreground">
                  {submessage}
                </p>
              )}
            </div>

            {showProgress && progress !== undefined && (
              <Progress value={progress} className="w-full h-1" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant - more compact for better performance
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 space-y-3",
      className
    )}>
      <LoadingSpinner size="md" />
      
      <div className="text-center space-y-1 max-w-sm">
        <h3 className="text-sm font-medium text-foreground">
          {getProgressMessage()}
        </h3>
        {submessage && (
          <p className="text-xs text-muted-foreground">
            {submessage}
          </p>
        )}
      </div>

      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs space-y-1">
          <Progress value={progress} className="w-full h-1" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}%</span>
            {showEstimatedTime && estimatedTime !== null && estimatedTime > 0 && (
              <span>~{formatTime(estimatedTime)}</span>
            )}
          </div>
        </div>
      )}

      {elapsedTime > 10 && (
        <p className="text-xs text-muted-foreground">
          Ha a töltés sokáig tart, próbáld újratölteni az oldalt
        </p>
      )}
    </div>
  );
};

// Optimized specialized loading overlays
export const SearchLoadingOverlay = ({ 
  isVisible, 
  teamNames,
  variant = 'inline' 
}: { 
  isVisible: boolean; 
  teamNames?: { home: string; away: string };
  variant?: 'fullscreen' | 'inline' | 'modal';
}) => {
  const message = teamNames 
    ? `${teamNames.home} vs ${teamNames.away}` 
    : "Meccsek keresése...";

  return (
    <LoadingOverlay
      isVisible={isVisible}
      message={message}
      submessage="Keresés az adatbázisban..."
      variant={variant}
      priority="normal"
    />
  );
};

export const StatisticsLoadingOverlay = ({ 
  isVisible, 
  variant = 'inline' 
}: { 
  isVisible: boolean; 
  variant?: 'fullscreen' | 'inline' | 'modal';
}) => {
  return (
    <LoadingOverlay
      isVisible={isVisible}
      message="Statisztikák számítása..."
      submessage="Eredmények elemzése..."
      variant={variant}
      priority="low"
    />
  );
};
