# Calendar Factory App - Comprehensive Test Suite

## Overview

A complete test suite has been implemented for the Calendar Factory (Calf) application, including:
- End-to-End (E2E) tests using Playwright
- Unit tests using Vitest
- Encryption/Decryption tests
- Time, timezone, and locale validation tests

## Test Coverage

### E2E Tests (`tests/e2e/app.spec.ts`)

#### Main Form Tests
- Page loading and display validation
- Dark/light mode toggle
- Modal dialogs (About, AI)
- Form input interactions
- Password protection enable/disable
- Password visibility toggle

#### Time Selection Tests
- **Morning times (6 AM - 11:59 AM)**: Tests times like 6:00, 8:00, 9:00, 10:00, 11:30
- **Afternoon times (12 PM - 6 PM)**: Tests times like 12:00, 13:00, 14:30, 15:00, 17:00
- **30-minute intervals**: Validates time slots with 08:00, 08:30, 09:00, 09:30, 10:00
- **Early morning (before 6 AM)**: Tests 00:00, 01:30, 03:00, 04:45, 05:59
- **Late evening (after 6 PM)**: Tests 18:00, 19:30, 20:00, 22:00, 23:59
- **Business hours (9 AM - 5 PM)**: Validates typical work hours
- **Midnight boundary**: Tests transition from 23:59 to 00:00
- **Noon boundary**: Tests transition from 11:59 to 12:01

#### Timezone Tests
- **UTC timezone**: Basic timezone support
- **US timezones**: EST/EDT, CST/CDT, MST/MDT, PST/PDT
  - America/New_York
  - America/Chicago
  - America/Denver
  - America/Los_Angeles
- **European timezones**:
  - Europe/London
  - Europe/Paris
  - Europe/Berlin
  - Europe/Moscow
- **Asian timezones**:
  - Asia/Tokyo (UTC+9)
  - Asia/Shanghai (UTC+8)
  - Asia/Singapore (UTC+8)
  - Asia/Bangkok
  - Asia/Dubai
  - Asia/Kolkata
- **Australian timezones**:
  - Australia/Sydney
  - Australia/Melbourne
  - Australia/Brisbane
- **Positive UTC offsets**: Tests UTC+ timezone handling
- **Negative UTC offsets**: Tests UTC- timezone handling
- **Cross-timezone events**: Same event in different timezones
- **Timezone preservation**: Timezone info maintained in share links
- **Event time consistency**: Same start/end time in different timezones

#### Locale Tests
- English locale display (default)
- Date formatting by locale
- en-US locale handling
- en-GB locale handling
- Form functionality across locales
- Timezone selection in any locale

#### Share Link Validation Tests
- **Complete parameter URLs**: All parameters present
- **Special characters**: &, ", ', accents (Café)
- **URL encoding**: Proper percent encoding
- **Unique links**: Different events generate different links
- **Long descriptions**: Handles 200+ character descriptions
- **Parameter integrity**: Parameters preserved when navigating
- **Time encoding**: Colons properly encoded as %3A
- **URL decoding**: Encoded parameters can be decoded correctly
- **Password-protected sharing**: Form data encryption/decryption in URLs

#### Date Range Tests
- Same-day all-day events
- Multi-day events
- Start time before end time validation
- Events spanning midnight
- Full day coverage with specific times

#### Time Format Tests
- 24-hour format consistency
- Minute precision (15, 30, 45-minute intervals)
- Valid time component ranges
- Invalid time detection

#### Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1280x720)

### Unit Tests

