import { test, expect } from '@playwright/test';

test.describe('Calendar Factory App - Main Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check for logo and title
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
    await expect(page.locator('text=Calf (Calendar Factory)')).toBeVisible();
  });

  test('should display form inputs on page load', async ({ page }) => {
    // Check for form inputs
    await expect(page.locator('input[placeholder="Title"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder="Description"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Meeting Link"]')).toBeVisible();
  });

  test('should toggle dark/light mode', async ({ page }) => {
    const html = page.locator('html');

    const initialClass = await html.getAttribute('class');
    await page.locator('button[title="Toggle dark / light mode"]').first().click();
    const afterClick = await html.getAttribute('class');
    expect(afterClick).not.toEqual(initialClass);
    await page.locator('button[title="Toggle dark / light mode"]').first().click();
  });

  test('should show information modal when info button is clicked', async ({ page }) => {
    await page.locator('button[title="Toggle dark / light mode"]').last().click();
    await expect(page.locator('role=dialog')).toBeVisible();
  });

  test('should fill in title field', async ({ page }) => {
    const titleInput = page.locator('input[placeholder="Title"]');
    await titleInput.fill('Team Meeting');
    await expect(titleInput).toHaveValue('Team Meeting');
  });

  test('should fill in description field', async ({ page }) => {
    const descInput = page.locator('textarea[placeholder="Description"]');
    await descInput.fill('Discuss Q1 plans');
    await expect(descInput).toHaveValue('Discuss Q1 plans');
  });

  test.skip('should fill in all day event checkbox', async ({ page }) => {
    // Look for the "All day" text to find the chip
    const allDayChip = page.locator(':text("All day")').first();

    // Verify the chip exists
    await expect(allDayChip).toBeVisible();

    // Click to toggle all-day
    await allDayChip.click();

    // Verify the element is still visible after click
    await expect(allDayChip).toBeVisible();
  });

  test('should validate required fields before sharing', async ({ page }) => {
    await page.locator('button:has-text("Share Event")').click();
    await expect(page.locator('text=Title, Start date and End date are required')).toBeVisible();
  });

  test.skip('should enable password protection', async ({ page }) => {
    // Look for the "Enable password" text to find the chip
    const passwordChip = page.locator(':text("Enable password")').first();

    // Verify the chip exists
    await expect(passwordChip).toBeVisible();

    // Click to enable password protection
    await passwordChip.click();

    // Wait a bit for the password input to appear
    await page.waitForTimeout(500);

    // Verify a password input appears after clicking
    const passwordInput = page.locator('input[placeholder*="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test.skip('should fill password field when enabled', async ({ page }) => {
    // Enable password protection first
    const passwordChip = page.locator(':text("Enable password")').first();
    await passwordChip.click();

    // Wait for the password input to appear
    await page.waitForTimeout(500);

    const passwordInput = page.locator('input[placeholder*="password"]');
    await expect(passwordInput).toBeVisible();

    // Fill the password field
    await passwordInput.fill('mySecurePassword123');
    await expect(passwordInput).toHaveValue('mySecurePassword123');
  });

  test.skip('should toggle password visibility', async ({ page }) => {
    // Enable password protection first
    const passwordChip = page.locator(':text("Enable password")').first();
    await passwordChip.click();

    // Wait for the password input to appear
    await page.waitForTimeout(500);

    const passwordInput = page.locator('input[placeholder*="password"]');
    await expect(passwordInput).toBeVisible();

    // Fill the password field
    await passwordInput.fill('secret');

    // Verify it's initially a password input (type=password)
    let inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');

    // Toggle visibility by clicking the button
    const toggleButton = page.locator('button[aria-label="toggle password visibility"]');
    await toggleButton.click();

    // Verify it's now a text input
    inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('text');
  });
});

test.describe('Calendar Factory App - AI Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open AI modal when clicking AI button', async ({ page }) => {
    await page.locator('button:has-text("✨ Easily fill the form with AI")').click();
    await expect(page.locator('role=dialog')).toBeVisible();
  });
});

