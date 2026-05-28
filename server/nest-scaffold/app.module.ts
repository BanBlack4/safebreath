import { Module } from '@nestjs/common';
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
    CoreModule,
    TelemetryModule,
    // ObservabilityModule,
    // RulesEngineModule,
  ],
})
export class AppModule {}
