import { securityMiddleware } from '@/middleware/security';

export const sanitizeInput = (input: string): string => {
  return securityMiddleware.sanitizeInput(input);
};

export const validateEmail = (email: string): boolean => {
  return securityMiddleware.isValidEmail(email);
};

export const validatePassword = (password: string): boolean => {
  return securityMiddleware.isStrongPassword(password);
};

export const encryptData = (data: string, key: string): string => {
  return securityMiddleware.encryptSensitiveData(data, key);
};

export const decryptData = (encryptedData: string, key: string): string => {
  return securityMiddleware.decryptSensitiveData(encryptedData, key);
};

export const hashPassword = (password: string, salt: string): string => {
  return securityMiddleware.hashPassword(password, salt);
};

export const generateSalt = (): string => {
  return securityMiddleware.generateSalt();
};

export const validateFileUpload = (file: File) => {
  return securityMiddleware.validateFileUpload(file);
};

// CSRF token management
export const generateCSRFToken = (sessionId: string): string => {
  return securityMiddleware.generateCSRFToken(sessionId);
};

export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  return securityMiddleware.validateCSRFToken(sessionId, token);
};

// Rate limiting utilities
import { apiRateLimiter, authRateLimiter, searchRateLimiter, exportRateLimiter } from '@/middleware/rate-limiter';

export const checkApiRateLimit = (identifier: string): boolean => {
  return apiRateLimiter.isAllowed(identifier);
};

export const checkAuthRateLimit = (identifier: string): boolean => {
  return authRateLimiter.isAllowed(identifier);
};

export const checkSearchRateLimit = (identifier: string): boolean => {
  return searchRateLimiter.isAllowed(identifier);
};

export const checkExportRateLimit = (identifier: string): boolean => {
  return exportRateLimiter.isAllowed(identifier);
};

// Security headers utilities
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://tssgzrzjxslvqmpxgsss.supabase.co;
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim()
  };
};

// Input validation utilities
export const validateTeamName = (teamName: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(teamName);
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, error: 'Team name is required' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Team name is too long' };
  }
  
  // Only allow letters, numbers, spaces, and common punctuation
  const validPattern = /^[a-zA-Z0-9\s\-\.']+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: 'Team name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateUserId = (userId: string): boolean => {
  // UUID format validation
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(userId);
};

export const validateSessionId = (sessionId: string): boolean => {
  // Session ID should be a random string of specific length
  return typeof sessionId === 'string' && sessionId.length >= 32 && sessionId.length <= 128;
};

// Security logging utilities
export const logSecurityEvent = (event: {
  type: 'auth_attempt' | 'rate_limit_exceeded' | 'invalid_input' | 'csrf_violation' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}) => {
  console.warn('Security Event:', {
    ...event,
    timestamp: new Date().toISOString(),
    severity: event.type === 'suspicious_activity' ? 'high' : 'medium'
  });
  
  // In production, this would send to a security monitoring service
  // or write to secure logs
};