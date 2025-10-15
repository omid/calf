import ICAL from "ical.js";
import type { EventQS } from "./eventForm";
import { icalDateFromParts } from "./helpers";

export function generateICal(event: EventQS) {
  const vcal = new ICAL.Component(["vcalendar", [], []]);
  vcal.addPropertyWithValue("prodid", "-//Calf//Calendar Export 1.0//EN");
  vcal.addPropertyWithValue("version", "2.0");

  const vevent = new ICAL.Component("vevent");
  vevent.addPropertyWithValue("summary", event.title);
  if (event.description)
    vevent.addPropertyWithValue("description", event.description);
  if (event.location) vevent.addPropertyWithValue("location", event.location);

  const tStart = icalDateFromParts(event.sDate, event.sTime, event.timezone);
  const tEnd = icalDateFromParts(event.eDate, event.eTime, event.timezone);

  vevent.addPropertyWithValue("dtstart", tStart);
  if (tEnd) vevent.addPropertyWithValue("dtend", tEnd);

  vevent.addPropertyWithValue("dtstamp", ICAL.Time.now());
  vevent.addPropertyWithValue("uid", `${Date.now()}@calf.local`);
  vcal.addSubcomponent(vevent);

  return vcal.toString();
}