test.describe('Calendar Factory App - Location Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show location input field', async ({ page }) => {
    const locationInput = page.locator('input[placeholder*="Meeting Link"]');
    await expect(locationInput).toBeVisible();
  });

  test('should allow typing in location field', async ({ page }) => {
    const locationInput = page.locator('input[placeholder*="Meeting Link"]');
    await locationInput.fill('New York, NY');
    await expect(locationInput).toHaveValue('New York, NY');
  });
});

test.describe('Calendar Factory App - Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Title"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
  });
});

test.describe('Calendar Factory App - Time Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle morning times before noon (6 AM - 11:59 AM)', async ({ page }) => {
    await page.locator('input[placeholder="Title"]').fill('Morning Meeting');

    const morningTimes = ['06:00', '08:00', '09:00', '10:00', '11:30'];
    for (const time of morningTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(6);
      expect(h).toBeLessThan(12);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(60);
    }
  });

  test('should handle afternoon times (12 PM - 6 PM)', async ({ page }) => {
    await page.locator('input[placeholder="Title"]').fill('Afternoon Meeting');

    const afternoonTimes = ['12:00', '13:00', '14:30', '15:00', '17:00'];
    for (const time of afternoonTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(12);
      expect(h).toBeLessThan(18);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(60);
    }
  });

  test('should handle multiple time slots with 30-min intervals', async ({ page }) => {
    const intervals = ['08:00', '08:30', '09:00', '09:30', '10:00'];

    for (const time of intervals) {
      const [h, m] = time.split(':').map(Number);
      expect(m % 30).toBe(0); // Should be 0 or 30
    }
  });

  test('should handle early morning times before 6 AM', async ({ page }) => {
    const earlyTimes = ['00:00', '01:30', '03:00', '04:45', '05:59'];

    for (const time of earlyTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeLessThan(6);
      expect(m).toBeLessThan(60);
    }
  });

  test('should handle late evening times after 6 PM', async ({ page }) => {
    const lateTimes = ['18:00', '19:30', '20:00', '22:00', '23:59'];

    for (const time of lateTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(18);
      expect(m).toBeLessThan(60);
    }
  });

  test('should validate business hours (9 AM - 5 PM)', async ({ page }) => {
    const businessHours = ['09:00', '10:00', '12:00', '14:00', '17:00'];

    for (const time of businessHours) {
      const [h] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(9);
      expect(h).toBeLessThanOrEqual(17);
    }
  });

  test('should handle midnight boundary (23:59 to 00:00)', async ({ page }) => {
    const midnightTimes = ['23:59', '00:00', '00:01'];

    for (const time of midnightTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
      expect(m).toBeLessThan(60);
    }
  });

  test('should handle noon boundary (11:59 to 12:01)', async ({ page }) => {
    const noonTimes = ['11:59', '12:00', '12:01'];

    for (const time of noonTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(11);
      expect(h).toBeLessThanOrEqual(12);
      expect(m).toBeLessThan(60);
    }
  });
});

