import AboutModal from "./AboutModal";
import { useState, useEffect, useRef, useMemo, type Key } from "react";
import ReactQRCode from "react-qr-code";
import Share from "./Share";
import {
  Button,
  Input,
  Textarea,
  DatePicker,
  Autocomplete,
  AutocompleteItem,
  Link,
  Alert,
} from "@heroui/react";
import { searchPlaces, debounce } from "./nominatim";
import type { NominatimPlace } from "./nominatim";
import {
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  LockOpenIcon,
  MapPinIcon,
} from "@heroicons/react/16/solid";
import ChipCheckbox from "./ChipCheckbox";
import CollapsibleSection from "./CollapsibleSection";
import {
  formToRecord,
  paramsSerializer,
  encryptString,
  timeOptions,
} from "./helpers";
import { initialForm } from "./eventForm";
import { CalendarDate } from "@internationalized/date";

const sharePath = "/share";

const FixedLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block w-18">{children}</span>
);

function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<"form" | "share">("form");
  const urlPrefix = import.meta.env.MODE === "production" ? "/calf" : "";
  const origin = window.location.origin;
  // controlled input for Autocomplete so default timeZone is visible
  // date values are managed via HeroUI DateInput onChange and stored in form
  const [formError, setFormError] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<NominatimPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>("");
  // needed to trigger async share link generation before rendering share step
  const [pendingShare, setPendingShare] = useState(false);
  const isSharePage = window.location.pathname === urlPrefix + sharePath;
  const [isPassVisible, setIsPassVisible] = useState(false);
  const togglePassVisibility = () => setIsPassVisible(!isPassVisible);

  // debounced search wrapper, memoized to avoid recreation on each render
  const debouncedSearch = useMemo(
    () =>
      debounce(async (arg: unknown) => {
        const q = String(arg ?? "");
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
    []
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const onSharePress = async () => {
    // validate required fields: title, sDate, endDate
    if (!form.title.trim() || !form.sDate || !form.eDate) {
      setFormError(
        "Title, Start date and End date are required to create an event."
      );
      return;
    }
    // validate start < end
    if (form.isAllDay) {
      if (form.eDate <= form.sDate) {
        setFormError("End date must be after Start date.");
        return;
      }
    } else {
      if (form.eDate <= form.sDate) {
        const startDt = form.sDate.toString() + " " + form.sTime;
        const endDt = form.eDate.toString() + " " + form.eTime;
        if (new Date(endDt) <= new Date(startDt)) {
          setFormError("End date/time must be after Start date/time.");
          return;
        }
      }
    }
    setFormError("");
    // Compose event params for share link:
    const params = formToRecord(form);
    if (passwordEnabled && form.password) {
      setPendingShare(true);
      try {
        const serializedParams = paramsSerializer(params);
        const cipher = await encryptString(serializedParams, form.password);
        setShareLink(
          `${origin}${urlPrefix}${sharePath}?h=${encodeURIComponent(cipher)}`
        );
      } finally {
        setPendingShare(false);
        setStep("share");
      }
    } else {
      // Ensure all values are strings
      const stringParams: Record<string, string> = Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      );
      const urlParams = new URLSearchParams(stringParams);
      setShareLink(`${origin}${urlPrefix}${sharePath}?${urlParams.toString()}`);
      setStep("share");
    }
  };

  const onChangeStartDate = (date: CalendarDate | null) => {
    setForm((f) => ({ ...f, sDate: date }));

    if (form.eDate && date && form.eDate < date) {
      setForm((f) => ({ ...f, eDate: date }));
    }
  };

  const onChangeStartTime = (timeKey: Key | null) => {
    if (!timeKey) return;
    const time = String(timeKey);
    setForm((f) => ({ ...f, sTime: time }));

    if (!form.eDate || !form.sDate) return;

    const startDt = new Date(form.sDate.toString() + " " + time);
    const endDt = new Date(form.eDate.toString() + " " + form.eTime);
    if (endDt <= startDt) {
      // adjust end time to be 1 hour after start time
      const newEndDt = new Date(startDt.getTime() + 60 * 60 * 1000);
      const eDate = new CalendarDate(
        newEndDt.getFullYear(),
        newEndDt.getMonth() + 1,
        newEndDt.getDate()
      );
      const h = newEndDt.getHours();
      const m = newEndDt.getMinutes();
      const eTime = `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}`;
      setForm((f) => ({ ...f, eDate, eTime }));
    }
  };

  const iframeSrc = `counter.html?path=${isSharePage ? sharePath : "/"}`;

  return (
    <div className="flex flex-col items-center sm:p-2 p-0">
      <div className="sm:rounded-lg w-full max-w-[100vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl bg-gray-50 text-gray-800 flex flex-col items-center p-2 sm:p-4">
        <img
          src="assets/logo.avif"
          className="h-20 sm:h-28 md:h-30 mb-2"
          alt="Calf"
        />
        <Link href={urlPrefix} className="hover:underline text-gray-800">
          <div className="text-2xl sm:text-3xl font-bold mb-1">
            Calf (Calendar Factory)
          </div>
        </Link>
        <div className="mb-2 text-md sm:text-lg font-semibold">
          Create calendar events and share them easily!
        </div>
        {!isSharePage && (
          <div className="mb-6 text-gray-600 max-w-full sm:max-w-2xl md:max-w-3xl text-center text-sm sm:text-base">
            Fill in the details below to generate a shareable calendar event
            link.
            <br />
            Anyone with the link can add the event to their calendar or download
            an iCal file.
          </div>
        )}
        {isSharePage ? (
          <Share />
        ) : (
          <>
            {step === "form" && (
              <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl bg-white rounded shadow p-2 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4">
                <Input
                  value={form.title}
                  onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="Title"
                  startContent={
                    <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-400" />
                  }
                  required
                />
                <Textarea
                  value={form.description}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, description: v }))
                  }
                  placeholder="Description"
                  rows={3}
                />
                <div className="flex flex-row items-center gap-2">
                  <div
                    className="relative flex-1 min-w-0 max-w-[70vw]"
                    ref={containerRef}
                  >
                    <Input
                      value={form.location}
                      onValueChange={(v) => {
                        setForm((f) => ({ ...f, location: v }));
                        if (!form.isOnline) {
                          debouncedSearch(String(v));
                          setShowSuggestions(true);
                        }
                      }}
                      startContent={
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      }
                      placeholder={form.isOnline ? "Meeting Link" : "Location"}
                      type={form.isOnline ? "url" : "text"}
                      required={!form.isOnline}
                      onFocus={() => {
                        if (!form.isOnline && form.location)
                          setShowSuggestions(true);
                      }}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-100 left-0 right-0 max-h-48 overflow-auto rounded-lg shadow-lg bg-white divide-y border border-gray-400">
                        {suggestions.map((s) => (
                          <li
                            key={s.place_id}
                            className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer text-left"
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

                  <div className="flex items-center flex-shrink-0 ml-2">
                    <ChipCheckbox
                      checked={form.isOnline}
                      onValueChange={(isOnline: boolean) => {
                        setForm((f) => ({ ...f, isOnline }));
                        if (isOnline) {
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }
                      }}
                      text="Online"
                      id="online-switch"
                    />
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
                    <div className="group flex flex-col xs:flex-row gap-3">
                      <DatePicker
                        label={<FixedLabel>Start</FixedLabel>}
                        labelPlacement="outside-left"
                        value={form.sDate}
                        onChange={onChangeStartDate}
                        granularity="day"
                      />
                      {!form.isAllDay && (
                        <Autocomplete
                          className="xs:max-w-32"
                          startContent={
                            <ClockIcon className="h-5 w-5 text-gray-400" />
                          }
                          allowsCustomValue
                          isClearable={false}
                          inputValue={form.sTime}
                          selectedKey={form.sTime}
                          isVirtualized={false}
                          onSelectionChange={onChangeStartTime}
                        >
                          {timeOptions.map((time) => (
                            <AutocompleteItem key={time.key}>
                              {time.label}
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      )}
                    </div>

                    <div className="group flex flex-col xs:flex-row gap-3">
                      <DatePicker
                        label={<FixedLabel>End</FixedLabel>}
                        labelPlacement="outside-left"
                        value={form.eDate}
                        onChange={(v) => setForm((f) => ({ ...f, eDate: v }))}
                        granularity="day"
                      />
                      {!form.isAllDay && (
                        <Autocomplete
                          className="xs:max-w-32"
                          startContent={
                            <ClockIcon className="h-5 w-5 text-gray-400" />
                          }
                          allowsCustomValue
                          isVirtualized={false}
                          isClearable={false}
                          inputValue={form.eTime}
                          selectedKey={form.eTime}
                          onSelectionChange={(v) => {
                            setForm((f) => ({ ...f, eTime: String(v) }));
                          }}
                        >
                          {timeOptions.map((time) => (
                            <AutocompleteItem key={time.key}>
                              {time.label}
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      )}
                    </div>
                    {!form.isAllDay && (
                      <div className="col-start-1">
                        <Autocomplete
                          startContent={
                            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          }
                          label={<FixedLabel>TimeZone</FixedLabel>}
                          labelPlacement="outside-left"
                          id="timezone"
                          placeholder="Type to filter timezones"
                          defaultItems={Intl.supportedValuesOf("timeZone").map(
                            (tz) => ({ label: tz, value: tz })
                          )}
                          fullWidth={false}
                          defaultSelectedKey={form.timezone}
                          onSelectionChange={(v) => {
                            setForm((f) => ({ ...f, timezone: String(v) }));
                          }}
                          isClearable={false}
                        >
                          {Intl.supportedValuesOf("timeZone").map((tz) => (
                            <AutocompleteItem
                              key={tz}
                              className="text-gray-800 bg-white hover:bg-gray-50 px-3 py-2 text-sm"
                            >
                              {tz}
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible section for password protection */}
                <CollapsibleSection
                  title={
                    <span className="text-sm">
                      Password protection (optional){" "}
                      {passwordEnabled ? (
                        <span
                          title="Enabled"
                          style={{
                            color: "green",
                            fontSize: "1.2em",
                            marginLeft: 6,
                          }}
                        >
                          <LockClosedIcon className="h-5 w-5 text-gray-400 inline" />
                        </span>
                      ) : (
                        <span
                          title="Disabled"
                          style={{
                            color: "#888",
                            fontSize: "1.2em",
                            marginLeft: 6,
                          }}
                        >
                          <LockOpenIcon className="h-5 w-5 text-gray-400 inline" />
                        </span>
                      )}
                    </span>
                  }
                >
                  <Alert
                    color="warning"
                    variant="faded"
                    title={
                      <div className="mb-2 font-bold">
                        Protect your event with a password
                      </div>
                    }
                    className="my-4 text-left"
                    description={
                      <div>
                        If you set a password, your event link will be
                        encrypted. The event details won't be visible to URL
                        trackers or third parties.
                        <br />
                        Only people with both the link and the password will be
                        able to open it.
                      </div>
                    }
                  ></Alert>

                  <div className="flex flex-col xs:flex-row gap-3">
                    <div className="mb-2">
                      <ChipCheckbox
                        checked={passwordEnabled}
                        onValueChange={(val: boolean) =>
                          setPasswordEnabled(val)
                        }
                        text="Enable password"
                        id="enable-password-switch"
                      />
                    </div>
                    {passwordEnabled && (
                      <Input
                        placeholder="Set a password to protect event details"
                        endContent={
                          <button
                            aria-label="toggle password visibility"
                            className="w-8 h-8 cursor-pointer"
                            type="button"
                            onClick={togglePassVisibility}
                          >
                            {isPassVisible ? (
                              <EyeSlashIcon className="text-2xl text-default-400 pointer-events-none" />
                            ) : (
                              <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
                            )}
                          </button>
                        }
                        type={isPassVisible ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                        }
                      />
                    )}
                  </div>
                </CollapsibleSection>

                {formError && (
                  <div className="text-sm text-red-600">{formError}</div>
                )}
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
            {step === "share" && (
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
                    <ReactQRCode value={shareLink} size={128} />
                  </>
                )}
                <Button
                  className="mt-4 bg-gray-200 px-4 py-2 rounded"
                  onPress={() => setStep("form")}
                >
                  Back
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="mt-10 w-full max-w-3xl text-center text-sm hover:text-gray-600">
        <Button
          className="cursor-pointer rounded-lg border px-3 py-2 bg-gray-500 hover:bg-gray-600"
          onPress={() => setAboutOpen(true)}
        >
          About &amp; Disclaimer
        </Button>
      </footer>
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <iframe src={iframeSrc} height="0" width="0"></iframe>
    </div>
  );
}

export default App;
