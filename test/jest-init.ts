import * as dotenv from 'dotenv';

dotenv.config({
    path: './test/.env.test',
});

global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
