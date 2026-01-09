import { Injectable } from '@angular/core';

export interface GeoCode {
  streetName?: string;
  streetNumber?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

@Injectable({ providedIn: 'root' })
export class MapUtilGeocode {
  async getAddressFromCoordinates(lat: number, lng: number): Promise<GeoCode | undefined | null> {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (!response.results) return null;
      if (!response.results.length) return null;

      const addressResult: GeoCode = {};
      const location_type_priority = ['ROOFTOP', 'GEOMETRIC_CENTER', 'APPROXIMATE', 'UNKNOWN'];
      let target: google.maps.GeocoderResult | undefined = undefined;
      for (const r of location_type_priority) {
        if (target === undefined) {
          const priorityResult = response.results.find(res => res.geometry.location_type.toUpperCase() === r);
          target = priorityResult;
        }
        if (target) break;
      }
      const result = target ?? response.results[0];
      const addressComponents: google.maps.GeocoderAddressComponent[] = result.address_components;

      addressComponents.forEach(ac => {
        const types = ac.types;
        if (types.includes('street_number')) addressResult.streetNumber = ac.long_name;
        else if (types.includes('route')) addressResult.streetName = ac.long_name;
        else if (types.includes('locality')) addressResult.city = ac.long_name;
        else if (types.includes('administrative_area_level_2')) addressResult.city = ac.long_name;
        else if (types.includes('postal_code')) addressResult.postalCode = ac.long_name;
        else if (types.includes('country')) addressResult.country = ac.long_name;
      });
      return addressResult;
    } catch (error) {
      return null;
    }
  }
}
