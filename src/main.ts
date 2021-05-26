import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';

bootstrap(AppModule).catch((error) => console.log(`Error bootstrapping the App`, error));
