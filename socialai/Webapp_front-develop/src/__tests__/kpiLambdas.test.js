import {
  countByStatus,
  prospectUsageOverTime,
  ACCEPTED,
  SAVED,
  // managerAppUsage,
} from "../components/analytics/lambdas"
import data from "data"
import { filterByRange } from "../library/optionsWrapper"

test("count by status", () => {
  // with one string
  expect(countByStatus(data)(ACCEPTED)).toEqual(12)
  // with an array of string
  expect(countByStatus(data)([ACCEPTED, SAVED])).toEqual(14)
})

test("accumulate by date", () => {
  expect(prospectUsageOverTime(data)).toMatchSnapshot()
})

test("filters by name and date", () => {
  expect(
    filterByRange(data, 90, "2020-02-03", "Funnel AI Admin")
  ).toMatchSnapshot()
})

// const data2 = [
//   {
//     date: "2020-01-31",
//     time: 1,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-01-23",
//     time: 139,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-02-06",
//     time: 2957,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-01-29",
//     time: 43,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-01-28",
//     time: 2,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-02-05",
//     time: 0,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-01-24",
//     time: 10,
//     userName: "FunnelAI Admin",
//   },
//   {
//     date: "2020-01-27",
//     time: 9,
//     userName: "Test FunnelAI",
//   },
//   {
//     date: "2020-01-23",
//     time: 19,
//     userName: "Test FunnelAI",
//   },
//   {
//     date: "2020-01-27",
//     time: 48,
//     userName: "FunnelAI Admin",
//   },
// ]

// test("app usage", () => {
//   managerAppUsage(data2, 14)
// })
