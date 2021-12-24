import React from "react"
import styled from "styled-components"
import { Menu } from "antd"
import Typography from "../../library/typography"
import { UnstatedTabNav } from "../../library/tabs"
import { TabsContainer } from "../../library/basicComponents"
import Up from "../../icons/svg/Caret/Filled/Down-Red.svg"
import Down from "../../icons/svg/Caret/Filled/Up-Green.svg"
import UserRoleProtected from "../userRoleProtected"

const toSlug = item =>
  item
    .toLowerCase()
    .split(" ")
    .join("-")
const NavItems = [
  { title: "KPIs", slug: "kpis" },
  { title: "App Usage", slug: "usage" },
  {
    title: "General Dashboard",
    slug: "dashboard",
    role: "canViewAutoAnalytics",
  },
]

export const AnalyticsLayout = ({ location, children }) => {
  return (
    <>
      <TabsContainer>
        {NavItems.map(item =>
          item.role ? (
            <UserRoleProtected
              component={UnstatedTabNav}
              to={`/analytics/${toSlug(item.slug)}`}
              active={`/analytics/${toSlug(item.slug)}` === location.pathname}
              key={item.slug}
              userRole={item.role}
            >
              {item.title}
            </UserRoleProtected>
          ) : (
            <UnstatedTabNav
              to={`/analytics/${toSlug(item.slug)}`}
              active={`/analytics/${toSlug(item.slug)}` === location.pathname}
              key={item.slug}
            >
              {item.title}
            </UnstatedTabNav>
          )
        )}
      </TabsContainer>
      {children}
    </>
  )
}

export const Card = styled.div`
  & * {
    margin-bottom: 0.5rem;
  }
`

export const CardsContainer = styled.div`
  padding: 1.5rem;
  width: ${props => (props.width ? props.width : "auto")};
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  margin-bottom: 0;
  text-align: center;
  @media only screen and (max-width: 1024px) {
    justify-content: center;
  }
`

export const CardTitle = styled(props => (
  <Typography variant="h4" weight="medium" {...props} />
))`
  text-transform: uppercase;
  color: #5e5e5e;
`

export const CardChange = styled.span`
  border-radius: 5px;
  padding: 8px;
  background-color: ${props => (props.positive ? "#E2F9F0" : "#FFE6E6")};
  color: ${props => (props.positive ? "#3ED57F" : "#FF4852")};
  display: inline-block;

  &:last-child {
    margin-bottom: 0;
  }
`

export const createMenu = items => (
  <Menu>
    {items.map(item => (
      <Menu.Item>{item}</Menu.Item>
    ))}
  </Menu>
)

const Caret = styled.img`
  margin: 0;
  margin-right: 5px;
`

export const ProspectAnalytics = ({ data, width, compareType = false }) => (
  <CardsContainer width={width}>
    {data.map(
      ({
        title,
        count,
        change,
        previous,
        isPercentage = false,
        compareType,
      }) => {
        const isPositive = change > 0 || change === "*"

        if (compareType) {
          return (
            <Card key={title}>
              <CardTitle>{title}</CardTitle>
              <Typography weight="bold" variant="h1">
                {count} / {previous}
              </Typography>
            </Card>
          )
        } else {
          return (
            <Card key={title}>
              <CardTitle>{title}</CardTitle>
              <Typography weight="bold" variant="h1">
                {count}
                {isPercentage && "%"}
              </Typography>
              <CardChange positive={isPositive}>
                <Caret src={isPositive ? Up : Down} alt="change" />
                {change}% (vs. {previous})
              </CardChange>
            </Card>
          )
        }
      }
    )}
  </CardsContainer>
)
