import { Injectable, ApplicationRef, EnvironmentInjector, createComponent } from '@angular/core';
import { GPSErrorRecord, GPSRecords, GPSWarningRecord, isGPSErrorRecord, isGPSWarningRecord } from './map.component';
import { inject } from '@angular/core';
import { ConfigService } from '@env/config.service';

type GoogleMap = google.maps.Map;
type GoogleLatLng = google.maps.LatLng;

@Injectable({ providedIn: 'root' })
export class MapUtilAddTraceService {
  private readonly configService = inject(ConfigService);
  private readonly colors = ['#FF8C00', '#000000'];
  private readonly intervalMinutes = 10;

  async addTrace(map: GoogleMap, gpsPoints: GPSRecords[]) {
    if (!map || gpsPoints.length < 2) return;
    const route = await this.getRoutesApiPolyline(gpsPoints);
    if (route) this.drawColoredSegments(map, route, gpsPoints);
    else this.drawStraightLineSegments(map, gpsPoints);
  }

  // TODO JR: instead of using routes api  maybe roads api would be beneficial
  private async getRoutesApiPolyline(gpsPoints: GPSRecords[]): Promise<GoogleLatLng[] | undefined | null> {
    const origin = {
      latitude: gpsPoints[0].geoPoint.latitude,
      longitude: gpsPoints[0].geoPoint.longitude,
    };
    const destination = {
      latitude: gpsPoints[gpsPoints.length - 1].geoPoint.latitude,
      longitude: gpsPoints[gpsPoints.length - 1].geoPoint.longitude,
    };
    const waypoints = gpsPoints.slice(1, -1).map(point => ({
      latLng: { latitude: point.geoPoint.latitude, longitude: point.geoPoint.longitude },
    }));

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const body = {
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      intermediates: waypoints.map(w => ({ location: { latLng: w.latLng } })),
      travelMode: 'DRIVE',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.configService.googleMapsApiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const encodedPolyline = data.routes[0].polyline.encodedPolyline;

    const { encoding } = (await google.maps.importLibrary('geometry')) as google.maps.GeometryLibrary;
    return encoding.decodePath(encodedPolyline);
  }

  private drawColoredSegments(map: google.maps.Map, route: google.maps.LatLng[], gpsPoints: GPSRecords[]) {
    // Sort GPS points by time just in case
    const sortedPoints = [...gpsPoints].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

    let colorIndex = 0;

    let segmentStartTime = sortedPoints[0].timestamp.toMillis();
    let bucketStartPoint = sortedPoints[0];

    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const elapsed = point.timestamp.toMillis() - segmentStartTime;

      if (elapsed >= this.intervalMinutes * 60 * 1000 || i === sortedPoints.length - 1) {
        // This point ends the bucket
        const startIdx = this.findClosestPolylineIndex(route, bucketStartPoint);
        const endIdx = this.findClosestPolylineIndex(route, point);

        if (endIdx > startIdx) {
          const segmentPath = route.slice(startIdx, endIdx + 1);
          const targetColor = this.colors[colorIndex % this.colors.length];
          new google.maps.Polyline({
            path: segmentPath,
            geodesic: true,
            strokeColor: targetColor,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2,
                  strokeColor: targetColor,
                },
                offset: '100%',
                repeat: '50px',
              },
            ],
          });
        }

        // Prepare new bucket
        bucketStartPoint = point;
        segmentStartTime = point.timestamp.toMillis();
        colorIndex++;
      }
    }
  }

  private findClosestPolylineIndex(polyline: google.maps.LatLng[], gpsPoint: GPSRecords): number {
    let closestIndex = 0;
    let minDistance = Number.MAX_VALUE;

    const targetLat = gpsPoint.geoPoint.latitude;
    const targetLng = gpsPoint.geoPoint.longitude;

    polyline.forEach((point, index) => {
      const distance = this.calculateDistance(targetLat, targetLng, point.lat(), point.lng());

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private drawStraightLineSegments(map: google.maps.Map, gpsPoints: GPSRecords[]): void {
    let colorIndex = 0;

    const sortedPoints = [...gpsPoints].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

    let segmentStartTime = sortedPoints[0].timestamp.toMillis();
    let bucket: google.maps.LatLngLiteral[] = [this.toLatLng(sortedPoints[0])];

    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      const latLng = this.toLatLng(point);
      const elapsed = point.timestamp.toMillis() - segmentStartTime;

      if (elapsed < this.intervalMinutes * 60 * 1000) {
        bucket.push(latLng);
      } else {
        // Draw finished bucket
        if (bucket.length > 1) {
          const targetColor = this.colors[colorIndex % this.colors.length];
          this.drawStraightLineSegment(map, bucket, targetColor);
        }

        // New bucket should *start with last point of previous bucket*
        bucket = [bucket[bucket.length - 1], latLng];
        segmentStartTime = point.timestamp.toMillis();
        colorIndex++;
      }
    }

    // Draw leftover bucket
    if (bucket.length > 1) {
      const targetColor = this.colors[colorIndex % this.colors.length];
      this.drawStraightLineSegment(map, bucket, targetColor);
    }
  }

  private toLatLng(point: GPSRecords): google.maps.LatLngLiteral {
    return { lat: point.geoPoint.latitude, lng: point.geoPoint.longitude };
  }

  private drawStraightLineSegment(map: google.maps.Map, path: google.maps.LatLngLiteral[], color: string): void {
    new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map,
      icons: [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2,
            strokeColor: color,
          },
          offset: '100%',
          repeat: '50px',
        },
      ],
    });
  }
}
