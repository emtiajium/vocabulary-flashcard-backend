import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import AutoRunScripts from '@/auto-run-scripts';
import executeManualScript from '@/manual-scripts/index';

kickOff(AppModule)
    .then((app) => {
        // do not need to wait to be resolved/rejected
        new AutoRunScripts(app).runScripts().finally();
        // workaround for executing manual script (in Amazon EB)
        // TODO execute in a separate thread
        executeManualScript().finally();
    })
    .catch((error) => console.error(`Error bootstrapping the App`, error));
