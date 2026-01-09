import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { BrnAccordionImports } from '@spartan-ng/brain/accordion';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCar,
  lucideChevronRight,
  lucideCircleX,
  lucideSettings,
  lucideBook,
  lucideGraduationCap,
  lucideCalendar,
  lucideClock,
  lucideMapPin,
  lucideCheck,
  lucideCircle,
  lucideFileText,
  lucideClipboard,
  lucideUserCheck,
  lucideHourglass,
  lucideCalendarClock,
  lucideUser,
  lucideX,
  lucideMapPinPlus,
  lucideMapPinX,
  lucideMap,
  lucideTriangleAlert,
  lucideInfo,
  lucidePlay,
  lucideRoute,
  lucideGauge,
  lucideTimer,
  lucideMapPinned,
  lucideVideo,
  lucideDatabase,
  lucideDatabaseZap,
  lucideHistory,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { remixStarLine, remixStarFill, remixStarHalfLine } from '@ng-icons/remixicon';
import { LicenseCategoryKey } from '@utils/enums';
import { NoDataTemplateComponent } from '../no-data-template/no-data-template.component';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { InstructorDrivingSessionComponent } from '../instructor-driving-session/instructor-driving-session.component';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { FirebaseService } from '@auth-demo/auth-lib';

import { DOC_VERSION, DOC_VERSION_V1, DOC_TYPE_CASHED, DOC_TYPE } from '@utils/constants';
import { DeepPartial } from '@utils/common';
import {
  BRIEF_SUMMARY,
  InstructorDetailsVehiclesDocCachedV1VehiclesVehicleHistorySummary,
} from '@models/admin/read/details/instructor-details-vehicles.collection';
import { CashedVehiclesProfileDetailsService } from './cashed-vehicles-profile-details.service';

type Props = DeepPartial<InstructorDetailsVehiclesDocCachedV1VehiclesVehicleHistorySummary>;

type LessonSummary = {
  sourceDocumentId: string | undefined;
  vehicleDetails: {
    vehicleId: string | undefined;
    vehicleMaker: string | undefined;
    vehicleModel: string | undefined;
    vehicleYear: string | undefined;
    vehicleTrim: string | undefined;
    vehicleRegistration: string | undefined;
  };
  type: 'lesson';
  lessonNumber: number | undefined;
  lessonGrade: string | undefined;
  lessonTimestamp: Date | undefined;
};

type ExamSummary = {
  sourceDocumentId: string | undefined;
  vehicleDetails: {
    vehicleId: string | undefined;
    vehicleMaker: string | undefined;
    vehicleModel: string | undefined;
    vehicleYear: string | undefined;
    vehicleTrim: string | undefined;
    vehicleRegistration: string | undefined;
  };
  type: 'exam';
  examTimestamp: Date | undefined;
  examPassed: boolean | undefined;
  examTryNumber: number | undefined;
};

type Summary = LessonSummary | ExamSummary;

@Component({
  selector: 'app-instructor-tab-student-history',
  templateUrl: './instructor-tab-student-history.component.html',
  imports: [
    CommonModule,
    NgIcon,
    NoDataTemplateComponent,
    HlmButton,
    HlmDropdownMenuImports,
    HlmAccordionImports,
    BrnAccordionImports,
    HlmCardImports,
    InstructorDrivingSessionComponent,
  ],
  providers: [
    provideIcons({
      lucideCar,
      lucideChevronRight,
      lucideCircleX,
      lucideSettings,
      lucideBook,
      lucideGraduationCap,
      lucideCalendar,
      lucideClock,
      lucideMapPin,
      lucideCheck,
      lucideCircle,
      lucideFileText,
      lucideClipboard,
      lucideUserCheck,
      lucideHourglass,
      lucideCalendarClock,
      lucideChevronDown,
      lucideUser,
      lucideX,
      remixStarLine,
      remixStarFill,
      remixStarHalfLine,
      lucideTimer,
      lucideMapPinned,
      lucideVideo,
      lucideDatabase,
      lucideDatabaseZap,
      lucideHistory,
    }),
  ],
})
export class InstructorTabStudentHistoryComponent {
  readonly _db = inject(FirebaseService).db;
  readonly _sanitizer = inject(DomSanitizer);
  readonly _studentId = signal<string | null | undefined>(undefined);
  readonly _openAccordions = signal<Set<number>>(new Set());
  readonly detailsService = inject(CashedVehiclesProfileDetailsService);

