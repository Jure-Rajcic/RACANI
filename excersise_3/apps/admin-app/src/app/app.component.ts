import { Component, inject, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@auth-demo/auth-lib';
import { ConfigService } from '@env/config.service';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { BrnSheet, BrnSheetImports } from '@spartan-ng/brain/sheet';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmSidebarImports, BrnSheetImports, HlmSheetImports, HlmButtonImports, HlmToasterImports],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly configService = inject(ConfigService);
  // private readonly app = inject(FirebaseApp);
  // private readonly functions = inject(Functions); // <-- will work once provided
  // readonly db = getFirestore(this.app);

  readonly auth = signal(false);
  readonly authService = inject(AuthService);
  readonly sheetRef = viewChild<BrnSheet>('sheetRef');

  closeSheet() {
    this.sheetRef()?.close({});
  }

  constructor() {
    this.loadGoogleMaps();
    //TODO You can remove this or replace it with real credentials
    this.logIn();
  }

  async logIn() {
    console.log('Logging in...');
    await this.authService.login('test@gmail.com', 'password'); // TODO Replace with real credentials for admin
    console.log('Logged in');
    this.auth.set(true);
  }

  private loadGoogleMaps(): void {
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.configService.googleMapsApiKey}&libraries=geometry,marker,places`;
    script.onload = () => console.log('Google Maps API loaded successfully');
    script.onerror = () => console.error('Failed to load Google Maps API');
    document.head.appendChild(script);
  }
}
