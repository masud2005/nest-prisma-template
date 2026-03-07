import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RATE_LIMIT } from '../constants/rate-limit.constant';
import { CustomThrottlerGuard } from '../guards/throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: RATE_LIMIT.GLOBAL.name,
          ttl: RATE_LIMIT.GLOBAL.ttl,
          limit: RATE_LIMIT.GLOBAL.limit,
        },
        {
          name: RATE_LIMIT.AUTH.name,
          ttl: RATE_LIMIT.AUTH.ttl,
          limit: RATE_LIMIT.AUTH.limit,
        },
        {
          name: RATE_LIMIT.LOGIN.name,
          ttl: RATE_LIMIT.LOGIN.ttl,
          limit: RATE_LIMIT.LOGIN.limit,
        },
        {
          name: RATE_LIMIT.OTP.name,
          ttl: RATE_LIMIT.OTP.ttl,
          limit: RATE_LIMIT.OTP.limit,
        },
        {
          name: RATE_LIMIT.OTP_RESEND.name,
          ttl: RATE_LIMIT.OTP_RESEND.ttl,
          limit: RATE_LIMIT.OTP_RESEND.limit,
        },
        {
          name: RATE_LIMIT.PASSWORD_RESET.name,
          ttl: RATE_LIMIT.PASSWORD_RESET.ttl,
          limit: RATE_LIMIT.PASSWORD_RESET.limit,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class ThrottlerConfigModule {}
