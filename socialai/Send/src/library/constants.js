import FacebookIcon from "../../static/icons/FacebookIcon.svg"
import TwitterIcon from "../../static/icons/TwitterIcon.svg"
import ForumIcon from "../../static/icons/ChatIcon2.svg"
import RedditIcon from "../../static/icons/RedditIcon.svg"
import CraiglistIcon from "../../static/icons/CraiglistIcon.svg"

export const Colors = {
  lightBlue: "#CDEBF9",
  blue: "#079BE2",
  lightBrandBlue: "#E6F0FF",
  primaryBrandBlue: "#006593",
  lightPrimaryBrandBlue: "#007dae",
  darkPrimaryBrandBlue: "#005278",
  lightPurple: "#E4B6D4",
  brandPurple: "#A70E72",
  darkBrandPurple: "#8E0B61",
  lightGreen: "#E2F9F0",
  green: "#3DD57F",
  lightOrange: "#FFEDC6",
  orange: "#FFBE42",
  darkOrange: "#d29e35",
  lightRed: "#FFE7E7",
  red: "#FC5A5A",
  darkRed: "#d25454",
  white: "#FFFFFF",
  backgroundGray: "#F5F6FA",
  veryLightGray: "#EEEEF1",
  lightGray: "#EEEEF1",
  mediumGray: "#BDC4CB",
  gray: "#C4C1C2",
  medDarkgray: "#999697",
  darkGray: "#5E5E5E",
  disabledGray: "#D2D3D8",
}

export const ChartColors = [
  Colors.green,
  Colors.orange,
  Colors.brandPurple,
  Colors.primaryBrandBlue,
  Colors.red,
  Colors.blue,
]

export const LightColorPairs = [
  {
    light: Colors.lightBrandBlue,
    standard: Colors.primaryBrandBlue,
  },
  {
    light: Colors.lightOrange,
    standard: Colors.orange,
  },
  {
    light: Colors.lightPurple,
    standard: Colors.brandPurple,
  },
  {
    light: Colors.lightGreen,
    standard: Colors.green,
  },
  {
    light: Colors.lightRed,
    standard: Colors.red,
  },
  {
    light: Colors.lightBlue,
    standard: Colors.blue,
  },
]

export const TagColors = tag => {
  switch (tag) {
    case "Buy Car":
      return ChartColors[0]
      break
    case "Sell Car":
      return ChartColors[1]
      break
    case "New":
      return ChartColors[2]
      break
    case "Used":
      return ChartColors[3]
      break
    case "Parts":
      return ChartColors[4]
      break
    case "Service":
      return ChartColors[5]
      break
    default:
      return null
  }
}

//TODO: Corner roundness?
export const Outlines = {
  thick: "4px",
  regular: "2px",
  thin: "1px",
}

//TODO: Cards

//TODO: Separators
export const Separators = (weight, color) => {
  const weights = {
    thin: "1px",
    medium: "2px",
    thick: "3px",
  }
  return weights[weight] + " solid " + Colors[color]
}

export const ProspectStatus = {
  REJECTED: "Rejected",
  SAVED: "Saved",
  ACCEPTED: "Accepted",
  VIEWED: "Viewed",
}

// Add more if necessary
export const SourceFilters = [
  "Others",
  "Forums",
  "Craiglist",
  "Quora",
  "Yelp",
  "Facebook",
]
export const SourceTypes = {
  FORUM: ForumIcon,
  CRAIGSLIST: CraiglistIcon,
  FACEBOOK: FacebookIcon,
  TWITTER: TwitterIcon,
  REDDIT: RedditIcon,
}

export const DealStatus = {
  ACTIVE: "Active",
  DEAL_WON: "Deal Won",
  DEAL_LOST: "Deal Lost",
  NO_RESPONSE: "No response",
  PUSHED_CRM: "Pushed to CRM",
  EXPIRED: "Expired",
  ARCHIVED: "Archive",
}

export const DealStatusFilters = ["Active", "Deal Won", "Deal Lost"]

