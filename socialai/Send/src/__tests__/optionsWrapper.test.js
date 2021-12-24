import React from "react"
import { render, fireEvent, waitForElement } from "@testing-library/react"
import OptionsWrapper, {
  mapify,
  rangeFilter,
  filterByRange,
  substractDays,
} from "../library/optionsWrapper"
import data from "data"

test("renders dropdown with period picker and modifies state", async () => {
  const { getByTestId, getByText } = render(
    <OptionsWrapper periods>{props => <p {...props}>Chart</p>}</OptionsWrapper>
  )
  fireEvent.mouseOver(getByTestId("period"))
  await waitForElement(() => fireEvent.click(getByText("1 week")))
  expect(getByTestId("period")).toHaveTextContent("1 week")
})

test("renders dropdown with change picker and modifies state", async () => {
  const { getByTestId, getByText } = render(
    <OptionsWrapper changes>{props => <p {...props}>Chart</p>}</OptionsWrapper>
  )
  fireEvent.mouseOver(getByTestId("changes"))
  await waitForElement(() => fireEvent.click(getByText("This quarter vs last")))
  expect(getByTestId("changes")).toHaveTextContent("This quarter vs last")
})

// TOOD test range
// test("changes range according to selected period", () => {
//   const { getByTestId, getByText } = render(<OptionsWrapper></OptionsWrapper>)
//   rangeFilter(data, 11, new Date(2020, 0, 23)))
// })

test("changes period (range) according to selected period", async () => {
  const { getByTestId, getByText, debug } = render(
    <OptionsWrapper periods date="2020-01-23" data={data} lambda={data => data}>
      {({ data }) => (
        <div data-testid="data">
          {data.reduce((acc, curr) => acc + curr.count, 0)}
        </div>
      )}
    </OptionsWrapper>
  )
  // starts with range 30
  expect(getByTestId("data")).toHaveTextContent("37")
  fireEvent.mouseOver(getByTestId("period"))

  // range 7
  await waitForElement(() => fireEvent.click(getByText("1 week")))
  expect(getByTestId("data")).toHaveTextContent("31")

  // range 1
  await waitForElement(() => fireEvent.click(getByText("3 months")))
  expect(getByTestId("data")).toHaveTextContent("43")
})

// test("changes change (range) according to selected change", async () => {
//   const { getByTestId, getByText, debug } = render(
//     <OptionsWrapper change data={data} lambda={data => data}>
//       {({ data }) => (
//         <div data-testid="data">
//           {data.reduce((acc, curr) => acc + curr.count, 0)}
//         </div>
//       )}
//     </OptionsWrapper>
//   )
//   // starts with range 2
//   expect(getByTestId("data")).toHaveTextContent("1")
//   fireEvent.mouseOver(getByTestId("period"))

//   // range 7
//   await waitForElement(() => fireEvent.click(getByText("1 week")))
//   expect(getByTestId("data")).toHaveTextContent("31")

//   // range 1
//   await waitForElement(() => fireEvent.click(getByText("1 day")))
//   expect(getByTestId("data")).toHaveTextContent("12")
// })

const changeMenu = {
  TODAY_YESTERDAY: { label: "Today vs yesterday", range: 2 },
  MONTH_LAST: { label: "This month vs last", range: 60 },
  WEEK_LAST: { label: "This week vs last", range: 14 },
}

test("maps object to menu", () => {
  expect(mapify(changeMenu)).toMatchSnapshot()
})

test("shows nothing on zero days", () => {
  expect(filterByRange(data, 0, "2020-01-23T00:00:00")).toMatchSnapshot()
})

test("filters correctly by 1 week range", () => {
  expect(filterByRange(data, 7, "2020-01-23T00:00:00")).toMatchSnapshot()
})

test("filters correctly by 30 days range", () => {
  expect(filterByRange(data, 30, "2020-01-23T00:00:00")).toMatchSnapshot()
})

test("substract days to date", () => {
  substractDays("2020-01-01T00:00:00", 6)
})