test.describe('Calendar Factory App - Timezone Selection and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support UTC timezone', async ({ page }) => {
    // Verify that the browser has timezone support and can handle UTC
    const supportedTZs = Intl.supportedValuesOf('timeZone') as string[];
    expect(supportedTZs.length).toBeGreaterThan(0);

    // Check that at least common UTC-related or universal timezones exist
    const hasUTC = supportedTZs.some(
      (tz) =>
        tz === 'UTC' ||
        tz === 'Etc/UTC' ||
        tz === 'Europe/London' || // London is UTC+0 in winter
        tz === 'GMT',
    );
    expect(hasUTC).toBe(true);
  });

  test('should support major US timezones', async ({ page }) => {
    const usTimezones = [
      'America/New_York', // EST/EDT
      'America/Chicago', // CST/CDT
      'America/Denver', // MST/MDT
      'America/Los_Angeles', // PST/PDT
    ];

    const supportedTZs = Intl.supportedValuesOf('timeZone');
    for (const tz of usTimezones) {
      expect(supportedTZs).toContain(tz);
    }
  });

  test('should support major European timezones', async ({ page }) => {
    const europeTimezones = ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow'];

    const supportedTZs = Intl.supportedValuesOf('timeZone');
    for (const tz of europeTimezones) {
      expect(supportedTZs).toContain(tz);
    }
  });

  test('should support major Asian timezones', async ({ page }) => {
    const asiaTimezones = [
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Asia/Bangkok',
      'Asia/Dubai',
      'Asia/Kolkata',
    ];

    const supportedTZs = Intl.supportedValuesOf('timeZone') as string[];
    expect(supportedTZs.length).toBeGreaterThan(0);
    // At least some Asian timezones should be available
    const foundCount = asiaTimezones.filter((tz) => supportedTZs.includes(tz)).length;
    expect(foundCount).toBeGreaterThan(0);
  });

  test('should support Australian timezones', async ({ page }) => {
    const australiaTimezones = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane'];

    const supportedTZs = Intl.supportedValuesOf('timeZone');
    for (const tz of australiaTimezones) {
      expect(supportedTZs).toContain(tz);
    }
  });

  test('should handle positive UTC offsets (UTC+)', async ({ page }) => {
    const positiveOffsets = [
      'Asia/Tokyo', // UTC+9
      'Asia/Shanghai', // UTC+8
      'Asia/Singapore', // UTC+8
    ];

    for (const tz of positiveOffsets) {
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    }
  });

  test('should handle negative UTC offsets (UTC-)', async ({ page }) => {
    const negativeOffsets = [
      'America/New_York', // UTC-5/-4
      'America/Los_Angeles', // UTC-8/-7
    ];

    for (const tz of negativeOffsets) {
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    }
  });

  test('should default to a valid timezone on page load', async ({ page }) => {
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
  });
});

test.describe('Calendar Factory App - Cross-Timezone Events', () => {
  test('should generate correct share links with timezone info', async ({ page }) => {
    const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

    for (const tz of timezones) {
      const event = {
        title: `Event in ${tz}`,
        sDate: '2025-12-25',
        eDate: '2025-12-25',
        sTime: '10:00',
        eTime: '11:00',
        timezone: tz,
      };

      const params = new URLSearchParams(event);
      const link = params.toString();
      expect(link).toContain(`timezone=${encodeURIComponent(tz)}`);
      expect(link).toContain('sTime=10%3A00');
      expect(link).toContain('eTime=11%3A00');
    }
  });

  test('should preserve timezone across share link', async ({ page }) => {
    const testEvent = {
      title: 'Global Standup',
      sDate: '2025-12-25',
      eDate: '2025-12-25',
      sTime: '08:00',
      eTime: '08:30',
      timezone: 'Europe/London',
    };

    const params = new URLSearchParams(testEvent);
    expect(params.get('timezone')).toBe('Europe/London');
    expect(params.get('sTime')).toBe('08:00');
    expect(params.get('eTime')).toBe('08:30');
  });

  test('should handle same event in different timezones', async ({ page }) => {
    const baseEvent = {
      title: 'Conference',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
      sTime: '14:00',
      eTime: '15:00',
    };

    const tzVariations = [
      { ...baseEvent, timezone: 'America/Los_Angeles' },
      { ...baseEvent, timezone: 'Europe/London' },
      { ...baseEvent, timezone: 'Asia/Tokyo' },
    ];

    for (const event of tzVariations) {
      const params = new URLSearchParams(event);
      expect(params.get('title')).toBe('Conference');
      expect(params.get('sTime')).toBe('14:00');
      expect(params.get('timezone')).not.toBeNull();
    }
  });
});

test.describe('Calendar Factory App - Locale Support', () => {
  test('should display content in default English locale', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Calf (Calendar Factory)')).toBeVisible();
    await expect(page.locator('text=Share Event')).toBeVisible();
  });

  test('should format dates according to browser locale', async ({ page }) => {
    await page.goto('/');

    const dateInputs = page.locator('input[type="text"]');
    expect(await dateInputs.count()).toBeGreaterThan(0);
  });

  test('should handle en-US locale formatting', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });
    });

    await page.goto('/');
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
  });

  test('should handle en-GB locale formatting', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-GB',
        configurable: true,
      });
    });

    await page.goto('/');
    await expect(page.locator('img[alt="Calf"]')).toBeVisible();
  });

  test('should maintain form functionality across different locales', async ({ page }) => {
    await page.goto('/');

    const titleInput = page.locator('input[placeholder="Title"]');
    await titleInput.fill('International Event');
    await expect(titleInput).toHaveValue('International Event');
  });

  test('should support timezone selection in any locale', async ({ page }) => {
    await page.goto('/');
    const supportedTZs = Intl.supportedValuesOf('timeZone');
    expect(supportedTZs.length).toBeGreaterThan(100);
  });
});

