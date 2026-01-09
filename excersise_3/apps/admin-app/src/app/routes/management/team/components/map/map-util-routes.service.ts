import { inject, Injectable } from '@angular/core';
import { GPSRecords } from './map.component';
import { ConfigService } from 'apps/admin-app/environment/config.service';

interface Waypoint {
  latitude: number;
  longitude: number;
}
interface OriginWaypoint {
  location: IntermediateWaypoint;
}
interface IntermediateWaypoint {
  latLng: Waypoint;
}
interface DestinationWaypoint {
  location: IntermediateWaypoint;
}

export type LatLng = google.maps.LatLng;

@Injectable({ providedIn: 'root' })
export class MapUtilRoutes {
  private readonly configService = inject(ConfigService);
  async getRoutesApiPolyline(gpsPoints: GPSRecords[]): Promise<LatLng[] | undefined | null> {
    const originWaypoint: OriginWaypoint = {
      location: {
        latLng: {
          latitude: gpsPoints[0].geoPoint.latitude,
          longitude: gpsPoints[0].geoPoint.longitude,
        },
      },
    };

    const destinationWaypoint: DestinationWaypoint = {
      location: {
        latLng: {
          latitude: gpsPoints[gpsPoints.length - 1].geoPoint.latitude,
          longitude: gpsPoints[gpsPoints.length - 1].geoPoint.longitude,
        },
      },
    };

    const intermediateWaypoints = gpsPoints.slice(1, -1).map(point => {
      const intermediateWaypoint: IntermediateWaypoint = {
        latLng: {
          latitude: point.geoPoint.latitude,
          longitude: point.geoPoint.longitude,
        },
      };
      return intermediateWaypoint;
    });

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.configService.googleMapsApiKey,
      'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
    };
    const body = {
      origin: originWaypoint,
      destination: destinationWaypoint,
      intermediates: intermediateWaypoints,
      travelMode: 'DRIVE',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.routes || !data.routes.length) return null;

    const encodedPolyline = data.routes[0].polyline.encodedPolyline;

    const { encoding } = (await google.maps.importLibrary('geometry')) as google.maps.GeometryLibrary;
    return encoding.decodePath(encodedPolyline);
  }
}
