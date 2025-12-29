import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPlaces, debounce, type NominatimPlace } from '../../src/nominatim';

describe('nominatim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchPlaces', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchPlaces('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await searchPlaces('   ');
      expect(result).toEqual([]);
    });

    it('should fetch places from Nominatim API', async () => {
      const mockResponse: NominatimPlace[] = [
        {
          place_id: '1',
          display_name: 'New York, NY, USA',
          lat: '40.7128',
          lon: '-74.0060',
          type: 'city',
        },
      ];

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchPlaces('New York');

      expect(fetchSpy).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].display_name).toBe('New York, NY, USA');
      expect(result[0].lat).toBe('40.7128');
      expect(result[0].lon).toBe('-74.0060');
    });

    it('should include proper headers in API request', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('Paris');

      const callArgs = fetchSpy.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('headers');
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers['Accept-Language']).toBe('en');
      expect(headers['User-Agent']).toContain('calf');
    });

    it('should use default limit of 6', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('Berlin');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=6');
    });

    it('should use custom limit when provided', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('London', 10);

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('limit=10');
    });

    it('should transform response data correctly', async () => {
      const mockResponse = [
        {
          place_id: '123',
          display_name: 'Tokyo, Japan',
          lat: '35.6762',
          lon: '139.6503',
          type: 'city',
          extra_field: 'should_be_ignored',
        },
        {
          place_id: '456',
          display_name: 'Sydney, Australia',
          lat: '-33.8688',
          lon: '151.2093',
          // Missing type field
        },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchPlaces('cities');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        place_id: '123',
        display_name: 'Tokyo, Japan',
        lat: '35.6762',
        lon: '139.6503',
        type: 'city',
      });
      expect(result[1]).toEqual({
        place_id: '456',
        display_name: 'Sydney, Australia',
        lat: '-33.8688',
        lon: '151.2093',
        type: undefined,
      });
    });

    it('should throw error on failed API response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(searchPlaces('query')).rejects.toThrow('Nominatim error: 500');
    });

    it('should handle network errors', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      await expect(searchPlaces('query')).rejects.toThrow('Network error');
    });

    it('should handle non-array JSON response gracefully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Invalid response' }),
      } as Response);

      const result = await searchPlaces('query');

      expect(result).toEqual([]);
    });

    it('should cache results for identical queries', async () => {
      const mockResponse: NominatimPlace[] = [
        {
          place_id: '1',
          display_name: 'Paris, France',
          lat: '48.8566',
          lon: '2.3522',
        },
      ];

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // First call should fetch
      const result1 = await searchPlaces('Paris', 5);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second call with same query and limit should use cache
      const result2 = await searchPlaces('Paris', 5);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No additional fetch

      expect(result1).toEqual(result2);
    });

    it('should not cache results for different limits', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('Rome', 5);
      await searchPlaces('Rome', 10);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should format API URL correctly with query parameters', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('São Paulo');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('nominatim.openstreetmap.org/search');
      expect(url).toContain('format=json');
      expect(url).toContain('addressdetails=0');
      // URL encoding might use + or %20 for spaces
      expect(url).toMatch(/q=S%C3%A3o[\+%20]/);
    });

    it('should handle special characters in query', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await searchPlaces('São Paulo, Brazil');

      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toContain('S%C3%A3o');
    });

    it('should convert all response fields to strings', async () => {
      const mockResponse = [
        {
          place_id: 12345, // number
          display_name: 'Location',
          lat: 50.5,
          lon: 25.3,
        },
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await searchPlaces('location');

      expect(typeof result[0].place_id).toBe('string');
      expect(typeof result[0].lat).toBe('string');
      expect(typeof result[0].lon).toBe('string');
      expect(result[0].place_id).toBe('12345');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounce(mockFn);

      const promise = debouncedFn('arg');
      expect(mockFn).not.toHaveBeenCalled();

      const result = await promise;
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledWith('arg');
    });

    it('should wait 600ms before executing', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounce(mockFn);

      const promise = debouncedFn('test');

      // Advance time by 599ms
      vi.advanceTimersByTime(599);
      expect(mockFn).not.toHaveBeenCalled();

      // Advance to 600ms
      vi.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalled();

      await promise;
      vi.useRealTimers();
    });

    it('should cancel previous execution if called again', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounce(mockFn);

      debouncedFn('first');
      vi.advanceTimersByTime(300);

      debouncedFn('second');
      vi.advanceTimersByTime(300);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('second');

      vi.useRealTimers();
    });

    it('should handle function errors', async () => {
      const error = new Error('Function error');
      const mockFn = vi.fn().mockRejectedValue(error);
      const debouncedFn = debounce(mockFn);

      await expect(debouncedFn()).rejects.toThrow('Function error');
    });

    it('should support multiple function signatures', async () => {
      const mockFn = vi.fn((a: number, b: string) => a.toString() + b);
      const debouncedFn = debounce(mockFn);

      const result = await debouncedFn(42, 'test');

      expect(mockFn).toHaveBeenCalledWith(42, 'test');
      expect(result).toBe('42test');
    });

    it('should preserve function context when called', async () => {
      const obj = {
        value: 10,
        method: function (this: any) {
          return this.value;
        },
      };

      const debouncedFn = debounce(() => obj.method.call(obj));
      const result = await debouncedFn();

      expect(result).toBe(10);
    });

    it('should handle rapid successive calls', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn().mockResolvedValue('done');
      const debouncedFn = debounce(mockFn);

      const calls = [];
      for (let i = 0; i < 10; i++) {
        calls.push(debouncedFn(i));
        vi.advanceTimersByTime(50);
      }

      // Only the last call should execute
      vi.advanceTimersByTime(600);

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith(9);

      vi.useRealTimers();
    });

    it('should return promise that resolves with function result', async () => {
      const mockFn = vi.fn().mockResolvedValue('test result');
      const debouncedFn = debounce(mockFn);

      const result = await debouncedFn();

      expect(result).toBe('test result');
    });
  });
});
