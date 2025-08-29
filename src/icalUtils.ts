import ICAL from "ical.js";

export function generateICal({
  title,
  description,
  location,
  sDate,
  eDate,
}: {
  title: string;
  description: string;
  location: string;
  sDate: string;
  eDate: string;
}) {
  // end date/time strings are constructed below as JS Dates
  const vevent = new ICAL.Component("vevent");
  vevent.addPropertyWithValue("summary", title);
  vevent.addPropertyWithValue("description", description);
  vevent.addPropertyWithValue("location", location);

  // Build JS Date objects from provided date/time and convert to ICAL.Time
  const startDate = new Date(sDate);
  const endDate = new Date(eDate);

  const tStart = ICAL.Time.fromJSDate(startDate);
  const tEnd = endDate ? ICAL.Time.fromJSDate(endDate) : undefined;

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
