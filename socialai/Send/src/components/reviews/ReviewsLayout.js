import React, { Fragment, useState, useRef, useEffect } from "react"
import { SocialIcon } from 'react-social-icons';
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
    Slider,
    Select,
    Input,
    DatePicker
} from "antd"
const { RangePicker } = DatePicker
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

import FacebooksIcon from "../../../static/icons/FacebooksIcon.svg"
import GoogleIcon from "../../../static/icons/GoogleIcon.svg"
import YelpIcon from "../../../static/icons/YelpIcon.svg"

import StarRatings from 'react-star-ratings'




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

const rating = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
}

const Review = ({ data }) => {
    // const { data: evalTerms } = useQuery(GET_EVAL_TERMS)



    return (
        <Container id={"prospect-cntr"} scroll>
            <ProspectItem
                style={{ padding: "1.5em" }}
            >
                <List.Item.Meta
                    avatar={<Avatar size={48} src={`${"/images/avatar1.png"}`} />}
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
                                        <span><SVGIcon component={data.platform === 'google' ? GoogleIcon : data.platform === 'facebook' ? FacebooksIcon : YelpIcon} style={{ height: '20px', width: '20px', marginRight: '0.2rem' }} alt="Rating" /> {data.reviewer.displayName} </span>
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
                            <br />
                            {data.reviewReply && (
                                <ReviewReply>
                                    <List.Item.Meta
                                        avatar={<Avatar size={40} src={`${"/images/avatar1.png"}`} />}
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
                                            // shape="square"
                                            component={ChatIcon}
                                            alt="Chat"
                                            onClick={() => {
                                                message.success("Your reply was submitted successfully.")
                                            }}
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

    const [reviewListAll, setReviewListAll] = useState({ dat: null })
    const [reviewList, setReviewList] = useState({ dat: null })
    const [radioFilter, setRadioFilter] = useState("All")
    const [radioDateFilter, setRadioDateFilter] = useState(null)
    const [visible, setVisible] = useState(true)
    const [sliderValue, setSliderValue] = useState([0, 5])
    const [rangeDateFilter, setRangeDateFilter] = useState(null)
    const [ratingList, setratingList] = useState([{ 'id': -1, 'name': 'Clear' }, { 'id': 1, 'name': '1' }, { 'id': 2, 'name': '2' }, { 'id': 3, 'name': '3' }, { 'id': 4, 'name': '4' }, { 'id': 5, 'name': '5' },])
    const [allChecked, setAllChecked] = useState(true)
    const [platformList, setPlatformList] = useState([{ id: 1, name: 'google', checked: true, icon: GoogleIcon }, { id: 2, name: 'facebook', checked: true, icon: FacebooksIcon }, { id: 3, name: 'yelp', checked: true, icon: YelpIcon }])
    const [userCurrentFilters, setUserCurrentFilters] = useState([])
    const [refreshingPosts, setRefreshingPosts] = useState(false)

    // not in use
    const [activeSelect, setActiveSelect] = useState(null)
    const [unrepliedOnly, setUnrepliedOnly] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [dateFilter, setDateFilter] = useState(null)
    const [minRating, setMinRating] = useState(-1)
    const [maxRating, setMaxRating] = useState(-1)
    const [minRatingList, setMinRatingList] = useState([{ 'id': -1, 'name': 'Clear' }, { 'id': 1, 'name': '1' }, { 'id': 2, 'name': '2' }, { 'id': 3, 'name': '3' }, { 'id': 4, 'name': '4' }, { 'id': 5, 'name': '5' },])
    const [maxRatingList, setMaxRatingList] = useState([{ 'id': -1, 'name': 'Clear' }, { 'id': 1, 'name': '1' }, { 'id': 2, 'name': '2' }, { 'id': 3, 'name': '3' }, { 'id': 4, 'name': '4' }, { 'id': 5, 'name': '5' },])
    const [allSelected, setAllSelected] = useState([{ "id": 1, "isChecked": false }, { "id": 2, "isChecked": false }, { "id": 3, "isChecked": false },])
    const [fetchData, setFetchData] = useState(false)




    const getData = async () => {
        setRefreshingPosts(true)
        let data = await fetch('data.json'
            , {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        )
        // .then(function (response) {
        //     console.log(response)
        //     return response.json();
        // })
        // .then(function (myJson) {
        //     console.log("myJson----------------------------------------------------------------------------");
        //     console.log(myJson);
        //     setReviewList({ dat: myJson })
        //     return myJson;
        // });
        let d = await data.json();
        setReviewListAll({ dat: d })
        setReviewList({ dat: d })
        setRefreshingPosts(false)
        setUserCurrentFilters([{ id: 1, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "google" }, { id: 2, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "facebook" }, { id: 3, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "yelp" }, ])
    }


    const getGoogleReviews = (checked) => {
        if (checked) {

            let dt = reviewList.dat.filter(d => {
                if (d.platform == "google") {
                    return (d)
                }
            })
            setReviewList({ dat: dt })
        } else {
            let dt = reviewList.dat.filter(d => {
                if (d.platform != "google") {
                    return (d)
                }
            })
            // console.log(dt)
            setReviewList({ dat: dt })

        }
    }

    const handlePresetMenuClick = async e => {
        if (e.key != -1) {
            let dt = reviewList.dat.filter(d => {
                if (d.starRating == e.key) {
                    return (d)
                }
            })
            setReviewList({ dat: dt })

        } else {

            setReviewList({ dat: data })
        }
    }

    const handlePresetDateFilterClick = async e => {
        if (e.key != -1) {
            let dt = reviewList.dat.filter(d => {
                if (d.starRating == e.key) {
                    return (d)
                }
            })
            setReviewList({ dat: dt })

        } else {

            setReviewList({ dat: data })
        }
    }

    const handlePresetMinMenuClick = async e => {
        if (e.key != -2) {
            setMinRating(e.key)
            setMaxRatingList(ratingList.filter(rating => {
                if (rating.id >= e.key) {
                    return rating
                }
            }))
        }
        if (e.key != -1) {
            getData()
            let dt = reviewList.dat.filter(d => {
                if (d.starRating >= e.key) {
                    return (d)
                }
            })
            setReviewList({ dat: dt })

        } else {
            getData()
        }
    }

    const handlePresetMaxMenuClick = async e => {
        if (e.key != -2) {
            setMaxRating(e.key)
            setMinRatingList(ratingList?.filter(rating => {
                if (rating.id <= e.key) {
                    return rating
                }
            }))
        }
        if (e.key != -1) {
            getData()
            let dt = reviewList?.dat?.filter(d => {
                if (d.starRating <= e.key) {
                    return (d)
                }
            })
            setReviewList({ dat: dt })

        } else {
            getData()
        }
    }
    
    function onChangeDateFilter(date, dateString) {
        if (!date) {

            setDateFilter(null)
        }
        else {
            setDateFilter(moment(date))
        }
        if (dateString) {
            let dt = reviewList.dat.filter(d => {
                try {
                    if (moment(d.createTime).utc().isAfter(date)) {
                        return (d)
                    }
                }
                catch {
                    alert('error')
                }
            })
            setReviewList({ dat: dt })
        }
        else {
            getData()
        }
    }

    // Filter by Response
    function onChangeUnrepliedOnly(e, checked, groupName) {
        setRefreshingPosts(true)
        setUnrepliedOnly(checked)
        setRadioFilter(groupName)
        if (checked) {
            let dt = []
            if (groupName == 'Unreplied') {
                dt = reviewListAll.dat.filter(d => {
                    if (d.reviewReply == null) {
                        return (d)
                    }
                })
                    const newUserCurrentFilters = userCurrentFilters.filter(c => !( c.type === "Replies" && c.typeName === "Replies"))
                    newUserCurrentFilters.push({ id: userCurrentFilters.length + 1, setType: "GENERAL", type: "Replies", typeName: "Replies", value: "Unreplied" })
                    setUserCurrentFilters(newUserCurrentFilters)
            } else {
                dt = reviewListAll.dat.filter(d => {
                    if (d.reviewReply != null) {
                        return (d)
                    }
                })
                    const newUserCurrentFilters = userCurrentFilters.filter(c => !( c.type === "Replies" && c.typeName === "Replies"))
                    newUserCurrentFilters.push({ id: userCurrentFilters.length + 1, setType: "GENERAL", type: "Replies", typeName: "Replies", value: "Replied" })
                    setUserCurrentFilters(newUserCurrentFilters)
            }
            setReviewList({ dat: dt })
        } else {
            setReviewList(reviewListAll)
            const newUserCurrentFilters = userCurrentFilters.filter(
                c => {
                    if( c.type !== "Replies" && c.typeName !== "Replies"){
                        return c
                    }
                }
            )
            setUserCurrentFilters(newUserCurrentFilters)
        }
        setRadioFilter(groupName)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }
    
    // Filter by Platform
    function onSelectAll() {
        setRefreshingPosts(true)
        let platlist = []
        if (allChecked) {
            setAllChecked(false)
            platlist = platformList.map(p => {
                p.checked = false
                return p
            })
            setReviewList({ dat: null })
        } else {
            setAllChecked(true)
            platlist = platformList.map(p => {
                p.checked = true
                return p
            })
            setReviewList(reviewListAll)
        }
        setPlatformList(platlist)

        console.log("cf1:",userCurrentFilters)
        const newUserCurrentFilters = userCurrentFilters.filter(
            c => !( c.type === "Platforms" && c.typeName === "Platforms")
        )
        console.log("cf2:",newUserCurrentFilters)
        
        console.log("platformList:",platformList)
        platformList.filter(p => {
            console.log("p",p)
            if (p.checked){
                newUserCurrentFilters.push({ id: newUserCurrentFilters.length + 1, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: p.name })
            }
        })
        console.log("cf3:",newUserCurrentFilters)

        setUserCurrentFilters(newUserCurrentFilters)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }

    function onPlatformCheckSelect(platform) {
        setRefreshingPosts(true)

        let selectall = true
        let platlist = platformList.map(p => {
            if (p.name == platform.name) {
                p.checked = !platform.checked
                if (p.checked) {
                    let dt = reviewListAll?.dat?.filter(d => {
                        if (d.platform == platform.name) {
                            return (d)
                        }
                    })
                    let newdata = dt?.concat(reviewList?.dat)
                    setReviewList({ dat: newdata })
                }
                else {
                    let dt = reviewList?.dat?.filter(d => {
                        if (d.platform != platform.name) {
                            return (d)
                        }
                    })
                    setReviewList({ dat: dt })
                }
            }
            if (!p.checked) {
                selectall = false
            }
            return p
        })
        setAllChecked(selectall)
        setPlatformList(platlist)

        // 
        // console.log("cf1:",userCurrentFilters)
        const newUserCurrentFilters = userCurrentFilters.filter(
            c => !( c.type === "Platforms" && c.typeName === "Platforms")
        )
        // console.log("cf2:",newUserCurrentFilters)
        // console.log("platformList:",platformList)
        
        platformList.filter(p => {
            // console.log("p",p)
            if (p.checked){
                newUserCurrentFilters.push({ id: newUserCurrentFilters.length + 1, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: p.name })
            }
        })
        // console.log("cf3:",newUserCurrentFilters)
        // setUserCurrentFilters([])
        setUserCurrentFilters(newUserCurrentFilters)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }

    // Filter by date range
    const returnMomentDateRange = (start, finish) => {
        return [moment(start, "YYYY-MM-DD"), moment(finish, "YYYY-MM-DD")];
    };

    function onChangeRangePickerFilter(date, dateString) {
        const newUserCurrentFilters = []
        setRefreshingPosts(true)
        if (!date[0] && !date[1]) {
            setRangeDateFilter(null)
        }
        else {
            setRangeDateFilter(returnMomentDateRange(date[0], date[1]));
        }
        if (dateString[0]) {
            let dt = reviewListAll.dat.filter(d => {
                try {
                    if (moment(d.createTime).utc().isAfter(date[0]) && moment(d.createTime).utc().isBefore(date[1])) {
                        return (d)
                    }
                }
                catch {
                    alert('error')
                }
            })
            const newUserCurrentFilters = userCurrentFilters.filter(
                c => !( c.type === "Date" && c.typeName === "Date Range")
            )
            newUserCurrentFilters.push({ id: newUserCurrentFilters.length + 1, setType: "GENERAL", type: "Date", typeName: "Date Range", value: `${dateString[0]} - ${dateString[1]}` })
            setUserCurrentFilters(newUserCurrentFilters)
            setReviewList({ dat: dt })
            }
        else {
            const newUserCurrentFilters = userCurrentFilters.filter(
                c => !( c.type === "Date" && c.typeName === "Date Range")
            )
            setUserCurrentFilters(newUserCurrentFilters)
            setReviewList(reviewListAll)
        }

        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }
    
    function onChangeRadioDate(e, filter, groupName) {
        setRefreshingPosts(true)
        let date = null
        setRadioDateFilter(groupName)

        if (filter === 'days') {
            date = moment().subtract(7, filter);
        } else {
            date = moment().subtract(1, filter);
        }
        let dt = reviewListAll.dat.filter(d => {
            try {
                if (moment(d.createTime).utc().isAfter(date)) {
                    return (d)
                }
            }
            catch {
                alert('error')
            }
        })
        const newUserCurrentFilters = userCurrentFilters.filter(
            c => !( c.type === "Date" && c.typeName === "Date Timeline")
        )
        newUserCurrentFilters.push({ id: newUserCurrentFilters.length + 1, setType: "GENERAL", type: "Date", typeName: "Date Timeline", value: `a ${groupName}` })
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList({ dat: dt })
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }

    function onClearRadioDate() {
        setRefreshingPosts(true)
        const newUserCurrentFilters = userCurrentFilters.filter(
            c => !( c.type === "Date" && c.typeName === "Date Timeline")
        )
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList(reviewListAll)
        setRadioDateFilter(null)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }
    
    // Filter by Rating
    function onSliderChange(value) {
        setRefreshingPosts(true)
        let dt = reviewListAll?.dat?.filter(d => {
            if (d.starRating >= value[0] && d.starRating <= value[1]) {
                return (d)
            }
        })
        let val = value[0]==value[1]?value[0]:`${value[0]} to ${value[1]}` 
        const newUserCurrentFilters = userCurrentFilters.filter(
            c => !( c.type === "Review" && c.typeName === "Review")
        )
        newUserCurrentFilters.push({ id: newUserCurrentFilters.length + 1, setType: "GENERAL", type: "Review", typeName: "Review", value: `${val} star` })
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList({ dat: dt })
        setSliderValue(value)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300);
    }

    // Clear Filters
    function onClearFilters() {
        setRadioFilter("All")
        setPlatformList([{ id: 1, name: 'google', checked: true, icon: GoogleIcon }, { id: 2, name: 'facebook', checked: true, icon: FacebooksIcon }, { id: 3, name: 'yelp', checked: true, icon: YelpIcon }])
        setRangeDateFilter(null)
        setRadioDateFilter(null)
        setSliderValue([0, 5])
        setReviewList(reviewListAll)
        // setUserCurrentFilters([])
        setUserCurrentFilters([{ id: 1, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "google" }, { id: 2, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "facebook" }, { id: 3, setType: "GENERAL", type: "Platforms", typeName: "Platforms", value: "yelp" }, ])
        // setFetchData(true)
    }

    // Refresh Reviews after change in filter tags
    function refreshReviews() {
        setRefreshingPosts(true)
        setRadioFilter(radioFilter)
        setReviewList(reviewList)
        setPlatformList(platformList)
        setRangeDateFilter(radioDateFilter)
        setSliderValue(sliderValue)
        setTimeout(() => {
            setRefreshingPosts(false)
        }, 300)
    }



    //
    // Filter Breadcrumb function
    //

    const removeFilterText = id => {
        setUserCurrentFilters(userCurrentFilters.filter(f => f.id !== id))
    }

    const removeResponse = filter => {
        let dt = []
        if (filter.value === "Unreplied"){
            dt = reviewListAll.dat.filter(d => {
                if (d.reviewReply != null) {
                    return (d)
                }
            })
        }else if (filter.value === "Replied"){
            dt = reviewListAll.dat.filter(d => {
                if (d.reviewReply == null) {
                    return (d)
                }
            })
        }else {
            
        }
        setRadioFilter("All")
        
        
        const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
            !(
                c.type === filter.type &&
                    c.typeName === filter.typeName &&
                    c.value === filter.value
                )
        )
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList({dat: dt})
    }

    const removePlatform = filter => {
        console.log("filter", filter)
        let filterSubgroup = platformList
        filterSubgroup = filterSubgroup.map(f => {
            if (filter.value === f.name) {
                console.log("filter.value, f.value")
                console.log(filter.value, f.name)
                f.checked = false
                let dt = reviewList?.dat?.filter(d => {
                    if (d.platform !== f.name) {
                        return (d)
                    }
                })
                setReviewList({ dat: dt })
            }
            return f
        })

        let selection = filterSubgroup.filter(f => f.checked)
        setAllChecked(selection.length?true:false)


        const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
                !(
                    c.type === filter.type &&
                    c.typeName === filter.typeName &&
                    c.value === filter.value
                )
        )
        console.log("newUserCurrentFilters", newUserCurrentFilters)
        console.log("newPlatformList", filterSubgroup)
        setPlatformList(filterSubgroup)
        setUserCurrentFilters(newUserCurrentFilters)
    }

    const removeDate = filter => {
        
        const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
            !(
                c.type === filter.type &&
                c.typeName === filter.typeName &&
                c.value === filter.value
            )
        )
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList(reviewListAll)
        setRangeDateFilter(null)        
    }

    const removeDateTimeline = filter => {
        
        const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
            !(
                c.type === filter.type &&
                c.typeName === filter.typeName &&
                c.value === filter.value
            )
        )
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList(reviewListAll)
        setRadioDateFilter(null)
    }

    const removeReviewRating = filter => {
        
        const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
            !(
                c.type === filter.type &&
                c.typeName === filter.typeName &&
                c.value === filter.value
            )
        )
        setUserCurrentFilters(newUserCurrentFilters)
        setReviewList(reviewListAll)
        setSliderValue([0,5])
    }

    useEffect(() => {
        console.log("DATAAAAAAA!")
        setTimeout(() => {
            getData()
        }, 3000)
        setFetchData(false)
    }, [fetchData])


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
                                value={radioFilter ? radioFilter : "All"}
                            // onChange={e => onChangeUnrepliedOnly(e, false)}
                            >
                                <Tooltip
                                    placement="bottom"
                                    title={"View all reviews"}
                                    type={'primary'}
                                >
                                    <RadioButtonCustom
                                        key={'All'}
                                        value={"All"}
                                        onClick={e => { onChangeUnrepliedOnly(e, false, "All") }}
                                    // onClick={e => handleActiveSelect(e, groupName)}
                                    >
                                        All
                                    </RadioButtonCustom>
                                </Tooltip>
                                <Tooltip
                                    placement="bottom"
                                    title={"Replied"}
                                >
                                    <RadioButtonCustom
                                        key={'Replied'}
                                        value={"Replied"}
                                        onClick={e => { onChangeUnrepliedOnly(e, true, "Replied") }}
                                    >
                                        Replied
                                    </RadioButtonCustom>
                                </Tooltip>
                                <Tooltip
                                    placement="bottom"
                                    title={"Unreplied"}
                                >
                                    <RadioButtonCustom
                                        key={'Unreplied'}
                                        value={"Unreplied"}
                                        onClick={e => { onChangeUnrepliedOnly(e, true, "Unreplied") }}
                                    >
                                        Unreplied
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
                                    <Checkbox checked={allChecked} onChange={onSelectAll} style={{ marginBottom: '0.2rem', marginLeft: '1px' }}>
                                        Select/DeselectALL
                                        <br />
                                    </Checkbox>
                                    {platformList && (
                                        platformList.map(platform => {
                                            return <Fragment key={platform.id}>
                                                <Checkbox checked={platform.checked} onChange={() => onPlatformCheckSelect(platform)} style={{ marginBottom: '0.2rem', marginLeft: '1px', width: '166px' }}>
                                                    <SVGIcon component={platform.name === 'google' ? GoogleIcon : platform.name === 'facebook' ? FacebooksIcon : YelpIcon} style={{ height: '20px', width: '20px', marginRight: '0.2rem' }} alt="Rating" />
                                                    {platform.name}
                                                    <br />
                                                </Checkbox>
                                            </Fragment>
                                        })
                                    )}
                                </TabSection>
                                {/* <Divider /> */}
                            </TabPane>
                        </FilterTab>
                        <FilterTab
                            defaultActiveKey="Makes"
                            tabPosition="top"
                            animated={false}
                        >

                            <TabPane
                                tab={'Filter by date range'}
                                key={2}
                                style={{ maxHeight: "400px", overflow: "auto" }}
                            >
                                <TabSection style={{ padding: "0 10px" }}>
                                    {/* <DatePicker style={{ minWidth: "100%" }} placeholder="Select date" value={dateFilter} onChange={onChangeDateFilter} /> */}
                                    <RangePicker onChange={onChangeRangePickerFilter} value={rangeDateFilter} />
                                </TabSection>
                                <Divider />


                                <RadioGroupCustom style={{ padding: "0 10px" }}
                                    key={'radioDateFilter'}
                                    buttonStyle="solid"
                                    value={radioDateFilter}
                                >
                                    <Tooltip
                                        placement="bottom"
                                        title={"Week"}
                                        type={'primary'}
                                    >
                                        <RadioButtonCustom
                                            key={'Week'}
                                            value={"Week"}
                                            onClick={e => { onChangeRadioDate(e, 'days', "Week") }}
                                        >
                                            Week
                                        </RadioButtonCustom>
                                    </Tooltip>
                                    <Tooltip
                                        placement="bottom"
                                        title={"Month"}
                                    >
                                        <RadioButtonCustom
                                            key={'Month'}
                                            value={"Month"}
                                            onClick={e => { onChangeRadioDate(e, 'months', "Month") }}
                                        >
                                            Month
                                        </RadioButtonCustom>
                                    </Tooltip>
                                    <Tooltip
                                        placement="bottom"
                                        title={"Year"}
                                    >
                                        <RadioButtonCustom
                                            key={'Year'}
                                            value={"Year"}
                                            onClick={e => { onChangeRadioDate(e, 'years', "Year") }}
                                        >
                                            Year
                                        </RadioButtonCustom>
                                    </Tooltip>
                                    {radioDateFilter != null && (
                                        <TooltipButton
                                            tooltip="Remove"
                                            shape="circle"
                                            onClick={onClearRadioDate}
                                            alt="Remove"
                                            component={RemoveIcon}

                                        />
                                    )}
                                </RadioGroupCustom>
                            </TabPane>
                        </FilterTab>
                        <FilterTab
                            defaultActiveKey="Makes"
                            tabPosition="top"
                            animated={false}
                        >

                            <TabPane
                                tab={'Filter by Rating'}
                                key={3}
                                style={{ maxHeight: "400px", overflow: "auto" }}
                            >
                                <TabSection>
                                    {/* <ButtonGroupCustom size={2}>
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
                                        </Dropdown>
                                    </ButtonGroupCustom> */}
                                    {/* <ButtonGroupCustom size={2} style={{ display: "flex", justifyContent: "center" }}>
                                        <ContainerNavigation >

                                            <Dropdown
                                                overlay={presetMenu(
                                                    minRatingList,
                                                    handlePresetMinMenuClick
                                                )}
                                            >
                                                <ButtonCustom
                                                >
                                                    {minRating == -1 ? `Min` : minRating}
                                                    <Icon type="down" />
                                                </ButtonCustom>
                                            </Dropdown>
                                            <Dropdown
                                                overlay={presetMenu(
                                                    maxRatingList,
                                                    handlePresetMaxMenuClick
                                                )}
                                            >
                                                <ButtonCustom
                                                >
                                                    {maxRating == -1 ? `Max` : maxRating}
                                                    <Icon type="down" />
                                                </ButtonCustom>
                                            </Dropdown>
                                        </ContainerNavigation>

                                    </ButtonGroupCustom> */}
                                    <Slider marks={rating} range step={1} defaultValue={sliderValue} value={sliderValue} min={0} max={5} onChange={onSliderChange} style={{ width: '90%' }} />
                                </TabSection>
                            </TabPane>
                        </FilterTab>

                        <br />
                        {/* <Button
                            type="primary"
                            style={{ width: "100%" }}
                            onClick={() => { onClearFilters() }}
                        >
                            Clear Filters
                        </Button> */}

                    </ContentSidebar>
                )}
                <ContentBody scroll style={{ maxHeight: "80vh", overflowX: "hidden" }}>

                    {!false && (
                        <>
                            {/* {console.log("userCurrentFilters", userCurrentFilters)} */}
                            <FilterBreadcrumbs
                                userCurrentFilters={userCurrentFilters}
                                removeText={removeFilterText}
                                removeMulti={removePlatform}
                                removeSelect={removeResponse}
                                removeRange={removeReviewRating}
                                removeDate={removeDate}
                                removeDateTimeline={removeDateTimeline}
                                refresh={refreshReviews}
                                // refresh={onClearFilters}
                                refreshingPosts={refreshingPosts}
                                clearAll={onClearFilters}
                            />
                        </>
                    )}

                    {reviewList.dat && (
                        reviewList.dat.map((dat, i) => {
                            return (<Review key={dat.reviewId} data={dat} path="/" />)
                        })
                    )}
                    {!reviewList.dat || !reviewList.dat.length && (
                        <Empty style={{marginTop: "30vh"}} />
                    )}
                </ContentBody>
            </Content>
        </Container>
    )
}

