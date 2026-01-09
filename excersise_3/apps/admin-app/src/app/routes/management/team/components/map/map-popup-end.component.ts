import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';

import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, Input, signal } from '@angular/core';
import { GeoCode, MapUtilGeocode } from './map-util-geocode.service';
import { GeoPoint, Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-marker-popup-end',
  templateUrl: './map-popup-end.component.html',
  imports: [DatePipe, HlmSpinnerImports, CommonModule],
  standalone: true,
})
export class MarkerPopupEndComponent {
  private readonly geocoderService = inject(MapUtilGeocode);

  readonly geocode = signal<GeoCode | undefined | null>(undefined);

  readonly _geoPoint = signal<GeoPoint | undefined>(undefined);
  @Input({ required: true })
  set geoPoint(value: GeoPoint) {
    this._geoPoint.set(value);
  }

  readonly _timestamp = signal<Timestamp | undefined>(undefined);
  @Input({ required: true })
  set timestamp(value: Timestamp) {
    this._timestamp.set(value);
  }

  readonly streetViewUrl = computed(() => {
    const geoPoint = this._geoPoint();
    if (!geoPoint) return '';
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${geoPoint.latitude},${geoPoint.longitude}`;
  });

  readonly coordinatesText = computed(() => {
    const geoPoint = this._geoPoint();
    if (!geoPoint) return '';
    return `${geoPoint.latitude.toFixed(6)}, ${geoPoint.longitude.toFixed(6)}`;
  });

  readonly formattedAddress = computed(() => {
    const geocode = this.geocode();
    if (!geocode) return '';

    const parts = [];
    if (geocode.streetName && geocode.streetNumber) parts.push(`${geocode.streetName} ${geocode.streetNumber}`);
    else if (geocode.streetName) parts.push(geocode.streetName);
    if (geocode.postalCode && geocode.city) parts.push(`${geocode.postalCode}, ${geocode.city}`);
    else if (geocode.city) parts.push(geocode.city);
    if (geocode.country) parts.push(geocode.country);

    return parts.join('\n');
  });

  readonly _geoPointSetEffect = effect(async () => {
    const geoPoint = this._geoPoint();
    if (!geoPoint) return;

    const geocode = await this.geocoderService.getAddressFromCoordinates(geoPoint.latitude, geoPoint.longitude);
    this.geocode.set(geocode);
  });
}
