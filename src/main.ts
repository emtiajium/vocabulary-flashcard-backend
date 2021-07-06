import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import AutoRunScripts from '@/auto-run-scripts';
import executeManualScript from '@script/index';

bootstrap(AppModule)
    .then((app) => {
        // do not need to wait to be resolved/rejected
        new AutoRunScripts(app).runScripts().finally();
        // workaround for executing manual script (in AEB)
        // TODO execute in a separate thread
        executeManualScript().finally();
    })
    .catch((error) => console.log(`Error bootstrapping the App`, error));
