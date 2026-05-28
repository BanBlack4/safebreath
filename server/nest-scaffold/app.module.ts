import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CoreModule } from './core/core.module';
import { TelemetryModule } from './telemetry/telemetry.module';

/**
 * Migration Scaffold: App Module
 * 
 * The root orchestration module. During the Strangler pattern, 
 * this runs alongside the Express app. Once everything is migrated,
 * this becomes the sole entry point of the backend.
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
      wildcard: true, // Allow wildcard event subscriptions
      maxListeners: 10,
    }),
    CoreModule,
    TelemetryModule,
    // ObservabilityModule,
    // RulesEngineModule,
  ],
})
export class AppModule {}
