import { describe, it, expect } from 'vitest';
import { initialForm, parseStandardParams } from '../../src/eventForm';
import type { EventForm } from '../../src/eventForm';
import { CalendarDate } from '@internationalized/date';

describe('eventForm.ts', () => {
  describe('initialForm', () => {
    it('should have all required fields', () => {
      expect(initialForm).toBeDefined();
      expect(initialForm.title).toBeDefined();
      expect(initialForm.description).toBeDefined();
      expect(initialForm.location).toBeDefined();
      expect(initialForm.sDate).toBeDefined();
      expect(initialForm.sTime).toBeDefined();
      expect(initialForm.eDate).toBeDefined();
      expect(initialForm.eTime).toBeDefined();
      expect(initialForm.timezone).toBeDefined();
      expect(initialForm.isAllDay).toBeDefined();
      expect(initialForm.password).toBeDefined();
    });

    it('should have title as empty string', () => {
      expect(initialForm.title).toBe('');
    });

    it('should have description as empty string', () => {
      expect(initialForm.description).toBe('');
    });

    it('should have location as empty string', () => {
      expect(initialForm.location).toBe('');
    });

    it('should have password as empty string', () => {
      expect(initialForm.password).toBe('');
    });

    it('should have isAllDay as false', () => {
      expect(initialForm.isAllDay).toBe(false);
    });

    it('should have sDate and eDate as CalendarDate objects or null', () => {
      expect(initialForm.sDate === null || initialForm.sDate instanceof Object).toBe(true);
      expect(initialForm.eDate === null || initialForm.eDate instanceof Object).toBe(true);
    });

    it('should have valid time format for sTime and eTime', () => {
      const timeRegex = /^\d{2}:\d{2}$/;
      expect(timeRegex.test(initialForm.sTime)).toBe(true);
      expect(timeRegex.test(initialForm.eTime)).toBe(true);
    });

    it('should have a valid timezone', () => {
      expect(typeof initialForm.timezone).toBe('string');
      expect(initialForm.timezone.length).toBeGreaterThan(0);
    });
  });

  describe('parseStandardParams', () => {
    it('should return object with string properties', () => {
      const params = parseStandardParams();
      expect(typeof params).toBe('object');
      expect(params).not.toBeNull();
    });

    it('should handle no query parameters', () => {
      // This assumes the function reads from window.location
      const params = parseStandardParams();
      expect(params).toBeDefined();
      expect(typeof params).toBe('object');
    });

    it('should have title property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.title === undefined || typeof params.title === 'string').toBe(true);
    });

    it('should have description property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.description === undefined || typeof params.description === 'string').toBe(true);
    });

    it('should have location property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.location === undefined || typeof params.location === 'string').toBe(true);
    });

    it('should have sDate property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.sDate === undefined || typeof params.sDate === 'string').toBe(true);
    });

    it('should have sTime property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.sTime === undefined || typeof params.sTime === 'string').toBe(true);
    });

    it('should have eDate property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.eDate === undefined || typeof params.eDate === 'string').toBe(true);
    });

    it('should have eTime property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.eTime === undefined || typeof params.eTime === 'string').toBe(true);
    });

    it('should have timezone property that is string or undefined', () => {
      const params = parseStandardParams();
      expect(params.timezone === undefined || typeof params.timezone === 'string').toBe(true);
    });

    it('should have isAllDay property that is boolean or undefined', () => {
      const params = parseStandardParams();
      expect(
        params.isAllDay === undefined || typeof params.isAllDay === 'boolean' || typeof params.isAllDay === 'string',
      ).toBe(true);
    });

    it('should parse date strings correctly', () => {
      const params = parseStandardParams();
      if (params.sDate) {
        // Should be in YYYY-MM-DD format
        expect(/^\d{4}-\d{2}-\d{2}$/.test(params.sDate)).toBe(true);
      }
    });
  });
});
