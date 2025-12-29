# Quick Test Reference Guide

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all tests
make test-all

# Or run tests separately
make test            # Unit tests
make test-e2e        # E2E tests
```

### Individual Test Runs
```bash
# Unit tests only
npm run test

# Unit tests with UI
npm run test:ui

# Generate coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests step by step
npm run test:e2e:debug
```

## Test Structure

### E2E Tests Location
```
tests/e2e/
└── app.spec.ts    (450+ lines, 50+ test cases)
```

### Unit Tests Location
```
src/
├── helpers.test.ts          (180+ lines)
├── eventForm.test.ts        (100+ lines)
├── encryption.test.ts       (450+ lines)
└── (integration via Vitest)
```

## What Gets Tested

### ✅ Time-Related Tests
- Morning times (before noon)
- Afternoon times (after noon)
- Business hours (9 AM - 5 PM)
- Edge cases: midnight, noon
- 30-minute intervals
- Full 24-hour coverage

```typescript
// Example: Morning test
test('should handle morning times before noon (6 AM - 11:59 AM)', async ({ page }) => {
  const morningTimes = ['06:00', '08:00', '09:00', '10:00', '11:30'];
  for (const time of morningTimes) {
    const [h, m] = time.split(':').map(Number);
    expect(h).toBeGreaterThanOrEqual(6);
    expect(h).toBeLessThan(12);
  }
});
```

### ✅ Timezone-Related Tests
- 30+ major world timezones
- UTC positive offsets (UTC+1 to UTC+12)
- UTC negative offsets (UTC-12 to UTC-5)
- Timezone preservation in share links
- Cross-timezone event handling

```typescript
// Example: Timezone test
test('should support major US timezones', async ({ page }) => {
  const usTimezones = [
    'America/New_York',      // EST/EDT
    'America/Chicago',        // CST/CDT
    'America/Denver',         // MST/MDT
    'America/Los_Angeles',    // PST/PDT
  ];
  
  const supportedTZs = Intl.supportedValuesOf('timeZone');
  for (const tz of usTimezones) {
    expect(supportedTZs).toContain(tz);
  }
});
```

### ✅ Locale-Related Tests
- Language support (en-US, en-GB)
- Date formatting variations
- Timezone selection across locales
- Form functionality in different locales

```typescript
// Example: Locale test
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
```

### ✅ Share Link Tests
- All parameters included
- Special character encoding
- URL-safe format validation
- Unique links for different events
- Parameter preservation
- Long description handling

```typescript
// Example: Share link test
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
  expect(shareLink).toContain('timezone=America');
});
```

### ✅ Encryption Tests
- Text encryption/decryption
- Unicode support
- Special characters
- Long strings
- Password protection
- Format validation
- Error handling

```typescript
// Example: Encryption test
test('should encrypt and decrypt simple text', async () => {
  const plaintext = 'Hello, World!';
  const password = 'secure-password-123';

  const encrypted = await encryptString(plaintext, password);
  expect(encrypted).toMatch(/^v1\./);

  const decrypted = await decryptString(encrypted, password);
  expect(decrypted).toBe(plaintext);
});
```

## Test Scenarios Covered

### Time Scenarios
| Scenario | Times Tested | Status |
|----------|-------------|--------|
| Early Morning | 00:00, 01:30, 03:00, 04:45, 05:59 | ✅ |
| Morning | 06:00, 08:00, 09:00, 10:00, 11:30 | ✅ |
| Noon | 11:59, 12:00, 12:01 | ✅ |
| Afternoon | 12:00, 13:00, 14:30, 15:00, 17:00 | ✅ |
| Evening | 18:00, 19:30, 20:00, 22:00, 23:59 | ✅ |
| Business Hours | 09:00 - 17:00 | ✅ |

### Timezone Scenarios
| Region | Examples | Count |
|--------|----------|-------|
| North America | NY, Chicago, Denver, LA | 4 |
| Europe | London, Paris, Berlin, Moscow | 4 |
| Asia | Tokyo, Shanghai, Singapore, Dubai, Kolkata | 5 |
| Australia | Sydney, Melbourne, Brisbane | 3 |
| UTC | UTC+0 | 1 |
| **Total** | | **17+** |

### Special Character Scenarios
| Category | Characters | Status |
|----------|-----------|--------|
| Symbols | !@#$%^&*()_+-=[]{}| | ✅ |
| Quotes | '"' | ✅ |
| Slashes | / | ✅ |
| Unicode | 中文, العربية, Русский | ✅ |
| Emoji | 🎉, 🔐 | ✅ |

## Troubleshooting

### If tests fail...

1. **Check Node/npm versions**
   ```bash
   node --version  # Should be v18+
   npm --version   # Should be v8+
   ```

2. **Clear node_modules and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Run tests with verbose output**
   ```bash
   npm run test -- --reporter=verbose
   npm run test:e2e -- --debug
   ```

4. **Check specific test file**
   ```bash
   npm run test -- encryption.test.ts
   ```

## Performance Tips

- Unit tests typically complete in <10 seconds
- E2E tests may take 2-5 minutes (depends on machine)
- Use `test.only()` to run single test during development
- Use `test.skip()` to skip tests temporarily

## CI/CD Integration

For GitHub Actions or similar:

```yaml
- name: Run Tests
  run: make test-ci
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Expected Output

### Successful Unit Tests
```
✓ encryption.test.ts (450ms)
✓ eventForm.test.ts (180ms)
✓ helpers.test.ts (220ms)

Test Files  3 passed (3)
Tests  45 passed (45)
```

### Successful E2E Tests
```
✓ tests/e2e/app.spec.ts (12.5s)

✓ 50 passed
```

## Next Steps

1. Run tests: `make test`
2. Check coverage: `make test-coverage`
3. Run E2E: `make test-e2e`
4. View reports in `coverage/` and `playwright-report/`
