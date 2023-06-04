import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import * as fs from 'fs';
import AppModule from '@/AppModule';
import ServiceConfig from '@/common/configs/ServiceConfig';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version, name, author } from '@root/package.json';
import RequestLoggingInterceptor from '@/common/interceptors/RequestLoggingInterceptor';

export class Bootstrap {
    private readonly serviceConfig: ServiceConfig;

    private app: INestApplication;

    constructor(private readonly appModule: AppModule) {
        this.serviceConfig = new ServiceConfig();
    }

    async start(): Promise<INestApplication> {
        const app: INestApplication = await NestFactory.create(this.appModule, this.getAppOptions());
        this.app = app;
        this.initSwagger();
        this.initCors();
        app.enableShutdownHooks();
        app.useGlobalPipes(new ValidationPipe());
        const { payloadLimitSize, serviceApiPrefix, port } = this.serviceConfig;
        app.use(bodyParser.json({ limit: payloadLimitSize }));
        app.use(bodyParser.urlencoded({ limit: payloadLimitSize, parameterLimit: 10_000_000, extended: true }));
        app.use(cookieParser());
        app.setGlobalPrefix(serviceApiPrefix);
        app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
        app.useGlobalInterceptors(new RequestLoggingInterceptor(app.get(Logger)));
        await app.listen(port);
        return app;
    }

    initCors(): void {
        const { allowedOrigins } = this.serviceConfig;

        this.app.enableCors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    this.app.get(Logger).log(`OK || origin ${origin}`, 'CORS');
                    /* eslint-disable node/callback-return */
                    callback(null, true);
                } else {
                    this.app.get(Logger).warn(`NOT OK || origin ${origin}`, 'CORS');
                    callback(new Error(`Don't mess this up`));
                    /* eslint-enable node/callback-return */
                }
            },
        });
    }

    initSwagger(): void {
        const { swaggerUsername, swaggerPassword, serviceApiPrefix } = this.serviceConfig;
        const swaggerEndpoint = `${serviceApiPrefix}/swagger`;

        if (swaggerPassword) {
            this.app.use(
                swaggerEndpoint,
                basicAuth({
                    challenge: true,
                    users: {
                        [swaggerUsername]: swaggerPassword,
                    },
                }),
            );
        }

        const config = new DocumentBuilder()
            .addServer(serviceApiPrefix)
            .setTitle(name)
            .setVersion(version)
            .setContact(author.name, author.url, author.email)
            .addApiKey({ type: 'apiKey', name: 'Authorization', in: 'header' }, 'Authorization')
            .build();

        const document = SwaggerModule.createDocument(this.app, config);

        SwaggerModule.setup(swaggerEndpoint, this.app, document, {
            customSiteTitle: 'API Docs | Firecracker Vocabulary Flashcards',
            customfavIcon: `https://firecrackervocabulary.com/assets/icon/favicon/favicon-32x32.png`,
        });
    }

    private getAppOptions(): NestApplicationOptions {
        let options: NestApplicationOptions;

        if (this.serviceConfig.environment === 'development') {
            options = {
                // Enabling HTTPS by following the steps mentioned at
                // https://www.section.io/engineering-education/how-to-get-ssl-https-for-localhost/
                // We also need to import certificate authority by hitting
                // <chrome://settings/certificates>
                httpsOptions: {
                    key: fs.readFileSync('cert/CA/localhost/localhost.decrypted.key'),
                    cert: fs.readFileSync('cert/CA/localhost/localhost.crt'),
                },
            };
        }

        return options;
    }
}

export function kickOff(module: AppModule): Promise<INestApplication> {
    return new Bootstrap(module).start();
}
