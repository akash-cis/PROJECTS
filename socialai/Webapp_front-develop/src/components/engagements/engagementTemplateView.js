import React, { useContext } from "react"
import { UserContext } from "../../amplify/authenticator-provider"
import EngagementTemplates from "../admin-dashboard/enagementMessageTemplate"
import {
  Container,
  ContainerNavigation,
  ContentBody,
} from "../../library/basicComponents"
import Typography from "../../library/typography"

const EngagementTemplateView = () => {
  const { user } = useContext(UserContext)
  return (
    <Container style={{ height: "auto" }}>
      <ContainerNavigation>
        <div>
          <Typography variant={"h4"} weight={"medium"}>
            Engagement Templates
          </Typography>
        </div>
      </ContainerNavigation>
      <ContentBody>
        <EngagementTemplates
          company={user?.company || null}
          showTitle={false}
        />
      </ContentBody>
    </Container>
  )
}
export default EngagementTemplateView
