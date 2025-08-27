import AboutModal from "./AboutModal";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import ReactQRCode from "react-qr-code";
import Share from "./Share";
import logo from "./assets/logo.png";
import {
  Button,
  Input,
  Textarea,
  Checkbox,
  DatePicker,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { searchPlaces, debounce } from "./nominatim";
import type { NominatimPlace } from "./nominatim";
import {
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/16/solid";

const initialForm = {
  title: "",
  description: "",
  location: "",
  sDate: "",
  sTime: "",
  eDate: "",
  eTime: "",
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<"form" | "share">("form");
  const [isOnline, setIsOnline] = useState(false);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  // controlled input for Autocomplete so default timezone is visible
  // date values are managed via HeroUI DateInput onChange and stored in form
  const [allDay, setAllDay] = useState(false);
  const [formError, setFormError] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  // debounced search wrapper
  const debouncedSearch = debounce(async (arg: unknown) => {
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
  }, 300);

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
  const isSharePage = window.location.pathname === "/share";

  // Generate share link with params
  const urlParams = new URLSearchParams();
  urlParams.set("t", form.title);
  if (form.description && form.description.trim()) {
    urlParams.set("d", form.description);
  }
  urlParams.set("l", form.location);
  // Create combined start/end in UTC YYYYMMDDTHHMMSSZ format
  // Create combined start/end in YYYYMMDDTHHMMSS±HHMM format (local timezone offset)
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const formatWithOffset = (d: Date) => {
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const tzMin = -d.getTimezoneOffset(); // minutes east of UTC
    const sign = tzMin >= 0 ? "+" : "-";
    const tzH = pad(Math.floor(Math.abs(tzMin) / 60));
    const tzM = pad(Math.abs(tzMin) % 60);
    return `${y}${m}${day}T${hh}${mm}${ss}${sign}${tzH}${tzM}`;
  };

  try {
    const startDt = new Date(`${form.sDate}T${form.sTime || "00"}:00`);
    const startParam = formatWithOffset(startDt);
    urlParams.set("s", startParam);
  } catch {
    // ignore
  }
  try {
    const endDt = new Date(
      `${form.eDate || form.sDate}T${form.eTime || form.sTime || "00"}:00`
    );
    const endParam = formatWithOffset(endDt);
    urlParams.set("e", endParam);
  } catch {
    // ignore
  }
  // include timezone name as well
  urlParams.set("tz", timezone);
  // include flags: online (o) and all-day (a)
  urlParams.set("o", isOnline ? "1" : "0");
  urlParams.set("a", allDay ? "1" : "0");
  const shareLink = `${window.location.origin}/share?${urlParams.toString()}`;

  // date change handlers are handled inline with Calendar onChange

  return (
    <div>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center p-4">
        <img src={logo} className="h-30 mb-2" alt="Calendar Factory" />
        <div className="text-3xl font-bold mb-">Calf (Calendar Factory)</div>
        <div className="mb-2 text-lg font-semibold">
          Create calendar events and share them easily!
        </div>
        {!isSharePage && (
          <div className="mb-6 text-gray-600 max-w-3xl text-center">
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
              <div className="w-full max-w-3xl bg-white rounded shadow p-6 flex flex-col gap-4">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Title"
                  startContent={
                    <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-500" />
                  }
                  required
                />
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Description"
                  rows={3}
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <div className="relative flex-1" ref={containerRef}>
                    <Input
                      value={form.location}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, location: val }));
                        if (!isOnline) {
                          debouncedSearch(String(val));
                          setShowSuggestions(true);
                        }
                      }}
                      startContent={
                        <MapPinIcon className="h-5 w-5 text-gray-500" />
                      }
                      placeholder={isOnline ? "Meeting Link" : "Location"}
                      type={isOnline ? "url" : "text"}
                      required={!isOnline}
                      onFocus={() => {
                        if (!isOnline && form.location)
                          setShowSuggestions(true);
                      }}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-100 left-0 right-0 max-h-48 overflow-auto rounded-lg shadow-lg bg-white divide-y border border-gray-400">
                        {suggestions.map((s) => (
                          <li
                            key={s.place_id}
                            className="px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer text-left"
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

                  <div className="flex items-center">
                    <Checkbox
                      checked={isOnline}
                      onChange={(eOrVal) => {
                        const val =
                          eOrVal &&
                          (eOrVal as unknown as { target?: unknown }).target
                            ? Boolean(
                                (
                                  eOrVal as unknown as {
                                    target: HTMLInputElement;
                                  }
                                ).target.checked
                              )
                            : Boolean(eOrVal);
                        setIsOnline(val);
                        if (val) {
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }
                      }}
                      id="online-switch"
                    />
                    <label
                      htmlFor="online-switch"
                      className="text-sm flex items-center"
                    >
                      <span>Online</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm">
                      Start Date{!allDay && " & Time"}
                    </label>
                    <DatePicker
                      startContent={
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                      }
                      onChange={(val: unknown) => {
                        const dt = new Date(String(val));
                        if (!isNaN(dt.getTime())) {
                          setForm((f) => ({
                            ...f,
                            sDate: dt.toISOString().slice(0, 10),
                            sTime: dt.toISOString().slice(11, 16),
                          }));
                        }
                      }}
                      granularity={allDay ? "day" : "minute"}
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-sm">
                      End Date{!allDay && " & Time"}
                    </label>
                    <DatePicker
                      startContent={
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                      }
                      onChange={(val: unknown) => {
                        const dt = new Date(String(val));
                        if (!isNaN(dt.getTime())) {
                          setForm((f) => ({
                            ...f,
                            eTime: dt.toISOString().slice(11, 16),
                            eDate: dt.toISOString().slice(0, 10),
                            sDate: f.sDate || dt.toISOString().slice(0, 10),
                          }));
                        }
                      }}
                      granularity={allDay ? "day" : "minute"}
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <div className="flex items-center">
                      <Checkbox
                        checked={allDay}
                        onChange={(eOrVal) => {
                          const val =
                            eOrVal &&
                            (eOrVal as unknown as { target?: unknown }).target
                              ? Boolean(
                                  (
                                    eOrVal as unknown as {
                                      target: HTMLInputElement;
                                    }
                                  ).target.checked
                                )
                              : Boolean(eOrVal);
                          setAllDay(val);
                        }}
                        id="all-day-switch"
                      />
                      <label htmlFor="all-day-switch" className="text-sm">
                        All day
                      </label>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-1">
                  <label htmlFor="timezone" className="text-sm">
                    Timezone
                  </label>
                  <Autocomplete
                    startContent={
                      <GlobeAltIcon className="h-5 w-5 text-gray-500" />
                    }
                    id="timezone"
                    placeholder="Type to filter timezones"
                    defaultItems={Intl.supportedValuesOf("timeZone").map(
                      (tz) => ({ label: tz, value: tz })
                    )}
                    defaultSelectedKey={timezone}
                    onSelectionChange={(key) => {
                      if (!key) return;
                      setTimezone(String(key));
                    }}
                  >
                    {Intl.supportedValuesOf("timeZone").map((tz) => (
                      <AutocompleteItem
                        key={tz}
                        className="text-gray-900 bg-white hover:bg-gray-50 px-3 py-2 text-sm"
                      >
                        {tz}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>
                {formError && (
                  <div className="text-sm text-red-600">{formError}</div>
                )}
                <Button
                  variant="solid"
                  color="primary"
                  onPress={() => {
                    // validate required fields: title, sDate, endDate
                    if (!form.title.trim() || !form.sDate || !form.eDate) {
                      setFormError(
                        "Title, Start date and End date are required to create an event."
                      );
                      return;
                    }
                    // validate start < end
                    const startIso = `${form.sDate}T${form.sTime || "00"}:00`;
                    const endIso = `${form.eDate}T${form.eTime || "00"}:00`;
                    const startDt = new Date(startIso);
                    const endDt = new Date(endIso);
                    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
                      setFormError("Invalid start or end date/time.");
                      return;
                    }
                    if (endDt <= startDt) {
                      setFormError(
                        "End date/time must be after Start date/time."
                      );
                      return;
                    }
                    setFormError("");
                    setStep("share");
                  }}
                  title="Share Event"
                >
                  Share Event
                </Button>
              </div>
            )}
            {step === "share" && (
              <div className="w-full max-w-3xl bg-white rounded shadow p-6 flex flex-col gap-4 items-center">
                <div className="font-semibold">Share this link:</div>
                <a
                  href={shareLink}
                  className="text-blue-600 underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shareLink}
                </a>
                <ReactQRCode value={shareLink} size={128} />
                <button
                  className="mt-4 bg-gray-200 px-4 py-2 rounded"
                  onClick={() => setStep("form")}
                >
                  Back
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <footer className="mt-10 w-full max-w-3xl text-center text-sm hover:text-gray-600">
        <Button
          className="cursor-pointer rounded-lg border px-3 py-2 hover:bg-white"
          onPress={() => setAboutOpen(true)}
        >
          About &amp; Disclaimer
        </Button>
      </footer>
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

export default App;
