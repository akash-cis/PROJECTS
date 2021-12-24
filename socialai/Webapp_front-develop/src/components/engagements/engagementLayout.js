import React, { useState, useRef, useEffect } from "react"
import { TabsContainer } from "../../library/basicComponents"
import { ScheduleProvider } from "../../library/scheduleProvider"
import styled from "styled-components"
import DashboarView from "./dashboard"
import LeadListView from "./leadList"
import LeadDetailsView from "./leadDetails"
import EngagementActivityView from "./engagementActivity"
import ScheduleView from "./schedule"
import AppointmentView from "./appointment"
import CompaignView from "./campaigns"
import Tabs from "../../library/tabs"
import { Separators } from "../../library/constants"
import isUndefiend from "lodash/isUndefined"
import EngagementTemplateView from "./engagementTemplateView"
import { Icon } from "antd"
const TabPanelHeader = styled.div`
  border-bottom: ${Separators("thin", "lightGray")};
  padding: 0 24px 0 24px;
  /*margin: 0 -24px 0 -24px;*/
  display: ${props => (props.display ? props.display : "flex")};
  flex-flow: row nowrap;
  justify-content: space-between;
  @media only screen and (max-width: 1024px) {
    padding: 0px;
  }
`
const TabWrapper = styled.div`
  div {
    font-size: 20px !important;
  }
  @media only screen and (max-width: 1024px) {
    display: flex;
    width: 870px;
    overflow: auto;
    ::-webkit-scrollbar {
      width: 0;
    }

    ::-webkit-scrollbar-track {
      box-shadow: none;
    }

    ::-webkit-scrollbar-thumb {
      background-color: transparent;
      outline: none;
    }
    .tabs__TabStyled-gnlphe {
      display: inline-flex !important;
      flex: 1 0 auto !important;
    }
    div {
      font-size: 16px !important;
    }
  }
`

const IconLeft = styled(Icon)`
  display: none;
  margin-top: 15px;
  padding-right: 10px;
  @media only screen and (max-width: 1024px) {
    display: inline-flex;
  }
`
const IconRight = styled(Icon)`
  display: none;
  margin-top: 15px;
  padding-left: 10px;
  @media only screen and (max-width: 1024px) {
    display: inline-flex;
  }
`

export const EngagementLayout = ({ id, uri, location }) => {
  let url = `${uri.split("/")[2]}`.replace("/", "")
  let queryString = id ? `${id.split("&")[0]}` : ""
  const compaignViewRef = useRef()
  const tbViewRef = useRef()
  const [defaultTab, setDefaultTab] = useState(
    url != "undefined" ? url : "dashboard"
  )

  const [selectedLead, setLeadDetail] = useState({})
  const [showDetails, setShowDetail] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [leads, setLeads] = useState([])

  const scroll = scrollOffset => {
    let offset = tbViewRef.current.scrollLeft + scrollOffset
    tbViewRef.current.scroll({ top: 0, left: offset, behavior: "smooth" })
  }
  //console.log(`defaultTab`, defaultTab)
  return (
    <TabsContainer fullScreen>
      <Tabs.Cntr defaultTab={defaultTab}>
        <TabPanelHeader
          className={"pb-0"}
          display={fullScreen ? "none" : "flex"}
        >
          <IconLeft
            type="left"
            onClick={() => {
              scroll(-200)
            }}
          />
          <TabWrapper ref={tbViewRef}>
            <Tabs.Nav
              name={"dashboard"}
              typography={{ variant: "huge", weight: "weight" }}
              onClick={() => {
                setLeadDetail({})
                setLeads([])
              }}
            >
              Dashboard
            </Tabs.Nav>
            <Tabs.Nav
              name={"lead-center"}
              typography={{ variant: "huge", weight: "weight" }}
              onClick={() => {
                setLeadDetail({})
                setLeads([])
                setShowDetail(false)
              }}
            >
              Lead Center
            </Tabs.Nav>

            <Tabs.Nav
              name={"activity-center"}
              typography={{ variant: "huge", weight: "weight" }}
              onClick={() => {
                setLeadDetail({})
                setLeads([])
              }}
            >
              Activity Center
            </Tabs.Nav>
            <Tabs.Nav
              name={"campaigns"}
              typography={{ variant: "huge", weight: "weight" }}
              onClick={() => {
                if (
                  !isUndefiend(compaignViewRef) &&
                  !isUndefiend(compaignViewRef.current) &&
                  compaignViewRef.current != null
                ) {
                  compaignViewRef.current.setBack()
                }
              }}
            >
              Campaigns
            </Tabs.Nav>
            <Tabs.Nav
              name={"schedule"}
              typography={{ variant: "huge", weight: "weight" }}
              onClick={() => {
                setLeadDetail({})
                setLeads([])
              }}
            >
              Schedule
            </Tabs.Nav>
            <Tabs.Nav
              name={"appointment"}
              typography={{ variant: "huge", weight: "weight" }}
            >
              Appointments
            </Tabs.Nav>
            <Tabs.Nav
              name={"templates"}
              typography={{ variant: "huge", weight: "weight" }}
            >
              Templates
            </Tabs.Nav>
          </TabWrapper>
          <IconRight
            type="right"
            onClick={() => {
              scroll(200)
            }}
          />
        </TabPanelHeader>
        <Tabs.Panel name={"dashboard"}>
          <DashboarView />
        </Tabs.Panel>
        <Tabs.Panel name={"lead-center"}>
          {showDetails ? (
            <LeadDetailsView
              id={selectedLead?.id || 0}
              onClick={e => {
                setLeadDetail({})
                setShowDetail(false)
              }}
            />
          ) : (
            <LeadListView
              onClick={e => {
                if (e.tab === "campaigns") {
                  setLeads(e?.data || [])
                } else {
                  setLeadDetail(e?.data || {})
                  setShowDetail(e?.tab === "lead-center")
                }
              }}
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel name={"activity-center"}>
          <EngagementActivityView
            queryString={queryString}
            lead={selectedLead}
            onBackClick={e => {
              setLeadDetail({})
              setShowDetail(false)
            }}
            onEditClick={e => {
              setLeadDetail({ ...e })
              setShowDetail(true)
            }}
            onFullScreen={e => setFullScreen(e)}
          />
        </Tabs.Panel>
        <Tabs.Panel name={"campaigns"}>
          <CompaignView ref={compaignViewRef} leadData={leads} />
        </Tabs.Panel>
        <Tabs.Panel name={"schedule"}>
          <ScheduleProvider>
            <ScheduleView />
          </ScheduleProvider>
        </Tabs.Panel>
        <Tabs.Panel name={"appointment"}>
          <AppointmentView
            lead={selectedLead}
            onClick={e => {
              setLeadDetail(e.data)
              setShowDetail(true)
            }}
          />
        </Tabs.Panel>
        <Tabs.Panel name={"templates"}>
          <EngagementTemplateView />
        </Tabs.Panel>
      </Tabs.Cntr>
    </TabsContainer>
  )
}
