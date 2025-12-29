import { getUserLocale } from './helpers';
import type { EventQS } from './eventForm';

/**
 * Gets the unlock state from URL parameters
 */
export function getShareUnlockState() {
  const params = new URLSearchParams(window.location.search);
  const cipher = params.get('h');
  if (cipher) return { protected: true, cipher };
  return { protected: false };
}

/**
 * Formats a date in a specific timezone with full date and time
 */
export function formatInTimezone(date: Date, tz?: string): string {
  if (!tz) return date.toUTCString();
  try {
    const locale = new Intl.Locale(getUserLocale());
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    };
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return date.toUTCString();
  }
}

/**
 * Formats just the time in a specific timezone
 */
export function formatInTime(date: Date, tz?: string): string {
  if (!tz) return date.toUTCString();
  try {
    const locale = new Intl.Locale(getUserLocale());
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    };
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return date.toUTCString();
  }
}

/**
 * Formats just the date (no time) in a readable format
 */
export function formatDateOnly(date: Date): string {
  try {
    const locale = new Intl.Locale(getUserLocale());
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    };
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Sanitizes date strings for calendar URLs by removing dashes, colons, and milliseconds
 * e.g., "2025-12-25T14:30:00.123Z" → "20251225T143000Z"
 */
export function sanitizeDate(d: string): string {
  return d.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Calculates timezone display string from a date and event timezone
 */
export function calculateTimezoneDisplay(date: Date, eventTimezone: string): string {
  if (eventTimezone) return eventTimezone;

  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
  const m = String(Math.abs(off) % 60).padStart(2, '0');
  return `${sign}${h}:${m}`;
}

/**
 * Generates Google Calendar link for an event
 */
export function generateGoogleCalendarLink(event: EventQS, startStr: string, endStr: string): string {
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${sanitizeDate(
    startStr,
  )}/${sanitizeDate(endStr)}`;
}

/**
 * Generates Outlook Live link for an event
 */
export function generateOutlookLink(event: EventQS, startStr: string, endStr: string): string {
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? '&allday=true' : ''
  }`;
}

/**
 * Generates Office 365 link for an event
 */
export function generateOffice365Link(event: EventQS, startStr: string, endStr: string): string {
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? '&allday=true' : ''
  }`;
}

/**
 * Generates Yahoo Calendar link for an event
 */
export function generateYahooCalendarLink(event: EventQS, startStr: string, endStr: string): string {
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  return `https://calendar.yahoo.com/?v=60&title=${title}&st=${startStr}&et=${endStr}&desc=${details}&in_loc=${location}&dur=${
    event.isAllDay ? 'allday' : ''
  }`;
}

/**
 * Determines start and end date strings for calendar URLs
 */
export function getCalendarDateStrings(
  event: EventQS,
  startDt: Date,
  endDt: Date,
): { startStr: string; endStr: string } {
  const startStr = event.isAllDay ? event.sDate : startDt.toISOString();
  const endStr = event.isAllDay ? event.eDate : endDt.toISOString();
  return { startStr, endStr };
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}
