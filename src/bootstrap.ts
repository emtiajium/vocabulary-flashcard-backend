import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import AppModule from '@/AppModule';
import ServiceConfig from '@/common/configs/ServiceConfig';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version, name } from '@root/package.json';

class Bootstrap {
    private serviceConfig: ServiceConfig;

    private app: INestApplication;

    constructor(private readonly appModule: AppModule) {
        this.serviceConfig = new ServiceConfig();
    }

    initSwagger(): void {
        const config = new DocumentBuilder()
            .addServer(this.serviceConfig.serviceApiPrefix)
            .setTitle(name)
            .setVersion(version)
            .addApiKey({ type: 'apiKey', name: 'Authorization', in: 'header' }, 'Authorization')
            .build();
        const document = SwaggerModule.createDocument(this.app, config);
        SwaggerModule.setup(`${this.serviceConfig.serviceApiPrefix}/swagger`, this.app, document);
    }

    async start(): Promise<INestApplication> {
        const app: INestApplication = await NestFactory.create(this.appModule);
        this.app = app;
        this.initSwagger();
        app.enableCors();
        app.enableShutdownHooks();
        app.useGlobalPipes(new ValidationPipe());
        const { payloadLimitSize, serviceApiPrefix, port } = this.serviceConfig;
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
