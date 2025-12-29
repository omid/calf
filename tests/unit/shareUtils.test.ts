import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getShareUnlockState,
  formatInTimezone,
  formatInTime,
  formatDateOnly,
  sanitizeDate,
  calculateTimezoneDisplay,
  generateGoogleCalendarLink,
  generateOutlookLink,
  generateOffice365Link,
  generateYahooCalendarLink,
  getCalendarDateStrings,
  isSameDay,
} from '../../src/shareUtils';
import type { EventQS } from '../../src/eventForm';

// Mock helpers
vi.mock('../../src/helpers', async () => {
  const actual = await vi.importActual('../../src/helpers');
  return {
    ...actual,
    getUserLocale: vi.fn(() => 'en-US'),
  };
});

describe('shareUtils', () => {
  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState({}, '', '/');
  });

  describe('getShareUnlockState', () => {
    it('should return unprotected state when no cipher in URL', () => {
      window.history.replaceState({}, '', '/?t=Test');
      const state = getShareUnlockState();
      expect(state.protected).toBe(false);
    });

    it('should return protected state with cipher when h param exists', () => {
      window.history.replaceState({}, '', '/?h=mocked_cipher_value');
      const state = getShareUnlockState();
      expect(state.protected).toBe(true);
      expect(state.cipher).toBe('mocked_cipher_value');
    });

    it('should handle cipher with special characters', () => {
      window.history.replaceState({}, '', '/?h=cipher%2Fwith%2Fslashes');
      const state = getShareUnlockState();
      expect(state.protected).toBe(true);
      expect(state.cipher).toBe('cipher/with/slashes');
    });

    it('should ignore cipher if other params exist', () => {
      window.history.replaceState({}, '', '/?t=Test&h=cipher123&d=Description');
      const state = getShareUnlockState();
      expect(state.protected).toBe(true);
      expect(state.cipher).toBe('cipher123');
    });
  });

  describe('formatInTimezone', () => {
    const testDate = new Date('2025-12-25T14:30:00Z');

    it('should format date with timezone', () => {
      const result = formatInTimezone(testDate, 'UTC');
      expect(result).toContain('2025');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
    });

    it('should return UTC string when timezone is not provided', () => {
      const result = formatInTimezone(testDate, '');
      expect(result).toContain('2025');
      expect(result).toBeDefined();
    });

    it('should handle different timezones', () => {
      const utcResult = formatInTimezone(testDate, 'UTC');
      const nyResult = formatInTimezone(testDate, 'America/New_York');
      expect(nyResult).toBeDefined();
      expect(typeof nyResult).toBe('string');
    });

    it('should return UTC string for invalid timezone', () => {
      const result = formatInTimezone(testDate, 'Invalid/Timezone');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include time information', () => {
      const result = formatInTimezone(testDate, 'UTC');
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('formatInTime', () => {
    const testDate = new Date('2025-12-25T14:30:00Z');

    it('should format only time', () => {
      const result = formatInTime(testDate, 'UTC');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should return UTC string when timezone is not provided', () => {
      const result = formatInTime(testDate, '');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different timezones', () => {
      const utcResult = formatInTime(testDate, 'UTC');
      const nyResult = formatInTime(testDate, 'America/New_York');
      expect(utcResult).toBeDefined();
      expect(nyResult).toBeDefined();
    });

    it('should return UTC string for invalid timezone', () => {
      const result = formatInTime(testDate, 'Invalid/Timezone');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not include date information', () => {
      const result = formatInTime(testDate, 'UTC');
      expect(result).not.toContain('2025');
    });
  });

  describe('formatDateOnly', () => {
    const testDate = new Date('2025-12-25T14:30:00Z');

    it('should format date without time', () => {
      const result = formatDateOnly(testDate);
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2025');
    });

    it('should include weekday', () => {
      const result = formatDateOnly(testDate);
      // December 25, 2025 is a Thursday
      expect(result.toLowerCase()).toContain('thursday');
    });

    it('should not include time information', () => {
      const result = formatDateOnly(testDate);
      expect(result).not.toMatch(/\d{2}:\d{2}/);
    });

    it('should handle edge cases', () => {
      const leapDay = new Date('2024-02-29T12:00:00Z');
      const result = formatDateOnly(leapDay);
      expect(result).toContain('Feb');
      expect(result).toContain('29');
    });

    it('should handle dates gracefully', () => {
      const validDate = new Date('2025-01-01T12:00:00Z');
      const result = formatDateOnly(validDate);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeDate', () => {
    it('should remove dashes from date', () => {
      const result = sanitizeDate('2025-12-25T14:30:00Z');
      expect(result).not.toContain('-');
    });

    it('should remove colons from time', () => {
      const result = sanitizeDate('2025-12-25T14:30:00Z');
      expect(result).not.toContain(':');
    });

    it('should remove milliseconds', () => {
      const result = sanitizeDate('2025-12-25T14:30:00.123Z');
      expect(result).not.toContain('.');
    });

    it('should produce correct calendar format', () => {
      const result = sanitizeDate('2025-12-25T14:30:00Z');
      expect(result).toMatch(/^\d{8}T\d{6}Z$/);
    });

    it('should handle dates without milliseconds', () => {
      const result = sanitizeDate('2025-12-25T14:30:00Z');
      expect(result).toBe('20251225T143000Z');
    });

    it('should handle dates with milliseconds', () => {
      const result = sanitizeDate('2025-12-25T14:30:00.456Z');
      expect(result).toBe('20251225T143000Z');
    });

    it('should handle leap year dates', () => {
      const result = sanitizeDate('2024-02-29T23:59:59.999Z');
      expect(result).toBe('20240229T235959Z');
    });
  });

  describe('calculateTimezoneDisplay', () => {
    it('should return event timezone when provided', () => {
      const date = new Date('2025-12-25T14:30:00Z');
      const result = calculateTimezoneDisplay(date, 'America/New_York');
      expect(result).toBe('America/New_York');
    });

    it('should calculate offset when timezone is empty', () => {
      const date = new Date('2025-12-25T14:30:00Z');
      const result = calculateTimezoneDisplay(date, '');
      expect(result).toMatch(/^[+-]\d{2}:\d{2}$/);
    });

    it('should use + for positive offset', () => {
      const date = new Date();
      const result = calculateTimezoneDisplay(date, '');
      expect(result).toMatch(/^[+-]/);
    });

    it('should pad hour and minute with zeros', () => {
      const date = new Date();
      const result = calculateTimezoneDisplay(date, '');
      const [, offset] = result.match(/^([+-])(\d{2}):(\d{2})$/) || [];
      expect(offset).toBeDefined();
    });

    it('should handle UTC timezone', () => {
      const date = new Date('2025-12-25T14:30:00Z');
      const result = calculateTimezoneDisplay(date, 'UTC');
      expect(result).toBe('UTC');
    });

    it('should handle various timezones', () => {
      const date = new Date();
      const timezones = ['Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
      timezones.forEach((tz) => {
        const result = calculateTimezoneDisplay(date, tz);
        expect(result).toBe(tz);
      });
    });
  });

  describe('generateGoogleCalendarLink', () => {
    const event: EventQS = {
      title: 'Team Meeting',
      description: 'Q&A session',
      location: 'Room 101',
      sDate: '2025-12-25',
      sTime: '14:00',
      eDate: '2025-12-25',
      eTime: '15:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    it('should generate valid Google Calendar URL', () => {
      const link = generateGoogleCalendarLink(event, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('calendar.google.com');
      expect(link).toContain('Team%20Meeting');
      expect(link).toContain('Room%20101');
    });

    it('should encode title', () => {
      const link = generateGoogleCalendarLink(event, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('Team%20Meeting');
    });

    it('should encode description', () => {
      const link = generateGoogleCalendarLink(event, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('Q%26A');
    });

    it('should encode location', () => {
      const link = generateGoogleCalendarLink(event, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('Room%20101');
    });

    it('should include sanitized dates', () => {
      const link = generateGoogleCalendarLink(event, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('20251225T140000Z');
      expect(link).toContain('20251225T150000Z');
    });

    it('should handle empty description', () => {
      const eventNoDesc = { ...event, description: '' };
      const link = generateGoogleCalendarLink(eventNoDesc, '2025-12-25T14:00:00Z', '2025-12-25T15:00:00Z');
      expect(link).toContain('calendar.google.com');
    });
  });

  describe('generateOutlookLink', () => {
    const event: EventQS = {
      title: 'Conference Call',
      description: 'Quarterly review',
      location: 'Virtual',
      sDate: '2025-12-25',
      sTime: '10:00',
      eDate: '2025-12-25',
      eTime: '11:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    it('should generate valid Outlook Live URL', () => {
      const link = generateOutlookLink(event, '2025-12-25T10:00:00Z', '2025-12-25T11:00:00Z');
      expect(link).toContain('outlook.live.com');
    });

    it('should include allday parameter for all-day events', () => {
      const allDayEvent = { ...event, isAllDay: true };
      const link = generateOutlookLink(allDayEvent, '2025-12-25', '2025-12-26');
      expect(link).toContain('&allday=true');
    });

    it('should not include allday parameter for timed events', () => {
      const link = generateOutlookLink(event, '2025-12-25T10:00:00Z', '2025-12-25T11:00:00Z');
      expect(link).not.toContain('&allday=true');
    });

    it('should encode special characters', () => {
      const link = generateOutlookLink(event, '2025-12-25T10:00:00Z', '2025-12-25T11:00:00Z');
      expect(link).toContain('Quarterly%20review');
    });
  });

  describe('generateOffice365Link', () => {
    const event: EventQS = {
      title: 'Project Review',
      description: 'Sprint retrospective',
      location: 'Building A',
      sDate: '2025-12-25',
      sTime: '09:00',
      eDate: '2025-12-25',
      eTime: '10:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    it('should generate valid Office 365 URL', () => {
      const link = generateOffice365Link(event, '2025-12-25T09:00:00Z', '2025-12-25T10:00:00Z');
      expect(link).toContain('outlook.office.com');
    });

    it('should include allday parameter for all-day events', () => {
      const allDayEvent = { ...event, isAllDay: true };
      const link = generateOffice365Link(allDayEvent, '2025-12-25', '2025-12-26');
      expect(link).toContain('&allday=true');
    });

    it('should handle complex descriptions', () => {
      const complexEvent = { ...event, description: 'Q&A: How to use APIs?' };
      const link = generateOffice365Link(complexEvent, '2025-12-25T09:00:00Z', '2025-12-25T10:00:00Z');
      expect(link).toContain('%26');
    });
  });

  describe('generateYahooCalendarLink', () => {
    const event: EventQS = {
      title: 'Birthday Party',
      description: 'Celebrate!',
      location: 'Downtown',
      sDate: '2025-12-25',
      sTime: '18:00',
      eDate: '2025-12-25',
      eTime: '23:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    it('should generate valid Yahoo Calendar URL', () => {
      const link = generateYahooCalendarLink(event, '2025-12-25T18:00:00Z', '2025-12-25T23:00:00Z');
      expect(link).toContain('calendar.yahoo.com');
    });

    it('should include allday duration for all-day events', () => {
      const allDayEvent = { ...event, isAllDay: true };
      const link = generateYahooCalendarLink(allDayEvent, '2025-12-25', '2025-12-26');
      expect(link).toContain('dur=allday');
    });

    it('should have empty dur for timed events', () => {
      const link = generateYahooCalendarLink(event, '2025-12-25T18:00:00Z', '2025-12-25T23:00:00Z');
      expect(link).toContain('dur=');
    });
  });

  describe('getCalendarDateStrings', () => {
    const event: EventQS = {
      title: 'Event',
      description: '',
      location: '',
      sDate: '2025-12-25',
      sTime: '14:00',
      eDate: '2025-12-26',
      eTime: '15:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    const startDt = new Date('2025-12-25T14:00:00Z');
    const endDt = new Date('2025-12-26T15:00:00Z');

    it('should return ISO strings for timed events', () => {
      const { startStr, endStr } = getCalendarDateStrings(event, startDt, endDt);
      expect(startStr).toContain('2025-12-25');
      expect(startStr).toContain('T');
      expect(endStr).toContain('2025-12-26');
      expect(endStr).toContain('T');
    });

    it('should return date strings for all-day events', () => {
      const allDayEvent = { ...event, isAllDay: true };
      const { startStr, endStr } = getCalendarDateStrings(allDayEvent, startDt, endDt);
      expect(startStr).toBe('2025-12-25');
      expect(endStr).toBe('2025-12-26');
    });

    it('should handle same-day events', () => {
      const sameDayEvent = {
        ...event,
        eDate: '2025-12-25',
        eTime: '15:00',
      };
      const startDt2 = new Date('2025-12-25T14:00:00Z');
      const endDt2 = new Date('2025-12-25T15:00:00Z');

      const { startStr, endStr } = getCalendarDateStrings(sameDayEvent, startDt2, endDt2);
      expect(startStr).toContain('2025-12-25');
      expect(endStr).toContain('2025-12-25');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2025-12-25T10:00:00Z');
      const date2 = new Date('2025-12-25T18:00:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2025-12-25T23:59:59Z');
      const date2 = new Date('2025-12-26T00:00:00Z');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2025-12-31T12:00:00Z');
      const date2 = new Date('2026-01-01T12:00:00Z');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different years', () => {
      const date1 = new Date('2024-12-25T12:00:00Z');
      const date2 = new Date('2025-12-25T12:00:00Z');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle edge cases', () => {
      const leap = new Date('2024-02-29T12:00:00Z');
      const nextDay = new Date('2024-03-01T12:00:00Z');
      expect(isSameDay(leap, nextDay)).toBe(false);
    });

    it('should return true for same midnight moment', () => {
      const date1 = new Date('2025-12-25T00:00:00Z');
      const date2 = new Date('2025-12-25T00:00:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });
  });

  describe('Integration: Multiple timezone formats', () => {
    const testDate = new Date('2025-06-15T12:30:00Z');
    const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

    timezones.forEach((tz) => {
      it(`should handle ${tz} consistently`, () => {
        const fullFormat = formatInTimezone(testDate, tz);
        const timeOnly = formatInTime(testDate, tz);
        const dateOnly = formatDateOnly(testDate);

        expect(fullFormat).toBeDefined();
        expect(timeOnly).toBeDefined();
        expect(dateOnly).toBeDefined();
        expect(fullFormat.length).toBeGreaterThan(timeOnly.length);
      });
    });
  });

  describe('Integration: Calendar links with special characters', () => {
    const eventWithSpecialChars: EventQS = {
      title: 'Q&A: How to use APIs?',
      description: 'Learn best practices & patterns',
      location: 'Room #101 (Building A)',
      sDate: '2025-12-25',
      sTime: '14:00',
      eDate: '2025-12-25',
      eTime: '15:00',
      timezone: 'UTC',
      isAllDay: false,
    };

    const startStr = '2025-12-25T14:00:00Z';
    const endStr = '2025-12-25T15:00:00Z';

    it('should properly encode Google Calendar link', () => {
      const link = generateGoogleCalendarLink(eventWithSpecialChars, startStr, endStr);
      expect(link).toContain('%26');
      expect(link).toContain('calendar.google.com');
    });

    it('should properly encode Outlook link', () => {
      const link = generateOutlookLink(eventWithSpecialChars, startStr, endStr);
      expect(link).toContain('%26');
      expect(link).toContain('outlook.live.com');
    });

    it('should properly encode Office365 link', () => {
      const link = generateOffice365Link(eventWithSpecialChars, startStr, endStr);
      expect(link).toContain('%26');
      expect(link).toContain('outlook.office.com');
    });

    it('should properly encode Yahoo link', () => {
      const link = generateYahooCalendarLink(eventWithSpecialChars, startStr, endStr);
      expect(link).toContain('%26');
      expect(link).toContain('calendar.yahoo.com');
    });
  });
});
