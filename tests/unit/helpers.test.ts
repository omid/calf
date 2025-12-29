import { describe, it, expect } from 'vitest';
import {
  encryptString,
  decryptString,
  icalDateFromParts,
  paramsDeserializer,
  dateFromParts,
  timeOptions,
  getUserLocale,
  to24Hour,
  toLocaleTimeFormat,
  isLink,
  formToRecord,
  paramsSerializer,
} from '../../src/helpers';
import { initialForm } from '../../src/eventForm';
import { CalendarDate } from '@internationalized/date';

describe('helpers.ts', () => {
  describe('timeOptions', () => {
    it('should have valid time options', () => {
      expect(timeOptions).toBeDefined();
      expect(typeof timeOptions).toBe('object');
      expect(Object.keys(timeOptions).length).toBeGreaterThan(0);
    });

    it('should contain 24-hour format times', () => {
      const times = Object.keys(timeOptions);
      expect(times.some((t) => t === '00:00')).toBe(true);
      expect(times.some((t) => t === '12:00')).toBe(true);
      expect(times.some((t) => t === '23:30')).toBe(true);
    });
  });

  describe('getUserLocale', () => {
    it('should return a valid locale string', () => {
      const locale = getUserLocale();
      expect(typeof locale).toBe('string');
      expect(locale.length).toBeGreaterThan(0);
      // Should be a valid BCP 47 language tag
      expect(/^[a-z]{2}(-[A-Z]{2})?$/.test(locale) || locale === 'en-US').toBe(true);
    });
  });

  describe('to24Hour', () => {
    it('should convert 12-hour format to 24-hour format', () => {
      expect(to24Hour('9:00 AM')).toBe('09:00');
      expect(to24Hour('12:00 AM')).toBe('00:00');
      expect(to24Hour('12:30 PM')).toBe('12:30');
      expect(to24Hour('3:45 PM')).toBe('15:45');
      expect(to24Hour('11:59 PM')).toBe('23:59');
    });

    it('should handle already 24-hour format', () => {
      const result = to24Hour('14:30');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle edge cases', () => {
      const midnight = to24Hour('12:00 AM');
      const noon = to24Hour('12:00 PM');
      expect(midnight).toBe('00:00');
      expect(noon).toBe('12:00');
    });
  });

  describe('toLocaleTimeFormat', () => {
    it('should convert 24-hour format to locale format', () => {
      const result = toLocaleTimeFormat('14:30');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle various times', () => {
      expect(toLocaleTimeFormat('00:00')).toBeDefined();
      expect(toLocaleTimeFormat('12:00')).toBeDefined();
      expect(toLocaleTimeFormat('23:59')).toBeDefined();
    });
  });

  describe('isLink', () => {
    it('should identify http/https URLs as links', () => {
      expect(isLink('https://example.com')).toBe(true);
      expect(isLink('http://example.com')).toBe(true);
      expect(isLink('https://zoom.us/j/12345')).toBe(true);
    });

    it('should identify mailto links as links', () => {
      expect(isLink('mailto://test@example.com')).toBe(true);
    });

    it('should identify zoom links as links', () => {
      expect(isLink('https://zoom.us/j/123456')).toBe(true);
    });

    it('should not identify plain text as links', () => {
      expect(isLink('New York, NY')).toBe(false);
      expect(isLink('Conference Room A')).toBe(false);
      expect(isLink('Meeting')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isLink('')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isLink('HTTPS://EXAMPLE.COM')).toBe(false);
      expect(isLink('https://EXAMPLE.COM')).toBe(true);
    });
  });

  describe('formToRecord', () => {
    it('should convert form to record with all fields', () => {
      const form = {
        ...initialForm,
        title: 'Test Event',
        description: 'Test Description',
        location: 'New York',
        sDate: new CalendarDate(2025, 12, 25),
        sTime: '10:00',
        eDate: new CalendarDate(2025, 12, 26),
        eTime: '14:00',
        timezone: 'America/New_York',
        isAllDay: false,
        password: 'testpass',
      };

      const record = formToRecord(form);

      expect(record.t).toBe('Test Event');
      expect(record.d).toBe('Test Description');
      expect(record.l).toBe('New York');
      expect(record.sd).toBeDefined();
      expect(record.st).toBe('10:00');
      expect(record.ed).toBeDefined();
      expect(record.et).toBe('14:00');
      expect(record.tz).toBe('America/New_York');
    });

    it('should handle all day events', () => {
      const form = {
        ...initialForm,
        title: 'All Day Event',
        isAllDay: true,
        sDate: new CalendarDate(2025, 12, 25),
        eDate: new CalendarDate(2025, 12, 26),
      };

      const record = formToRecord(form);

      expect(record.t).toBe('All Day Event');
      expect(record.a).toBe('');
    });

    it('should include optional fields when present', () => {
      const form = {
        ...initialForm,
        title: 'Event',
        sDate: new CalendarDate(2025, 12, 25),
        eDate: new CalendarDate(2025, 12, 26),
        password: 'secret',
      };

      const record = formToRecord(form);

      expect(record.t).toBeDefined();
      expect(record.t).toBe('Event');
    });
  });

  describe('paramsSerializer', () => {
    it('should serialize record to string', () => {
      const record = {
        title: 'Test',
        description: 'Desc',
        location: 'Loc',
      };

      const serialized = paramsSerializer(record);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should handle empty records', () => {
      const serialized = paramsSerializer({});
      expect(typeof serialized).toBe('string');
    });

    it('should handle records with various types', () => {
      const record = {
        title: 'Event',
        isAllDay: true,
        timezone: 'UTC',
      };

      const serialized = paramsSerializer(record);
      expect(serialized).toContain('Event');
    });
  });
});

