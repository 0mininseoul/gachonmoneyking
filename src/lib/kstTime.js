const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const KST_TIMEZONE = 'Asia/Seoul';

export function formatKstTimestamp(value = new Date()) {
  const date = toValidDate(value);
  if (!date) return '';

  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  return kstDate.toISOString().replace('Z', '+09:00');
}

export function formatKstDate(value = new Date()) {
  return formatKstTimestamp(value).slice(0, 10);
}

export function getKstEventProperties(value = new Date()) {
  const timestamp = formatKstTimestamp(value);
  return {
    event_time_kst: timestamp,
    event_date_kst: timestamp.slice(0, 10),
    event_hour_kst: timestamp ? Number(timestamp.slice(11, 13)) : null,
    event_timezone: KST_TIMEZONE,
  };
}

function toValidDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
