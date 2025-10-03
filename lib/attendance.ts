import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);

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

export function getJakartaDateInfo(reference?: string | Date) {
  const now = reference ? dayjs(reference) : dayjs();
  const jakartaNow = now.tz(TIMEZONE);

  return {
    isoDate: jakartaNow.format("YYYY-MM-DD"),
    isSaturday: jakartaNow.day() === 6,
    weekday: jakartaNow.format("dddd"),
    readableDate: jakartaNow.locale("id").format("dddd, D MMMM YYYY"),
  };
}

export function formatAttendanceDate(dateString: string) {
  return dayjs.tz(dateString, TIMEZONE).locale("id").format("dddd, DD MMMM YYYY");
}

export function formatAttendanceTime(timestamp: string) {
  return dayjs(timestamp).tz(TIMEZONE).locale("id").format("HH.mm");
}

export function formatAttendanceDateTime(timestamp: string) {
  return dayjs(timestamp).tz(TIMEZONE).locale("id").format("dddd, DD MMMM YYYY HH.mm");
}
