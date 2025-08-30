export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAriaDescribedBy(ids: (string | undefined)[]): string | undefined {
  const validIds = ids.filter(Boolean);
  return validIds.length > 0 ? validIds.join(' ') : undefined;
}

export function createAriaLabel(
  label: string,
  description?: string,
  status?: string
): string {
  const parts = [label];
  if (description) parts.push(description);
  if (status) parts.push(status);
  return parts.join(', ');
}

export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }
) {
  if (!isElementInViewport(element)) {
    element.scrollIntoView(options);
  }
}

export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  container.addEventListener('keydown', handleTabKey);

  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  return skipLink;
}

export interface AccessibilityOptions {
  highContrast?: boolean;
  reducedMotion?: boolean;
  largerText?: boolean;
  dyslexiaFriendly?: boolean;
  screenReaderOptimized?: boolean;
}

export function applyAccessibilitySettings(options: AccessibilityOptions) {
  const root = document.documentElement;

  // High contrast
  if (options.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Reduced motion
  if (options.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // Larger text
  if (options.largerText) {
    root.classList.add('large-text');
  } else {
    root.classList.remove('large-text');
  }

  // Dyslexia friendly
  if (options.dyslexiaFriendly) {
    root.classList.add('dyslexia-friendly');
  } else {
    root.classList.remove('dyslexia-friendly');
  }

  // Screen reader optimized
  if (options.screenReaderOptimized) {
    root.classList.add('screen-reader-optimized');
  } else {
    root.classList.remove('screen-reader-optimized');
  }
}