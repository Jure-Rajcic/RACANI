import { DestroyRef, Injectable, OnInit, RendererFactory2, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

type Theme = 'light' | 'dark'

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly platformId = inject(PLATFORM_ID);
  readonly renderer = inject(RendererFactory2).createRenderer(null, null);
  readonly document = inject(DOCUMENT);
  readonly destroyRef = inject(DestroyRef);
  readonly theme = signal<Theme>('light');


  constructor() {
    const sub = toObservable(this.theme).subscribe((t) => {
        if (t === 'dark')  this.renderer.addClass(this.document.documentElement, 'dark');
        else this.renderer.removeClass(this.document.documentElement, 'dark');
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe())
    this.syncThemeFromLocalStorage();
  }

  private syncThemeFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem('theme');
      this.theme.set(storedTheme === 'dark' ? 'dark' : 'light');
    }
  }

  public toggleDarkMode(): void {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', newTheme);
    }
  }

  public setDarkMode(): void {
    this.theme.set('dark');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', 'dark');
    }
  }

  public setLightMode(): void {
    this.theme.set('light');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', 'light');
    }
  }
}
