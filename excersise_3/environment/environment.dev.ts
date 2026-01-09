export const environment = {
  useEmulators: true,
  emulators: {
    functions: {
      host: 'localhost',
      port: 5001,
    },
    firestore: {
      host: 'localhost',
      port: 8080,
    },
    database: {
      host: 'localhost',
      port: 9000,
    },
  },
  firebaseConfig: {
    apiKey: 'xx',
    authDomain: 'xx',
    projectId: 'xx',
    storageBucket: 'xx',
    messagingSenderId: 'xx',
    appId: 'xx',
    measurementId: 'xx',
    databaseURL: 'xx',
  },
  googleMapsApiKey: 'xx',
  drivingSchoolId: 'xx',
};
