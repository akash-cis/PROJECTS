import React from "react"
import {
  Container,
  ContainerNavigation,
} from "../../../library/basicComponents"
import { Rows, FirstRow, SecondRow } from "./elements"

export const Layout = ({
  title,
  buttons,
  secondRow,
  children,
  containerProps = {},
  showFirstRow = true,
}) => {
  return (
    <Container {...containerProps}>
      <ContainerNavigation>
        <Rows>
          {showFirstRow && (
            <FirstRow secondRow={secondRow}>
              {title}
              <div>{buttons}</div>
            </FirstRow>
          )}
          <SecondRow>{secondRow && secondRow}</SecondRow>
        </Rows>
      </ContainerNavigation>
      {children}
    </Container>
  )
}