export const RangeFilters = [
  { value: 1, name: "Today" },
  { value: 3, name: "3 Days" },
  { value: 7, name: "Week" },
  { value: 14, name: "2 weeks" },
  { value: null, name: "All Posts" },
]

export const DealStatusSelects = [
  { value: "ACTIVE", display: "Active" },
  { value: "DEAL_WON", display: "Deal Won" },
  { value: "DEAL_LOST", display: "Deal Lost" },
  { value: "ARCHIVED", display: "Archive" },
]

// TODO: complete with correct industries
export const Industries = ["Industry 1", "Industry 2", "Industry 3"]

export const BAR = "BAR"
export const LINE = "LINE"
export const TREE = "TREE"
export const graphTypes = { BAR, LINE, TREE }

export const timeMappings = [
  { value: "00:00:00", name: "12:00AM" },
  { value: "01:00:00", name: "1:00AM" },
  { value: "02:00:00", name: "2:00AM" },
  { value: "03:00:00", name: "3:00AM" },
  { value: "04:00:00", name: "4:00AM" },
  { value: "05:00:00", name: "5:00AM" },
  { value: "06:00:00", name: "6:00AM" },
  { value: "07:00:00", name: "7:00AM" },
  { value: "08:00:00", name: "8:00AM" },
  { value: "09:00:00", name: "9:00AM" },
  { value: "10:00:00", name: "10:00AM" },
  { value: "11:00:00", name: "11:00AM" },
  { value: "12:00:00", name: "12:00PM" },
  { value: "13:00:00", name: "1:00PM" },
  { value: "14:00:00", name: "2:00PM" },
  { value: "15:00:00", name: "3:00PM" },
  { value: "16:00:00", name: "4:00PM" },
  { value: "17:00:00", name: "5:00PM" },
  { value: "18:00:00", name: "6:00PM" },
  { value: "19:00:00", name: "7:00PM" },
  { value: "20:00:00", name: "8:00PM" },
  { value: "21:00:00", name: "9:00PM" },
  { value: "22:00:00", name: "10:00PM" },
  { value: "23:00:00", name: "11:00PM" },
]

export const timezones = [
  { value: "America/Juneau", name: "Alaska Daylight Time" },
  { value: "America/Chicago", name: "Central Daylight Time (North America)" },
  { value: "America/New_York", name: "Eastern Daylight Time (North America)" },
  { value: "Pacific/Honolulu", name: "Hawaii-Aleutian Daylight Time" },
  { value: "America/Denver", name: "Mountain Daylight Time (North America)" },
  {
    value: "America/Los_Angeles",
    name: "Pacific Daylight Time (North America)",
  },
  { value: "Asia/Calcutta", name: "Asia/Calcutta" },
]

export const intervals = [
  { name: "30 min", value: "30" },
  { name: "1 Hour", value: "60" },
  { name: "2 Hours", value: "120" },
  { name: "4 Hours", value: "240" },
  { name: "8 Hours", value: "480" },
  { name: "24 Hours", value: "1440" },
]

export const FilterSetTypes = {
  ANALYTICS: "ANALYTICS",
  PROSPECTS: "PROSPECTS",
  EXPORT: "EXPORT",
  LIFE_EVENTS: "LIFE_EVENTS",
  GENERAL: "GENERAL",
  ENGAGEMENTS: "ENGAGEMENTS",
}

export const NOT_ENOUGH_DATA =
  "Not enough data to display.\n Let's work on some leads and check back later."

// filters
export const KEYWORD = "Keyword"
export const LOCATION = "Location"
export const SOURCES = "Sources"
export const MAKE = "Make"
export const MULTISELECT = "Multiselect"
export const SELECT = "Select"
export const ALL = "All"

// personalized ads
export const COUNTS = [100, 200, 300, 400]
export const FREQUENCY = [
  ["1 Day", 1],
  ["1 Week", 7],
  ["1 Month", 30],
]

export const TypeFiltersSelects = [
  { value: "ALL", display: "All" },
  { value: "PROSPECTS", display: "Prospects" },
  { value: "LIFE_EVENT", display: "Life Events" },
]
