import ICAL from "ical.js";
import type { EventQS } from "./eventForm";
import { icalDateFromParts } from "./helpers";

export function generateICal(event: EventQS) {
  // end date/time strings are constructed below as JS Dates
  const vevent = new ICAL.Component("vevent");
  vevent.addPropertyWithValue("summary", event.title);
  vevent.addPropertyWithValue("description", event.description);
  vevent.addPropertyWithValue("location", event.location);

  const tStart = icalDateFromParts(event.sDate, event.sTime, event.timezone);
  const tEnd = icalDateFromParts(event.eDate, event.eTime, event.timezone);

  // Attach dtstart/dtend as ICAL.Time objects
  vevent.addPropertyWithValue("dtstart", tStart);
  if (tEnd) vevent.addPropertyWithValue("dtend", tEnd);

  // Add DTSTAMP and UID for completeness
  vevent.addPropertyWithValue("dtstamp", ICAL.Time.now());
  vevent.addPropertyWithValue("uid", `${Date.now()}@calf.local`);
  const vcal = new ICAL.Component(["vcalendar", [], []]);
  vcal.addSubcomponent(vevent);
  return vcal.toString();
}
