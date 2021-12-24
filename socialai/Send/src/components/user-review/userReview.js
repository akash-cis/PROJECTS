import React from "react"
import styled from "styled-components"
import Typography from "../../library/typography"
import { Col, Icon, Row, Card } from "antd"
import { Link } from "gatsby"
import { Container } from "../../library/basicComponents"
import backImage from "../../utils/images/backpage.jpg"
export const jwt = require('jsonwebtoken');
import { useQuery, useLazyQuery } from "@apollo/react-hooks"
import { GET_COMPANY } from "../../graphql/query"


const Cntr = styled.div`
  height: 100vh;
  width: 100%;
`
const ContainerWrap = styled(Container)`
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

const UserReview = ({token, uri, location}) => {
    // const [company, setCompany] = useState(null)
    // const [getCompany] = useQuery(GET_COMPANY)

    
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
        console.log('----------------------------------------------')
      },
    })
  return (
    <Cntr>
      <ContainerWrap
        auto
        backImage={`url(${backImage})`}
      >
        <CardWrapper
          style={{ borderRadius: "10px" }}
          className="card-signup header-solid h-full ant-card pt-0"
          bordered="false"
        >
          <RowWrapper>
            <Row style={{ marginBottom: "50px" }}>
              <Title>Do you like our service? </Title>
            </Row>
            <RowWrapper>
              <ColWrapper span={12}>
                <Link to={`/user-review/good/${token}`}>
                  <Icon
                    type="check-circle-twotone"
                    style={{
                      display: "grid",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#1890ff",
                      fontSize: "60px",
                      marginRight: "10px",
                    }}
                  />
                  <TypographyWrapper variant={"h1"}>Good</TypographyWrapper>
                </Link>
              </ColWrapper>
              <ColWrapper span={12}>
                <Link to={`/user-review/bad/${token}`}>
                  <Icon
                    type="close-circle"
                    style={{
                      display: "grid",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#dc3545",
                      fontSize: "60px",
                    }}
                  />
                  <TypographyWrapper variant={"h1"}>Bad</TypographyWrapper>
                </Link>
              </ColWrapper>
            </RowWrapper>
          </RowWrapper>
        </CardWrapper>
      </ContainerWrap>
    </Cntr>
  )
}

export default UserReview