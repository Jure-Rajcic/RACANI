import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  Component,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
  computed,
  inject,
  DestroyRef,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseService } from '@auth-demo/auth-lib';
import {
  DOC_MONTH,
  DOC_TYPE,
  DOC_TYPE_CREATION,
  DOC_TYPE_EDIT,
  DOC_VERSION,
  DOC_VERSION_V1,
  DocMonthType,
} from '@utils/constants';
import { docMonthFormat, getDateSixMonthsAgo } from '@utils/date.utils';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartBar,
  lucideChartColumn,
  lucideCopyX,
  lucideDatabase,
  lucideDatabaseZap,
  lucideInfo,
  lucideRefreshCcw,
  lucideSquare,
  lucideSquareX,
} from '@ng-icons/lucide';

// Chart Data
@Component({
  selector: 'app-no-data-template',
  templateUrl: './no-data-template.component.html',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmAlertDialogImports, BrnAlertDialogImports, HlmButton, HlmCardImports],
  providers: [
    provideIcons({
      lucideInfo,
      lucideSquare,
      lucideRefreshCcw,
    }),
  ],
})
export class NoDataTemplateComponent {
  readonly _iconName = signal('lucideSquare');
  @Input({ required: true }) set iconName(value: string) {
    this._iconName.set(value);
  }

  readonly _iconColor = signal('var(--color-black)');
  @Input({ required: true }) set iconColor(value: string) {
    this._iconColor.set(value);
  }

  readonly _title = signal('');
  @Input({ required: true }) set title(value: string) {
    this._title.set(value);
  }

  readonly _description = signal('');
  @Input({ required: true }) set description(value: string) {
    this._description.set(value);
  }

  readonly _canRefresh = signal(false);
  @Input({ required: true }) set canRefresh(value: boolean) {
    this._canRefresh.set(value);
  }

  readonly _buttonText = signal('');
  @Input() set buttonText(value: string) {
    this._buttonText.set(value);
  }

  readonly _helpText = signal('');
  @Input() set helpText(value: string) {
    this._helpText.set(value);
  }

  @Output() buttonClick = new EventEmitter<void>();
  protected onButtonClick() {
    this.buttonClick.emit();
  }
}
