import { Injectable } from '@angular/core';
import { environment } from './environment.dev';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get googleMapsApiKey(): string {
    return environment.googleMapsApiKey;
  }
}
