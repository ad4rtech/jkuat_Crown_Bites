import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Formats a given number of minutes into a human-readable string.
 * - < 60 minutes: "Xm ago"
 * - 60 to 1439 minutes (under 24h): "Xh Ym ago"
 * - >= 1440 minutes (24h+): Returns the actual date format (e.g., "Oct 24, 2:30 PM")
 */
export function formatMinutesAgo(minutes: number, createdAtString?: string): string {
  if (minutes < 0) minutes = 0;

  if (minutes >= 1440 && createdAtString) {
    return dayjs(createdAtString).format('MMM D, h:mm A');
  }

  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    const hStr = h === 1 ? '1 hr' : `${h} hrs`;
    const mStr = m === 1 ? '1 min' : `${m} mins`;
    return m === 0 ? `${hStr} ago` : `${hStr} ${mStr} ago`;
  }

  return `${Math.floor(minutes)} mins ago`;
}

/**
 * Parses an ISO date string and formats the elapsed time.
 */
export function formatTimeAgo(dateString: string): string {
  const now = dayjs();
  const date = dayjs(dateString);
  const diffMinutes = now.diff(date, 'minute');
  
  return formatMinutesAgo(diffMinutes, dateString);
}
