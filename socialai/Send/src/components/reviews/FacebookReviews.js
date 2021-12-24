import React, { Fragment, useState, useRef, useEffect } from "react"
import { useLazyQuery, useQuery } from "@apollo/react-hooks"
import {
  GET_POSTS,
  GET_USER_FILTERS,
  GET_DISPLAY_FILTERS,
  GET_SAVED_POSTS,
  SCREEN_NAME_CHECK,
  GET_EVAL_TERMS,
} from "../../graphql/query"
import { useMutation } from "@apollo/react-hooks"
import {
  SAVE_USER_FILTER_SET,
  SELECT_FILTER_SET,
  UPDATE_USER_FILTERS,
  PROSPECT_ACTION,
  UPDATE_USER_FILTER_SET,
  ADD_SCREEN_NAME,
  SAVE_INITIAL_SENT,
  UPDATE_PREDICTION_REVIEW,
  UPDATE_PREDICTION_REVIEW_RESOLVER,
} from "../../graphql/mutation"
import styled, { css } from "styled-components"
import moment from "moment"
import {
  Divider,
  Button,
  Menu,
  Dropdown,
  Icon,
  Tabs,
  Checkbox,
  List,
  Avatar,
  Modal,
  Progress,
  Empty,
  Spin,
  Typography,
  notification,
  Tooltip,
  message,
  Select,
  Input,
} from "antd"
import TextInput from "../../library/textInput"
import PostAvatar from "../../library/postAvatar"
import {
  Colors,
  ProspectStatus,
  RangeFilters,
  FilterSetTypes,
  TagColors,
} from "../../library/constants"
import {
  ButtonCustom,
  ButtonGroupCustom,
  SwitchCustom,
  RadioButtonCustom,
  RadioGroupCustom,
  InputButtonGroup,
  ActionGroup,
  // Container,
  ContainerNavigation,
  Content,
  ContentSidebar,
  ContentBody,
  SVGIcon,
  Tag,
  TagColored,
  TooltipButton,
  fadeIn,
  FilterTab,
  TabSection,
} from "../../library/basicComponents"
import { parseTimestamp } from "../../library/utils"
import LocationIcon from "../../../static/icons/LocationIcon.svg"
import CalendarIcon from "../../../static/icons/CalendarIcon.svg"
import FilterIcon from "../../../static/icons/FilterIcon2.svg"
import AddItemIcon1 from "../../../static/icons/AddItemIcon1.svg"
import RemoveIcon from "../../../static/icons/RemoveIcon.svg"
import RemoveActive from "../../../static/icons/RemoveActive.svg"
import StarIcon from "../../../static/icons/StarIcon.svg"
import StarIconActive from "../../../static/icons/StarIconActive.svg"
import ChatIcon from "../../../static/icons/ChatIconWhite.svg"
import ScreenNameModel from "../../components/prospect/screenNameModel"
import ResponseIcon from "../../../static/icons/ResponseIcon.svg"
import AirplaneIconWhite from "../../../static/icons/AirplaneIconWhite.svg"
import CloseIconBlue from "../../../static/icons/CloseIconBlue.svg"
import CheckIconBlue from "../../../static/icons/CheckIconBlue.svg"
import AddIcon from "../../../static/icons/AddIcon.svg"

import UserRoleProtected from "../../components/userRoleProtected"
import { getCognitoRoles } from "../../hooks/utils"
import { TestTag } from "../../library/testTag"
import { usePrevious } from "../../components/personalized-ads/hooks"
import { NetworkStatus } from "apollo-boost"
import { Router } from "@reach/router"
import NoPermissionAlert from "../../pages/no-permission"
import FilterBreadcrumbs from "../../components/commons/filterBreadcrumbs"
import { InfoText } from "../../components/commons/infoText"
import ReadMore from "../../components/commons/ReadMore"
import { presetMenu } from "../../library/preset/PresetMenu"
import { EditPresetModal } from "../../library/preset/EditPresetModal"
import { PeriodSelector } from "../../components/life-events/lifeEvents/periodSelector"

import StarRatings from 'react-star-ratings'



// import { parseTimestamp } from "../library/utils"
// import LocationIcon from "../../static/icons/LocationIcon.svg"
// import CalendarIcon from "../../static/icons/CalendarIcon.svg"
// import FilterIcon from "../../static/icons/FilterIcon2.svg"
// import AddItemIcon1 from "../../static/icons/AddItemIcon1.svg"
// import RemoveIcon from "../../static/icons/RemoveIcon.svg"
// import RemoveActive from "../../static/icons/RemoveActive.svg"
// import StarIcon from "../../static/icons/StarIcon.svg"
// import StarIconActive from "../../static/icons/StarIconActive.svg"
// import ChatIcon from "../../static/icons/ChatIconWhite.svg"
// import ScreenNameModel from "../components/prospect/screenNameModel"
// import ResponseIcon from "../../static/icons/ResponseIcon.svg"
// import AirplaneIconWhite from "../../static/icons/AirplaneIconWhite.svg"
// import CloseIconBlue from "../../static/icons/CloseIconBlue.svg"
// import CheckIconBlue from "../../static/icons/CheckIconBlue.svg"
// import AddIcon from "../../static/icons/AddIcon.svg"

