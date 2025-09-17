import ReactQRCode from "react-qr-code";
import { generateICal } from "./icalUtils";
import { ArrowDownTrayIcon, CalendarDaysIcon } from "@heroicons/react/16/solid";
import { Link } from "@heroui/react";
import { useState } from "react";
import { dateFromParts, decryptString, paramsDeserializer } from "./helpers";
import type { EventQS } from "./eventForm";

function getShareUnlockState() {
  const params = new URLSearchParams(window.location.search);
  const cipher = params.get("h");
  if (cipher) return { protected: true, cipher };
  return { protected: false };
}

function parseStandardParams(): EventQS {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("t") || "",
    description: params.get("d") || "",
    location: params.get("l") || "",
    sDate: params.get("sd") || "",
    sTime: params.get("st") || "",
    eDate: params.get("ed") || "",
    eTime: params.get("et") || "",
    timezone: params.get("tz") || "",
    isOnline: typeof params.get("o") === "string",
    isAllDay: typeof params.get("a") === "string",
  };
}

export default function Share() {
  const lockState = getShareUnlockState();
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [protectedEvent, setProtectedEvent] = useState<EventQS | null>(null);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError("");
    try {
      const base = await decryptString(lockState.cipher || "", password);
      const data = paramsDeserializer(base);
      // set event metadata exactly as "standard" event
      setProtectedEvent({
        title: data.t ?? "",
        description: data.d ?? "",
        location: data.l ?? "",
        sDate: data.sd ?? "",
        sTime: data.st ?? "",
        eDate: data.ed ?? "",
        eTime: data.et ?? "",
        timezone: data.tz ?? "",
        isOnline: data.o === "1",
        isAllDay: data.a === "1",
      });
      setUnlocked(true);
    } catch {
      setUnlockError("Unlock failed, data format/corruption?");
    }
  }

  // If share is protected, show unlock UI
  if (lockState.protected) {
    if (!unlocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-24">
          <form
            onSubmit={handleUnlock}
            className="flex flex-col bg-white border rounded-lg shadow-md p-4 gap-4 w-full max-w-sm"
          >
            <div className="font-bold text-lg mb-2">Protected event</div>
            <div className="text-sm mb-1 text-slate-700">
              This event is password-protected. Enter password to show event
              details.
            </div>
            <input
              type="password"
              autoFocus
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border px-2 py-2"
            />
            {unlockError && (
              <div className="text-red-600 text-sm">{unlockError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium rounded py-2 px-3 hover:bg-blue-700 mt-2"
            >
              Unlock Event
            </button>
          </form>
        </div>
      );
    }
    // fall through: show event with details from "event"
  }
  // Use unlocked event if set (from protected), else parse from standard URL
  const event = protectedEvent || parseStandardParams();

  const startDt = dateFromParts(event.sDate, event.sTime, event.timezone);
  const endDt = dateFromParts(
    event.eDate || event.sDate,
    event.eTime || event.sTime,
    event.timezone
  );

  const tzDisplay = (() => {
    if (event.timezone) return event.timezone;
    const off = -startDt.getTimezoneOffset();
    const sign = off >= 0 ? "+" : "-";
    const h = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
    const m = String(Math.abs(off) % 60).padStart(2, "0");
    return `${sign}${h}:${m}`;
  })();

  const formatInTimezone = (date: Date, tz?: string) => {
    if (!tz) return date.toUTCString();
    try {
      const opts: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      };
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      return date.toUTCString();
    }
  };

  const formatInTime = (date: Date, tz?: string) => {
    if (!tz) return date.toUTCString();
    try {
      const opts: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      };
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      return date.toUTCString();
    }
  };

  const formatDateOnly = (date: Date) => {
    try {
      const opts: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "long",
      };
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  };

  const ical = generateICal(event);

  const icalBlob = new Blob([ical], { type: "text/calendar" });
  const icalUrl = URL.createObjectURL(icalBlob);
  const shareLink = window.location.href;

  const sanitizeDate = (d: string) =>
    d.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const startStr = event.isAllDay ? event.sDate : startDt.toISOString();
  const endStr = event.isAllDay ? event.eDate : endDt.toISOString();
  const details = encodeURIComponent(event.description);
  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location);

  const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${sanitizeDate(
    startStr
  )}/${Number(sanitizeDate(endStr)) + 1}`;

  const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? "&allday=true" : ""
  }`;

  const office365Link = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startStr}&enddt=${endStr}${
    event.isAllDay ? "&allday=true" : ""
  }`;

  const yahooLink = `https://calendar.yahoo.com/?v=60&title=${title}&st=${startStr}&et=${endStr}&desc=${details}&in_loc=${location}&dur=${
    event.isAllDay ? "allday" : ""
  }`;

  // Apple Calendar: open the ICS (do not force download) so the OS can hand it to Calendar
  const appleLink = icalUrl; // keep as blob; omit `download` attr on the anchor

  // Shared button styling to ensure uniform size
  const btn =
    "flex h-12 w-full items-center justify-center gap-3 rounded-lg shadow hover:shadow-lg text-base text-gray-800 transition";

  return (
    <div className="bg-gray-50 text-gray-900 flex flex-col p-4">
      <div className="w-full max-w-3xl bg-white rounded shadow p-6 flex flex-col gap-4">
        <div className="border border-gray-200 shadow-lg rounded p-4 flex flex-row gap-5">
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
                Location:{" "}
                <Link
                  href={
                    event.isOnline
                      ? event.location
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          event.location
                        )}`
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
            ) : formatDateOnly(startDt) === formatDateOnly(endDt) ? (
              <>
                <div className="text-sm text-gray-600">
                  {formatDateOnly(startDt)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatInTime(startDt, event.timezone)} to{" "}
                  {formatInTime(endDt, event.timezone)}
                </div>
                <div className="text-sm text-gray-600">
                  Time Zone: {tzDisplay}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-600">
                  Start: {formatInTimezone(startDt, event.timezone)}
                </div>
                <div className="text-sm text-gray-600">
                  End: {formatInTimezone(endDt, event.timezone)}
                </div>
                <div className="text-sm text-gray-600">
                  Time Zone: {tzDisplay}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="font-semibold">Add to your calendar:</div>

        <div className="grid xs:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-3 w-full">
          <Link
            href={googleLink}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            aria-label="Add to Google Calendar"
          >
            <img
              src="assets/google-calendar.avif"
              alt="Google Calendar"
              className="w-5 h-5"
            />
            Google Calendar
          </Link>

          <Link
            href={outlookLink}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            aria-label="Add to Outlook"
          >
            <img src="assets/outlook.avif" alt="Outlook" className="w-5 h-5" />
            Outlook (Live)
          </Link>

          <Link
            href={appleLink}
            // NOTE: no download attribute — lets iOS/macOS open in Calendar
            className={btn}
            aria-label="Add to Apple Calendar"
            type="text/calendar"
          >
            <img src="assets/apple.avif" alt="Apple" className="w-5 h-5" />
            Apple Calendar
          </Link>

          <Link
            href={office365Link}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            aria-label="Add to Office 365"
          >
            <img
              src="assets/office.avif"
              alt="Office 365"
              className="w-5 h-5"
            />
            Office 365
          </Link>

          <Link
            href={yahooLink}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
            aria-label="Add to Yahoo Calendar"
          >
            <img src="assets/yahoo.avif" alt="Yahoo" className="w-5 h-5" />
            Yahoo Calendar
          </Link>

          <Link
            href={icalUrl}
            download="event.ics"
            className={btn}
            aria-label="Download iCal file"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download iCal (.ics)
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div>
            <div className="text-sm">Share QR code</div>
            <ReactQRCode value={shareLink} size={128} />
          </div>
          <div className="text-sm text-gray-600 break-all">{shareLink}</div>
        </div>
      </div>
    </div>
  );
}
