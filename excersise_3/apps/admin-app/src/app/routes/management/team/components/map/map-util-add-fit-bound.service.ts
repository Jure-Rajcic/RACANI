import { Injectable } from '@angular/core';
import { GPSRecords } from './map.component';

@Injectable({ providedIn: 'root' })
export class MapUtilAddFitBoundService {
  fitMapBounds(map: google.maps.Map, gpsPoints: GPSRecords[]): void {
    if (!map || !gpsPoints.length) return;

    const bounds = new google.maps.LatLngBounds();
    gpsPoints.forEach(point => {
      bounds.extend({ lat: point.geoPoint.latitude, lng: point.geoPoint.longitude });
    });

    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }
}