// import { PeriodSelector } from "../../components/life-events/lifeEvents/periodSelector"
const { TabPane } = Tabs
const { Paragraph } = Typography
const { confirm } = Modal


const Info = styled.div`
  display: flex;
`

const BottomInfo = styled(Info)`
  margin-top: 8px;
  justify-content: space-between;
  flex-flow: row nowrap;
  @media (max-width: 668px) {
    flex-flow: column nowrap;
  }
`

const ButtonInfo = styled.div`
  display: flex;
  flex-flow: row nowrap;
  @media (max-width: 668px) {
    margin: 8px 0 0 -8px;
  }
`

const SourceText = styled(InfoText)`
  //font-size: 13px;
  flex-grow: 1.8;
  text-align: right;
  font-weight: bold;
  color: ${Colors.darkGray};
  @media (max-width: 968px) {
    text-align: left;
  }
`

const InfoIcon = styled(SVGIcon)`
  height: 1em;
  font-family: Helvetica;
  font-size: 16px;
  color: #5e5e5e;
  letter-spacing: 0;
  line-height: 24px;
  margin: 0 0.5rem;
  vertical-align: text-top;
  @media (max-width: 968px) {
    margin: 0 0.3rem 0.3rem 0;
  }
`

const SourceIcon = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 8px;
  @media (max-width: 968px) {
    width: 22px;
    height: 22px;
    float: left;
    margin: -4px 8px 0 0;
  }
`

const ResponseBody = styled.p`
  text-align: justify;
`

const ResponseTitle = styled.div`
  display: flex;
  font-weight: bold;
`

const LoadingCntr = styled.div`
  margin: 8px auto;
  text-align: center;
`

const savedActive = {
  background: "#FFEDC6",
}

const ResponseTemplateCntr = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: ${Colors.white};
  box-shadow: -4px 6px 4px 0px rgba(0, 0, 0, 0.35);
`

const ResponseTemplateItem = styled.div`
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: ${Colors.lightBrandBlue};
  }
  & > p {
    width: 100%;
    padding: 12px 20px;
    margin: 0 auto;
  }
`

const FilterButtonCntr = styled.div`
  display: flex;
  flex-flow: row wrap;
  @media (max-width: 992px) {
    min-height: 72px;
    align-content: space-between;
  }
`

const ThreadTitle = styled.p`
  font-weight: bold;
  font-size: 14px;
  color: ${Colors.darkGray};
  margin: 0;
`

const ModalReminderCntr = styled.div`
  text-align: left;
  display: flex;
  flex-flow: row nowrap;
  & > p {
    margin: 0;
  }
`

const SwitchContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1em;
`




// 
// 
// 
// 
// 
// 
// 
// 


const ProspectItem = styled(List.Item)`
  animation: 1s ${fadeIn} ease-in;
`

// const Info = styled.div`
//   display: flex;
// `

// const BottomInfo = styled(Info)`
//   margin-top: 8px;
//   justify-content: space-between;
//   flex-flow: row nowrap;
//   @media (max-width: 668px) {
//     flex-flow: column nowrap;
//   }
// `

// const ButtonInfo = styled.div`
//   display: flex;
//   flex-flow: row nowrap;
//   @media (max-width: 668px) {
//     margin: 8px 0 0 -8px;
//   }
// `

// const SourceText = styled(InfoText)`
//   //font-size: 13px;
//   flex-grow: 1.8;
//   text-align: right;
//   font-weight: bold;
//   color: ${Colors.darkGray};
//   @media (max-width: 968px) {
//     text-align: left;
//   }
// `

// const InfoIcon = styled(SVGIcon)`
//   height: 1em;
//   font-family: Helvetica;
//   font-size: 16px;
//   color: #5e5e5e;
//   letter-spacing: 0;
//   line-height: 24px;
//   margin: 0 0.5rem;
//   vertical-align: text-top;
//   @media (max-width: 968px) {
//     margin: 0 0.3rem 0.3rem 0;
//   }
// `
// const SourceIcon = styled.img`
//   width: 50px;
//   height: 50px;
//   border-radius: 50%;
//   vertical-align: middle;
//   margin-right: 8px;
//   @media (max-width: 968px) {
//     width: 22px;
//     height: 22px;
//     float: left;
//     margin: -4px 8px 0 0;
//   }
// `

// const ResponseTemplateCntr = styled.div`
//   width: 100%;
//   max-width: 600px;
//   background-color: ${Colors.white};
//   box-shadow: -4px 6px 4px 0px rgba(0, 0, 0, 0.35);
// `

// const ResponseTemplateItem = styled.div`
//   width: 100%;
//   cursor: pointer;
//   &:hover {
//     background-color: ${Colors.lightBrandBlue};
//   }
//   & > p {
//     width: 100%;
//     padding: 12px 20px;
//     margin: 0 auto;
//   }
// `

