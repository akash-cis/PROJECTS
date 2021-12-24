import React from "react"
import styled from "styled-components"
import Panel from "../library/panel"
import Typography from "../library/typography"
import { Icon } from "antd"

const Cntr = styled.div`
  height: 100vh;
  width: 100%;
`

const Content = styled(Panel)`
  height: 280px;
  text-align: center;
  margin: 15vh auto;
`

const NotFound = () => {
  return (
    <Cntr>
      <Content width={"50%"}>
        <Icon
          type={"warning"}
          style={{ fontSize: "64px", color: "#A70E72", marginTop: "12px" }}
        />
        <Typography variant={"h1"}>Page not found</Typography>
        <Typography>
          The page you are looking for has been removed or relocated.
        </Typography>
      </Content>
    </Cntr>
  )
}

export default NotFound
