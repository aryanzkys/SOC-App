export type AttendanceStatus = "Hadir" | "Izin" | "Alfa";

export type AttendanceRecord = {
  id: string;
  user_id?: string;
  nisn: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
  name?: string | null;
};

const TIMEZONE = "Asia/Jakarta";

export function getJakartaDateInfo(date = new Date()) {
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "long",
  }).format(date);

  const readableDate = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

  return {
    isoDate,
    isSaturday: weekday.toLowerCase() === "saturday",
    weekday,
    readableDate,
  };
}

export function formatAttendanceDate(dateString: string) {
  const isoSource = `${dateString}T00:00:00+07:00`;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(isoSource));
}

export function formatAttendanceTime(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatAttendanceDateTime(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