// const ThreadTitle = styled.p`
//   font-weight: bold;
//   font-size: 14px;
//   color: ${Colors.darkGray};
//   margin: 0;
// `

const Container = styled.div`
  margin-top: 2em;
  margin-bottom: 2em;
  background-color: #fff;
  border: ${props => (props.border == 0 ? "0" : "1px solid #eeeef1")};
  border-radius: 4px;
  width: 100%;
  ${props => (props.noMargin ? "margin: 0" : null)};

  ${props => props.scroll && "overflow: auto;"};
  font-family: Helvetica;

  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 992px) {
    width: auto;
  }
`

const Review = ({data}) => {
  const left = css`
    left: -0.2rem;
    padding-left: 0.5rem;
  `
  const SidebarArrow = styled.div`
    position: absolute;
    padding: 10px 5px;
    top: 50%;
    ${props => props.right && "right: -0.2rem"};
    ${props => props.left && left};
    background-color: #fff;
    border: 1px solid #eeeef1;
    border-radius: 4px;
    z-index: 1;
    cursor: pointer;
  `

  return (
    <Container id={"prospect-cntr"} scroll>
      <ProspectItem
          style={{ padding: "1.5em" }}
        >
          <List.Item.Meta
            // avatar={<PostAvatar post={item} evalTerms={evalTerms} />}
            description={
              <div>
                <Info>
                  <Info style={{ flexGrow: 4, flexFlow: "row wrap" }}>
                    <InfoText style={{ flexGrow: 1.8 }}>
                        <SourceIcon
                          src={"/images/sources/forum.png"}
                          onError={e => {
                            e.target.src = "/images/sources/forum.png"
                          }}
                        />
                      <span>{data.name} </span>
                      {/* posted {parseTimestamp(item.timestamp)} */}{data.createTime}
                    </InfoText>
                    <SourceText>
                    <StarRatings
                        starRatedColor="gold"
                        rating={data.starRating}
                        starDimension="30px"
                        starSpacing="15px"
                    />
                    </SourceText>
                  </Info>
                </Info>

                {/* <ThreadTitle>
                  thread title
                </ThreadTitle> */}
                I'm working as Software Engineer at Crest Infosystems Pvt. Ltd. and very happy to working with crest. 
                There are lots of opportunities for growth. A best company to work with in surat, Team leaders are wonderful to work with, 
                they has exceptional expertise in leadership, coaching, motivation and very capable. colleague supporting each other, 
                Proper Management - Easily approachable, Well orientated and organized, picnics - outings, work life balance, Good pay structure, 
                half yearly appraisal, 5 day working, after all Work culture is Great.
                <br/>
                <BottomInfo>
                  {/* <div> */}
                      <TextInput placeholder="Reply"></TextInput>
                      {/* <TagColored>
                        tag
                      </TagColored> */}
                  {/* </div> */}
                  <ButtonInfo style={{ marginTop: "12px" }}>
                    <TooltipButton
                      tooltip="Respond"
                      type={"primary"}
                      shape="square"
                      component={ChatIcon}
                      alt="Chat"
                    />
                  </ButtonInfo>
                </BottomInfo>
              </div>
            }
          />
        </ProspectItem>
    </Container>
  )
}

export const FacebookReviews = () => {
  const Stars = {
    'ZERO': 0,
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
  }
  const data = {
    "name": 'Akash Singh',
    "reviewId": '123123123',
    "reviewer": {
        "name": "Akash Singh",
    },
    "starRating": Stars["THREE"],
    "comment": "THIS IS A COMMENT GIVEN BY REVIEWER",
    "createTime": "3 months ago",
    // "updateTime": string,
    // "reviewReply": {
    //   object (ReviewReply)
    // }
  }
  const handlePresetMenuClick = async e => {
    alert('hey')
  }
  return (
      <div>
        <ContainerNavigation>
          <div>
            Starred only{" "}
            <SwitchCustom
            />
                <>
                  Hide Replied posts{" "}
                  <SwitchCustom
                  />
                </>
          </div>
          <FilterButtonCntr>
            <ButtonGroupCustom size={2}>
              <Dropdown
                overlay={presetMenu(
                  [{'id': 1, 'name': '1'},{'id': 2, 'name': '2'},{'id': 3, 'name': '3'},{'id': 4, 'name': '4'},{'id': 5, 'name': '5'},],
                  handlePresetMenuClick
                )}
              >
                <ButtonCustom
                  style={{ marginLeft: "-1px" }}
                >
                  {`Filter by Stars`}
                  <SVGIcon component={StarIcon} alt="Prospects" />
                </ButtonCustom>
                {/* <Button>
                  {`Filter by Stars`} <Icon type="down" />
                </Button> */}
              </Dropdown>
            </ButtonGroupCustom>
            {/* <PeriodSelector
              
            /> */}
          </FilterButtonCntr>
        </ContainerNavigation>

        <Review data={data} path="/" />
        <Review data={data} path="/" />
        <Review data={data} path="/" />
        <Review data={data} path="/" />
      </div>
  )
}

