import { ConfigService } from '@nestjs/config';

export default class ServiceConfig {
    private readonly configService: ConfigService;

    port: number;

    environment: string;

    serviceName: string;

    serviceApiPrefix: string;

    payloadLimitSize: string;

    swaggerUsername: string;

    swaggerPassword: string;

    constructor() {
        this.configService = new ConfigService();
        this.port = this.configService.get<number>('PORT');
        this.environment = this.configService.get<string>('SERVICE_ENV');
        this.serviceName = this.configService.get<string>('SERVICE_NAME');
        this.serviceApiPrefix = this.configService.get<string>('SERVICE_API_PREFIX');
        this.payloadLimitSize = this.configService.get<string>('PAYLOAD_LIMIT_SIZE');
        this.swaggerUsername = this.configService.get<string>('SWAGGER_USERNAME');
        this.swaggerPassword = this.configService.get<string>('SWAGGER_PASSWORD');
    }
}
