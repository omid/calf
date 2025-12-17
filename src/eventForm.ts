import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';

export type EventForm = {
  title: string;
  description: string;
  location: string;
  sDate: CalendarDate | null;
  sTime: string;
  eDate: CalendarDate | null;
  eTime: string;
  timezone: string;
  isAllDay: boolean;
  password: string;
};

export type EventQS = {
  title: string;
  description: string;
  location: string;
  sDate: string;
  sTime: string;
  eDate: string;
  eTime: string;
  timezone: string;
  isAllDay: boolean;
};

const nowTime = function () {
  const date = new Date();
  let h = date.getHours();
  let m = date.getMinutes();
  if (m <= 30) {
    m = 30;
  } else {
    m = 0;
    h++;
    if (h === 24) h = 0;
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const nextHourTime = function () {
  const date = new Date();
  let h = date.getHours() + 1;
  let m = date.getMinutes();

  if (m <= 30) {
    m = 30;
  } else {
    m = 0;
    h++;
  }
  if (h >= 24) h -= 24;

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const initialForm: EventForm = {
  title: '',
  description: '',
  location: '',
  sDate: today(getLocalTimeZone()),
  sTime: nowTime(),
  eDate: today(getLocalTimeZone()),
  eTime: nextHourTime(),
  timezone: getLocalTimeZone(),
  isAllDay: false,
  password: '',
};

export const parseStandardParams = function (): EventQS {
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
};
