import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config({
    path: './test/.env.test',
});

if (process.env.LOGGING_CONSOLE_ENABLED === 'false') {
    process.env.TYPEORM_LOGGING = 'false';
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
}
