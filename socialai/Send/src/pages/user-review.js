import React, { useState } from "react"
import UserReview from "../components/user-review/userReview"
import BadReview from "../components/user-review/bad"
import GoodReview from "../components/user-review/good"
import styled from "styled-components"
import { Container } from "../library/basicComponents"
import { Router } from "@reach/router"
import { Alert, Button, Input, Icon, Row, Col, Card } from "antd"
import Typography from "../library/typography"


const ContainerWrapBad = styled(Container)`
  display: grid;
  justify-content: center;
  align-items: center;
  padding: 40px;
  margin: 15px
  over-flow: none;
  .ant-fullcalendar-fullscreen .ant-fullcalendar-date {
    height: 80px;
  }
  .ant-radio-group ant-radio-group-outline ant-radio-group-default {
    display: none;
  }
  .ant-fullcalendar-fullscreen .ant-fullcalendar-header .ant-radio-group {
    display: none;
  }
`
const ContainerWrapGood = styled(Container)`
  display: grid;
  justify-content: center;
  align-items: center;
  padding: 40px;
  margin: 15px
  over-flow: none;
  .ant-fullcalendar-fullscreen .ant-fullcalendar-date {
    height: 80px;
  }
  .ant-radio-group ant-radio-group-outline ant-radio-group-default {
    display: none;
  }
  .ant-fullcalendar-fullscreen .ant-fullcalendar-header .ant-radio-group {
    display: none;
  }
`

const Cntr = styled.div`
  height: 100vh;
  width: 100%;
`
const ContainerWrapUR = styled(Container)`
  display: grid;
  justify-content: center;
  align-items: center;
  margin-top: 0px;
  height: 100vh;
  background-repeat: no-repeat;
  background-size: cover;
  background-image: ${props => props.backImage};
`
const CardWrapper = styled(Card)`
  & .ant-card {
    border-radius: 10px;
  }
  .ant-card-body {
    zoom: 1;
    width: 100%;
    width: 500px;
    height: 500px;
    box-shadow: 0 20px 27px rgb(0 0 0 / 5%);
    display: grid;
    align-items: center;
  }
`
const RowWrapper = styled(Row)`
  & .ant-row {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const ColWrapper = styled(Col)`
  & .ant-col {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const Title = styled.div`
  font-weight: bold;
`

const TypographyWrapper = styled(Typography)`
  display: grid;
  justify-content: center;
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
  max-width: 150px;
  float: right;
`

let endPoint = (
    process.env.GATSBY_API_URL || "http://localhost:5000/graphql"
).replace("/graphql", "")
  
  
  

const UserReviewPage = ({ location, authData }) => {
    // console.log(location)
    // console.log(location.pathname)
    return (
        <Cntr auto>
            <Router basepath={'/'}>
                <UserReview location={location} exact path="/user-review/:token" />
                <BadReview location={location} path="/user-review/bad/:token" />
                <GoodReview location={location} path="/user-review/good/:token" />
            </Router>
        </Cntr>
    )
}

export default UserReviewPage

