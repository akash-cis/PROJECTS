import React,{useState, useEffect} from "react"
import { Icon, Row, Col } from "antd"
import styled from "styled-components"
import { Container } from "../../library/basicComponents"
import { Link } from "gatsby"
import { GET_MY_COMPANY } from "../../graphql/query"
import { useQuery, useLazyQuery, useMutation } from "@apollo/react-hooks"
export const jwt = require('jsonwebtoken');
import { GET_COMPANY } from "../../graphql/query"


const ContainerWrap = styled(Container)`
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

const GoodReview = ({token, uri, location}) => {
  console.log('token: '+token)
  console.log('uri: '+uri)
  const [buttonState, setButtonState] = useState(true);
  const [reviewState, setReviewState] = useState(true);
  const [company, setCompany] = useState({})

  console.log('token: '+token)
  const decoded = jwt.verify(token, 'shhhhh');
  console.log(decoded.company)


  const { data, refetch: refreshCompany } = useQuery(GET_COMPANY, {
    fetchPolicy: "network-only",
    variables: { id: decoded?.company || 0 },
    onCompleted: res => {
      // if (res && res.me && res.me.company) setCompany(res.me.company)
      console.log('----------------------------------------------')
      console.log(res)
      if (res && res.company) setCompany(res.company)
      console.log('----------------------------------------------')
    },
  })


  // const { data, refetch: refreshCompany } = useQuery(GET_MY_COMPANY, {
  //   onCompleted: res => {
  //     if (res && res.me && res.me.company) setCompany(res.me.company)
  //   },
  // })
  console.log(company)
  useEffect(() => {
    if (company && company.facebookLink && company.facebookLink !== "" ) {
      setButtonState(true);

    } else {
      setButtonState(false)
    }
    if (company && company.googleLink && company.googleLink !== ""){
      setReviewState(true);
    } else {
      setReviewState(false)
    }
  }, [company])

    // console.log(locaiton)
    // var decoded = jwt.verify(token, 'shhhhh');
    // alert(decoded)
  return (
    <ContainerWrap auto>
      <strong level={5}>
        Thanks for your time! We're looking forward to making your experience
        even better in the future!.
      </strong>
      <Row gutter={[16, 16]}>
        <Col span={12}>
        {buttonState ?<Link to={company.facebookLink}>
            <Icon
              type="facebook"
              style={{
                marginTop: "45px",
                color: "#00a1c9",
                fontSize: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          </Link> : <></>}
        </Col>
        <Col span={12}>
        {reviewState ?<Link to={company.googleLink}>
            <Icon
              type="google"
              style={{
                marginTop: "45px",
                color: "#00a1c9",
                fontSize: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          </Link>: <></>}
        </Col>
      </Row>
    </ContainerWrap>
  )
}
export default GoodReview
