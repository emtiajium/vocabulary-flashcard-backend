import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import AppModule from '@/AppModule';
import UserModule from '@/user/UserModule';
import ServiceConfig from '@/common/ServiceConfig';

type Module = AppModule | UserModule;

async function bootstrap(module: Module): Promise<INestApplication> {
    // TODO load the environment variables using NestJS way
    dotenv.config();
    const app: INestApplication = await NestFactory.create(module);
    app.useGlobalPipes(new ValidationPipe());
    const serviceConfig = new ServiceConfig();
    const { payloadLimitSize, serviceApiPrefix, port } = serviceConfig;
    app.use(bodyParser.json({ limit: payloadLimitSize }));
    app.use(bodyParser.urlencoded({ limit: payloadLimitSize, parameterLimit: 10_000_000, extended: true }));
    app.use(cookieParser());
    app.setGlobalPrefix(serviceApiPrefix);
    await app.listen(port);
    return app;
}

export default bootstrap;
