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
  DatePicker
} from "antd"
import TextInput from "../../library/textInput"
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

const ReviewReply = styled.div`
  margin-top: 10px;
  border-left: 5px solid #00648d;
  &:hover {
    background-color: #DCDCDC;
  }
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
  // const { data: evalTerms } = useQuery(GET_EVAL_TERMS)

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
            avatar={<Avatar size={48} src={`${"/images/avatar1.png"}`}/>}
            description={
              <div>
                <Info>
                  <Info style={{ flexGrow: 4, flexFlow: "row wrap" }}>
                    <InfoText style={{ flexGrow: 1.8 }}>
                        {/* <SourceIcon
                          src={data.reviewer.profilePhotoUrl || "/images/avatar1.png"}
                          onError={e => {
                            e.target.src = "/images/avatar1.png"
                          }}
                        /> */}
                      <span>{data.reviewer.displayName} </span>
                      {moment(data.createTime).fromNow()}
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

                {data.comment}
                <br/>
                {data.reviewReply && (
                  <ReviewReply>
                    <List.Item.Meta
                      avatar={<Avatar size={40} src={`${"/images/avatar1.png"}`}/>}
                      description={
                        <div>
                          <Info>
                            <Info style={{ flexGrow: 4, flexFlow: "row wrap" }}>
                              <InfoText style={{ flexGrow: 1.8 }}>
                                  {/* <SourceIcon
                                    src={"/images/avatar1.png"}
                                    onError={e => {
                                      e.target.src = "/images/avatar1.png"
                                    }}
                                  /> */}
                                <span>{data.reviewReply.name} </span>
                                {moment(data.reviewReply.createTime).fromNow()}
                              </InfoText>
                            </Info>
                          </Info>
                            <div>
                              {data.reviewReply.comment}
                            </div>
                        </div>
                      }
                      />
                  </ReviewReply>
                )}
                {!data.reviewReply && (
                <BottomInfo>
                  {/* <div> */}
                  <TextInput placeholder="Reply"></TextInput>
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
                </BottomInfo>)}
              </div>
            }
          />
        </ProspectItem>
    </Container>
  )
}

export const ReviewsLayout = () => {
  const Stars = {
    // 'ZERO': -1,
    'STAR_RATING_UNSPECIFIED': 0,
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
  }
  const data = [
    {
    "name": 'Ajay Koli',
    "reviewId": '123123123',
    "reviewer": {
      "profilePhotoUrl": "/images/avatar1.png",
      "displayName": "Ajay Koli",
      "isAnonymous": false
    },
    "starRating": Stars["FIVE"],
    "comment": "I'm working as Software Engineer at Crest Infosystems Pvt. Ltd. and very happy to working with crest. There are lots of opportunities for growth. A best company to work with in surat, Team leaders are wonderful to work with, they has exceptional expertise in leadership, coaching, motivation and very capable. colleague supporting each other, Proper Management - Easily approachable, Well orientated and organized, picnics - outings, work life balance, Good pay structure, half yearly appraisal, 5 day working, after all Work culture is Great.",
    "createTime": "2021-07-13T15:28:51.818095+00:00",
    "updateTime": "",
    "reviewReply": {
      "name": "Owner",
      "comment": "Thank you Ajay! It was great working with you as well.",
      "createTime": "2021-07-13T15:28:51.818095+00:00",
      "updateTime": "",
    }},
    {
      "name": 'jugal desai',
      "reviewId": '123123123',
      "reviewer": {
        "profilePhotoUrl": "/images/avatar1.png",
        "displayName": "jugal desai",
        "isAnonymous": false
      },
      "starRating": Stars["FIVE"],
      "comment": "Best company with very much friendly environment. i have been with this company from almost 4 years. TLs are very supportive and management is always ready to help all the employees.",
      "createTime": "2021-12-22T07:44:35.067970",
      "updateTime": "",
      "reviewReply": {
        "name": "Owner",
        "comment": "Thank you Jugal! really appriciated.",
        "createTime": "2021-12-22T07:44:35.067970",
        "updateTime": "",
      }},
      {
    "name": 'Chintan Soni',
    "reviewId": '123123123',
    "reviewer": {
      "profilePhotoUrl": "/images/avatar1.png",
      "displayName": "Chintan Soni",
      "isAnonymous": false
    },
    "starRating": Stars["FOUR"],
    "comment": "I worked here for almost 2yr, in lots of area it was actually pretty good like salay, environment, activities etc. One thing i stil think they need to work on are on few policies otherwise a very good place to work on",
    "createTime": "2021-07-13T15:28:51.818095+00:00",
    "updateTime": "",
    "reviewReply": {
      "name": "Owner",
      "comment": "Thank you Chintan!",
      "createTime": "2021-07-13T15:28:51.818095+00:00",
      "updateTime": "",
    }},
    {
    "name": 'Nilesh Gire',
    "reviewId": '123123123',
    "reviewer": {
      "profilePhotoUrl": "/images/avatar1.png",
      "displayName": "Nilesh Gire",
      "isAnonymous": false
    },
    "starRating": Stars["FIVE"],
    "comment": "Nice office, well organized and planned for good team collaboration. Good benefits and good work-life balance.",
    "createTime": "2021-07-13T15:28:51.818095+00:00",
    "updateTime": "",
    "reviewReply": null 
    // {
    //   "name": "Owner",
    //   "comment": "Thank you Nilesh! It was great working with you as well.",
    //   "createTime": "A year ago",
    //     "updateTime": "",
    // }
    },
    {
    "name": 'MadAddie Marketing',
    "reviewId": '123123123',
    "reviewer": {
      "profilePhotoUrl": "/images/avatar1.png",
      "displayName": "MadAddie Marketing",
      "isAnonymous": false
    },
    "starRating": Stars["FOUR"],
    "comment": "We have been working with this company to finalize an Adobe Integration and have finished the project with regards.",
    "createTime": "2021-07-13T15:28:51.818095+00:00",
    "updateTime": "",
    "reviewReply": {
      "name": "Owner",
      "comment": "Thank you MadAddie Marketing!",
      "createTime": "2021-07-13T15:28:51.818095+00:00",
      "updateTime": "",
    }},
    {
    "name": 'ROHII DESAI',
    "reviewId": '123123123',
    "reviewer": {
      "profilePhotoUrl": "/images/avatar1.png",
      "displayName": "ROHII DESAI",
      "isAnonymous": false
    },
    "starRating": Stars["THREE"],
    "comment": "One of the reputed top companies in providing IT services satisfactorily. They are providing best work environment for their employees.",
    "createTime": "2021-07-13T15:28:51.818095+00:00",
    "updateTime": "",
    "reviewReply": null
    },
  ]
  
  const [reviewList, setReviewList] = useState({dat: data})
  const [unrepliedOnly, setUnrepliedOnly] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [visible, setVisible] = useState(true)


  
  
  const handlePresetMenuClick = async e => {
    console.log(e)
    console.log(e.key)
    // alert(e.key)
    if (e.key != -1) {
      let dt = data.filter(d => {
        if (d.starRating == e.key){
          return (d)
        }
      })
      console.log(dt)
      setReviewList({dat: dt})
      
    } else {
      
      setReviewList({dat: data})
    }
  }
  
  function onChangeUnrepliedOnly(checked) {
    // alert(checked)
    setUnrepliedOnly(checked)
    // setHideViewed(false)
    // setAllResultsShown(false)
    if (checked) {
      // refetchSavedPosts()
      let dt = data.filter(d => {
        if (d.reviewReply == null){
          return (d)
        }
      })
      // console.log(dt)
      setReviewList({dat: dt})
    } else {
      setReviewList({dat: data})
    }
  }
  
  function onChangeDateFilter(date, dateString) {
    // alert(date)
    // alert(dateString)
    console.log(date, dateString)
    if (dateString) {
      let dt = data.filter(d => {
        try{
          // alert(moment(d.createTime).utc().isAfter(date))
          if (moment(d.createTime).utc().isAfter(date)){
            // moment(data.createTime).isAfter(dateString)
            return (d)
          }
        }
        catch {
          alert('error')
        }
      })
      setReviewList({dat: dt})
    }
    else{
      setReviewList({dat: data})
    }
  }

  useEffect(() => {
    setVisible(!isMobile)
  }, [isMobile])

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

  
  console.log('reviewList---------------')
  console.log(reviewList)
  return (
    <Container id={"prospect-cntr"} scroll>

        

        <Content>
          {!visible && (
            <Tooltip
              placement="topLeft"
              title={visible ? "Hide filters" : "Show filters"}
            >
              <SidebarArrow left onClick={() => setVisible(true)}>
                <Icon type="right" />
              </SidebarArrow>
            </Tooltip>
          )}
          {visible && (
          <ContentSidebar>
            {/* arrow placed here to be relative to the sidebar */}
            <Tooltip
              placement="top"
              title={visible ? "Hide filters" : "Show filters"}
            >
              <SidebarArrow right onClick={() => setVisible(false)}>
                <Icon type="left" />
              </SidebarArrow>
            </Tooltip>
            
            <Fragment key={'groupName'}>
              <RadioGroupCustom
                key={'groupName'}
                buttonStyle="solid"
                value={"All"}
              // onChange={e => handleActiveSelect(e, groupName)}
              >
                    <Tooltip
                      placement="bottom"
                      title={"View all reviews"}
                    >
                      <RadioButtonCustom
                        key={'ALL'}
                        value={-1}
                        // onClick={e => handleActiveSelect(e, groupName)}
                      >
                        All
                      </RadioButtonCustom>
                    </Tooltip>
                  {/* ))} */}
              </RadioGroupCustom>
            </Fragment>

            <FilterTab
              defaultActiveKey="Makes"
              tabPosition="top"
              animated={false}
            >
              
                    <TabPane
                      tab={'Filter by platform'}
                      key={1}
                      style={{ maxHeight: "400px", overflow: "auto" }}
                    >
                      <TabSection>
                        <Checkbox
                          // checked={showActiveOnly[index]}
                          // onChange={() => onChangeShowActiveOnly(index)}
                        >
                          Google
                        </Checkbox><br />
                        <Checkbox>
                          Facebool
                        </Checkbox><br />
                        <Checkbox>
                          Yelp
                        </Checkbox>
                        <br />
                        <Checkbox
                          // checked={selectAll[multiselectsGroup.indexOf(g)]}
                          // onChange={() => onSelectAll(g)}
                        >
                          Select/deselect all
                        </Checkbox>
                      </TabSection>
                      {/* <Divider /> */}
                      {/* <TabSection>
                                  <Fragment key={'1'}>
                                      <>
                                        <Checkbox
                                          checked={false}
                                          // onChange={() =>
                                          //   onChangeMulti(g, item.id)
                                          // }
                                        >
                                          value of item
                                        </Checkbox>
                                        <br />
                                      </>
                                  </Fragment>
                      </TabSection>
                      <br /> */}
                    </TabPane>
            </FilterTab>
            <FilterTab
              defaultActiveKey="Makes"
              tabPosition="top"
              animated={false}
            >
              
                    <TabPane
                      tab={'Filter by date'}
                      key={1}
                      style={{ maxHeight: "400px", overflow: "auto" }}
                    >
                      <TabSection>
                          <DatePicker style={{ minWidth: "100%" }} placeholder="Select date" onChange={onChangeDateFilter} />
                      </TabSection>
                      <br />
                    </TabPane>
            </FilterTab>
            <FilterTab
              defaultActiveKey="Makes"
              tabPosition="top"
              animated={false}
            >
              
                    <TabPane
                      tab={'Filter by Rating'}
                      key={1}
                      style={{ maxHeight: "400px", overflow: "auto" }}
                    >
                      <TabSection>
                        <ButtonGroupCustom size={2}>
                          <Dropdown
                            overlay={presetMenu(
                              [{'id': -1, 'name': 'All'},{'id': 0, 'name': 'Not specified'},{'id': 1, 'name': '1'},{'id': 2, 'name': '2'},{'id': 3, 'name': '3'},{'id': 4, 'name': '4'},{'id': 5, 'name': '5'},],
                              handlePresetMenuClick
                            )}
                          >
                            <ButtonCustom
                              style={{ marginLeft: "-1px" }}
                            >
                              {`Select rating`}
                              <SVGIcon component={StarIcon} alt="Rating" />
                            </ButtonCustom>
                            {/* <Button>
                              {`Filter by Stars`} <Icon type="down" />
                            </Button> */}
                          </Dropdown>
                        </ButtonGroupCustom>
                      </TabSection>
                      <br />
                    </TabPane>
            </FilterTab>

            <br />
            <Button
              type="primary"
              style={{ width: "100%" }}
              // onClick={refreshProspects}
            >
              Refresh Prospects
            </Button>
            
          </ContentSidebar>
          )}
          <ContentBody scroll style={{maxHeight: "80vh", overflowX: "hidden"}}>

              {/* <InfoText style={{ flexGrow: 1.8, minHeight: 24 }}>
                Info text
              </InfoText> */}
              {
                reviewList.dat.map((dat,i) => { 
                  return (<Review data={dat} path="/" />)
                })
              }
          </ContentBody>
        </Content>

        {/* {
          reviewList.dat.map((dat,i) => { 
            return (<Review data={dat} path="/" />)
          })
        } */}
      </Container>
  )
}

