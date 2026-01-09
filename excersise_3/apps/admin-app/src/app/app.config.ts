import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import { environment } from './../../../../environment/environment.dev';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFunctions(() => {
      const fns = getFunctions(undefined, 'us-central1'); // match region
      if (environment.useEmulators) {
        connectFunctionsEmulator(fns, environment.emulators.functions.host, environment.emulators.functions.port);
      }
      return fns;
    }),
  ],
};
