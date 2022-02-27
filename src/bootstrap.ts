import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import AppModule from '@/AppModule';
import ServiceConfig from '@/common/configs/ServiceConfig';
import * as fs from 'fs';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';

class Bootstrap {
    private readonly serviceConfig: ServiceConfig;

    constructor(private readonly appModule: AppModule) {
        this.serviceConfig = new ServiceConfig();
    }

    async start(): Promise<INestApplication> {
        const app: INestApplication = await NestFactory.create(this.appModule, this.getAppOptions());
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

    private getAppOptions(): NestApplicationOptions {
        let options: NestApplicationOptions;

        if (this.serviceConfig.environment === 'development') {
            options = {
                httpsOptions: {
                    key: fs.readFileSync('cert/CA/localhost/localhost.decrypted.key'),
                    cert: fs.readFileSync('cert/CA/localhost/localhost.crt'),
                },
            };
        }

        return options;
    }
}

export default async function bootstrap(module: AppModule): Promise<INestApplication> {
    return new Bootstrap(module).start();
}