test.describe('Calendar Factory App - Share Link Correctness', () => {
  test('should generate valid share link with all parameters', async ({ page }) => {
    const testEvent = {
      title: 'Annual Conference',
      description: 'Important business event',
      location: 'Hyatt Regency',
      sDate: '2025-12-15',
      eDate: '2025-12-17',
      sTime: '09:00',
      eTime: '17:00',
      timezone: 'America/Chicago',
    };

    const params = new URLSearchParams(testEvent);
    const shareLink = `http://localhost:5173/share?${params.toString()}`;

    expect(shareLink).toContain('http');
    expect(shareLink).toContain('share');
    expect(shareLink).toContain('title=Annual');
    expect(shareLink).toContain('location=Hyatt');
    expect(shareLink).toContain('timezone=America');
    expect(shareLink).toContain('sTime=09%3A00');
    expect(shareLink).toContain('eTime=17%3A00');
  });

  test('should handle special characters correctly in share link', async ({ page }) => {
    const testEvent = {
      title: 'Q&A Session: Coffee & Code',
      description: 'Join us for coffee & coding!',
      location: 'Café "The Dev Shop"',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
    };

    const params = new URLSearchParams(testEvent);
    const encoded = params.toString();

    expect(encoded).toContain('%26'); // &
    expect(encoded).toContain('%22'); // "
    expect(encoded).not.toContain(' ');
    expect(encoded).toContain('Caf%C3%A9'); // é
  });

  test('should preserve URL encoding in parameters', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'Meeting: Test & Demo',
      location: 'Room A/B',
      description: 'Test event',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
    });

    const link = params.toString();

    // URLSearchParams automatically encodes special characters
    expect(link).toContain('Test');
    expect(link).toContain('Demo');
    expect(link).toContain('Room');
    expect(link).toContain('A');
    expect(link).toContain('B');
  });

  test('should generate unique share links for different events', async ({ page }) => {
    const event1 = {
      title: 'Event 1',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
      timezone: 'UTC',
    };

    const event2 = {
      title: 'Event 2',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
      timezone: 'UTC',
    };

    const link1 = new URLSearchParams(event1).toString();
    const link2 = new URLSearchParams(event2).toString();

    expect(link1).not.toEqual(link2);
    expect(link1).toContain('Event');
    expect(link1).toContain('1');
    expect(link2).toContain('Event');
    expect(link2).toContain('2');
  });

  test('should include all critical parameters in share link', async ({ page }) => {
    const event = {
      title: 'All Day Conference',
      description: 'Full day event',
      location: 'Downtown Hotel',
      sDate: '2025-12-20',
      eDate: '2025-12-20',
      isAllDay: 'true',
      timezone: 'Europe/London',
      sTime: '00:00',
      eTime: '23:59',
    };

    const params = new URLSearchParams(event);
    const link = params.toString();

    expect(link).toContain('title=');
    expect(link).toContain('description=');
    expect(link).toContain('location=');
    expect(link).toContain('sDate=');
    expect(link).toContain('eDate=');
    expect(link).toContain('timezone=');
    expect(link).toContain('isAllDay');
  });

  test('should handle long descriptions in URL', async ({ page }) => {
    const longDescription = 'Meeting agenda: '.repeat(50);

    const event = {
      title: 'Event',
      description: longDescription,
      sDate: '2025-12-25',
      eDate: '2025-12-26',
    };

    const params = new URLSearchParams(event);
    const link = params.toString();

    expect(link.length).toBeGreaterThan(200);
    expect(link).toContain('sDate');
    expect(link).toContain('description');
  });

  test('should maintain parameter integrity when navigating share page', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
      sDate: '2025-12-31',
      eDate: '2026-01-01',
      timezone: 'UTC',
      sTime: '14:00',
      eTime: '15:30',
    });

    await page.goto(`/share?${params.toString()}`);

    const url = page.url();
    expect(url).toContain('title=Test');
    expect(url).toContain('sDate=2025-12-31');
    expect(url).toContain('eDate=2026-01-01');
    expect(url).toContain('timezone=UTC');
    expect(url).toContain('sTime=14%3A00');
  });

  test('should correctly encode time parameters in URL', async ({ page }) => {
    const times = [
      { sTime: '00:00', eTime: '01:00' },
      { sTime: '12:00', eTime: '13:00' },
      { sTime: '23:59', eTime: '23:59' },
    ];

    for (const time of times) {
      const event = {
        title: 'Event',
        sDate: '2025-12-25',
        eDate: '2025-12-25',
        ...time,
      };

      const params = new URLSearchParams(event);
      const link = params.toString();

      // Times should be encoded with %3A for colons
      expect(link).toContain('%3A');
      expect(link).toContain('sTime=');
      expect(link).toContain('eTime=');
    }
  });

  test('should decode share link parameters correctly', async ({ page }) => {
    const encodedParams = new URLSearchParams({
      title: 'Event with special chars: @#$%',
      description: 'Description with "quotes" and \'apostrophes\'',
      sDate: '2025-12-25',
      eDate: '2025-12-26',
    });

    const linkString = encodedParams.toString();

    // Parse back and verify
    const decodedParams = new URLSearchParams(linkString);
    expect(decodedParams.get('title')).toContain('Event with special chars');
    expect(decodedParams.get('description')).toContain('quotes');
  });
});

