import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisService } from './redis.service';
import { TracingInterceptor } from './tracing.interceptor';
// import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  // imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    }
  ],
  exports: [RedisService], // Emits the Redis dependency injection token globally
})
export class CoreModule {}
