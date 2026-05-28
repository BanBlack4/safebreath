import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody
  } from '@nestjs/websockets';
  import { Logger, UseGuards } from '@nestjs/common';
  
  /**
   * Migration Scaffold: Telemetry Gateway
   * 
   * Transforms our manual ws handlers into clean, declarative NestJS controllers.
   * Authentication is moved to a @UseGuards() class, separating transport from security.
   */
  @WebSocketGateway({ cors: true })
  export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(TelemetryGateway.name);
  
    // NestJS automatically binds to the underlying ws/socket.io engine
    @WebSocketServer()
    server: any;
  
    constructor(
       // DI: Inject our domain logic orchestration service
       // private readonly telemetryService: TelemetryService,
    ) {}
  
    handleConnection(client: any) {
      // Logic for tracking connections, metrics.increment('active_sockets');
      this.logger.log(`Client Connected: ${client.id}`);
    }
  
    handleDisconnect(client: any) {
      this.logger.log(`Client Disconnected: ${client.id}`);
      // telemetryService.cleanSession(client.userId);
    }
  
    // @UseGuards(WsJwtAuthGuard) // Declarative Authentication!
    @SubscribeMessage('TELEMETRY_INGEST')
    handleTelemetry(
      @ConnectedSocket() client: any,
      @MessageBody() payload: any // DTO validation can happen via Pipes here!
    ) {
        // Validation and ingestion happens without the boilerplate of try/catch JSON.parse
        // this.telemetryService.ingest(client.userId, payload);
    }
  }
  
