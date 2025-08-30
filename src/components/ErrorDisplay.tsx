import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  ShieldX, 
  ServerCrash,
  SearchX 
} from 'lucide-react';
import { ApiError, ErrorType } from '@/types/api';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export const ErrorDisplay = ({
  error,
  onRetry,
  onDismiss,
  className,
  compact = false,
  showDetails = false
}: ErrorDisplayProps) => {
  const getErrorIcon = (errorCode: string) => {
    switch (errorCode) {
      case ErrorType.NETWORK:
        return WifiOff;
      case ErrorType.TIMEOUT:
        return Clock;
      case ErrorType.VALIDATION:
        return AlertTriangle;
      case ErrorType.NOT_FOUND:
        return SearchX;
      case ErrorType.UNAUTHORIZED:
        return ShieldX;
      case ErrorType.SERVER:
        return ServerCrash;
      default:
        return AlertTriangle;
    }
  };

  const getErrorColor = (errorCode: string) => {
    switch (errorCode) {
      case ErrorType.NETWORK:
        return 'text-orange-500';
      case ErrorType.TIMEOUT:
        return 'text-yellow-500';
      case ErrorType.VALIDATION:
        return 'text-red-500';
      case ErrorType.NOT_FOUND:
        return 'text-blue-500';
      case ErrorType.UNAUTHORIZED:
        return 'text-purple-500';
      case ErrorType.SERVER:
        return 'text-red-600';
      default:
        return 'text-destructive';
    }
  };

  const getErrorTitle = (errorCode: string) => {
    switch (errorCode) {
      case ErrorType.VALIDATION:
        return 'Érvénytelen adatok';
      case ErrorType.NETWORK:
        return 'Kapcsolati hiba';
      case ErrorType.SERVER:
        return 'Szerver hiba';
      case ErrorType.NOT_FOUND:
        return 'Nincs találat';
      case ErrorType.TIMEOUT:
        return 'Időtúllépés';
      case ErrorType.UNAUTHORIZED:
        return 'Nincs jogosultság';
      case ErrorType.RATE_LIMIT:
        return 'Túl sok kérés';
      default:
        return 'Hiba történt';
    }
  };

  const ErrorIcon = getErrorIcon(error.code);
  const iconColor = getErrorColor(error.code);
  const title = getErrorTitle(error.code);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 glass-light rounded-lg border border-destructive/20",
        className
      )}>
        <div className={cn("flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center")}>
          <ErrorIcon className={cn("w-4 h-4", iconColor)} />
        </div>
        
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {error.message}
          </p>
        </div>

        {error.retryable && onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Újra
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("glass border-destructive/20", className)}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <ErrorIcon className={cn("w-8 h-8", iconColor)} />
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-xl text-destructive flex items-center justify-center gap-2">
            {title}
            {!error.retryable && (
              <Badge variant="secondary" className="text-xs">
                Nem újrapróbálható
              </Badge>
            )}
          </CardTitle>
          
          <CardDescription className="text-base">
            {error.message}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showDetails && error.details && (
          <div className="text-sm text-muted-foreground bg-muted/10 p-3 rounded border">
            <strong>Részletek:</strong> {error.details}
          </div>
        )}

        {showDetails && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Kód:</strong> {error.code}</div>
            <div><strong>Időpont:</strong> {new Date(error.timestamp).toLocaleString('hu-HU')}</div>
            {error.requestId && (
              <div><strong>Kérés ID:</strong> {error.requestId}</div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {error.retryable && onRetry && (
            <Button 
              onClick={onRetry}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Újrapróbálás
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()}
            className="flex-1"
            variant="outline"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Oldal újratöltése
          </Button>
          
          {onDismiss && (
            <Button 
              onClick={onDismiss}
              variant="ghost"
              className="flex-1"
            >
              Bezárás
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Specific error display components for common scenarios
export const NetworkErrorDisplay = ({ onRetry, className }: { onRetry?: () => void; className?: string }) => {
  const networkError: ApiError = {
    code: ErrorType.NETWORK,
    message: 'Nincs internetkapcsolat vagy a szerver nem elérhető.',
    timestamp: new Date().toISOString(),
    retryable: true
  };

  return (
    <ErrorDisplay 
      error={networkError} 
      onRetry={onRetry} 
      className={className}
    />
  );
};

export const NotFoundErrorDisplay = ({ onRetry, className }: { onRetry?: () => void; className?: string }) => {
  const notFoundError: ApiError = {
    code: ErrorType.NOT_FOUND,
    message: 'Nem találtunk meccseket a megadott csapatok között.',
    timestamp: new Date().toISOString(),
    retryable: true
  };

  return (
    <ErrorDisplay 
      error={notFoundError} 
      onRetry={onRetry} 
      className={className}
    />
  );
};

export const ValidationErrorDisplay = ({ message, className }: { message?: string; className?: string }) => {
  const validationError: ApiError = {
    code: ErrorType.VALIDATION,
    message: message || 'A megadott adatok érvénytelenek.',
    timestamp: new Date().toISOString(),
    retryable: false
  };

  return (
    <ErrorDisplay 
      error={validationError} 
      className={className}
      compact
    />
  );
};