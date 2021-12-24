import { toTreeMapCompatible } from "../components/analytics/dashboard"

const dating = [
  {
    make: "Tesla",
    model: "Model 8",
    count: 5,
  },
  {
    make: "Ford",
    model: "Model 8",
    count: 10,
  },
  {
    make: "Tesla",
    model: "Model 9",
    count: 9,
  },
  {
    make: "Ford",
    model: "Model 9",
    count: 4,
  },
  {
    make: "Tesla",
    model: "Model 5",
    count: 5,
  },
]

test("processes data correctly", () => {
  expect(toTreeMapCompatible(dating)).toMatchSnapshot()
})
