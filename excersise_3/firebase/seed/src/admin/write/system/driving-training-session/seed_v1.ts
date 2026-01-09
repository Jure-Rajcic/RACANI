import { Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import {
  DRIVING_TRAINING_SESSION_ABSOLUTE_PATH,
  TRAINING_CREATION,
  DrivingTrainingDocV1,
} from '@models/admin/write/system/driving-training-session.collection';
import { DOC_ID, DOC_TYPE, DOC_VERSION, DOC_VERSION_V1 } from '@utils/constants';

export async function seedV1(db: Firestore) {
  const collectionRef = db.collection(DRIVING_TRAINING_SESSION_ABSOLUTE_PATH);

  const batch = db.batch();

  const fn1 = () => {
    const docRef = collectionRef.doc();
    // Use monthIndex to vary the date across different months
    const lessonStartDate = new Date(2025, 10, 24, 14, 0, 0);
    const lessonEndDate = new Date(2025, 10, 24, 15, 30, 0);
    const doc: DrivingTrainingDocV1 = {
      [DOC_TYPE]: TRAINING_CREATION,
      [DOC_VERSION]: DOC_VERSION_V1,
      [DOC_ID]: docRef.id,
      clientId: '1',
      instructorId: '1',
      vehicleId: '1',
      lessonNumber: 1,
      lessonGrade: '3',
      lessonTimestampStart: Timestamp.fromDate(lessonStartDate),
      lessonTimestampEnd: Timestamp.fromDate(lessonEndDate),
      geoPointStart: new GeoPoint(43.729945, 15.901242),
      geoPointEnd: new GeoPoint(43.729732, 15.901765),
      lessonVideoUrl: 'https://www.youtube.com/embed/snP2tXwXLxQ',
      gpsPoints: [
        {
          point: new GeoPoint(43.729945, 15.901242),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:00:00')),
        },
        {
          point: new GeoPoint(43.729837, 15.901682),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:05:00')),
        },
        {
          point: new GeoPoint(43.728511, 15.903034),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:10:00')),
        },
        {
          point: new GeoPoint(43.726616, 15.904698),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:15:00')),
        },
        {
          point: new GeoPoint(43.724095, 15.907088),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:20:00')),
        },
        {
          point: new GeoPoint(43.722924, 15.906498),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:21:00')),
        },
        {
          point: new GeoPoint(43.726949, 15.903259),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:22:00')),
        },
        {
          point: new GeoPoint(43.731582, 15.896543),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:40:00')),
        },
        {
          point: new GeoPoint(43.729732, 15.901765),
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:41:00')),
        },
      ],

      lessonNotes: [
        {
          timestamp: Timestamp.fromDate(lessonStartDate),
          note: 'Student showed good progress with parallel parking. Needs more practice with highway merging.',
        },
      ],
      lessonErrorLogs: [
        {
          // First mistake at 20 minutes and 30 seconds into the lesson
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:10:00')),
          severity: 'warning',
          description: 'Failed to signal before lane change',
          geoPoint: new GeoPoint(43.728511, 15.903034),
        },
        {
          // Second mistake at 1 hour and 2 minutes into the lesson
          timestamp: Timestamp.fromDate(new Date('2025-09-06T10:21:00')),
          severity: 'error',
          description: 'Improper following distance - too close to vehicle ahead',
          geoPoint: new GeoPoint(43.722924, 15.906498),
        },
      ],
    };

    batch.set(docRef, doc);
  };

  const fn2 = () => {
    const docRef = collectionRef.doc();

    const lessonStartDate = new Date(2025, 11, 24, 15, 0, 0);
    const lessonEndDate = new Date(lessonStartDate.getTime() + 45 * 60 * 1000);

    const startPoint = new GeoPoint(45.80081715225768, 15.97040392737487);
    const endPoint = new GeoPoint(45.80079167328869, 15.970693283125048);

    // Helper to generate random minute steps
    const randomMinutes = (min = 1, max = 7) => (Math.floor(Math.random() * (max - min + 1)) + min) * 60 * 1000;

    let currentTime = lessonStartDate.getTime();

    const gpsPath = [
      startPoint,
      new GeoPoint(45.80116930491249, 15.970005436041152),
      new GeoPoint(45.8020745399497, 15.969887129139497),
      new GeoPoint(45.80240304891242, 15.970984839984341),
      new GeoPoint(45.802354231316016, 15.972234295111265),
      new GeoPoint(45.80133283132593, 15.971863803840094),
      new GeoPoint(45.80054419575351, 15.97195892698156),
      new GeoPoint(45.79996330843313, 15.970861180716229),
      new GeoPoint(45.800550818472836, 15.970144387153871),
      new GeoPoint(45.80079167328869, 15.970693283125048),
      endPoint,
    ];

    const gpsPoints = gpsPath.map((point, index) => {
      if (index === gpsPath.length - 1) {
        currentTime = lessonEndDate.getTime(); // force exact 45 min end
      } else if (index !== 0) {
        currentTime += randomMinutes();
      }

      return {
        point,
        timestamp: Timestamp.fromDate(new Date(currentTime)),
      };
    });

    const doc: DrivingTrainingDocV1 = {
      [DOC_TYPE]: TRAINING_CREATION,
      [DOC_VERSION]: DOC_VERSION_V1,
      [DOC_ID]: docRef.id,

      clientId: '1',
      instructorId: '1',
      vehicleId: '1',

      lessonNumber: 2,
      lessonGrade: '4',

      lessonTimestampStart: Timestamp.fromDate(lessonStartDate),
      lessonTimestampEnd: Timestamp.fromDate(lessonEndDate),

      geoPointStart: startPoint,
      geoPointEnd: startPoint,

      lessonVideoUrl: 'https://www.youtube.com/embed/zthGHvjyOKQ?si=CQsRg-TNDs_costF',

      gpsPoints,

      lessonNotes: [
        {
          timestamp: Timestamp.fromDate(lessonStartDate),
          note: 'Student is a bit nervous but shows good progress.',
        },
      ],

      lessonErrorLogs: [
        {
          timestamp: gpsPoints[3].timestamp,
          severity: 'warning',
          description: 'Driving to close to the sidewalk',
          geoPoint: gpsPoints[3].point,
        },
        {
          timestamp: gpsPoints[6].timestamp,
          severity: 'warning',
          description: 'Failed to signal before lane change',
          geoPoint: gpsPoints[6].point,
        },
      ],
    };

    batch.set(docRef, doc);
  };

  fn1();
  fn2();
  await batch.commit();
}
