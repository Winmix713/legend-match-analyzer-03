import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ErrorType, ApiError, ErrorHandlerConfig } from '@/types/api';
import { MatchServiceError, NetworkError, ValidationError, DataNotFoundError } from '@/services/matchService';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const createApiError = useCallback((error: unknown, context?: string): ApiError => {
    const timestamp = new Date().toISOString();
    
    if (error instanceof ValidationError) {
      return {
        code: ErrorType.VALIDATION,
        message: error.message,
        details: `Validációs hiba: ${context || 'Ismeretlen'}`,
        timestamp,
        retryable: false
      };
    }
    
    if (error instanceof DataNotFoundError) {
      return {
        code: ErrorType.NOT_FOUND,
        message: error.message,
        details: `Nincs találat: ${context || 'Ismeretlen'}`,
        timestamp,
        retryable: true
      };
    }
    
    if (error instanceof NetworkError) {
      return {
        code: ErrorType.NETWORK,
        message: error.message,
        details: `Hálózati hiba: ${context || 'Ismeretlen'}`,
        timestamp,
        retryable: true
      };
    }
    
    if (error instanceof MatchServiceError) {
      return {
        code: ErrorType.SERVER,
        message: error.message,
        details: `Szerver hiba: ${context || 'Ismeretlen'}`,
        timestamp,
        retryable: true
      };
    }
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        code: ErrorType.TIMEOUT,
        message: 'A kérés túl sokáig tartott',
        details: `Időtúllépés: ${context || 'Ismeretlen'}`,
        timestamp,
        retryable: true
      };
    }
    
    // Handle generic errors
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
    return {
      code: ErrorType.UNEXPECTED,
      message: errorMessage,
      details: `Váratlan hiba: ${context || 'Ismeretlen'}`,
      timestamp,
      retryable: false
    };
  }, []);

  const getErrorTitle = useCallback((errorCode: string): string => {
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
  }, []);

  const getErrorDescription = useCallback((apiError: ApiError): string => {
    switch (apiError.code) {
      case ErrorType.VALIDATION:
        return 'Ellenőrizd a megadott adatokat és próbáld újra.';
      case ErrorType.NETWORK:
        return 'Ellenőrizd az internetkapcsolatot és próbáld újra.';
      case ErrorType.SERVER:
        return 'A szerver jelenleg nem elérhető. Próbáld újra később.';
      case ErrorType.NOT_FOUND:
        return 'Próbálj más csapatnevekkel keresni.';
      case ErrorType.TIMEOUT:
        return 'A kérés túl sokáig tartott. Próbáld újra.';
      case ErrorType.UNAUTHORIZED:
        return 'Nincs jogosultságod ehhez a művelethez.';
      case ErrorType.RATE_LIMIT:
        return 'Túl sok kérést küldtél. Várj egy kicsit és próbáld újra.';
      default:
        return 'Váratlan hiba történt. Ha a probléma továbbra is fennáll, fordulj a támogatáshoz.';
    }
  }, []);

  const handleError = useCallback((
    error: unknown,
    config: ErrorHandlerConfig = {},
    context?: string
  ) => {
    const {
      showToast = true,
      logError = true,
      retryable,
      fallbackValue
    } = config;

    const apiError = createApiError(error, context);
    
    // Log error for debugging
    if (logError) {
      console.error('Error handled:', {
        apiError,
        originalError: error,
        context,
        timestamp: new Date().toISOString()
      });
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: getErrorTitle(apiError.code),
        description: getErrorDescription(apiError),
        variant: "destructive",
      });
    }

    // Return error details and fallback value
    return {
      error: apiError,
      retry: retryable !== undefined ? retryable : apiError.retryable,
      fallback: fallbackValue
    };
  }, [createApiError, getErrorTitle, getErrorDescription, toast]);

  const handleSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  }, [toast]);

  const handleWarning = useCallback((message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default", // Using default as there's no warning variant
    });
  }, [toast]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    createApiError,
    getErrorTitle,
    getErrorDescription
  };
};