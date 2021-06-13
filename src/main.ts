import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import AutoRunScripts from '@/auto-run-scripts';

bootstrap(AppModule)
    .then((app) => {
        // do not need to wait to be resolved/rejected
        new AutoRunScripts(app).runScripts().finally();
    })
    .catch((error) => console.log(`Error bootstrapping the App`, error));
