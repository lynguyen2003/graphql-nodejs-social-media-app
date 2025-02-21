import { authenticator, totp } from 'otplib';

authenticator.options = {
  step: 120, 
  window: 1,
  digits: 6
};

export const otpHelper = {
  generateSecret(): string {
    return authenticator.generateSecret();
  },

  generateToken(secret: string): string {
    return authenticator.generate(secret);
  },

  verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  },

  generateOtpAuthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, 'Your App Name', secret);
  }
};