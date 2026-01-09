// duration.pipe.ts
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

export type DurationFormat =
  | 'short' // 1h 30m
  | 'medium' // 1 hr 30 min
  | 'long' // 1 hour 30 minutes
  | 'full' // 1 hour and 30 minutes
  | 'hms' // 1h 30m 5s
  | 'hm' // 1h 30m
  | 'ms' // 90m 5s
  | 'digital' // 01:30:05 (HH:mm:ss, hours can exceed 24)
  | 'hours' // 1.5 hours (configurable decimals/rounding)
  | 'minutes' // 90 minutes (configurable decimals/rounding)
  | 'seconds'; // 5400 seconds

export interface DurationPipeOptions {
  /**
   * Rounding applied when format is 'hours' | 'minutes' | 'seconds'.
   * - 'round' (default), 'floor', or 'ceil'
   */
  round?: 'round' | 'floor' | 'ceil';
  /** Decimal places for 'hours'/'minutes' outputs. Default 0. */
  decimals?: number;
  /**
   * Drop zero-valued units for wordy formats.
   * true => "1 hour 5 minutes", false => "1 hour 5 minutes 0 seconds"
   * Default: true
   */
  dropZero?: boolean;
  /**
   * Conjunction for 'full' format between the last two units.
   * Default: "and" => "1 hour and 5 minutes"
   */
  conjunction?: string;
  /**
   * Force showing seconds in 'long'/'full' if non-zero. Default: true.
   * If false, seconds are omitted unless both hours and minutes are 0.
   */
  showSeconds?: boolean;
}

