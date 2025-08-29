import { getLocalTimeZone } from "@internationalized/date";

export type EventForm = {
  title: string;
  description: string;
  location: string;
  sDate: string;
  sTime: string;
  eDate: string;
  eTime: string;
  timezone: string;
  isOnline: boolean;
  isAllDay: boolean;
  password: string;
};

export type EventQS = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  timezone: string;
  isOnline: boolean;
  isAllDay: boolean;
};

export const initialForm: EventForm = {
  title: "",
  description: "",
  location: "",
  sDate: "",
  sTime: "",
  eDate: "",
  eTime: "",
  timezone: getLocalTimeZone(),
  isOnline: false,
  isAllDay: false,
  password: "",
};
