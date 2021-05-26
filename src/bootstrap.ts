import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import AppModule from '@/AppModule';
import ServiceConfig from '@/common/ServiceConfig';

async function bootstrap(module: AppModule): Promise<INestApplication> {
    const app: INestApplication = await NestFactory.create(module);
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

export default bootstrap;
