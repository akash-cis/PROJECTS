import React, { useState, useRef, useEffect } from "react"
import {GoogleReviews} from "../../components/reviews/GoogleReviews"
import {FacebookReviews} from "../../components/reviews/FacebookReviews"
import { TabsContainer } from "../../library/basicComponents"
import styled from "styled-components"
import Tabs from "../../library/tabs"
import { Separators } from "../../library/constants"
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

export const ReviewsLayout = ({ id, uri, location }) => {
    let url = `${uri.split("/")[2]}`.replace("/", "")
    let queryString = id ? `${id.split("&")[0]}` : ""
    const tbViewRef = useRef()
    const [defaultTab, setDefaultTab] = useState(
    url != "undefined" ? url : "google"
    )

    const [selectedLead, setLeadDetail] = useState({})
    const [fullScreen, setFullScreen] = useState(false)

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
            <TabWrapper>
            <Tabs.Nav
                name={"google"}
                typography={{ variant: "huge", weight: "weight" }}
            >
                Google
            </Tabs.Nav>
            <Tabs.Nav
                name={"facebook"}
                typography={{ variant: "huge", weight: "weight" }}
            >
                Facebook
            </Tabs.Nav>
            <Tabs.Nav
                name={"others"}
                typography={{ variant: "huge", weight: "weight" }}
            >
                Others
            </Tabs.Nav>
            </TabWrapper>
            <IconRight
            type="right"
            onClick={() => {
                scroll(200)
            }}
            />
        </TabPanelHeader>
        <Tabs.Panel name={"google"}>
            <GoogleReviews location={location} />
        </Tabs.Panel>
        <Tabs.Panel name={"facebook"}>
            <FacebookReviews location={location} />
        </Tabs.Panel>
        <Tabs.Panel name={"others"}>
            <h1>Other Reviews</h1>
        </Tabs.Panel>
        </Tabs.Cntr>
    </TabsContainer>
    )
}