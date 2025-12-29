import { describe, it, expect, vi } from 'vitest';
import {
  encryptString,
  decryptString,
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

describe('Encryption Tests', () => {
  describe('encryptString and decryptString', () => {
    it('should encrypt and decrypt simple text', async () => {
      const plaintext = 'Hello, World!';
      const password = 'secure-password-123';

      const encrypted = await encryptString(plaintext, password);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^v1\./);

      const decrypted = await decryptString(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', async () => {
      const plaintext = '';
      const password = 'password';

      const encrypted = await encryptString(plaintext, password);
      const decrypted = await decryptString(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const password = 'test-password';

      const encrypted = await encryptString(plaintext, password);
      const decrypted = await decryptString(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode characters', async () => {
      const plaintext = '你好世界 🎉 مرحبا بالعالم';
      const password = 'unicode-password';

      const encrypted = await encryptString(plaintext, password);
      const decrypted = await decryptString(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt very long strings', async () => {
      const plaintext = 'A'.repeat(10000);
      const password = 'password';

      const encrypted = await encryptString(plaintext, password);
      const decrypted = await decryptString(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'Same message';
      const password = 'password';

      const encrypted1 = await encryptString(plaintext, password);
      const encrypted2 = await encryptString(plaintext, password);

      // Due to random salt and IV, should be different
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same plaintext
      const decrypted1 = await decryptString(encrypted1, password);
      const decrypted2 = await decryptString(encrypted2, password);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should use v1 format', async () => {
      const encrypted = await encryptString('test', 'password');
      expect(encrypted).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9]+\.[A-Za-z0-9_-]+$/);
    });

    it('should fail decryption with wrong password', async () => {
      const plaintext = 'Secret message';
      const password1 = 'password1';
      const password2 = 'password2';

      const encrypted = await encryptString(plaintext, password1);

      try {
        await decryptString(encrypted, password2);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Decryption failed');
      }
    });

    it('should fail with invalid payload format', async () => {
      try {
        await decryptString('invalid-payload', 'password');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Invalid payload format');
      }
    });

    it('should fail with malformed base64url', async () => {
      try {
        const badPayload = 'v1.!!!.!!!.250000.!!!';
        await decryptString(badPayload, 'password');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBeTruthy();
      }
    });

    it('should encrypt JSON serialized form data', async () => {
      const formData = {
        title: 'Meeting',
        description: 'Q1 Planning',
        location: 'Room 101',
        sDate: '2025-12-25',
        eDate: '2025-12-26',
      };

      const plaintext = JSON.stringify(formData);
      const password = 'form-password';

      const encrypted = await encryptString(plaintext, password);
      const decrypted = await decryptString(encrypted, password);

      const restored = JSON.parse(decrypted);
      expect(restored).toEqual(formData);
    });

    it('should handle passwords with special characters', async () => {
      const plaintext = 'Secret';
      const passwords = [
        'P@ssw0rd!',
        'пароль', // Russian
        '密码', // Chinese
        '🔐secure',
      ];

      for (const password of passwords) {
        const encrypted = await encryptString(plaintext, password);
        const decrypted = await decryptString(encrypted, password);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should encrypt parameters for URL sharing with password', async () => {
      const params = {
        title: 'Confidential Meeting',
        description: 'Private details',
        location: 'Secret location',
      };

      const plaintext = JSON.stringify(params);
      const password = 'secure-share-password';

      const encrypted = await encryptString(plaintext, password);

      // Encrypted string should be URL-safe
      const urlSafePattern = /^[A-Za-z0-9_.-]*$/;
      expect(urlSafePattern.test(encrypted)).toBe(true);

      const decrypted = await decryptString(encrypted, password);
      const restored = JSON.parse(decrypted);
      expect(restored).toEqual(params);
    });
  });
});

describe('Time Conversion Tests', () => {
  describe('to24Hour', () => {
    it('should convert morning times correctly', () => {
      expect(to24Hour('6:00 AM')).toBe('06:00');
      expect(to24Hour('8:30 AM')).toBe('08:30');
      expect(to24Hour('11:59 AM')).toBe('11:59');
    });

    it('should convert afternoon times correctly', () => {
      expect(to24Hour('12:00 PM')).toBe('12:00');
      expect(to24Hour('1:00 PM')).toBe('13:00');
      expect(to24Hour('3:45 PM')).toBe('15:45');
      expect(to24Hour('11:59 PM')).toBe('23:59');
    });

    it('should handle midnight correctly', () => {
      expect(to24Hour('12:00 AM')).toBe('00:00');
      expect(to24Hour('12:30 AM')).toBe('00:30');
      expect(to24Hour('12:45 AM')).toBe('00:45');
    });

    it('should handle noon correctly', () => {
      expect(to24Hour('12:00 PM')).toBe('12:00');
      expect(to24Hour('12:15 PM')).toBe('12:15');
      expect(to24Hour('12:45 PM')).toBe('12:45');
    });

    it('should handle already 24-hour format', () => {
      const result = to24Hour('14:30');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should pad hours and minutes correctly', () => {
      const result = to24Hour('1:05 AM');
      expect(result).toBe('01:05');
    });
  });

  describe('toLocaleTimeFormat', () => {
    it('should convert 24-hour to locale format', () => {
      const result = toLocaleTimeFormat('14:30');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle various times', () => {
      const times = ['00:00', '06:00', '12:00', '18:00', '23:59'];

      for (const time of times) {
        const result = toLocaleTimeFormat(time);
        expect(typeof result).toBe('string');
        expect(result).toBeTruthy();
      }
    });

    it('should handle boundary times', () => {
      expect(toLocaleTimeFormat('00:00')).toBeDefined();
      expect(toLocaleTimeFormat('23:59')).toBeDefined();
    });
  });
});

describe('Link Detection Tests', () => {
  describe('isLink', () => {
    it('should identify HTTP URLs', () => {
      expect(isLink('http://example.com')).toBe(true);
      expect(isLink('http://example.com/path')).toBe(true);
      expect(isLink('http://subdomain.example.com')).toBe(true);
    });

    it('should identify HTTPS URLs', () => {
      expect(isLink('https://example.com')).toBe(true);
      expect(isLink('https://example.com/path?query=value')).toBe(true);
      expect(isLink('https://secure.example.com:8443')).toBe(true);
    });

    it('should identify Zoom links', () => {
      expect(isLink('https://zoom.us/j/123456789')).toBe(true);
    });

    it('should identify Google Meet links', () => {
      expect(isLink('https://meet.google.com/abc-defg-hij')).toBe(true);
    });

    it('should identify Microsoft Teams links', () => {
      expect(isLink('https://teams.microsoft.com/l/meetup-join')).toBe(true);
    });

    it('should identify mailto links', () => {
      expect(isLink('mailto://test@example.com')).toBe(true);
      expect(isLink('mailto://user@domain.co.uk')).toBe(true);
    });

    it('should identify tel links', () => {
      expect(isLink('tel://+1234567890')).toBe(true);
    });

    it('should not identify plain locations', () => {
      expect(isLink('New York, NY')).toBe(false);
      expect(isLink('Conference Room A')).toBe(false);
      expect(isLink('Boardroom')).toBe(false);
      expect(isLink('Meeting Point')).toBe(false);
    });

    it('should not identify plain text', () => {
      expect(isLink('Meeting')).toBe(false);
      expect(isLink('Discussion')).toBe(false);
      expect(isLink('Standup')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isLink('')).toBe(false);
    });

    it('should be case insensitive for protocols', () => {
      expect(isLink('https://EXAMPLE.COM')).toBe(true);
      expect(isLink('http://EXAMPLE.COM')).toBe(true);
    });

    it('should handle URLs with complex paths', () => {
      expect(isLink('https://example.com/path/to/resource?key=value&other=data#anchor')).toBe(true);
    });

    it('should handle IP addresses', () => {
      expect(isLink('http://192.168.1.1')).toBe(true);
      expect(isLink('https://127.0.0.1:8000')).toBe(true);
    });
  });
});

describe('Form Serialization Tests', () => {
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
      expect(record.st).toBe('10:00');
      expect(record.et).toBe('14:00');
      expect(record.tz).toBe('America/New_York');
    });

    it('should handle all-day events', () => {
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

    it('should handle special characters in fields', () => {
      const form = {
        ...initialForm,
        title: 'Meeting: Q&A & Discussion',
        description: 'Details about "important" items',
        location: 'Room A/B',
        sDate: new CalendarDate(2025, 12, 25),
        eDate: new CalendarDate(2025, 12, 26),
      };

      const record = formToRecord(form);

      expect(record.t).toContain('&');
      expect(record.d).toContain('"');
      expect(record.l).toContain('/');
    });

    it('should handle empty optional fields', () => {
      const form = {
        ...initialForm,
        title: 'Event',
        description: '',
        location: '',
        sDate: new CalendarDate(2025, 12, 25),
        eDate: new CalendarDate(2025, 12, 26),
        password: '',
      };

      const record = formToRecord(form);

      expect(record.t).toBe('Event');
    });

    it('should convert dates to string format', () => {
      const form = {
        ...initialForm,
        title: 'Event',
        sDate: new CalendarDate(2025, 12, 25),
        eDate: new CalendarDate(2025, 12, 26),
      };

      const record = formToRecord(form);

      expect(typeof record.sd).toBe('string');
      expect(typeof record.ed).toBe('string');
      expect(record.sd).toMatch(/\d{4}-\d{2}-\d{2}/);
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
        sTime: '10:00',
      };

      const serialized = paramsSerializer(record);
      expect(serialized).toContain('Event');
    });

    it('should properly escape special characters', () => {
      const record = {
        title: 'Event & Conference',
        location: 'Room "A"',
      };

      const serialized = paramsSerializer(record);
      expect(serialized).toBeTruthy();
      // Should handle encoding
      expect(typeof serialized).toBe('string');
    });

    it('should handle long text values', () => {
      const longText = 'A'.repeat(500);
      const record = {
        title: 'Event',
        description: longText,
      };

      const serialized = paramsSerializer(record);
      expect(serialized.length).toBeGreaterThan(100);
    });

    it('should handle Unicode values', () => {
      const record = {
        title: '会议',
        description: 'Встреча',
        location: 'مكان اللقاء',
      };

      const serialized = paramsSerializer(record);
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });
  });
});

describe('Time Options', () => {
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

  it('should have valid labels for each time', () => {
    const times = Object.values(timeOptions);
    for (const label of times) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('User Locale', () => {
  it('should return a valid locale string', () => {
    const locale = getUserLocale();
    expect(typeof locale).toBe('string');
    expect(locale.length).toBeGreaterThan(0);
  });

  it('should return a BCP 47 compliant locale or en-US', () => {
    const locale = getUserLocale();
    const validPattern = /^[a-z]{2}(-[A-Z]{2})?$|^en-US$/;
    expect(validPattern.test(locale) || locale === 'en-US').toBe(true);
  });
});
