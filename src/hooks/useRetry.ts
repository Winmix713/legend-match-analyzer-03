import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  onError?: (error: Error, attempt: number) => void;
}

export const useRetry = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: UseRetryOptions = {}
) => {
  const { maxAttempts = 3, delay = 1000, onError } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { toast } = useToast();

  const execute = useCallback(async (...args: T): Promise<R> => {
    setIsRetrying(true);
    setAttempt(0);

    for (let currentAttempt = 1; currentAttempt <= maxAttempts; currentAttempt++) {
      try {
        setAttempt(currentAttempt);
        const result = await fn(...args);
        setIsRetrying(false);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        
        if (onError) {
          onError(err, currentAttempt);
        }

        if (currentAttempt === maxAttempts) {
          setIsRetrying(false);
          toast({
            title: "Kapcsolati hiba",
            description: `Nem sikerült csatlakozni ${maxAttempts} próbálkozás után. Ellenőrizd az internetkapcsolatod.`,
            variant: "destructive"
          });
          throw err;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * currentAttempt));
      }
    }

    throw new Error('Max attempts reached');
  }, [fn, maxAttempts, delay, onError, toast]);

  return {
    execute,
    isRetrying,
    attempt,
    maxAttempts
  };
};