@Pipe({
  name: 'duration',
  pure: true,
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) private locale: string) {}

  transform(
    value: number | null | undefined,
    format: DurationFormat = 'long',
    locale?: string,
    options?: DurationPipeOptions,
  ): string | null {
    if (value === null || value === undefined) return null;

    const secs = Math.max(0, Number(value)); // clamp negatives to 0
    const loc = locale || this.locale;

    const opts: Required<DurationPipeOptions> = {
      round: options?.round ?? 'round',
      decimals: options?.decimals ?? 0,
      dropZero: options?.dropZero ?? true,
      conjunction: options?.conjunction ?? 'and',
      showSeconds: options?.showSeconds ?? true,
    };

    const { h, m, s } = this.split(secs);

    switch (format) {
      case 'digital':
        return this.toDigital(secs);
      case 'hms':
        return this.joinCompact(
          [
            { v: h, u: 'h' },
            { v: m, u: 'm' },
            { v: s, u: 's' },
          ],
          opts.dropZero,
        );
      case 'hm':
        return this.joinCompact(
          [
            { v: h, u: 'h' },
            { v: m, u: 'm' },
          ],
          opts.dropZero,
        );
      case 'ms':
        const totalM = Math.floor(secs / 60);
        const remS = secs % 60;
        return this.joinCompact(
          [
            { v: totalM, u: 'm' },
            { v: remS, u: 's' },
          ],
          opts.dropZero,
        );
      case 'short':
        return this.joinCompact(this.filterUnits(h, m, s, opts), opts.dropZero);
      case 'medium':
        return this.joinLabeled({ h, m, s }, { h: 'hr', m: 'min', s: 'sec' }, opts);
      case 'long':
        return this.joinWordy({ h, m, s }, { h: 'hour', m: 'minute', s: 'second' }, loc, false, opts);
      case 'full':
        return this.joinWordy({ h, m, s }, { h: 'hour', m: 'minute', s: 'second' }, loc, true, opts);
      case 'hours': {
        const hours = secs / 3600;
        const num = this.roundTo(hours, opts.round, opts.decimals);
        return `${this.formatNumber(num, loc)} ${this.plural('hour', num, loc)}`;
      }
      case 'minutes': {
        const minutes = secs / 60;
        const num = this.roundTo(minutes, opts.round, opts.decimals);
        return `${this.formatNumber(num, loc)} ${this.plural('minute', num, loc)}`;
      }
      case 'seconds': {
        const num = this.roundTo(secs, opts.round, 0);
        return `${this.formatNumber(num, loc)} ${this.plural('second', num, loc)}`;
      }
      default:
        return this.joinWordy({ h, m, s }, { h: 'hour', m: 'minute', s: 'second' }, loc, false, opts);
    }
  }

  // ---- helpers ----

  private split(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return { h, m, s };
  }

  private toDigital(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  private filterUnits(h: number, m: number, s: number, opts: Required<DurationPipeOptions>) {
    const units = [
      { v: h, u: 'h' },
      { v: m, u: 'm' },
      { v: s, u: 's' },
    ];
    if (!opts.showSeconds) return units.filter(u => u.u !== 's');
    return units;
  }

  private joinCompact(parts: Array<{ v: number; u: string }>, dropZero: boolean) {
    const filtered = dropZero ? parts.filter(p => p.v !== 0) : parts;
    if (filtered.length === 0) return '0s';
    return filtered.map(p => `${p.v}${p.u}`).join(' ');
  }

  private joinLabeled(
    t: { h: number; m: number; s: number },
    labels: { h: string; m: string; s: string },
    opts: Required<DurationPipeOptions>,
  ) {
    const pieces: string[] = [];
    if (t.h !== 0 || !opts.dropZero) pieces.push(`${t.h} ${labels.h}`);
    if (t.m !== 0 || !opts.dropZero) pieces.push(`${t.m} ${labels.m}`);
    if ((t.s !== 0 || !opts.dropZero) && opts.showSeconds) pieces.push(`${t.s} ${labels.s}`);
    return pieces.length ? pieces.join(' ') : `0 ${labels.s}`;
  }

  private joinWordy(
    t: { h: number; m: number; s: number },
    words: { h: string; m: string; s: string },
    locale: string,
    useConjunction: boolean,
    opts: Required<DurationPipeOptions>,
  ) {
    const parts: string[] = [];
    if (t.h !== 0 || !opts.dropZero)
      parts.push(`${this.formatNumber(t.h, locale)} ${this.plural(words.h, t.h, locale)}`);
    if (t.m !== 0 || !opts.dropZero)
      parts.push(`${this.formatNumber(t.m, locale)} ${this.plural(words.m, t.m, locale)}`);
    if ((t.s !== 0 || !opts.dropZero) && opts.showSeconds)
      parts.push(`${this.formatNumber(t.s, locale)} ${this.plural(words.s, t.s, locale)}`);

    if (parts.length === 0) return `0 ${this.plural(words.s, 0, locale)}`;
    if (!useConjunction || parts.length < 2) return parts.join(' ');

    // Oxford-comma-ish join with conjunction
    if (parts.length === 2) return `${parts[0]} ${opts.conjunction} ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')} ${opts.conjunction} ${parts[parts.length - 1]}`;
  }

  private roundTo(n: number, mode: 'round' | 'floor' | 'ceil', decimals: number) {
    const factor = Math.pow(10, decimals);
    let x = n * factor;
    if (mode === 'floor') x = Math.floor(x);
    else if (mode === 'ceil') x = Math.ceil(x);
    else x = Math.round(x);
    return x / factor;
  }

  private formatNumber(n: number, locale: string) {
    return new Intl.NumberFormat(locale).format(n);
  }

  /**
   * Extremely simple English pluralization.
   * For fully localized units, wire this up to your i18n solution or expand the map.
   */
  private plural(singular: string, value: number, _locale: string) {
    // Single number AND equals 1 => singular, else plural with "s"
    return Math.abs(value) === 1 ? singular : `${singular}s`;
  }
}

// <!-- value is seconds -->
// <p>{{ 5400 | duration:'short' }}</p>     <!-- 1h 30m -->
// <p>{{ 5400 | duration:'medium' }}</p>    <!-- 1 hr 30 min -->
// <p>{{ 5400 | duration:'long' }}</p>      <!-- 1 hour 30 minutes -->
// <p>{{ 5400 | duration:'full' }}</p>      <!-- 1 hour and 30 minutes -->
// <p>{{ 5400 | duration:'hms' }}</p>       <!-- 1h 30m 0s -->
// <p>{{ 5400 | duration:'digital' }}</p>   <!-- 01:30:00 -->
// <p>{{ 5400 | duration:'hours' }}</p>     <!-- 2 hours (with default rounding) -->
// <p>{{ 5400 | duration:'hours':'en-US':{decimals:1} }}</p> <!-- 1.5 hours -->
// <p>{{ 75   | duration:'ms' }}</p>        <!-- 1m 15s -->
// <p>{{ 59   | duration:'full' }}</p>      <!-- 59 seconds -->
// <p>{{ 3600 | duration:'full' }}</p>      <!-- 1 hour -->
