import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { RATE_LIMIT } from '../constants/rate-limit.constant';

export const ThrottleAuth = () =>
  Throttle({
    [RATE_LIMIT.AUTH.name]: {
      ttl: RATE_LIMIT.AUTH.ttl,
      limit: RATE_LIMIT.AUTH.limit,
    },
  });

export const ThrottleLogin = () =>
  Throttle({
    [RATE_LIMIT.LOGIN.name]: {
      ttl: RATE_LIMIT.LOGIN.ttl,
      limit: RATE_LIMIT.LOGIN.limit,
    },
  });

export const ThrottleOtp = () =>
  Throttle({
    [RATE_LIMIT.OTP.name]: {
      ttl: RATE_LIMIT.OTP.ttl,
      limit: RATE_LIMIT.OTP.limit,
    },
  });

export const ThrottleOtpResend = () =>
  Throttle({
    [RATE_LIMIT.OTP_RESEND.name]: {
      ttl: RATE_LIMIT.OTP_RESEND.ttl,
      limit: RATE_LIMIT.OTP_RESEND.limit,
    },
  });

export const ThrottlePasswordReset = () =>
  Throttle({
    [RATE_LIMIT.PASSWORD_RESET.name]: {
      ttl: RATE_LIMIT.PASSWORD_RESET.ttl,
      limit: RATE_LIMIT.PASSWORD_RESET.limit,
    },
  });

export const NoThrottle = () => SkipThrottle();
