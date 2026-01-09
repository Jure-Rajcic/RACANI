import {Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserViewService {
  readonly userId = signal<string | undefined | null>(undefined);
}
