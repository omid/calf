import ReactQRCode from 'react-qr-code';
import { generateICal } from './icalUtils';
import { ArrowDownTrayIcon, CalendarDaysIcon, GlobeAltIcon, NoSymbolIcon } from '@heroicons/react/16/solid';
import { Button, Input, Link } from '@heroui/react';
import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { useState } from 'react';
import { dateFromParts, decryptString, getUserLocale, isLink, paramsDeserializer } from './helpers';
import type { EventQS } from './eventForm';

function getShareUnlockState() {
  const params = new URLSearchParams(window.location.search);
  const cipher = params.get('h');
  if (cipher) return { protected: true, cipher };
  return { protected: false };
}

function parseStandardParams(): EventQS {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get('t') || '',
    description: params.get('d') || '',
    location: params.get('l') || '',
    sDate: params.get('sd') || '',
    sTime: params.get('st') || '',
    eDate: params.get('ed') || '',
    eTime: params.get('et') || '',
    timezone: params.get('tz') || '',
    isAllDay: typeof params.get('a') === 'string',
  };
}

export default function Share({ isDark }: { isDark: boolean }) {
  const lockState = getShareUnlockState();
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [protectedEvent, setProtectedEvent] = useState<EventQS | null>(null);
  const [selectedTz, setSelectedTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  async function handleUnlock() {
    setUnlockError('');
    try {
      const base = await decryptString(lockState.cipher || '', password);
      const data = paramsDeserializer(base);
      // set event metadata exactly as "standard" event
      setProtectedEvent({
        title: data.t ?? '',
        description: data.d ?? '',
        location: data.l ?? '',
        sDate: data.sd ?? '',
        sTime: data.st ?? '',
        eDate: data.ed ?? '',
        eTime: data.et ?? '',
        timezone: data.tz ?? '',
        isAllDay: data.a === '1',
      });
      setUnlocked(true);
    } catch {
      setUnlockError('Unlock failed, either link is wrongly copied or password is wrong');
    }
  }

  // If share is protected, show unlock UI
  if (lockState.protected) {
    if (!unlocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-24">
          <div className="flex flex-col bg-white border-3 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 gap-4 w-full max-w-sm">
            <div className="font-bold text-lg mb-2">
              <NoSymbolIcon className="w-5 h-5 inline-block text-red-600 mr-2" />
              Protected event
            </div>
            <div className="text-sm mb-1 text-slate-700 dark:text-slate-300">
              This event is password-protected. Enter password to show event details.
            </div>
            <Input
              type="password"
              autoFocus
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {unlockError && <div className="text-red-600 text-sm">{unlockError}</div>}
            <Button
              className="w-full bg-blue-600 text-white font-medium rounded py-2 px-3 hover:bg-blue-700 mt-2"
              onPress={handleUnlock}
            >
              Unlock Event
            </Button>
          </div>
        </div>
      );
    }
    // fall through: show event with details from "event"
  }
  // Use unlocked event if set (from protected), else parse from standard URL
  const event = protectedEvent || parseStandardParams();

  const startDt = dateFromParts(event.sDate, event.sTime, event.timezone);
  const endDt = dateFromParts(event.eDate || event.sDate, event.eTime || event.sTime, event.timezone);

  const tzDisplay = (() => {
    if (event.timezone) return event.timezone;
    const off = -startDt.getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
    const m = String(Math.abs(off) % 60).padStart(2, '0');
    return `${sign}${h}:${m}`;
  })();

  const formatInTimezone = (date: Date, tz?: string) => {
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
  };

  const formatInTime = (date: Date, tz?: string) => {
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
  };

  const formatDateOnly = (date: Date) => {
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
  };

  const ical = generateICal(event);

  const icalBlob = new Blob([ical], { type: 'text/calendar' });
  const icalUrl = URL.createObjectURL(icalBlob);
  const shareLink = window.location.href;

  const sanitizeDate = (d: string) => d.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const startStr = event.isAllDay ? event.sDate : startDt.toISOString();
  const endStr = event.isAllDay ? event.eDate : endDt.toISOString();
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${sanitizeDate(
    startStr,
  )}/${sanitizeDate(endStr)}`;

  const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? '&allday=true' : ''
  }`;

  const office365Link = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? '&allday=true' : ''
  }`;

  const yahooLink = `https://calendar.yahoo.com/?v=60&title=${title}&st=${startStr}&et=${endStr}&desc=${details}&in_loc=${location}&dur=${
    event.isAllDay ? 'allday' : ''
  }`;

  // Apple Calendar: open the ICS (do not force download) so the OS can hand it to Calendar
  const appleLink = icalUrl; // keep as blob; omit `download` attr on the anchor

  return (
    <div className="w-full max-w-3xl p-1 pt-6 flex flex-col gap-4">
      <div className="border-3 border-gray-200 dark:border-gray-700 shadow-lg rounded p-4 flex flex-row gap-5">
        <div className="hidden xs:block">
          <CalendarDaysIcon className="w-35 h-35 text-gray-500" />
        </div>
        <div className="flex flex-col gap-2 justify-start text-left align-middle ">
          <div className="flex flex-row items-center gap-3">
            <div className="xs:hidden">
              <CalendarDaysIcon className="w-10 h-10 text-gray-700" />
            </div>
            <div className="font-semibold wrap-anywhere">{event.title}</div>
          </div>
          <div className="text-sm text-gray-700">{event.description}</div>
          {event.location && (
            <div className="text-sm text-gray-600 mt-2">
              Location:{' '}
              <Link
                href={
                  isLink(event.location)
                    ? event.location
                    : `https://www.google.com/maps/search/?api=1&query=${location}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {event.location}
              </Link>
            </div>
          )}
          {event.isAllDay ? (
            <div className="text-sm text-gray-600">
              {formatDateOnly(startDt)} <br />
              to {formatDateOnly(endDt)} (All day)
            </div>
          ) : (
            <>
              {formatDateOnly(startDt) === formatDateOnly(endDt) ? (
                <>
                  <div className="text-sm text-gray-600">{formatDateOnly(startDt)}</div>
                  <div className="text-sm text-gray-600">
                    {formatInTime(startDt, selectedTz)} to {formatInTime(endDt, selectedTz)} ({tzDisplay})
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-600">Start: {formatInTimezone(startDt, selectedTz)}</div>
                  <div className="text-sm text-gray-600">
                    End: {formatInTimezone(endDt, selectedTz)} ({tzDisplay})
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 mt-2">
                <label htmlFor="tz-autocomplete" className="text-sm text-gray-600">
                  Time Zone:
                </label>
                <Autocomplete
                  className="flex-1 min-w-0"
                  startContent={<GlobeAltIcon className="h-5 w-5 text-gray-400" />}
                  id="timezone"
                  selectedKey={selectedTz}
                  placeholder="Type to filter time zones"
                  onSelectionChange={(key) => key && setSelectedTz(String(key))}
                  isClearable={false}
                  variant="bordered"
                >
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <AutocompleteItem key={tz} className="text-gray-800 bg-white px-3 py-2 text-sm">
                      {tz}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="font-semibold">Add to your calendar:</div>

      <div className="grid xs:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-3 w-full">
        <Button
          showAnchorIcon
          as={Link}
          href={googleLink}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          aria-label="Add to Google Calendar"
        >
          <img src="assets/google-calendar.avif" alt="Google Calendar" className="w-5 h-5" />
          Google Calendar
        </Button>

        <Button
          showAnchorIcon
          as={Link}
          href={outlookLink}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          aria-label="Add to Outlook"
        >
          <img src="assets/outlook.avif" alt="Outlook" className="w-5 h-5" />
          Outlook (Live)
        </Button>

        <Button
          showAnchorIcon
          as={Link}
          href={appleLink}
          // NOTE: no download attribute — lets iOS/macOS open in Calendar
          aria-label="Add to Apple Calendar"
          variant="ghost"
        >
          <img src="assets/apple.avif" alt="Apple" className="w-5 h-5" />
          Apple Calendar
        </Button>

        <Button
          showAnchorIcon
          as={Link}
          href={office365Link}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          aria-label="Add to Office 365"
        >
          <img src="assets/office.avif" alt="Office 365" className="w-5 h-5" />
          Office 365
        </Button>

        <Button
          showAnchorIcon
          as={Link}
          href={yahooLink}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          aria-label="Add to Yahoo Calendar"
        >
          <img src="assets/yahoo.avif" alt="Yahoo" className="w-5 h-5" />
          Yahoo Calendar
        </Button>

        <Button
          showAnchorIcon
          as={Link}
          href={icalUrl}
          download="event.ics"
          variant="ghost"
          aria-label="Download iCal file"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Download iCal (.ics)
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div>
          <ReactQRCode
            value={shareLink}
            size={128}
            bgColor={isDark ? '#1e2939' : '#fff'}
            fgColor={isDark ? '#4A5565' : '#000'}
          />
        </div>

        <div className="text-sm text-gray-600 break-all">
          {shareLink}
          <div className="flex gap-3 mt-8">
            <Button
              as={Link}
              href={(() => {
                const params = new URLSearchParams();
                params.set('t', event.title);
                params.set('d', event.description);
                params.set('l', event.location);
                params.set('sd', event.sDate);
                params.set('st', event.sTime);
                params.set('ed', event.eDate);
                params.set('et', event.eTime);
                params.set('tz', event.timezone);
                if (event.isAllDay) params.set('a', '1');
                return `/?${params.toString()}`;
              })()}
              size="sm"
              rel="noopener noreferrer"
              className="bg-gray-400 dark:bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-600 hover:dark:bg-gray-700"
              aria-label="Edit/Clone Event"
            >
              Edit/Clone Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