#### `encryption.test.ts`
**Encryption/Decryption Tests:**
- Simple text encryption/decryption
- Empty string handling
- Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?/~`
- Unicode support: 你好世界 🎉 مرحبا بالعالم
- Very long strings (10,000+ characters)
- Different ciphertexts for same plaintext (random salt/IV)
- v1 format validation
- Wrong password failure
- Invalid payload format detection
- Malformed base64url handling
- JSON serialization roundtrip
- Special password characters
- URL-safe encryption for sharing
- Passwords with Unicode characters

**Time Conversion Tests:**
- 12-hour to 24-hour conversion
- AM/PM handling
- Midnight (00:00) conversion
- Noon (12:00) conversion
- Time padding (leading zeros)
- Locale-aware time formatting

**Link Detection Tests:**
- HTTP/HTTPS URLs
- Zoom links (zoom.us, zoom://)
- Google Meet links
- Microsoft Teams links
- mailto: links
- tel: links
- Plain text location rejection
- Case-insensitive protocol handling
- Complex URLs with query strings
- IP address handling

**Form Serialization Tests:**
- Full form to record conversion
- All-day event handling
- Optional field inclusion
- Special characters in fields
- Empty field handling
- Date to string conversion
- Parameter serialization
- Long text handling
- Unicode value serialization

#### `eventForm.test.ts`
- Initial form structure validation
- Empty field defaults
- Date/time format validation
- Query parameter parsing
- Parameter presence checks

#### `helpers.test.ts`
- Time options structure
- Time options content
- Locale string validation
- to24Hour conversion
- toLocaleTimeFormat formatting
- isLink detection
- formToRecord conversion
- paramsSerializer functionality

## Test Commands

```bash
# Run unit tests
make test

# Run unit tests with UI
make test-ui

# Generate coverage report
make test-coverage

# Run E2E tests
make test-e2e

# Run E2E tests with UI
make test-e2e-ui

# Debug E2E tests
make test-e2e-debug

# Run all tests
make test-all

# CI mode (all tests)
make test-ci
```

## Key Test Scenarios

### Time Testing Scenarios
- ✅ Early morning (before 6 AM)
- ✅ Morning (6 AM - 12 PM)
- ✅ Afternoon (12 PM - 6 PM)
- ✅ Evening (6 PM - 11:59 PM)
- ✅ Business hours (9 AM - 5 PM)
- ✅ Midnight boundary
- ✅ Noon boundary
- ✅ 30-minute intervals
- ✅ Full 24-hour coverage

### Timezone Testing Scenarios
- ✅ 5 major continents covered
- ✅ UTC±0 to UTC±12 offsets
- ✅ 30+ major timezones
- ✅ Cross-timezone consistency
- ✅ Share link timezone preservation

### Locale Testing Scenarios
- ✅ English (default)
- ✅ en-US variant
- ✅ en-GB variant
- ✅ Date formatting
- ✅ Timezone selection
- ✅ Form functionality

### Share Link Testing Scenarios
- ✅ All parameters present
- ✅ Special character encoding
- ✅ URL-safe format
- ✅ Unique link generation
- ✅ Long descriptions
- ✅ Time encoding
- ✅ Parameter decoding
- ✅ Password protection
- ✅ Multi-day events

## Coverage Areas

| Area | Status | Test Count |
|------|--------|-----------|
| Time Selection | ✅ Complete | 8 tests |
| Timezone Handling | ✅ Complete | 8 tests |
| Locale Support | ✅ Complete | 6 tests |
| Share Links | ✅ Complete | 10 tests |
| Encryption | ✅ Complete | 14 tests |
| Form Validation | ✅ Complete | 8 tests |
| Date Ranges | ✅ Complete | 5 tests |
| Time Formats | ✅ Complete | 3 tests |
| Responsive Design | ✅ Complete | 3 tests |
| **TOTAL** | | **65+ tests** |

## Browser Support

E2E tests run against:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit / Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Output & Reports

- **Unit Test Coverage**: `coverage/` directory
  - HTML report
  - LCOV report
  - JSON report
  - Terminal report

- **E2E Test Results**: `playwright-report/` directory
  - HTML report
  - JSON results
  - JUnit XML
  - Trace files for failures
  - Screenshots on failure

## Notes

- Tests use realistic data (actual timezones, times, locales)
- Encryption tests verify both security and functionality
- Share link tests validate URL encoding and parameter preservation
- Timezone tests cover both positive and negative UTC offsets
- Time tests include boundary conditions and edge cases
- All tests are browser/environment agnostic where applicable
