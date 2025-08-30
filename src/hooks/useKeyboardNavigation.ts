import { useCallback, useRef, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  enabledKeys?: string[];
  disabled?: boolean;
}

export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>(options: KeyboardNavigationOptions) {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabledKeys = ['enter', 'escape', 'up', 'down', 'left', 'right', 'tab'],
    disabled = false,
  } = options;

  const containerRef = useRef<T>(null);

  // Register hotkeys
  useHotkeys('enter', onEnter || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('enter') && !!onEnter,
    scopes: ['keyboard-navigation'],
  });

  useHotkeys('escape', onEscape || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('escape') && !!onEscape,
    scopes: ['keyboard-navigation'],
  });

  useHotkeys('up', onArrowUp || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('up') && !!onArrowUp,
    scopes: ['keyboard-navigation'],
    preventDefault: true,
  });

  useHotkeys('down', onArrowDown || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('down') && !!onArrowDown,
    scopes: ['keyboard-navigation'],
    preventDefault: true,
  });

  useHotkeys('left', onArrowLeft || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('left') && !!onArrowLeft,
    scopes: ['keyboard-navigation'],
  });

  useHotkeys('right', onArrowRight || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('right') && !!onArrowRight,
    scopes: ['keyboard-navigation'],
  });

  useHotkeys('tab', onTab || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('tab') && !!onTab,
    scopes: ['keyboard-navigation'],
  });

  useHotkeys('shift+tab', onShiftTab || (() => {}), { 
    enabled: !disabled && enabledKeys.includes('tab') && !!onShiftTab,
    scopes: ['keyboard-navigation'],
  });

  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLastElement = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current || event.key !== 'Tab') return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    trapFocus,
  };
}