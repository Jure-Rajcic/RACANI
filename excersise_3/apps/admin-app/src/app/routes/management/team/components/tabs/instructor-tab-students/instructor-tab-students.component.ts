import { Component, computed, effect, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideBook,
  lucideCalendar,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleCheck,
  lucideCircleX,
  lucideDatabase,
  lucideDatabaseZap,
  lucideGraduationCap,
  lucideHash,
  lucideSearch,
  lucideSettings,
  lucideUser,
  lucideX,
} from '@ng-icons/lucide';
import { NoDataTemplateComponent } from '../no-data-template/no-data-template.component';
import { CashedInstructorStudentDetailsService } from './instructor-tab-students.service';
import {
  InstructorDetailsStudentsDocCachedV1,
  InstructorDetailsStudentsDocCachedV1StudentsLast6MonthsStats,
  InstructorDetailsStudentsDocCachedV1StudentsStudentSummary,
  InstructorDetailsStudentsDocCachedV1StudentsStudentHistorySummary,
  STUDENTS,
  LAST_6_MONTHS_STATS,
  STUDENT_SUMMARY,
  STUDENT_HISTORY_SUMMARY,
} from '@models/admin/read/details/instructor-details-students.collection';
import { InstructorTabStudentHistoryComponent } from '../instructor-tab-student-history/instructor-tab-student-history.component';

// Student interfaces
export interface Student {
  name: string;
  surname: string;
  email: string;
  status: 'active' | 'completed' | 'dropped';
  enrollmentDate: string;
  totalLessons: number;
  assignedInstructor: string;
}

@Component({
  selector: 'app-instructor-tab-students',
  templateUrl: './instructor-tab-students.component.html',
  standalone: true,
  imports: [CommonModule, InstructorTabStudentHistoryComponent],
  providers: [
    provideIcons({
      lucideUser,
      lucideBook,
      lucideCalendar,
      lucideSettings,
      lucideDatabase,
      lucideDatabaseZap,
      lucideGraduationCap,
    }),
  ],
})
export class InstructorTabStudentsComponent {
  readonly detailsService = inject(CashedInstructorStudentDetailsService);

  readonly instructorId = signal<string | undefined>(undefined);
  @Input() set selectedInstructorId(value: string | undefined) {
    if (!value) return;
    this.instructorId.set(value);
  }

  readonly cashedProfileDoc = computed(() => {
    const instructorId = this.instructorId();
    if (!instructorId) return undefined;
    const cashedProfileDocSignal = this.detailsService.linkTo(instructorId);
    console.log('cashedProfileDocSignal', cashedProfileDocSignal());
    return cashedProfileDocSignal();
  });

  readonly cashedStudentsDoc = computed(() => {
    const cashedProfileDoc = this.cashedProfileDoc();
    if (cashedProfileDoc === undefined) return undefined;
    if (cashedProfileDoc === null) return null;

    const cashedStudentsDoc = cashedProfileDoc[STUDENTS];
    if (!cashedStudentsDoc) return null;
    return cashedStudentsDoc;
  });

  readonly selectedStudentId = signal<string>('1');

  readonly studentHistorySummary = computed(() => {
    const cashedStudentsDoc = this.cashedStudentsDoc();
    const selectedStudentId = this.selectedStudentId();
    if (cashedStudentsDoc === undefined || selectedStudentId === undefined) return undefined;
    if (cashedStudentsDoc === null || selectedStudentId === null) return null;

    const allSummaries = cashedStudentsDoc[STUDENT_HISTORY_SUMMARY];
    if (!allSummaries) return null;
    const filteredSummaries = allSummaries.filter(summary => summary.studentId === selectedStudentId);
    return filteredSummaries;
  });
}
