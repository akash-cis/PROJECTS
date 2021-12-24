import moment from "moment"

export const parseTimestamp = timestamp => {
  const date = timestamp
  // const date = moment('17/09/2020 15:20:00', 'DD/MM/YYYY HH:mm:ss');
  const now = moment()
  const months = now.diff(date, "months")
  if (months > 0) {
    // return months === 1 ? `${months} month ago` : `${months} months ago`;
    return `${moment(timestamp).format("MM/DD/YYYY")}`
  }
  const days = now.diff(date, "days")
  if (days > 0) {
    return days === 1 ? `${days} day ago` : `${days} days ago`
  }
  const hours = now.diff(date, "hours")
  if (hours > 0) {
    return hours === 1 ? `${hours} hour ago` : `${hours} hours ago`
  }
  const minutes = now.diff(date, "minutes")
  if (minutes > 0) {
    return minutes === 1 ? `${minutes} minute ago` : `${minutes} minutes ago`
  }
  return `${now.diff(date, "seconds")} seconds ago`
}
