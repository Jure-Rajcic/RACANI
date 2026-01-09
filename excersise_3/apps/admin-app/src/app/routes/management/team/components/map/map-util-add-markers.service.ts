import { Injectable, ApplicationRef, EnvironmentInjector, createComponent } from '@angular/core';
import { GPSErrorRecord, GPSRecords, GPSWarningRecord, isGPSErrorRecord, isGPSWarningRecord } from './map.component';
import { MarkerIconStartComponent } from './map-icon-start.component';
import { inject } from '@angular/core';
import { MapUtilGeocode } from './map-util-geocode.service';
import { MarkerPopupStartComponent } from './map-popup-start.component';
import { MarkerIconEndComponent } from './map-icon-end.component';
import { MarkerPopupEndComponent } from './map-popup-end.component';
import { MarkerIconErrorComponent } from './map-icon-error.component';
import { MarkerPopupErrorComponent } from './map-popup-error.component';
import { MarkerPopupWarningComponent } from './map-popup-warning.component';
import { MarkerIconWarningComponent } from './map-icon-warning.component';
type GoogleMapClass = google.maps.Map;
type GoogleMarkerClass = typeof google.maps.marker.AdvancedMarkerElement;
type GoogleInfoWindowClass = typeof google.maps.InfoWindow;

@Injectable({ providedIn: 'root' })
export class MapUtilAddMarkersService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  async addMarkers(map: GoogleMapClass, gpsPoints: GPSRecords[]) {
    if (!map || !gpsPoints.length) return;
    const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
    if (!AdvancedMarkerElement) return;

    const startPoint = gpsPoints[0];
    this.addMarkerStart(map, startPoint, AdvancedMarkerElement);

    const warningPoints = gpsPoints.filter(isGPSWarningRecord);
    warningPoints.forEach(point => this.addMarkerWarning(map, point, AdvancedMarkerElement));

    const errorPoints = gpsPoints.filter(isGPSErrorRecord);
    errorPoints.forEach(point => this.addMarkerError(map, point, AdvancedMarkerElement));

    const endPoint = gpsPoints[gpsPoints.length - 1];
    this.addMarkerEnd(map, endPoint, AdvancedMarkerElement);
  }

  private addMarkerStart(map: GoogleMapClass, point: GPSRecords, AdvancedMarkerElement: GoogleMarkerClass) {
    const compRefMarkerIcon = createComponent(MarkerIconStartComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(compRefMarkerIcon.hostView);
    const position = {
      lat: point.geoPoint.latitude,
      lng: point.geoPoint.longitude,
    };
    const marker = new AdvancedMarkerElement({
      map,
      position,
      content: compRefMarkerIcon.location.nativeElement,
    });

    const componentRefMarkerPopup = createComponent(MarkerPopupStartComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(componentRefMarkerPopup.hostView);

    let isOpen = false;
    let infoWindow: google.maps.InfoWindow | undefined;

    marker.addListener('click', () => {
      if (!isOpen) {
        componentRefMarkerPopup.instance.geoPoint = point.geoPoint;
        componentRefMarkerPopup.instance.timestamp = point.timestamp;

        infoWindow = new google.maps.InfoWindow({
          content: componentRefMarkerPopup.location.nativeElement,
        });

        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', () => {
          isOpen = false;
          infoWindow = undefined;
        });
        isOpen = true;
      } else {
        infoWindow?.close();
        isOpen = false;
      }
    });
  }

  private addMarkerEnd(map: GoogleMapClass, point: GPSRecords, AdvancedMarkerElement: GoogleMarkerClass) {
    const compRefMarkerIcon = createComponent(MarkerIconEndComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(compRefMarkerIcon.hostView);
    const position = {
      lat: point.geoPoint.latitude,
      lng: point.geoPoint.longitude,
    };
    const marker = new AdvancedMarkerElement({
      map,
      position,
      content: compRefMarkerIcon.location.nativeElement,
    });

    const componentRefMarkerPopup = createComponent(MarkerPopupEndComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(componentRefMarkerPopup.hostView);

    let isOpen = false;
    let infoWindow: google.maps.InfoWindow | undefined;

    marker.addListener('click', () => {
      if (!isOpen) {
        componentRefMarkerPopup.instance.geoPoint = point.geoPoint;
        componentRefMarkerPopup.instance.timestamp = point.timestamp;

        infoWindow = new google.maps.InfoWindow({
          content: componentRefMarkerPopup.location.nativeElement,
        });

        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', () => {
          isOpen = false;
          infoWindow = undefined;
        });
        isOpen = true;
      } else {
        infoWindow?.close();
        isOpen = false;
      }
    });
  }

  private addMarkerError(map: GoogleMapClass, point: GPSErrorRecord, AdvancedMarkerElement: GoogleMarkerClass) {
    const compRefMarkerIcon = createComponent(MarkerIconErrorComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(compRefMarkerIcon.hostView);
    const position = {
      lat: point.geoPoint.latitude,
      lng: point.geoPoint.longitude,
    };
    const marker = new AdvancedMarkerElement({
      map,
      position,
      content: compRefMarkerIcon.location.nativeElement,
    });

    const componentRefMarkerPopup = createComponent(MarkerPopupErrorComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(componentRefMarkerPopup.hostView);

    let isOpen = false;
    let infoWindow: google.maps.InfoWindow | undefined;

    marker.addListener('click', () => {
      if (!isOpen) {
        componentRefMarkerPopup.instance.geoPoint = point.geoPoint;
        componentRefMarkerPopup.instance.timestamp = point.timestamp;
        componentRefMarkerPopup.instance.error = point.error;

        infoWindow = new google.maps.InfoWindow({
          content: componentRefMarkerPopup.location.nativeElement,
        });

        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', () => {
          isOpen = false;
          infoWindow = undefined;
        });
        isOpen = true;
      } else {
        infoWindow?.close();
        isOpen = false;
      }
    });
  }

  private addMarkerWarning(map: GoogleMapClass, point: GPSWarningRecord, AdvancedMarkerElement: GoogleMarkerClass) {
    const compRefMarkerIcon = createComponent(MarkerIconWarningComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(compRefMarkerIcon.hostView);
    const position = {
      lat: point.geoPoint.latitude,
      lng: point.geoPoint.longitude,
    };
    const marker = new AdvancedMarkerElement({
      map,
      position,
      content: compRefMarkerIcon.location.nativeElement,
    });

    const componentRefMarkerPopup = createComponent(MarkerPopupWarningComponent, {
      environmentInjector: this.injector,
    });
    this.appRef.attachView(componentRefMarkerPopup.hostView);

    let isOpen = false;
    let infoWindow: google.maps.InfoWindow | undefined;

    marker.addListener('click', () => {
      if (!isOpen) {
        componentRefMarkerPopup.instance.geoPoint = point.geoPoint;
        componentRefMarkerPopup.instance.timestamp = point.timestamp;
        componentRefMarkerPopup.instance.warning = point.warning;

        infoWindow = new google.maps.InfoWindow({
          content: componentRefMarkerPopup.location.nativeElement,
        });

        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', () => {
          isOpen = false;
          infoWindow = undefined;
        });
        isOpen = true;
      } else {
        infoWindow?.close();
        isOpen = false;
      }
    });
  }
}