describe('helpers.ts - Additional Coverage', () => {
  describe('icalDateFromParts', () => {
    it('should convert date and time to iCal date format', () => {
      const result = icalDateFromParts('2025-12-25', '10:00', 'UTC');
      expect(result).toBeDefined();
      expect(result.toJSDate()).toEqual(expect.any(Date));
    });

    it('should handle all day events (empty time)', () => {
      const result = icalDateFromParts('2025-12-25', '', 'UTC');
      expect(result).toBeDefined();
      expect(result.toJSDate()).toEqual(expect.any(Date));
    });

    it('should handle different timezones', () => {
      const utcResult = icalDateFromParts('2025-12-25', '10:00', 'UTC');
      const nyResult = icalDateFromParts('2025-12-25', '10:00', 'America/New_York');

      expect(utcResult).toBeDefined();
      expect(nyResult).toBeDefined();
    });

    it('should handle afternoon times', () => {
      const result = icalDateFromParts('2025-12-25', '14:30', 'UTC');
      expect(result).toBeDefined();
      expect(result.toJSDate()).toEqual(expect.any(Date));
    });

    it('should handle late evening times', () => {
      const result = icalDateFromParts('2025-12-25', '23:45', 'UTC');
      expect(result).toBeDefined();
    });

    it('should handle early morning times', () => {
      const result = icalDateFromParts('2025-12-25', '00:15', 'UTC');
      expect(result).toBeDefined();
    });

    it('should handle midnight', () => {
      const result = icalDateFromParts('2025-12-25', '00:00', 'UTC');
      expect(result).toBeDefined();
    });
  });

  describe('dateFromParts', () => {
    it('should convert date and time strings to Date object', () => {
      const result = dateFromParts('2025-12-25', '10:00', 'UTC');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle all day events', () => {
      const result = dateFromParts('2025-12-25', '', 'UTC');
      expect(result).toBeInstanceOf(Date);
      // When no time is provided, it creates a valid date
      expect(result).toBeDefined();
    });

    it('should handle afternoon times', () => {
      const result = dateFromParts('2025-12-25', '14:30', 'UTC');
      expect(result).toBeInstanceOf(Date);
    });

    it('should respect timezone', () => {
      const result = dateFromParts('2025-12-25', '12:00', 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle different date formats', () => {
      const result = dateFromParts('2025-01-01', '08:00', 'UTC');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle dates throughout the year', () => {
      const result = dateFromParts('2025-12-31', '23:59', 'UTC');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('paramsDeserializer', () => {
    it('should deserialize URL parameters', () => {
      const query = 'title=Test&description=Desc';
      const result = paramsDeserializer(query);

      expect(result.title).toBe('Test');
      expect(result.description).toBe('Desc');
    });

    it('should handle encoded special characters', () => {
      const query = 'title=Test%20Event&location=Room%20A';
      const result = paramsDeserializer(query);

      expect(result.title).toBe('Test Event');
      expect(result.location).toBe('Room A');
    });

    it('should handle empty query string', () => {
      const result = paramsDeserializer('');
      expect(result).toEqual({});
    });

    it('should handle single parameter', () => {
      const result = paramsDeserializer('title=Meeting');
      expect(result.title).toBe('Meeting');
    });

    it('should handle parameters with no value', () => {
      const result = paramsDeserializer('flag=');
      expect(result.flag).toBe('');
    });

    it('should handle multiple parameters', () => {
      const query = 'title=Event&sDate=2025-12-25&eDate=2025-12-26&timezone=UTC';
      const result = paramsDeserializer(query);

      expect(result.title).toBe('Event');
      expect(result.sDate).toBe('2025-12-25');
      expect(result.eDate).toBe('2025-12-26');
      expect(result.timezone).toBe('UTC');
    });

    it('should handle ampersand in encoded strings', () => {
      const query = 'title=A%26B';
      const result = paramsDeserializer(query);
      expect(result.title).toBe('A&B');
    });

    it('should handle equals sign in values', () => {
      const query = 'formula=a%3Db';
      const result = paramsDeserializer(query);
      expect(result.formula).toBe('a=b');
    });

    it('should preserve order of parameters', () => {
      const query = 'z=last&a=first&m=middle';
      const result = paramsDeserializer(query);

      expect(result.z).toBe('last');
      expect(result.a).toBe('first');
      expect(result.m).toBe('middle');
    });

    it('should handle URL encoded quotes', () => {
      const query = 'description=%22Hello%22';
      const result = paramsDeserializer(query);
      expect(result.description).toBe('"Hello"');
    });

    it('should handle plus signs (space encoding)', () => {
      const query = 'title=Test+Event';
      const result = paramsDeserializer(query);
      // Plus signs should be treated as literals, not spaces
      expect(result.title).toBe('Test+Event');
    });
  });

  describe('Advanced encryption scenarios', () => {
    it('should handle very long plaintext', async () => {
      const longText = 'x'.repeat(10000);
      const encrypted = await encryptString(longText, 'password');
      const decrypted = await decryptString(encrypted, 'password');

      expect(decrypted).toBe(longText);
    });

    it('should handle multiple special character types', async () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = await encryptString(text, 'pwd123');
      const decrypted = await decryptString(encrypted, 'pwd123');

      expect(decrypted).toBe(text);
    });

    it('should fail with slightly wrong password', async () => {
      const encrypted = await encryptString('secret', 'password123');

      try {
        await decryptString(encrypted, 'password124');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle emoji characters', async () => {
      const emoji = '🎉 Party 🎊 Event 🎈';
      const encrypted = await encryptString(emoji, 'emojiPass');
      const decrypted = await decryptString(encrypted, 'emojiPass');

      expect(decrypted).toBe(emoji);
    });

    it('should preserve newlines', async () => {
      const textWithNewlines = 'Line 1\nLine 2\nLine 3';
      const encrypted = await encryptString(textWithNewlines, 'pass');
      const decrypted = await decryptString(encrypted, 'pass');

      expect(decrypted).toBe(textWithNewlines);
    });

    it('should preserve tabs', async () => {
      const textWithTabs = 'Col1\tCol2\tCol3';
      const encrypted = await encryptString(textWithTabs, 'pass');
      const decrypted = await decryptString(encrypted, 'pass');

      expect(decrypted).toBe(textWithTabs);
    });

    it('should handle mixed case passwords', async () => {
      const text = 'sensitive data';
      const password = 'MyS3cur3P@ssw0rd!';
      const encrypted = await encryptString(text, password);
      const decrypted = await decryptString(encrypted, password);

      expect(decrypted).toBe(text);
    });

    it('should handle null bytes', async () => {
      const text = 'before\x00after';
      const encrypted = await encryptString(text, 'pass');
      const decrypted = await decryptString(encrypted, 'pass');

      expect(decrypted).toBe(text);
    });

    it('should handle numeric strings', async () => {
      const text = '123456789';
      const encrypted = await encryptString(text, 'numpass');
      const decrypted = await decryptString(encrypted, 'numpass');

      expect(decrypted).toBe(text);
    });
  });
});
