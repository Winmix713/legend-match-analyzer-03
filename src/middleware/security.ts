import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

export interface SecurityConfig {
  enableCSRF: boolean;
  enableXSSProtection: boolean;
  enableInputSanitization: boolean;
  allowedOrigins: string[];
  sessionTimeout: number;
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private csrfTokens: Map<string, { token: string; expiry: number }> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
    this.initializeCSRF();
  }

  private initializeCSRF(): void {
    if (this.config.enableCSRF) {
      // Cleanup expired tokens every hour
      setInterval(() => {
        const now = Date.now();
        for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
          if (tokenData.expiry < now) {
            this.csrfTokens.delete(sessionId);
          }
        }
      }, 3600000);
    }
  }

  public sanitizeInput(input: string): string {
    if (!this.config.enableInputSanitization) return input;
    
    // Basic XSS protection
    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // SQL injection protection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(["';])/g
    ];

    let result = sanitized;
    sqlPatterns.forEach(pattern => {
      result = result.replace(pattern, '');
    });

    return result.trim();
  }

  public generateCSRFToken(sessionId: string): string {
    if (!this.config.enableCSRF) return '';

    const token = CryptoJS.lib.WordArray.random(32).toString();
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    this.csrfTokens.set(sessionId, { token, expiry });
    return token;
  }

  public validateCSRFToken(sessionId: string, token: string): boolean {
    if (!this.config.enableCSRF) return true;

    const tokenData = this.csrfTokens.get(sessionId);
    if (!tokenData) return false;

    if (tokenData.expiry < Date.now()) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return tokenData.token === token;
  }

  public validateOrigin(origin: string): boolean {
    if (this.config.allowedOrigins.includes('*')) return true;
    return this.config.allowedOrigins.includes(origin);
  }

  public encryptSensitiveData(data: string, key: string): string {
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  public decryptSensitiveData(encryptedData: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  public hashPassword(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();
  }

  public generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  public validateFileUpload(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Invalid file type' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File too large' };
    }

    return { isValid: true };
  }
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  enableCSRF: true,
  enableXSSProtection: true,
  enableInputSanitization: true,
  allowedOrigins: [window.location.origin],
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
};

export const securityMiddleware = new SecurityMiddleware(defaultSecurityConfig);