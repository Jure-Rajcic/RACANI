import { DocMonthType } from './constants';

export const docMonthFormat = (date: Date) =>
  date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
  }) as DocMonthType;

export const getDateSixMonthsAgo = () => {
  const date = new Date(Date.now());
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month - 6);
};

/**
 * Parse Croatian Auto Club (HAK) date format to Date object
 * Format: DD.MM.YYYY HH:mm (e.g., "17.10.2025 10:00")
 * @param dateStr - Date string in HAK format
 * @returns Date object or undefined if parsing fails
 */
export const parseEuropeanTimestampFormat = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr) return undefined;

  // Parse format: "17.10.2025 10:00"
  const parts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!parts) return undefined;

  const [, day, month, year, hours, minutes] = parts;
  // Create date object: month is 0-indexed in JavaScript
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
};

/**
 * Parse Croatian Auto Club (HAK) date format to Date object (without time)
 * Format: DD.MM.YYYY (e.g., "17.10.2025")
 * @param dateStr - Date string in HAK format
 * @returns Date object or undefined if parsing fails
 */
export const parseEuropeanDateFormat = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr) return undefined;

  // Parse format: "17.10.2025"
  const parts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!parts) return undefined;

  const [, day, month, year] = parts;
  // Create date object: month is 0-indexed in JavaScript
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

/**
 * Parse ISO/SQL datetime format (from metadata)
 * Format: YYYY-MM-DD HH:mm:ss (e.g., "2025-10-16 00:00:00")
 * @param dateStr - Date string in ISO format
 * @returns Date object or undefined if parsing fails
 */
export const parseISOTimestampFormat = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr) return undefined;

  // Parse format: "2025-10-16 00:00:00"
  const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return undefined;

  const [, year, month, day, hours, minutes, seconds] = parts;
  // Create date object: month is 0-indexed in JavaScript
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds),
  );
};

/**
 * Parse flexible date format from HAK forms
 * Supports multiple formats:
 * - DD.MM.YYYY (e.g., "05.01.1983")
 * - DD.MM.YYYY HH:mm (e.g., "16.02.2021 07:45")
 * - ISO format as fallback
 * @param dateStr - Date string in various formats
 * @returns Date object or null if parsing fails
 */
export const parseFlexibleDateFormat = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr || dateStr === '' || dateStr === 'Null') return undefined;

  // Try DD.MM.YYYY HH:mm format first
  const ddmmyyyyHHmmMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (ddmmyyyyHHmmMatch) {
    const [, day, month, year, hours, minutes] = ddmmyyyyHHmmMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  }

  // Try DD.MM.YYYY format
  const ddmmyyyyMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback to ISO
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
};

// YYYY-MM (MonthName): 2025-12 (December)
export const formatYearMonthLabel = (date: Date): string => {
  const year = date.getFullYear();
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
  const monthName = date.toLocaleString('default', { month: 'long' });
  const format = `${year}-${monthNumber} (${monthName})`;
  return format;
};