  readonly _studentHistorySummary = signal<Props | undefined | null>(undefined);
  @Input({ required: true }) set studentHistorySummary(value: Props | null | undefined) {
    this._studentHistorySummary.set(value);
  }

  readonly _computedTransformedDocs = computed(() => {
    const studentHistorySummary = this._studentHistorySummary();
    if (studentHistorySummary === undefined) return undefined;
    if (studentHistorySummary === null) return null;

    const sortedSummaries = studentHistorySummary.sort((a, b) => {
      const aTimestamp = a.timestamp;
      const bTimestamp = b.timestamp;
      if (!aTimestamp || !bTimestamp) return 0;
      return bTimestamp.toDate().getTime() - aTimestamp.toDate().getTime();
    });

    const summaries: Summary[] = [];
    sortedSummaries.forEach(doc => {
      const sourceDocumentId = doc.sourceDocumentId;
      if (!sourceDocumentId) return null;
      const vehicleId = doc.vehicleId;
      if (!vehicleId) return null;

      // const vehicleDetailsSignal = this.detailsService.linkTo(vehicleId);
      // const vehicleDetails = vehicleDetailsSignal();
      // if (!vehicleDetails) return null;

      const briefSummary = doc[BRIEF_SUMMARY];
      if (!briefSummary) return null;
      const timestamp = doc.timestamp;
      if (!timestamp) return null;

      const summaryType = briefSummary.summaryType;
      switch (summaryType) {
        case 'lesson':
          const lesson = briefSummary.lesson;
          if (!lesson) return null;
          const lessonGrade = lesson.grade;
          if (!lessonGrade) return null;
          const lessonNumber = lesson.lessonNumber;
          if (!lessonNumber) return null;
          const lessonTimestamp = doc.timestamp;
          if (!lessonTimestamp) return null;
          const lessonSummary: LessonSummary = {
            sourceDocumentId: sourceDocumentId,
            vehicleDetails: {
              vehicleId: vehicleId,
              vehicleMaker: 'Toyota',
              vehicleModel: 'Toyota Corolla',
              vehicleYear: '2022',
              vehicleTrim: 'LE',
              vehicleRegistration: 'ZG-1234-AB',
            },
            type: 'lesson',
            lessonNumber: lessonNumber,
            lessonTimestamp: lessonTimestamp.toDate(),
            lessonGrade: lessonGrade,
          };
          summaries.push(lessonSummary);
          return;
        case 'exam':
          const exam = briefSummary.exam;
          if (!exam) return null;
          const examPassed = exam.passed;
          if (!examPassed) return null;
          const examTimestamp = doc.timestamp;
          if (!examTimestamp) return null;
          const examTryNumber = exam.tryNumber;
          // if (!examTryNumber) return null;
          const examSummary: ExamSummary = {
            sourceDocumentId: sourceDocumentId,
            vehicleDetails: {
              vehicleId: vehicleId,
              vehicleMaker: 'Toyota',
              vehicleModel: 'Toyota Corolla',
              vehicleYear: '2022',
              vehicleTrim: 'LE',
              vehicleRegistration: 'ZG-1234-AB',
            },
            type: 'exam',
            examTimestamp: examTimestamp.toDate(),
            examPassed: examPassed,
            examTryNumber: examTryNumber,
          };
          summaries.push(examSummary);
          return;
        default:
          return;
      }
    });
    return summaries;
  });

  toggleAccordion(index: number): void {
    const openAccordions = this._openAccordions();
    const newOpenAccordions = new Set(openAccordions);
    if (newOpenAccordions.has(index)) newOpenAccordions.delete(index);
    else newOpenAccordions.add(index);
    this._openAccordions.set(newOpenAccordions);
  }

  isAccordionOpen(index: number): boolean {
    return this._openAccordions().has(index);
  }
}
