import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import AppModule from '@/AppModule';
import ServiceConfig from '@/common/configs/ServiceConfig';

class Bootstrap {
    private serviceConfig: ServiceConfig;

    constructor(private readonly appModule: AppModule) {
        this.serviceConfig = new ServiceConfig();
    }

    async start(): Promise<INestApplication> {
        const app: INestApplication = await NestFactory.create(this.appModule);
        app.enableCors();
        app.enableShutdownHooks();
        app.useGlobalPipes(new ValidationPipe());
        const serviceConfig = new ServiceConfig();
        const { payloadLimitSize, serviceApiPrefix, port } = serviceConfig;
        app.use(bodyParser.json({ limit: payloadLimitSize }));
        app.use(bodyParser.urlencoded({ limit: payloadLimitSize, parameterLimit: 10_000_000, extended: true }));
        app.use(cookieParser());
        app.setGlobalPrefix(serviceApiPrefix);
        app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
        await app.listen(port);
        return app;
    }
}

export default async function bootstrap(module: AppModule): Promise<INestApplication> {
    return new Bootstrap(module).start();
}
