import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstructorTabStudentsComponent } from './components/tabs/instructor-tab-students/instructor-tab-students.component';
import { provideIcons } from '@ng-icons/core';
import { lucideCalendar1, lucideCar, lucideFileCheck, lucideUser, lucideUsers } from '@ng-icons/lucide';

@Component({
  selector: 'app-team-view',
  templateUrl: './view.component.html',
  imports: [CommonModule, InstructorTabStudentsComponent],
  providers: [
    provideIcons({
      lucideUser,
      lucideCar,
      lucideUsers,
      lucideFileCheck,
      lucideCalendar1,
    }),
  ],
})
export default class TeamViewComponent {
  readonly _selectedInstructorId = signal('1');
}
