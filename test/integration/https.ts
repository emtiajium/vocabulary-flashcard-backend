import { Bootstrap } from '@/bootstrap';
import AppModule from '@/AppModule';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';

describe('HTTPS', () => {
    let bootstrap: Bootstrap;

    test('Options as undefined WHEN SERVICE_ENV is production', async () => {
        process.env.SERVICE_ENV = 'production';
        bootstrap = new Bootstrap(AppModule);

        const appOptions = (bootstrap as ObjectLiteral).getAppOptions();

        expect(appOptions).toBeUndefined();
    });

    test('Options as undefined WHEN SERVICE_ENV is test', async () => {
        process.env.SERVICE_ENV = 'test';
        bootstrap = new Bootstrap(AppModule);

        const appOptions = (bootstrap as ObjectLiteral).getAppOptions();

        expect(appOptions).toBeUndefined();
    });

    test('Options as defined WHEN SERVICE_ENV is development', async () => {
        process.env.SERVICE_ENV = 'development';
        bootstrap = new Bootstrap(AppModule);

        const appOptions = (bootstrap as ObjectLiteral).getAppOptions();

        expect(appOptions.httpsOptions).toBeDefined();
        expect(appOptions.httpsOptions.key).toBeDefined();
        expect(appOptions.httpsOptions.cert).toBeDefined();
    });
});
