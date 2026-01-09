import {
  Component,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  effect,
  inject,
  ComponentFactoryResolver,
  Injector,
  ApplicationRef,
  Input,
} from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { createComponent } from '@angular/core';
import { MarkerIconStartComponent } from './map-icon-start.component';
import { MapUtilAddMarkersService } from './map-util-add-markers.service';
import { MapUtilAddTraceService } from './map-util-add-trace.service';
import { MapUtilAddFitBoundService } from './map-util-add-fit-bound.service';
import { NoDataTemplateComponent } from '../tabs/no-data-template/no-data-template.component';
import { provideIcons } from '@ng-icons/core';

import { lucideDatabase, lucideDatabaseZap, lucideSquareX } from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';

type GpsRecordType = 'Error' | 'Warning' | 'Normal';
interface GPSRecordsBase {
  type: GpsRecordType;
  geoPoint: GeoPoint;
  timestamp: Timestamp;
}
export interface GPSErrorRecord extends GPSRecordsBase {
  type: 'Error';
  error: string;
}

export function isGPSErrorRecord(point: GPSRecords): point is GPSErrorRecord {
  return point.type === 'Error';
}

export interface GPSWarningRecord extends GPSRecordsBase {
  type: 'Warning';
  warning: string;
}

export function isGPSWarningRecord(point: GPSRecords): point is GPSWarningRecord {
  return point.type === 'Warning';
}

export interface GPSNormalRecord extends GPSRecordsBase {
  type: 'Normal';
}

export type GPSRecords = GPSErrorRecord | GPSWarningRecord | GPSNormalRecord;

@Component({
  selector: 'app-map-component',
  templateUrl: './map.component.html',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%; /* takes height from parent */
      }
    `,
  ],

  imports: [NoDataTemplateComponent, CommonModule],
  providers: [
    provideIcons({
      lucideDatabase,
      lucideDatabaseZap,
      lucideSquareX,
    }),
  ],
})
export class MapComponent {
  private readonly utilAddMarkers = inject(MapUtilAddMarkersService);
  private readonly utilAddTrace = inject(MapUtilAddTraceService);
  private readonly utilAddFitBound = inject(MapUtilAddFitBoundService);

  readonly map = signal<google.maps.Map | undefined>(undefined);

  @ViewChild('mapContainer', { static: false })
  private set _(mapContainer: ElementRef<HTMLCanvasElement> | undefined) {
    if (!mapContainer) return;
    const map = new google.maps.Map(mapContainer.nativeElement, {
      zoom: 14,
      mapId: 'IGNORABLE',
    });
    this.map.set(map);
  }

  readonly _gpsPoints = signal<GPSRecords[] | undefined | null>(undefined);

  @Input({ required: true })
  set gpsPoints(value: GPSRecords[] | null) {
    const sorted = value?.sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
    this._gpsPoints.set(sorted);
  }

  private createMapEffect = effect(() => {
    const map = this.map();
    if (!map) return;

    const gpsPoints = this._gpsPoints();
    if (!gpsPoints || !gpsPoints.length) return;

    this.utilAddMarkers.addMarkers(map, gpsPoints);
    this.utilAddTrace.addTrace(map, gpsPoints);
    this.utilAddFitBound.fitMapBounds(map, gpsPoints);
  });
}
