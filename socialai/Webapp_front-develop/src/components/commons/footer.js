import React from "react"
import styled from "styled-components"

const InfoSection = styled.div`
  font-size: 11px;
  color: #5e5e5e;
`
const FooterText = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
`

const Footer = () => (
  <InfoSection>
    <FooterText>
      <div>
        2017-{new Date().getFullYear()} All Rights Reserved. SocialMiningAi is a
        registered trademark of SocialMiningAi, Inc.
      </div>
      <div>
        {" "}
        <a href="#">Privacy</a> and <a href="#">Terms</a>{" "}
      </div>
    </FooterText>
  </InfoSection>
)
export default Footer
