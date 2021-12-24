import React, { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { useMutation } from "@apollo/react-hooks"
import { CREATE_COMPANY, UPDATE_COMPANY } from "../../graphql/mutation"
import CompanyForm from "./companyForm"
import Users from "./users"
import Panel from "../../library/panel"
import CompanyNav from "./companyNav"
import UserFilters from "./userFilters"
import CompanyFilters from "./companyFilters"
import ResponseTemplates from "./resonseTemplates"
import CrmIntegration from "./crmIntegration"
import EngagementMessageTemplates from "./enagementMessageTemplate"
import Roles from "./roles"
import WorkHours from "../settings/workHours"
import NudgeSettings from "./nudgeSettings"

import { Button, Row, Col } from "antd"
import PanelHeader from "../../library/panelHeader"
import PhoneBots from "./phoneBots"
const Cntr = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  margin-top: 28px;
`

const FlexItem = styled.div`
  flex-grow: 10;
`
const SaveButton = styled(Button)`
  margin-left: 14px;
`

const Company = ({ company, setCompany, refreshCompanies }) => {
  const [activeTab, setActiveTab] = useState("Company details")
  const [newCoSetup, setNewCoSetup] = useState(false)

  const [
    createCompany,
    { data: companyData, loading: companyLoading },
  ] = useMutation(CREATE_COMPANY, {
    onCompleted: res => {
      setCompany(res.createCompany.company)
      refreshCompanies()
      //setActiveTab("Company filters")
      setActiveTab("Working Hours")
    },
  })

  const [updateCompany, response] = useMutation(UPDATE_COMPANY, {
    onCompleted: res => {
      if (res.updateCompany.ok) {
        setCompany(res.updateCompany.company)
      }
    },
  })

  useEffect(() => {
    if (company === "new") {
      setNewCoSetup(true)
    }
  }, [])

  const TabReducer = ({ activeTab, ...props }) => {
    switch (activeTab) {
      case "Company details":
        return (
          <CompanyForm
            createCompany={createCompany}
            updateCompany={updateCompany}
            company={company}
            loading={companyLoading}
            {...props}
          />
        )
      case "Subscription plan":
        return <h1>Coming Soon...</h1>
      case "Company filters":
        return <CompanyFilters {...props} />
      case "Roles":
        return <Roles {...props} />
      case "Users":
        return <Users {...props} />
      case "User filters":
        return <UserFilters {...props} />
      case "Response templates":
        return <ResponseTemplates {...props} />
      case "CRM Integration":
        return <CrmIntegration {...props} />
      case "Engagement Templates":
        return <EngagementMessageTemplates {...props} showTitle={true} />
      case "Working Hours":
        return <CompanyWorkHours {...props} company={company} />
      case "Manage Phone Bots":
        return <PhoneBots {...props} />
      case "Manage Nudge Settings":
        return <NudgeSettings {...props} />
    }
  }

  return (
    <Cntr>
      <CompanyNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        newCoSetup={newCoSetup}
        companyName={company.name}
      />
      <FlexItem>
        <Panel width={"100%"}>
          <TabReducer
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            company={company}
            setCompany={setCompany}
            newCoSetup={newCoSetup}
          />
        </Panel>
      </FlexItem>
    </Cntr>
  )
}

export default Company

const CompanyWorkHours = ({
  setCompany,
  newCoSetup,
  setActiveTab,
  company,
}) => {
  const workHoursRef = useRef(null)
  return (
    <React.Fragment>
      <PanelHeader title={"Working Hours"}>
        {!newCoSetup ? (
          <React.Fragment>
            <Button onClick={() => setCompany(null)}>Close</Button>
            <SaveButton
              type={"primary"}
              onClick={() => workHoursRef.current.saveWorkHours()}
            >
              Save
            </SaveButton>
          </React.Fragment>
        ) : (
          <SaveButton
            type={"primary"}
            onClick={() => workHoursRef.current.saveWorkHours()}
          >
            Save & Continue
          </SaveButton>
        )}
      </PanelHeader>

      <Row>
        <Col span={24}>
          <WorkHours
            showTitle={false}
            isCompanyAdmin={true}
            ref={workHoursRef}
            setActiveTab={setActiveTab}
            newCoSetup={newCoSetup}
            isEdit={true}
            company={company}
          />
        </Col>
      </Row>
    </React.Fragment>
  )
}