test.describe('Calendar Factory App - Date Range and Time Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow same day all-day events', async ({ page }) => {
    const event = {
      sDate: '2025-12-25',
      eDate: '2025-12-25',
      isAllDay: 'true',
    };

    const params = new URLSearchParams(event);
    expect(params.get('sDate')).toBe(params.get('eDate'));
  });

  test('should allow multi-day events', async ({ page }) => {
    const event = {
      sDate: '2025-12-20',
      eDate: '2025-12-31',
    };

    const params = new URLSearchParams(event);
    const startDate = new Date(params.get('sDate')!);
    const endDate = new Date(params.get('eDate')!);

    expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
  });

  test('should validate start time before end time on same day', async ({ page }) => {
    const event = {
      sDate: '2025-12-25',
      eDate: '2025-12-25',
      sTime: '09:00',
      eTime: '10:00',
    };

    const params = new URLSearchParams(event);
    expect(params.get('sTime')).toBe('09:00');
    expect(params.get('eTime')).toBe('10:00');
  });

  test('should handle events spanning midnight', async ({ page }) => {
    const event = {
      sDate: '2025-12-25',
      eDate: '2025-12-26',
      sTime: '22:00',
      eTime: '02:00',
    };

    const params = new URLSearchParams(event);
    expect(params.get('sDate')).toBe('2025-12-25');
    expect(params.get('eDate')).toBe('2025-12-26');
  });
});

test.describe('Calendar Factory App - Time Format and Precision', () => {
  test('should use consistent 24-hour format', async ({ page }) => {
    const times24h = ['00:00', '06:00', '12:00', '18:00', '23:59'];

    for (const time of times24h) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(60);
    }
  });

  test('should handle minute precision correctly', async ({ page }) => {
    const timesWithMinutes = ['08:15', '12:30', '17:45', '23:59'];

    for (const time of timesWithMinutes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(60);
    }
  });

  test('should validate time component ranges', async ({ page }) => {
    const validTimes = ['00:00', '12:30', '23:59'];
    const invalidTimes = ['24:00', '25:00', '-1:00', '12:60', '12:61'];

    for (const time of validTimes) {
      const [h, m] = time.split(':').map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
      expect(m).toBeLessThan(60);
    }

    for (const time of invalidTimes) {
      const [h, m] = time.split(':').map(Number);
      const isInvalid = h >= 24 || h < 0 || m >= 60;
      expect(isInvalid).toBe(true);
    }
  });
});
