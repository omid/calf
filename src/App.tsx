import AboutModal from './AboutModal';
import { useState, useEffect, useRef, useMemo } from 'react';
import ReactQRCode from 'react-qr-code';
import Share from './Share';
import { Button, Input, Textarea, DatePicker, Autocomplete, AutocompleteItem, Link, Alert } from '@heroui/react';
import { searchPlaces, debounce } from './nominatim';
import type { NominatimPlace } from './nominatim';
import {
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LockOpenIcon,
  MapPinIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/16/solid';
import ChipCheckbox from './ChipCheckbox';
import CollapsibleSection from './CollapsibleSection';
import {
  formToRecord,
  paramsSerializer,
  encryptString,
  timeOptions,
  getUserLocale,
  to24Hour,
  toLocaleTimeFormat,
  isLink,
} from './helpers';
import { initialForm } from './eventForm';
import { CalendarDate } from '@internationalized/date';
import { I18nProvider } from '@react-aria/i18n';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const sharePath = '/share';

const FixedLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block w-21 text-center xs:text-left">{children}</span>
);

function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<'form' | 'share'>('form');
  const urlPrefix = import.meta.env.MODE === 'production' ? '/calf' : '';
  const origin = window.location.origin;
  // controlled input for Autocomplete so default timeZone is visible
  // date values are managed via HeroUI DateInput onChange and stored in form
  const [formError, setFormError] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<NominatimPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  // binary theme: dark or light. Default to system preference on first load.
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );
  const [shareLink, setShareLink] = useState<string>('');
  // needed to trigger async share link generation before rendering share step
  const [pendingShare, setPendingShare] = useState(false);
  const isSharePage = window.location.pathname === urlPrefix + sharePath;
  const [isPassVisible, setIsPassVisible] = useState(false);

  const locale = getUserLocale();

  // Parse URL query parameters on initial mount to prefill form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    const d = params.get('d');
    const l = params.get('l');
    const sd = params.get('sd');
    const st = params.get('st');
    const ed = params.get('ed');
    const et = params.get('et');
    const tz = params.get('tz');
    const a = params.get('a');

    // Only update form if there are query parameters to parse
    if (t || d || l || sd || st || ed || et || tz || a) {
      setForm((prevForm) => ({
        ...prevForm,
        title: t || prevForm.title,
        description: d || prevForm.description,
        location: l || prevForm.location,
        sDate: sd ? new CalendarDate(...(sd.split('-').map(Number) as [number, number, number])) : prevForm.sDate,
        sTime: st || prevForm.sTime,
        eDate: ed ? new CalendarDate(...(ed.split('-').map(Number) as [number, number, number])) : prevForm.eDate,
        eTime: et || prevForm.eTime,
        timezone: tz || prevForm.timezone,
        isAllDay: a === '1' || prevForm.isAllDay,
      }));
    }
  }, []);

  // apply theme class when `isDark` changes. Do NOT persist in cookies/localStorage.
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  // debounced search wrapper, memoized to avoid recreation on each render
  const debouncedSearch = useMemo(
    () =>
      debounce(async (arg: unknown) => {
        const q = String(arg ?? '');
        if (!q || q.trim().length < 2) {
          setSuggestions([]);
          return;
        }
        try {
          const res = await searchPlaces(q, 6);
          setSuggestions(res);
        } catch {
          setSuggestions([]);
        }
      }),
    [],
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const onSharePress = async () => {
    // validate required fields: title, sDate, endDate
    if (!form.title.trim() || !form.sDate || !form.eDate) {
      setFormError('Title, Start date and End date are required to create an event.');
      return;
    }
    // validate start < end
    if (form.isAllDay) {
      if (form.eDate <= form.sDate) {
        setFormError('End date must be after Start date.');
        return;
      }
    } else {
      if (form.eDate <= form.sDate) {
        const startDt = form.sDate.toString() + ' ' + form.sTime;
        const endDt = form.eDate.toString() + ' ' + form.eTime;
        if (new Date(endDt) <= new Date(startDt)) {
          setFormError('End date/time must be after Start date/time.');
          return;
        }
      }
    }
    setFormError('');
    // Compose event params for share link:
    const params = formToRecord(form);
    if (passwordEnabled && form.password) {
      setPendingShare(true);
      try {
        const serializedParams = paramsSerializer(params);
        const cipher = await encryptString(serializedParams, form.password);
        setShareLink(`${origin}${urlPrefix}${sharePath}?h=${encodeURIComponent(cipher)}`);
      } finally {
        setPendingShare(false);
        setStep('share');
      }
    } else {
      // Ensure all values are strings
      const stringParams: Record<string, string> = Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      );
      const urlParams = new URLSearchParams(stringParams);
      setShareLink(`${origin}${urlPrefix}${sharePath}?${urlParams.toString()}`);
      setStep('share');
    }
  };

  const onChangeStartDate = (date: CalendarDate | null) => {
    setForm((f) => ({ ...f, sDate: date }));

    if (form.eDate && date && form.eDate < date) {
      setForm((f) => ({ ...f, eDate: date }));
    }
  };

  const onChangeStartTime = (time: string | null) => {
    if (!time) return;
    const sTime = to24Hour(time);
    setForm((f) => ({ ...f, sTime }));
    if (!form.eDate || !form.sDate) return;

    const startDt = new Date(form.sDate.toString() + ' ' + sTime);
    const endDt = new Date(form.eDate.toString() + ' ' + form.eTime);

    if (endDt <= startDt) {
      // adjust end time to be 1 hour after start time
      const newEndDt = new Date(startDt.getTime() + 60 * 60 * 1000);
      const eDate = new CalendarDate(newEndDt.getFullYear(), newEndDt.getMonth() + 1, newEndDt.getDate());
      const h = newEndDt.getHours();
      const m = newEndDt.getMinutes();
      const eTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      setForm((f) => ({ ...f, eDate, eTime }));
    }
  };

  const onChangeEndTime = (time: string | null) => {
    if (!time) return;
    const eTime = to24Hour(time);
    setForm((f) => ({ ...f, eTime }));
  };

  const iframeSrc = `counter.html?path=${isSharePage ? sharePath : '/'}`;

  return (
    <div className="flex flex-col items-center sm:p-2 p-0">
      <div className={`${aboutOpen ? 'overscroll-none' : ''}`}>
        <div className="sm:rounded-lg w-full max-w-[100vw] lg:max-w-3xl bg-gray-50 dark:bg-gray-800 text-gray-800 flex flex-col items-center p-2 sm:p-4">
          <div className="w-full flex items-start justify-between gap-3 mb-2">
            <img src="assets/logo.avif" className="h-20 sm:h-28 mb-2" alt="Calf" />
            <div className="text-left flex flex-col justify-center">
              <Link
                href={urlPrefix + '/'}
                className="hover:underline text-gray-800 text-2xl sm:text-3xl font-bold mb-1"
              >
                Calf (Calendar Factory)
              </Link>
              <div className="text-sm font-bold sm:text-base text-gray-600 pb-3">
                Create calendar events and share them easily!
              </div>
              {!isSharePage && (
                <div className="mb-6 text-gray-600 max-w-full hidden xs:block sm:max-w-2xl text-sm sm:text-base">
                  Fill in the details below to generate a shareable calendar event link.
                  <br />
                  Anyone with the link can add the event to their calendar or download an iCal file.
                </div>
              )}
            </div>

            <div className="flex items-start flex-col xs:flex-row">
              <Button
                aria-label="toggle-dark"
                title="Toggle dark / light mode"
                onPress={() => setIsDark((v) => !v)}
                className=" bg-gray-200 dark:bg-gray-700 p-0 min-w-8 h-8"
              >
                {isDark ? (
                  <>
                    <MoonIcon className="h-4 w-4 text-yellow-300" />
                    <span className="sr-only">Dark</span>
                  </>
                ) : (
                  <>
                    <SunIcon className="h-4 w-4 text-yellow-600" />
                    <span className="sr-only">Light</span>
                  </>
                )}
              </Button>
              <Button
                aria-label="toggle-dark"
                title="Toggle dark / light mode"
                onPress={() => setAboutOpen(true)}
                className=" bg-gray-200 dark:bg-gray-700 p-0 min-w-8 xs:ml-2 ml-0 xs:mt-0 mt-2 h-8"
              >
                <InformationCircleIcon className={`h-4 w-4 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`} />
              </Button>
            </div>
          </div>

          {isSharePage ? (
            <Share isDark={isDark} />
          ) : (
            <>
              {step === 'form' && (
                <div className="w-full max-w-full sm:max-w-2xl  bg-white rounded shadow p-2 sm:p-4 flex flex-col gap-3 sm:gap-4">
                  <Input
                    value={form.title}
                    onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
                    placeholder="Title"
                    startContent={<ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-400" />}
                    required
                  />
                  <Textarea
                    value={form.description}
                    onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
                    placeholder="Description"
                    rows={3}
                  />
                  <div className="flex flex-row items-center gap-2">
                    <div className="relative flex-1 min-w-0" ref={containerRef}>
                      <Input
                        value={form.location}
                        onValueChange={(v) => {
                          setForm((f) => ({ ...f, location: v }));
                          setShowSuggestions(!isLink(form.location));
                          if (!isLink(form.location)) {
                            debouncedSearch(String(v));
                          }
                        }}
                        startContent={<MapPinIcon className="h-5 w-5 text-gray-400" />}
                        placeholder={'Meeting Link/Location'}
                        type="text"
                        onFocus={() => {
                          setShowSuggestions(!isLink(form.location));
                        }}
                      />

                      {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute z-100 left-0 right-0 max-h-48 overflow-auto rounded-lg shadow-lg bg-white divide-y border border-gray-400">
                          {suggestions.map((s) => (
                            <li
                              key={s.place_id}
                              className="border-b-gray-300 dark:border-b-gray-600 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 hover:dark:bg-gray-700 cursor-pointer text-left"
                              onMouseDown={(e) => {
                                // prevent blur before click
                                e.preventDefault();
                                setForm((f) => ({
                                  ...f,
                                  location: s.display_name,
                                }));
                                setShowSuggestions(false);
                                setSuggestions([]);
                              }}
                            >
                              {s.display_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-3">
                    <div className="pt-1 flex-1 min-w-25 max-w-25">
                      <ChipCheckbox
                        checked={form.isAllDay}
                        onValueChange={(isAllDay: boolean) => {
                          setForm((f) => ({
                            ...f,
                            isAllDay,
                          }));
                        }}
                        text="All day"
                        id="all-day-switch"
                      />
                    </div>

                    <div className="gap-3 flex flex-col flex-auto">
                      <div className="group flex flex-col items-center xs:flex-row gap-2">
                        <FixedLabel>Start</FixedLabel>
                        <div className="flex flex-1 w-full flex-col 2xs:flex-row gap-2">
                          <I18nProvider locale={locale}>
                            <DatePicker className="flex-1 min-w-0" value={form.sDate} onChange={onChangeStartDate} />
                          </I18nProvider>
                          {!form.isAllDay && (
                            <Autocomplete
                              className="xs:max-w-34 w-full 2xs:w-34"
                              startContent={<ClockIcon className="h-5 w-5 text-gray-400" />}
                              allowsCustomValue
                              isClearable={false}
                              defaultSelectedKey={form.sTime}
                              isVirtualized={false}
                              onInputChange={onChangeStartTime}
                            >
                              {Object.entries(timeOptions).map(([key, label]) => (
                                <AutocompleteItem key={key}>{label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                          )}
                        </div>
                      </div>

                      <div className="group flex flex-col items-center xs:flex-row gap-2">
                        <FixedLabel>End</FixedLabel>
                        <div className="flex flex-1 w-full flex-col 2xs:flex-row gap-2">
                          <I18nProvider locale={locale}>
                            <DatePicker
                              className="flex-1 min-w-0"
                              value={form.eDate}
                              onChange={(v) => setForm((f) => ({ ...f, eDate: v }))}
                            />
                          </I18nProvider>
                          {!form.isAllDay && (
                            <Autocomplete
                              className="xs:max-w-34 w-full 2xs:w-34"
                              startContent={<ClockIcon className="h-5 w-5 text-gray-400" />}
                              allowsCustomValue
                              isVirtualized={false}
                              isClearable={false}
                              defaultSelectedKey={form.eTime}
                              inputValue={toLocaleTimeFormat(form.eTime)}
                              onInputChange={onChangeEndTime}
                            >
                              {Object.entries(timeOptions).map(([key, label]) => (
                                <AutocompleteItem key={key}>{label}</AutocompleteItem>
                              ))}
                            </Autocomplete>
                          )}
                        </div>
                      </div>
                      {!form.isAllDay && (
                        <div className="group flex flex-col items-center xs:flex-row gap-2">
                          <FixedLabel>Time Zone</FixedLabel>
                          <Autocomplete
                            className="flex-1 min-w-0"
                            startContent={<GlobeAltIcon className="h-5 w-5 text-gray-400" />}
                            id="timezone"
                            placeholder="Type to filter time zones"
                            defaultItems={Intl.supportedValuesOf('timeZone').map((tz) => ({ label: tz, value: tz }))}
                            defaultSelectedKey={form.timezone}
                            onSelectionChange={(v) => {
                              setForm((f) => ({ ...f, timezone: String(v) }));
                            }}
                            isClearable={false}
                          >
                            {Intl.supportedValuesOf('timeZone').map((tz) => (
                              <AutocompleteItem key={tz} className="text-gray-800 bg-white px-3 py-2 text-sm">
                                {tz}
                              </AutocompleteItem>
                            ))}
                          </Autocomplete>
                        </div>
                      )}
                    </div>
                  </div>

                  <CollapsibleSection
                    title="Password protection (optional)"
                    startContent={
                      passwordEnabled ? (
                        <LockClosedIcon className="h-5 w-5 text-red-400 inline" />
                      ) : (
                        <LockOpenIcon className="h-5 w-5 text-gray-400 inline" />
                      )
                    }
                  >
                    <Alert
                      color="warning"
                      variant="faded"
                      title={<div className="mb-2 font-bold">Protect your event with a password</div>}
                      className="my-4 text-left"
                      description={
                        <div>
                          If you set a password, your event link will be encrypted. The event details won't be visible
                          to URL trackers or third parties.
                          <br />
                          Only people with both the link and the password will be able to open it.
                        </div>
                      }
                    ></Alert>

                    <div className="flex flex-col xs:flex-row gap-3">
                      <div className="mb-2">
                        <ChipCheckbox
                          checked={passwordEnabled}
                          onValueChange={(val: boolean) => setPasswordEnabled(val)}
                          text="Enable password"
                          id="enable-password-switch"
                        />
                      </div>
                      {passwordEnabled && (
                        <Input
                          placeholder="Set a password to protect event details"
                          endContent={
                            <Button
                              aria-label="toggle password visibility"
                              className="min-w-6 w-6 p-0 bg-transparent"
                              onPress={() => setIsPassVisible(!isPassVisible)}
                            >
                              {isPassVisible ? (
                                <EyeSlashIcon className="text-2xl text-default-400 pointer-events-none" />
                              ) : (
                                <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
                              )}
                            </Button>
                          }
                          type={isPassVisible ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        />
                      )}
                    </div>
                  </CollapsibleSection>

                  {formError && <div className="text-sm text-red-600">{formError}</div>}
                  <Button
                    variant="solid"
                    color="primary"
                    size="lg"
                    className="font-bold"
                    onPress={onSharePress}
                    title="Share Event"
                  >
                    Share Event
                  </Button>
                </div>
              )}
              {step === 'share' && (
                <div className="w-full max-w-3xl bg-white rounded shadow p-6 flex flex-col gap-4 items-center">
                  <div className="font-semibold">Share this link:</div>
                  {pendingShare ? (
                    <div>Generating secure link...</div>
                  ) : (
                    <>
                      <a
                        href={shareLink}
                        className="text-blue-600 underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shareLink}
                      </a>
                      <ReactQRCode
                        value={shareLink}
                        size={128}
                        bgColor={isDark ? '#0F1724' : '#fff'}
                        fgColor={isDark ? '#4A5565' : '#000'}
                      />
                    </>
                  )}
                  <Button
                    className="mt-4 bg-gray-200 px-4 py-2 rounded dark:bg-gray-600 dark:text-gray-300"
                    onPress={() => setStep('form')}
                  >
                    Back
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <iframe src={iframeSrc} height="0" width="0"></iframe>
    </div>
  );
}

export default App;
