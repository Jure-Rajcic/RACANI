import { Component, computed, effect, inject, Input, OnInit, resource, signal } from '@angular/core';
import { GeoPoint, Timestamp } from 'firebase/firestore';

import {
  DRIVING_TRAINING_SESSION_ABSOLUTE_PATH,
  TRAINING_CREATION,
  DrivingTrainingDocV1,
} from '@models/admin/write/system/driving-training-session.collection';

import { DOC_ID, DOC_TYPE, DOC_TYPE_CREATION, DOC_VERSION, DOC_VERSION_V1, DocIdType } from '@utils/constants';
import { CommonModule, DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { NoDataTemplateComponent } from '../no-data-template/no-data-template.component';
import {
  lucideCalendarClock,
  lucideMapPinned,
  lucideRoute,
  lucideVideo,
  lucideTriangleAlert,
  lucideClock,
  lucideMapPin,
  lucidePlay,
  lucideFileText,
  lucideHistory,
  lucideMap,
} from '@ng-icons/lucide';
import { DurationPipe } from 'apps/admin-app/src/app/pipes/DurationPipe.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { FirebaseService } from '@auth-demo/auth-lib';
import { DeepPartial } from '@utils/common';
import { GPSErrorRecord, GPSNormalRecord, GPSRecords, GPSWarningRecord, MapComponent } from '../../map/map.component';
import { GeoCode, MapUtilGeocode } from '../../map/map-util-geocode.service';
import { ADMIN_APP_COLL, ADMIN_APP_DOC } from '@models/admin/base.doc';
import { ADMIN_WRITEONLY_COLL, ADMIN_WRITEONLY_SYSTEM_DOC } from '@models/admin/write/write.doc';

interface LessonErrorLog {
  relativeOffsetInSeconds?: number | undefined;
  actualTimestamp?: Date | undefined;
  severity?: 'warning' | 'error' | undefined;
  description?: string | undefined;
}

interface LessonNote {
  date?: Date | undefined;
  note?: string | undefined;
}

interface Lesson {
  timestampStart?: Date | undefined;
  timestampEnd?: Date | undefined;
  durationInSeconds?: number | undefined;
  startingLocation?: string | undefined;
  endingLocation?: string | undefined;
  // sanitizedRouteUrl?: SafeResourceUrl | undefined;
  // sanitizedVideoUrl?: SafeResourceUrl | undefined;
  errorLogs?: (LessonErrorLog | undefined)[] | undefined;
  notes?: (LessonNote | undefined)[] | undefined;
}

type DocCreationV1 = DrivingTrainingDocV1;

@Component({
  selector: 'app-instructor-driving-session',
  templateUrl: './instructor-driving-session.component.html',
  imports: [CommonModule, NgIcon, NoDataTemplateComponent, DatePipe, DurationPipe, MapComponent],
  providers: [
    provideIcons({
      lucideHistory,
      lucideCalendarClock,
      lucideClock,
      lucideMapPinned,
      lucideRoute,
      lucideVideo,
      lucideTriangleAlert,
      lucideMapPin,
      lucidePlay,
      lucideFileText,
      lucideMap,
    }),
  ],
})
export class InstructorDrivingSessionComponent {
  readonly _sanitizer = inject(DomSanitizer);
  readonly mapUtilGeocode = inject(MapUtilGeocode);
  readonly _db = inject(FirebaseService).db;
  readonly _doc = signal<DeepPartial<DocCreationV1> | null | undefined>(undefined);

  readonly _sourceDocumentId = signal<string | null | undefined>(undefined);
  @Input()
  set sourceDocumentId(value: string | null) {
    this._sourceDocumentId.set(value);
  }

  readonly _type = signal<'lesson' | 'exam' | null | undefined>(undefined);
  @Input()
  set type(value: 'lesson' | 'exam' | null) {
    this._type.set(value);
  }

  readonly _alreadyExpanded = signal<boolean>(false);
  readonly _expanded = signal<boolean>(false);
  @Input()
  set expanded(value: boolean) {
    const alreadyExpanded = this._alreadyExpanded();
    if (alreadyExpanded) return;
    this._expanded.set(value);
    if (value) this._alreadyExpanded.set(true);
  }

  readonly _fetchEffect = effect(() => {
    const sourceDocumentId = this._sourceDocumentId();
    const type = this._type();
    const expanded = this._expanded();
    if (!sourceDocumentId || !type || !expanded) return;
    console.log('fetching data for lessonDocId: ' + sourceDocumentId + ' and type: ' + type);
    switch (type) {
      case 'lesson':
        this.fetchDrivingSessionFirestoreData(sourceDocumentId);
        break;
      default:
        return;
    }
  });

  async fetchDrivingSessionFirestoreData(docId: DocIdType) {
    const collectionRef = collection(this._db, DRIVING_TRAINING_SESSION_ABSOLUTE_PATH);
    try {
      const docsSnapshot = await getDocs(
        query(
          collectionRef,
          where(DOC_ID, '==', docId),
          where(DOC_TYPE, 'in', [TRAINING_CREATION]),
          where(DOC_VERSION, '==', DOC_VERSION_V1),
        ),
      );
      if (docsSnapshot.empty) {
        console.error('No doc found for docId: ' + docId);
        return;
      }
      if (docsSnapshot.docs.length > 1) {
        console.error('Multiple docs found for docId: ' + docId);
        return;
      }
      const doc = docsSnapshot.docs[0].data() as DeepPartial<DrivingTrainingDocV1>;
      this._doc.set(doc);
    } catch (error) {
      console.error('Error fetching doc for docId: ' + docId, error);
      return;
    } finally {
      const doc = this._doc();
      if (!doc) this._doc.set(null);
    }
  }

  readonly _lesson = computed(() => {
    const timestampStart = this.buildTimestampStart();
    const timestampEnd = this.buildTimestampEnd();
    const durationInSeconds = this.buildDurationInSeconds();
    const startingLocation = this.buildLessonStartingLocation();
    const endingLocation = this.buildLessonEndingLocation();
    const errorLogs = this.buildLessonErrorLogs();
    const notes = this.buildLessonNotes();

    const lesson: Lesson = {
      timestampStart: timestampStart,
      timestampEnd: timestampEnd,
      durationInSeconds: durationInSeconds,
      startingLocation: startingLocation,
      endingLocation: endingLocation,
      errorLogs: errorLogs,
      notes: notes,
    };
    return lesson;
  });

  readonly buildTimestampStart = computed(() => {
    const doc = this._doc();
    const type = this._type();
    if (!doc || !type) return;
    switch (type) {
      case 'lesson':
        const lessonDoc = doc as DrivingTrainingDocV1;
        if (!lessonDoc || !lessonDoc.lessonTimestampStart) return;
        return lessonDoc.lessonTimestampStart.toDate();

      default:
        return;
    }
  });

  readonly buildTimestampEnd = computed(() => {
    const doc = this._doc();
    const type = this._type();
    if (!doc || !type) return;
    switch (type) {
      case 'lesson':
        const lessonDoc = doc as DrivingTrainingDocV1;
        if (!lessonDoc || !lessonDoc.lessonTimestampEnd) return;
        return lessonDoc.lessonTimestampEnd.toDate();

      default:
        return;
    }
  });

  readonly buildDurationInSeconds = computed(() => {
    const buildTimestampStart = this.buildTimestampStart();
    const buildTimestampEnd = this.buildTimestampEnd();
    if (!buildTimestampStart || !buildTimestampEnd) return;
    return (buildTimestampEnd.getTime() - buildTimestampStart.getTime()) / 1000;
  });

  readonly buildLessonStartingLocation = signal<string | undefined>(undefined);
  readonly buildLessonEndingLocation = signal<string | undefined>(undefined);

  readonly fetchLessonLocationSEffect = effect(() => {
    const doc = this._doc();
    const type = this._type();

    if (!doc || !type) return;
    const extractGeoCode = async (geoPoint: GeoPoint | undefined) => {
      if (!geoPoint) return;
      const geoCode = await this.mapUtilGeocode.getAddressFromCoordinates(geoPoint.latitude, geoPoint.longitude);
      if (!geoCode) return;
      const streetNameStart = geoCode.streetName;
      const streetNumberStart = geoCode.streetNumber;
      if (!streetNameStart || !streetNumberStart) return;
      return streetNameStart + ' ' + streetNumberStart;
    };

    switch (type) {
      case 'lesson':
        const lessonDoc = doc as DrivingTrainingDocV1;
        const geoPointStart1 = lessonDoc.geoPointStart;
        if (geoPointStart1) {
          const geoPoint = new GeoPoint(geoPointStart1.latitude, geoPointStart1.longitude);
          const geoCodePromise = extractGeoCode(geoPoint);
          geoCodePromise.then(geoCode => this.buildLessonStartingLocation.set(geoCode));
        }
        const geoPointEnd1 = lessonDoc.geoPointEnd;
        if (geoPointEnd1) {
          const geoPoint = new GeoPoint(geoPointEnd1.latitude, geoPointEnd1.longitude);
          const geoCodePromise = extractGeoCode(geoPoint);
          geoCodePromise.then(geoCode => this.buildLessonEndingLocation.set(geoCode));
        }
        break;
      default:
        return;
    }
  });

  readonly gpsRecords = computed(() => {
    const doc = this._doc();
    const type = this._type();
    if (!doc || !type) return;
    switch (type) {
      case 'lesson':
        const lessonDoc = doc as DrivingTrainingDocV1;
        const routeGpsPoints = lessonDoc.gpsPoints;
        if (!routeGpsPoints) return;

        const gpsRecords1: GPSRecords[] = [];
        routeGpsPoints.forEach(gpsPoint => {
          const geoPoint = gpsPoint.point;
          if (!geoPoint) return;
          const timestamp = gpsPoint.timestamp;
          if (!timestamp) return;
          const gpsRecord: GPSNormalRecord = {
            geoPoint: new GeoPoint(geoPoint.latitude, geoPoint.longitude),
            timestamp: Timestamp.fromDate(timestamp.toDate()),
            type: 'Normal',
          };
          gpsRecords1.push(gpsRecord);
        });

        const lessonErrorLogs = lessonDoc.lessonErrorLogs;
        if (!lessonErrorLogs) return gpsRecords1;

        lessonErrorLogs.forEach(errorLog => {
          const geoPoint = errorLog.geoPoint;
          if (!geoPoint) return;
          const timestamp = errorLog.timestamp;
          if (!timestamp) return;
          const severity = errorLog.severity;
          if (!severity) return;
          const description = errorLog.description;
          if (!description) return;
          if (severity === 'error') {
            const gpsRecord: GPSErrorRecord = {
              geoPoint: new GeoPoint(geoPoint.latitude, geoPoint.longitude),
              timestamp: Timestamp.fromDate(timestamp.toDate()),
              type: 'Error',
              error: description,
            };
            gpsRecords1.push(gpsRecord);
          } else if (severity === 'warning') {
            const gpsRecord: GPSWarningRecord = {
              geoPoint: new GeoPoint(geoPoint.latitude, geoPoint.longitude),
              timestamp: Timestamp.fromDate(timestamp.toDate()),
              type: 'Warning',
              warning: description,
            };
            gpsRecords1.push(gpsRecord);
          }
        });
        return gpsRecords1;
      default:
        return;
    }
  });

  readonly sanitizedVideoUrl = computed(() => {
    const doc = this._doc();
    const type = this._type();
    if (!doc || type !== 'lesson') return;
    const lessonDoc = doc as DrivingTrainingDocV1;
    if (!lessonDoc || !lessonDoc.lessonVideoUrl) return;
    return this._sanitizer.bypassSecurityTrustResourceUrl(lessonDoc.lessonVideoUrl);
  });

  readonly buildLessonErrorLogs = computed(() => {
    const doc = this._doc();
    const type = this._type();

    if (!doc || type !== 'lesson') return;
    const lessonDoc = doc as DrivingTrainingDocV1;
    if (!lessonDoc || !lessonDoc.lessonErrorLogs) return;

    const lessonTimestampStart = this.buildTimestampStart();
    if (!lessonTimestampStart) return;

    const LessonErrorLog: LessonErrorLog[] = [];
    lessonDoc.lessonErrorLogs.forEach(log => {
      if (!log.timestamp) return;

      const newLog: LessonErrorLog = {
        relativeOffsetInSeconds: (log.timestamp.toDate().getTime() - lessonTimestampStart.getTime()) / 1000,
        actualTimestamp: log.timestamp.toDate(),
        severity: log.severity,
        description: log.description,
      };
      LessonErrorLog.push(newLog);
    });
    return LessonErrorLog;
  });

  readonly buildLessonNotes = computed(() => {
    const doc = this._doc();
    const type = this._type();
    if (!doc || type !== 'lesson') return;
    const lessonDoc = doc as DrivingTrainingDocV1;
    if (!lessonDoc || !lessonDoc.lessonNotes) return;

    const LessonNote: LessonNote[] = [];
    lessonDoc.lessonNotes.forEach(note => {
      if (!note.timestamp) return;
      const newNote: LessonNote = {
        date: note.timestamp.toDate(),
        note: note.note,
      };
      LessonNote.push(newNote);
    });
    return LessonNote;
  });
}
