import ICAL from "ical.js";

export function generateICal({
  title,
  description,
  location,
  sDate,
  sTime,
  eDate,
  eTime,
}: {
  title: string;
  description: string;
  location: string;
  sDate: string;
  sTime: string;
  eDate?: string;
  eTime?: string;
}) {
  const endDateStr = eDate || sDate;
  const endTimeStr = eTime || sTime;
  // end date/time strings are constructed below as JS Dates
  const vevent = new ICAL.Component("vevent");
  vevent.addPropertyWithValue("summary", title);
  vevent.addPropertyWithValue("description", description);
  vevent.addPropertyWithValue("location", location);

  // Build JS Date objects from provided date/time and convert to ICAL.Time
  const startIso = `${sDate}T${sTime}:00Z`;
  const endIso = `${endDateStr}T${endTimeStr}:00Z`;
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  const tStart = ICAL.Time.fromJSDate(startDate);
  const tEnd = ICAL.Time.fromJSDate(endDate);

  // Attach dtstart/dtend as ICAL.Time objects
  vevent.addPropertyWithValue("dtstart", tStart);
  vevent.addPropertyWithValue("dtend", tEnd);

  // Add DTSTAMP and UID for completeness
  vevent.addPropertyWithValue("dtstamp", ICAL.Time.now());
  vevent.addPropertyWithValue("uid", `${Date.now()}@calf.local`);
  const vcal = new ICAL.Component(["vcalendar", [], []]);
  vcal.addSubcomponent(vevent);
  return vcal.toString();
}
