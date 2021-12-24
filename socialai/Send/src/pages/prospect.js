import React, { Fragment, useState, useRef, useEffect } from "react"
import { useLazyQuery, useQuery } from "@apollo/react-hooks"
import {
  GET_POSTS,
  GET_USER_FILTERS,
  GET_DISPLAY_FILTERS,
  GET_SAVED_POSTS,
  SCREEN_NAME_CHECK,
  GET_EVAL_TERMS,
} from "../graphql/query"
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
} from "../graphql/mutation"
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
import TextInput from "../library/textInput"
import PostAvatar from "../library/postAvatar"
import {
  Colors,
  ProspectStatus,
  RangeFilters,
  FilterSetTypes,
  TagColors,
} from "../library/constants"
import {
  ButtonCustom,
  ButtonGroupCustom,
  SwitchCustom,
  RadioButtonCustom,
  RadioGroupCustom,
  InputButtonGroup,
  ActionGroup,
  Container,
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
} from "../library/basicComponents"
import { parseTimestamp } from "../library/utils"
import LocationIcon from "../../static/icons/LocationIcon.svg"
import CalendarIcon from "../../static/icons/CalendarIcon.svg"
import FilterIcon from "../../static/icons/FilterIcon2.svg"
import AddItemIcon1 from "../../static/icons/AddItemIcon1.svg"
import RemoveIcon from "../../static/icons/RemoveIcon.svg"
import RemoveActive from "../../static/icons/RemoveActive.svg"
import StarIcon from "../../static/icons/StarIcon.svg"
import StarIconActive from "../../static/icons/StarIconActive.svg"
import ChatIcon from "../../static/icons/ChatIconWhite.svg"
import ScreenNameModel from "../components/prospect/screenNameModel"
import ResponseIcon from "../../static/icons/ResponseIcon.svg"
import AirplaneIconWhite from "../../static/icons/AirplaneIconWhite.svg"
import CloseIconBlue from "../../static/icons/CloseIconBlue.svg"
import CheckIconBlue from "../../static/icons/CheckIconBlue.svg"
import AddIcon from "../../static/icons/AddIcon.svg"

import UserRoleProtected from "../components/userRoleProtected"
import { getCognitoRoles } from "../hooks/utils"
import { TestTag } from "../library/testTag"
import { usePrevious } from "../components/personalized-ads/hooks"
import { NetworkStatus } from "apollo-boost"
import { Router } from "@reach/router"
import NoPermissionAlert from "./no-permission"
import FilterBreadcrumbs from "../components/commons/filterBreadcrumbs"
import { InfoText } from "../components/commons/infoText"
import ReadMore from "../components/commons/ReadMore"
import { presetMenu } from "../library/preset/PresetMenu"
import { EditPresetModal } from "../library/preset/EditPresetModal"
import { PeriodSelector } from "../components/life-events/lifeEvents/periodSelector"
const { TabPane } = Tabs
const { Paragraph } = Typography
const { confirm } = Modal

const ProspectItem = styled(List.Item)`
  animation: 1s ${fadeIn} ease-in;
`

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

const responsesMenu = (userFilters, handleResponseMenuClick) => {
  return (
    <ResponseTemplateCntr>
      {userFilters &&
        userFilters.me.responseTemplates &&
        userFilters.me.responseTemplates.map(item => (
          <ResponseTemplateItem
            key={item.id}
            onClick={() => handleResponseMenuClick(item.message)}
          >
            <p>{item.message}</p>
          </ResponseTemplateItem>
        ))}
    </ResponseTemplateCntr>
  )
}

const sampleTags = ["Cold", "New Car", "BMW"]
const typeNameOrder = ["Make", "Category"]
const ProspectPage = ({ authData }) => {
  const name = useRef("")
  const locationTag = useRef("")
  const keywordTag = useRef("")
  const response = useRef("")

  const [isMobile, setIsMobile] = useState(false)
  const [userCurrentFilters, setUserCurrentFilters] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [activeSelect, setActiveSelect] = useState(null)
  const [selectsGroups, setSelectsGroup] = useState([])
  const [rangesGroup, setRangesGroup] = useState([])
  const [multiselectsGroup, setMultiselectsGroup] = useState([])
  const [multiselectsSubgroup, setMultiselectsSubgroup] = useState([])
  const [manageFiltersVisible, setManageFiltersVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [addPresetVisible, setAddPresetVisible] = useState(false)
  const [responseVisible, setResponseVisible] = useState(false)
  const [showActiveOnly, setShowActiveOnly] = useState([])
  const [selectAll, setSelectAll] = useState([])
  const [starredOnly, setStarredOnly] = useState(false)
  const [hideViewed, setHideViewed] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [scrollLoading, setScrollLoading] = useState(false)
  const [allResultsShown, setAllResultsShown] = useState(false)
  const [visible, setVisible] = useState(true)
  const [showScreenNameModal, setShowScreenNameModal] = useState(false)
  const [userFiltersSets, setUserFiltersSets] = useState(null)
  const [rangeFilter, setRangeFilter] = useState(null)
  const [parsingComplete, setParsingComplete] = useState(false)
  const [refreshingPosts, setRefreshingPosts] = useState(false)
  const [totalHitsText, setTotalHitsText] = useState("")
  const [viewingOlderPosts, setViewingOlderPosts] = useState(false)
  const [isValidPresetName, setIsValidPresetName] = useState(true)
  // const [showFilterModalReminder, setShowFilterModalReminder] = useState(
  //   () => localStorage.getItem("filterReminderMessage") || "true"
  // )

  const accessPayload = authData.signInUserSession.accessToken.payload

  const updateMobileResponsive = () => {
    setIsMobile(window.innerWidth < 1120)
  }

  useEffect(() => {
    updateMobileResponsive()
    window.addEventListener("resize", updateMobileResponsive)
    return () => {
      window.removeEventListener("resize", updateMobileResponsive)
    }
  }, [])

  useEffect(() => {
    setVisible(!isMobile)
  }, [isMobile])

  const {
    loading,
    error,
    data,
    networkStatus,
    // called,
    refetch: refetchPosts,
    fetchMore: fetchMorePosts,
  } = useQuery(GET_POSTS, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
    variables: {
      hideViewed: hideViewed,
    },
    onCompleted: x => {
      if (x && x?.getPosts?.data?.length < 10) {
        setAllResultsShown(true)
      }
      setScrollLoading(false)
    },
  })
  const {
    // loading: loading2,
    error: error2,
    data: data2,
    refetch: refetchSavedPosts,
    loading: loadingSavedPosts,
  } = useQuery(GET_SAVED_POSTS)
  const { data: displayFilters } = useQuery(GET_DISPLAY_FILTERS, {
    fetchPolicy: "network-only",
  })
  const { data: userFilters, refetch: refetchUserFilters } = useQuery(
    GET_USER_FILTERS,
    {
      fetchPolicy: "network-only",
    }
  )
  const [checkScreenName, { data: hasScreenNameData }] = useLazyQuery(
    SCREEN_NAME_CHECK
  )
  const { data: evalTerms } = useQuery(GET_EVAL_TERMS)

  const [addScreenName] = useMutation(ADD_SCREEN_NAME)
  const [updatePredictionReview] = useMutation(UPDATE_PREDICTION_REVIEW)
  const [updatePredictionReviewResolver] = useMutation(
    UPDATE_PREDICTION_REVIEW_RESOLVER
  )

  const [saveUserFilterSet] = useMutation(SAVE_USER_FILTER_SET)
  const [updateUserFilterSet] = useMutation(UPDATE_USER_FILTER_SET)
  const [setSelectFilterSet] = useMutation(SELECT_FILTER_SET, {
    onCompleted: res => {
      message.destroy({ key: "preset" })
      const multiselectssubgroup = displayFilters.getUserDisplayFilters
        .filter(filter => filter.type === "Multiselect")
        .reduce((r, a) => {
          a.checked =
            res.selectFilterSet.userFilters.filter(
              f =>
                f.type === "Multiselect" &&
                f.typeName === a.typeName &&
                f.value === a.value &&
                f.setType === FilterSetTypes.GENERAL
            ).length > 0
              ? true
              : false
          r[a.typeName] = [...(r[a.typeName] || []), a]
          return r
        }, {})
      setMultiselectsSubgroup(multiselectssubgroup)
      const generalCurrentFilters = res.selectFilterSet.userFilters.filter(
        f => f.setType === FilterSetTypes.GENERAL
      )
      setUserCurrentFilters(generalCurrentFilters)
      const currentRangeFilter = generalCurrentFilters.find(
        x => x.type === "Range"
      )

      if (currentRangeFilter) {
        setRangeFilter(currentRangeFilter.value)
      }
      const updatedSelectFilters = res.selectFilterSet.userFilters
        .filter(f => f.type === "Select")
        .reduce((acc, val) => {
          acc[val.typeName] = val.value
          return acc
        }, {})

      setActiveSelect(updatedSelectFilters)
      setAllResultsShown(false)
      if (starredOnly) {
        refetchSavedPosts()
      } else {
        setRefreshingPosts(true)
        setViewingOlderPosts(false)
        setAllResultsShown(false)
        refetchPosts().then(() => setRefreshingPosts(false))
      }
    },
  })
  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)
  const [prospectAction] = useMutation(PROSPECT_ACTION)
  const [saveInitialResponse] = useMutation(SAVE_INITIAL_SENT)

  const setDefaultRange = (currentFilters, rangesGroup) => {
    const filtersToUpdate = currentFilters.filter(x => x.type !== "Range")
    const found = rangesGroup.reduce((a, b) => (a.y > b.y ? a : b))
    if (found) {
      filtersToUpdate.push(found)
      setRangeFilter(found.value)
    }
    setUserCurrentFilters(filtersToUpdate)

    updateUserFilters({
      variables: {
        filters: filtersToUpdate.map(f => ({
          type: f.type,
          typeName: f.typeName,
          value: f.value,
        })),
        setType: FilterSetTypes.GENERAL,
      },
    }).then(() => refetchPosts())
  }

  useEffect(() => {
    if (displayFilters && userFilters && !userCurrentFilters.length) {
      const selects = displayFilters.getUserDisplayFilters.filter(
        filter => filter.type === "Select"
      )
      if (selects.length > 0) {
        selects.unshift({ id: 0, value: "All", typeName: "All" })

        let groupsTracker = []
        const groupedSelects = selects.reduce((acc, cur, idx) => {
          if (idx === 1) {
            groupsTracker.push(acc.typeName)
            let newAcc = {}
            newAcc[acc.typeName] = [{ ...acc }]
            acc = newAcc
          }

          let groupIdx = groupsTracker.indexOf(cur.typeName)
          if (groupIdx >= 0) {
            acc[cur.typeName].push({ ...cur })
          } else {
            groupsTracker.push(cur.typeName)
            let newAcc = { ...acc }
            newAcc[cur.typeName] = [{ ...cur }]
            acc = newAcc
          }
          return acc
        })

        setSelectsGroup(groupedSelects)
      }
      const currentFilters = userFilters.me.filters.filter(
        f => f.setType === FilterSetTypes.GENERAL
      )
      setUserCurrentFilters(currentFilters)

      setUserFiltersSets(
        userFilters.me.filterSets.filter(
          f => f.setType === FilterSetTypes.GENERAL
        )
      )
      const multiselectssubgroup = displayFilters.getUserDisplayFilters
        .filter(filter => filter.type === "Multiselect")
        .reduce((r, a) => {
          a.checked =
            userFilters.me.filters
              .filter(f => f.setType === FilterSetTypes.GENERAL)
              .filter(
                f =>
                  f.type === "Multiselect" &&
                  f.typeName === a.typeName &&
                  f.value === a.value
              ).length > 0
              ? true
              : false
          r[a.typeName] = [...(r[a.typeName] || []), a]
          return r
        }, {})
      Object.entries(multiselectssubgroup).map(([key, value]) => {
        let sortedVals = value.sort((a, b) =>
          a.value > b.value ? 1 : b.value > a.value ? -1 : 0
        )
        multiselectssubgroup[key] = sortedVals
      })
      setMultiselectsSubgroup(multiselectssubgroup)
      const multiselectgroup = Object.keys(multiselectssubgroup)
      setMultiselectsGroup(multiselectgroup)
      setShowActiveOnly(Array(multiselectgroup.length).fill(false))
      setSelectAll(Array(multiselectgroup.length).fill(false))

      const selectsOptions = userFilters.me.filters
        .filter(f => f.setType === FilterSetTypes.GENERAL)
        .filter(f => f.type === "Select")
      const currentSelect = {}
      selectsOptions.map(opt => {
        currentSelect[opt.typeName] = opt.value
      })
      setActiveSelect(currentSelect)
      setParsingComplete(true)

      const ranges = displayFilters.getUserDisplayFilters
        .filter(filter => filter.type === "Range")
        .sort((x1, x2) => {
          if (
            Number(x1.selectionOption.query) > Number(x2.selectionOption.query)
          )
            return 1
          if (
            Number(x1.selectionOption.query) <= Number(x2.selectionOption.query)
          )
            return -1
        })

      setRangesGroup(ranges)
      const currentRangeFilter = currentFilters.find(x => x.type === "Range")
      if (currentRangeFilter) {
        setRangeFilter(currentRangeFilter.value)
      } else if (ranges?.length > 1) {
        setDefaultRange(currentFilters, ranges)
      }
    }
  }, [displayFilters, userFilters])

  function onChangeHideViewed(checked) {
    setStarredOnly(false)
    setHideViewed(checked)
    setAllResultsShown(false)
    refetchPosts({ hideViewed: checked })
  }

  function onChangeStarredOnly(checked) {
    setStarredOnly(checked)
    setHideViewed(false)
    setAllResultsShown(false)
    if (checked) {
      refetchSavedPosts()
    } else {
      refetchPosts()
    }
  }

  function renderParagraph(item, id2) {
    //Removes any unwanted phrases that have been added to this list
    const excludePhrases = [
      "QR Code Link to This Post",
      "(adsbygoogle = window.adsbygoogle || []).push({});",
    ]
    let paragraph = item.body
    excludePhrases.forEach(excludePhrase => {
      if (paragraph.includes(excludePhrase)) {
        paragraph = paragraph.replace(excludePhrase, "")
      }
    })
    //Removes HTML tags from post
    paragraph = paragraph.replace(/(<([^>]+)>)/gi, "")
    return (
      <div key={id2}>
        <ReadMore
          charLimit={350}
          readMoreText={"Expand"}
          readLessText={"Close"}
          readMoreClassName="read-more-less--more"
          readLessClassName="read-more-less--less"
          keyWords={userCurrentFilters}
          readMoreStyle={{ color: "#006593", cursor: "pointer" }}
          readLessStyle={{ color: "#006593", cursor: "pointer" }}
        >
          {paragraph}
        </ReadMore>
      </div>
    )
  }

  const changeProspectStatus = (id, action, url, shouldScreenName = true) => {
    prospectAction({ variables: { action, id } }).then(data => {
      if (
        data.data &&
        data.data.prospectAction &&
        data.data.prospectAction.ok &&
        action === ProspectStatus.ACCEPTED &&
        shouldScreenName
      ) {
        checkScreenName({
          variables: { sourceId: selectedPost.sourceId },
        })
      }
    })
    setTimeout(() => {
      setAllResultsShown(false)
      if (starredOnly) {
        refetchSavedPosts()
      } else {
        refetchPosts()
      }
    }, 500)

    if (url) {
      response.current.select()
      document.execCommand("copy")
      setResponseVisible(false)
      window.open(url, "_blank")

      response.current.value = ""
    }
  }

  useEffect(() => {
    if (userFilters) {
      setUserFiltersSets(
        userFilters.me.filterSets.filter(
          f => f.setType === FilterSetTypes.GENERAL
        )
      )
    }
  }, [userFilters])

  const saveFilterSet = () => {
    const trimmedValue = name?.current?.value?.trim()
    if (!!trimmedValue) {
      setIsValidPresetName(true)
      const filterSet = {
        name: trimmedValue,
        setType: FilterSetTypes.GENERAL,
      }
      const filtersToUpdate = userCurrentFilters.map(f => ({
        type: f.type,
        typeName: f.typeName,
        value: f.value,
      }))
      updateUserFilters({
        variables: {
          filters: filtersToUpdate,
          setType: FilterSetTypes.GENERAL,
        },
      }).then(() => {
        saveUserFilterSet({ variables: filterSet }).then(() => {
          refetchUserFilters()
        })
        setAddPresetVisible(false)
      })
      name.current.value = ""
    } else {
      setIsValidPresetName(false)
    }
  }

  const updateFilterSet = (filterSet, del) => {
    const updatedFilterSet = {
      id: filterSet.id,
      name: filterSet.name,
      delete: del,
      setType: FilterSetTypes.GENERAL,
    }
    const filtersToUpdate = userCurrentFilters.map(f => ({
      type: f.type,
      typeName: f.typeName,
      value: f.value,
    }))
    updateUserFilters({
      variables: {
        filters: filtersToUpdate,
        setType: FilterSetTypes.GENERAL,
      },
    }).then(() => {
      updateUserFilterSet({ variables: updatedFilterSet }).then(() => {
        refetchUserFilters()
      })
      message.success(del ? "Deleted!" : "Updated")
    })
  }

  const confirmUpdateFilterSet = (filterSet, del) => {
    confirm({
      title: "Do you want to update this preset?",
      content:
        "When clicked the OK button, the preset will be updated with the current selected filters",
      onOk() {
        updateFilterSet(filterSet, del)
      },
      onCancel() { },
    })
  }

  const editPresetName = (id, value) => {
    setUserFiltersSets(prevState => {
      const newState = prevState.map(item => {
        if (item.id === id) {
          item.name = value
        }
        return item
      })
      return newState
    })
  }

  const saveFilterText = type => {
    let ftype
    let val
    if (type === "Location") {
      ftype = "Location (Any)"
      val = locationTag?.current?.value?.trim()
      locationTag.current.value = ""
    } else if (type === "Keyword") {
      const hasMatchAllOptionForKeyword = hasMatchAllOptionForKeywordFilter()
      if (hasMatchAllOptionForKeyword) {
        ftype = "Keyword (All)"
      } else {
        ftype = "Keyword (Any)"
      }
      val = keywordTag?.current?.value?.trim()
      keywordTag.current.value = ""
    }
    saveFilterValue(ftype, val)
  }

  const saveUnknownLocationFilter = checked => {
    const ftype = "Location (Any)"
    const fval = "Unknown Location"
    if (checked) {
      // add unknown location
      saveFilterValue(ftype, fval)
    } else {
      // remove unknown location
      setUserCurrentFilters(userCurrentFilters.filter(f => f.value !== fval))
    }
  }

  const saveFilterValue = (type, val) => {
    if (!!val) {
      const filterText = {
        id: userCurrentFilters.length + 1,
        typeName: type,
        type: "Text",
        value: val,
        companyFilterId: null,
      }
      let updatedFilters = userCurrentFilters.map(f => f)
      updatedFilters.push(filterText)
      setUserCurrentFilters(updatedFilters)
    }
  }

  const removeFilterText = id => {
    setUserCurrentFilters(userCurrentFilters.filter(f => f.id !== id))
  }

  const hasUnknownLocationFilter = () => {
    return userCurrentFilters.filter(
      f =>
        f.type === "Text" &&
        f.typeName.indexOf("Location") === 0 &&
        f.value === "Unknown Location"
    ).length > 0
      ? true
      : false
  }

  const hasMatchAllOptionForKeywordFilter = () => {
    return userCurrentFilters.filter(
      f => f.type === "Text" && f.typeName === "Keyword (All)"
    ).length > 0
      ? true
      : false
  }

  const saveFilterAllOrAnyOption = (checked, e) => {
    const elementId = e.target.id
    if (checked) {
      if (elementId.indexOf("Keyword") === 0) {
        const hasMatchAllOptionForKeyword = hasMatchAllOptionForKeywordFilter()
        if (!hasMatchAllOptionForKeyword) {
          let updatedFilters = userCurrentFilters.map(f => {
            if (f.type === "Text" && f.typeName.indexOf("Keyword") === 0) {
              f.typeName = "Keyword (All)"
            }
            return f
          })
          setUserCurrentFilters(updatedFilters)
        }
      }
    } else {
      if (elementId.indexOf("Keyword") === 0) {
        const hasMatchAllOptionForKeyword = hasMatchAllOptionForKeywordFilter()
        if (hasMatchAllOptionForKeyword) {
          let updatedFilters = userCurrentFilters.map(f => {
            if (f.type === "Text" && f.typeName.indexOf("Keyword") === 0) {
              f.typeName = "Keyword (Any)"
            }
            return f
          })
          setUserCurrentFilters(updatedFilters)
        }
      }
    }
  }

  const checkFilter = (filter, check) => {
    setMultiselectsSubgroup(prevState => {
      const newState = Object.assign({}, prevState)
      newState["Sources"] = multiselectsSubgroup["Sources"].map(f => {
        if (f.value === filter.value) {
          f.checked = check
          if (f.checked) {
            setUserCurrentFilters([...userCurrentFilters, f])
          } else {
            const newUserCurrentFilters = userCurrentFilters.filter(
              c =>
                !(
                  c.type === f.type &&
                  c.typeName === f.typeName &&
                  c.value === f.value
                )
            )
            setUserCurrentFilters(newUserCurrentFilters)
          }
        }
        return f
      })
      return newState
    })
  }

  const removeSelect = filter => {
    let updatedActive = {}
    if (filter.value !== "All") {
      let current = userCurrentFilters.filter(
        x =>
          x.type !== "Select" ||
          (x.type === "Select" && x.value !== filter.value)
      )
      updatedActive = { ...activeSelect }
      delete updatedActive[filter.typeName]
      if (filter.value.includes("Buy")) {
        current = current.filter(x => x.typeName !== "New/Used")
        delete updatedActive["New/Used"]
      }
      setUserCurrentFilters(current)
    }
    setActiveSelect(updatedActive)
  }

  const removeRange = filter => {
    let updatedActive = {}

    let current = userCurrentFilters.filter(
      x =>
        x.type !== "Range" || (x.type === "Range" && x.value !== filter.value)
    )
    setUserCurrentFilters(current)
    setRangeFilter(null)
  }

  const handleActiveSelect = (e, groupName) => {
    let filter = { value: "All" }
    let updatedActive = {}
    let unchecked = e.target.value === activeSelect[groupName]

    if (e.target.value !== "All") {
      filter = selectsGroups[groupName].filter(
        s => s.value === e.target.value
      )[0]
      if (unchecked) {
        updatedActive = { ...activeSelect }
        delete updatedActive[groupName]
      } else {
        updatedActive = { ...activeSelect }
        updatedActive[groupName] = filter.value
      }
      if (
        filter.value.includes("Sell") ||
        (unchecked && filter.value.includes("Buy"))
      ) {
        delete updatedActive["New/Used"]
      }
    }

    setActiveSelect(updatedActive)

    let newUserCurrentFilters = userCurrentFilters.filter(
      f =>
        f.type !== "Select" ||
        (filter.value !== "All" && f.typeName !== groupName) ||
        unchecked
    )

    if (
      filter.value.includes("Sell") ||
      (unchecked && filter.value.includes("Buy"))
    ) {
      newUserCurrentFilters = newUserCurrentFilters.filter(
        x => x.typeName !== "New/Used"
      )
    }

    if (filter.value !== "All") {
      if (unchecked) {
        newUserCurrentFilters = newUserCurrentFilters.filter(
          x => x.value !== filter.value
        )
      } else {
        newUserCurrentFilters.push(
          selectsGroups[groupName].filter(f => f.value === filter.value)[0]
        )
      }
    }

    setUserCurrentFilters(newUserCurrentFilters)
  }

  const onChangeShowActiveOnly = index => {
    setShowActiveOnly(prevState => {
      const newState = [...prevState]
      newState[index] = !prevState[index]
      return newState
    })
  }

  const onSelectAll = group => {
    const index = multiselectsGroup.indexOf(group)
    setSelectAll(prevState => {
      const newState = [...prevState]
      newState[index] = !prevState[index]
      return newState
    })
    let newUserCurrentFilters = [...userCurrentFilters]
    multiselectsSubgroup[multiselectsGroup[index]] = multiselectsSubgroup[
      multiselectsGroup[index]
    ].map(f => {
      f.checked = !selectAll[index]
      const filterExist = userCurrentFilters.filter(
        c =>
          c.type === f.type && c.typeName === f.typeName && c.value === f.value
      )
      if (f.checked && !filterExist.length) {
        newUserCurrentFilters.push(f)
      } else if (!f.checked && filterExist.length) {
        newUserCurrentFilters = newUserCurrentFilters.filter(
          c =>
            !(
              c.type === f.type &&
              c.typeName === f.typeName &&
              c.value === f.value
            )
        )
      }
      return f
    })
    setUserCurrentFilters(newUserCurrentFilters)
    setMultiselectsSubgroup(multiselectsSubgroup)
  }

  const removeMulti = filter => {
    let filterSubgroup = multiselectsSubgroup[filter.typeName]
    filterSubgroup = filterSubgroup.map(f => {
      if (filter.value === f.value) {
        f.checked = false
      }
      return f
    })
    const newUserCurrentFilters = userCurrentFilters.filter(
      c =>
        !(
          c.type === filter.type &&
          c.typeName === filter.typeName &&
          c.value === filter.value
        )
    )
    setUserCurrentFilters(newUserCurrentFilters)
    setMultiselectsSubgroup({
      ...multiselectsSubgroup,
      [filter.typeName]: filterSubgroup,
    })
  }

  const onChangeMulti = (group, id) => {
    multiselectsSubgroup[group] = multiselectsSubgroup[group].map(f => {
      if (f.id === id) {
        f.checked = !f.checked
        if (f.checked) {
          setUserCurrentFilters([...userCurrentFilters, f])
        } else {
          const newUserCurrentFilters = userCurrentFilters.filter(
            c =>
              !(
                c.type === f.type &&
                c.typeName === f.typeName &&
                c.value === f.value
              )
          )
          setUserCurrentFilters(newUserCurrentFilters)
        }
      }
      return f
    })
    setMultiselectsSubgroup(multiselectsSubgroup)

    const index = multiselectsGroup.indexOf(group)
    const selectedAll =
      multiselectsSubgroup[multiselectsGroup[index]].filter(f => f.checked)
        .length === multiselectsSubgroup[multiselectsGroup[index]].length
    setSelectAll(prevState => {
      const newState = [...prevState]
      newState[index] = !!selectedAll
      return newState
    })
  }

  const handleInitialResponse = (response, aingineId) => {
    setTimeout(() => {
      saveInitialResponse({
        variables: {
          aingineId: aingineId,
          response: response,
        },
      })
    }, 2500)
  }

  const handlePresetMenuClick = async e => {
    setSelectedPreset(e.item.props.children)
    message.loading({
      content: "Loading preset...",
      key: "preset",
      duration: 60,
    })
    setSelectFilterSet({
      variables: { id: e.key, setType: FilterSetTypes.GENERAL },
    })
  }

  const handleResponseMenuClick = template => {
    response.current.value = template
  }

  const clearAllFilters = () => {
    let updatedSubGroups = {}
    multiselectsGroup.map(group => {
      updatedSubGroups[group] = []
      multiselectsSubgroup[group].map(sub => {
        sub.checked = false
        updatedSubGroups[group].push(sub)
      })
    })
    setRangeFilter(null)
    removeSelect({ value: "All" })
    setMultiselectsSubgroup(updatedSubGroups)
    setUserCurrentFilters([])
  }

  const refreshProspects = () => {
    setRefreshingPosts(true)
    setViewingOlderPosts(false)
    setAllResultsShown(false)
    // setSelectedPreset(null)
    const filtersToUpdate = userCurrentFilters.map(f => ({
      type: f.type,
      typeName: f.typeName,
      value: f.value,
    }))
    updateUserFilters({
      variables: {
        filters: filtersToUpdate,
        setType: FilterSetTypes.GENERAL,
      },
    }).then(() => {
      if (starredOnly) {
        refetchSavedPosts().then(() => setRefreshingPosts(false))
      } else {
        refetchPosts().then(() => setRefreshingPosts(false))
      }
    })
  }

  const loadNewerProspects = () => {
    let variables = {}
    if (data.getPosts.data.length > 0) {
      const firstPost = data.getPosts.data[0]
      variables.newer = firstPost.timestamp
    }

    fetchMorePosts({
      variables: variables,
      updateQuery: (prev, { fetchMoreResult }) => {
        const amount = fetchMoreResult.getPosts.data.length
        if (amount > 0) {
          notification.info({
            message: amount > 1 ? "New Prospects" : "New Prospect",
            description: `There ${amount > 1
              ? "are " + amount + " new leads"
              : "is " + amount + " new lead"
              } for you to check out.`,
          })
          return {
            getPosts: {
              ...prev.getPosts,
              data: [...fetchMoreResult.getPosts.data, ...prev.getPosts.data],
            },
          }
        } else {
          return prev
        }
      },
    })
  }

  const loadOlderProspects = () => {
    let lastPost
    if (data.getPosts.data.length > 0) {
      lastPost = data.getPosts.data[data.getPosts.data.length - 1]
    }
    if (!loading) {
      fetchMorePosts({
        variables: { older: lastPost ? lastPost.timestamp : null },
        updateQuery: (prev, { fetchMoreResult }) => {
          return {
            getPosts: {
              ...prev.getPosts,
              data: [...prev.getPosts.data, ...fetchMoreResult.getPosts.data],
            },
          }
        },
      }).then(d => {
        if (d.data && d.data.getPosts.data.length === 0) {
          setAllResultsShown(true)
          setScrollLoading(false)
        } else if (d.data && viewingOlderPosts) {
          setTotalHitsText(
            getTotalHitsText(data.getPosts.data.length + d.data.getPosts.count)
          )
        }
      })
    }
  }

  useEffect(() => {
    if (viewingOlderPosts) {
      loadOlderProspects()
    }
  }, [viewingOlderPosts])

  useEffect(() => {
    if (viewingOlderPosts) {
      setViewingOlderPosts(false)
    }
  }, [rangeFilter])

  const trackProspectScrolling = () => {
    const prospectList = document.getElementById("prospect-list")
    if (
      prospectList &&
      prospectList.getBoundingClientRect().bottom <= window.innerHeight + 180
    ) {
      setScrollLoading(true)
    }
  }

  const submitScreenName = inputs => {
    addScreenName({
      variables: inputs,
    }).then(d => {
      setShowScreenNameModal(false)
    })
  }

  const updateReview = (postId, prevReview, review) => {
    updatePredictionReview({
      variables: { postId, review: review === prevReview ? null : review },
    }).catch(e => {
      updatePredictionReviewResolver({
        variables: { id: postId, review: prevReview },
      })
      message.error("Review field can not be updated")
    })
    updatePredictionReviewResolver({
      variables: { id: postId, review: review === prevReview ? null : review },
    })
  }

  // const handleCheckFilterReminder = e => {
  //   const checked = e.target.checked
  //   setShowFilterModalReminder(checked)
  //   localStorage.setItem("filterReminderMessage", "false")
  // }

  const addScrollEventListener = () => {
    document
      .getElementById("prospect-cntr")
      .addEventListener("scroll", trackProspectScrolling, true)
  }

  const removeScrollEventListener = () => {
    document
      .getElementById("prospect-cntr")
      .removeEventListener("scroll", trackProspectScrolling, true)
  }

  useEffect(() => {
    addScrollEventListener()
    const newDataPolling = setInterval(() => {
      loadNewerProspects()
    }, 60000)

    return () => {
      removeScrollEventListener()
      clearInterval(newDataPolling)
    }
  }, [data])

  useEffect(() => {
    if (scrollLoading && !allResultsShown) {
      loadOlderProspects()
    }
  }, [scrollLoading])

  useEffect(() => {
    if (allResultsShown) {
      setScrollLoading(false)
    }
  }, [allResultsShown])

  useEffect(() => {
    if (
      hasScreenNameData &&
      hasScreenNameData.screenNameCheck &&
      hasScreenNameData.screenNameCheck.hasScreenName === false
    ) {
      setShowScreenNameModal(true)
    }
  }, [hasScreenNameData])

  // const strength = 'WARM';
  const prevLoading = usePrevious(refreshingPosts || loading)
  const filtersRef = useRef(userCurrentFilters)

  useEffect(() => {
    filtersRef.current = userCurrentFilters
  }, [userCurrentFilters])

  useEffect(() => {
    // If there are Model filters selected we can assume that we were previously redirected to this page from the treemap component.
    // Since there are no model filters in the sidebar of this page yet, let's remove the selected model filter when this page is unmounted.
    return () => {
      const found = filtersRef.current.find(x => x.typeName === "Model")
      if (found) {
        updateUserFilters({
          variables: {
            filters: filtersRef.current
              .filter(x => x.typeName !== "Model")
              .map(f => ({
                type: f.type,
                typeName: f.typeName,
                value: f.value,
              })),
            setType: FilterSetTypes.GENERAL,
          },
        })
      }
    }
  }, [])

  const getTotalHitsText = count =>
    `${count === 1
      ? "1 result"
      : 1 < count && data.getPosts.count < 10
        ? `${count} results`
        : count < 10000
          ? `Showing ${count.toLocaleString()} results`
          : `Showing more than ${(10000).toLocaleString()} results`
    } ${userCurrentFilters.length > 0 ? " for the selected filters" : ""}`

  useEffect(() => {
    if (prevLoading && !(refreshingPosts || loading)) {
      if (data && data.getPosts.count > 0) {
        setTotalHitsText(getTotalHitsText(data.getPosts.count))
      } else {
        setTotalHitsText("")
      }
    } else if (loading) {
      setTotalHitsText("")
    }
  }, [data, userCurrentFilters, refreshingPosts, loading])

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
      <ContainerNavigation>
        <div>
          {/* <Tooltip
            placement="topLeft"
            title={visible ? "Hide filters" : "Show filters"}
          >
            <Icon
              style={{ padding: "1em" }}
              className="trigger"
              type={!visible ? "menu-unfold" : "menu-fold"}
              onClick={() => setVisible(!visible)}
            />
          </Tooltip> */}
          {/* NOTE: Temporary hidden */}
          {/* Customers only <SwitchCustom onChange={onChangeCustomersOnly} /> */}
          Starred only{" "}
          <SwitchCustom
            disabled={loadingSavedPosts || refreshingPosts}
            onChange={onChangeStarredOnly}
            checked={starredOnly}
          />
          {getCognitoRoles(accessPayload) &&
            getCognitoRoles(accessPayload).includes("LABELER") && (
              <>
                Hide viewed posts{" "}
                <SwitchCustom
                  onChange={onChangeHideViewed}
                  checked={hideViewed}
                />
              </>
            )}
        </div>
        <FilterButtonCntr>
          <ButtonCustom
            onClick={() => setManageFiltersVisible(true)}
            style={{ marginLeft: "-1px" }}
          >
            Manage filters
            <SVGIcon component={FilterIcon} alt="Prospects" />
          </ButtonCustom>
          <ButtonGroupCustom size={2}>
            <Dropdown
              overlay={presetMenu(
                userFilters?.me?.filterSets?.filter(
                  f => f.setType === FilterSetTypes.GENERAL
                ),
                handlePresetMenuClick
              )}
            >
              <Button>
                {selectedPreset || `Choose a preset`} <Icon type="down" />
              </Button>
            </Dropdown>
            <Button onClick={() => setSettingsVisible(true)}>
              <Icon type="setting" />
            </Button>
          </ButtonGroupCustom>
          <ButtonCustom onClick={() => setAddPresetVisible(true)}>
            Add to filters preset
            <SVGIcon component={AddItemIcon1} alt="Prospects" />
          </ButtonCustom>
          <PeriodSelector
            onClick={val => {
              if (viewingOlderPosts) {
                setViewingOlderPosts(false)
              }

              setRangeFilter(val)

              const filtersToUpdate = userCurrentFilters.filter(
                x => x.type !== "Range"
              )

              const found = rangesGroup.find(x => x.value === val)
              if (found) {
                filtersToUpdate.push(found)
              }

              setUserCurrentFilters(filtersToUpdate)
              setAllResultsShown(false)
              updateUserFilters({
                variables: {
                  filters: filtersToUpdate.map(f => ({
                    type: f.type,
                    typeName: f.typeName,
                    value: f.value,
                  })),
                  setType: FilterSetTypes.GENERAL,
                },
              }).then(() => refetchPosts())
            }}
            rangeFilter={rangeFilter}
            options={rangesGroup}
          />
        </FilterButtonCntr>
      </ContainerNavigation>
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
            {typeof selectsGroups === "object" &&
              Object.entries(selectsGroups).length > 0 &&
              Object.entries(selectsGroups).map(([groupName, group]) =>
                groupName !== "New/Used" ||
                  userCurrentFilters.find(x => x.value === "Buy Car") ? (
                  <Fragment key={groupName}>
                    <RadioGroupCustom
                      key={groupName}
                      buttonStyle="solid"
                      value={
                        Object.entries(activeSelect).length > 0
                          ? activeSelect[groupName]
                          : "All"
                      }
                    // onChange={e => handleActiveSelect(e, groupName)}
                    >
                      {group.length > 0 &&
                        group.map(g => (
                          <Tooltip
                            placement="bottom"
                            title={
                              g.value === "Parts"
                                ? "Parts & Accessories"
                                : g.value
                            }
                          >
                            <RadioButtonCustom
                              key={g.id}
                              value={g.value}
                              onClick={e => handleActiveSelect(e, groupName)}
                            >
                              {g.value}
                            </RadioButtonCustom>
                          </Tooltip>
                        ))}
                    </RadioGroupCustom>
                  </Fragment>
                ) : null
              )}
            <FilterTab
              defaultActiveKey="Makes"
              tabPosition="top"
              animated={false}
            >
              {parsingComplete &&
                multiselectsGroup
                  .filter(g => g !== "Sources" && g !== "Events")
                  .sort((x1, x2) => {
                    if (typeNameOrder.indexOf(x1) > typeNameOrder.indexOf(x2))
                      return 1
                    if (typeNameOrder.indexOf(x1) <= typeNameOrder.indexOf(x2))
                      return -1
                  })
                  .map((g, index) => (
                    <TabPane
                      tab={g}
                      key={g}
                      style={{ maxHeight: "400px", overflow: "auto" }}
                    >
                      <TabSection>
                        <Checkbox
                          checked={showActiveOnly[index]}
                          onChange={() => onChangeShowActiveOnly(index)}
                        >
                          Show active only
                        </Checkbox>
                        <br />
                        <Checkbox
                          checked={selectAll[multiselectsGroup.indexOf(g)]}
                          onChange={() => onSelectAll(g)}
                        >
                          Select/deselect all
                        </Checkbox>
                      </TabSection>
                      <Divider />
                      <TabSection>
                        {multiselectsSubgroup &&
                          multiselectsSubgroup[g].length &&
                          multiselectsSubgroup[g]
                            .sort((x1, x2) => {
                              if (x1.value > x2.value) return 1
                              if (x1.value <= x2.value) return -1
                            })
                            .map(item => {
                              if (showActiveOnly[index]) {
                                return (
                                  <Fragment key={item.id}>
                                    {item.checked && (
                                      <>
                                        <Checkbox
                                          checked={item.checked}
                                          onChange={() =>
                                            onChangeMulti(g, item.id)
                                          }
                                        >
                                          {item.value}
                                        </Checkbox>
                                        <br />
                                      </>
                                    )}
                                  </Fragment>
                                )
                              } else {
                                return (
                                  <Fragment key={item.id}>
                                    <Checkbox
                                      checked={item.checked}
                                      onChange={() => onChangeMulti(g, item.id)}
                                    >
                                      {item.value}
                                    </Checkbox>
                                    <br />
                                  </Fragment>
                                )
                              }
                            })}
                      </TabSection>
                      <br />
                    </TabPane>
                  ))}
            </FilterTab>
            <br />
            <Button
              type="primary"
              style={{ width: "100%" }}
              onClick={refreshProspects}
            >
              Refresh Prospects
            </Button>
          </ContentSidebar>
        )}
        <ContentBody>
          {!starredOnly && (
            <FilterBreadcrumbs
              userCurrentFilters={userCurrentFilters}
              removeText={removeFilterText}
              removeMulti={removeMulti}
              removeSelect={removeSelect}
              removeRange={removeRange}
              refresh={refreshProspects}
              refreshingPosts={refreshingPosts || loading}
              clearAll={clearAllFilters}
            />
          )}

          {!starredOnly && (
            <InfoText style={{ flexGrow: 1.8, minHeight: 24 }}>
              {totalHitsText}
            </InfoText>
          )}

          {/* {(loading || loading2) && <LoadingIcon type="loading" />} */}
          {(error || error2) && <h4>Error...</h4>}
          {!loading &&
            !error &&
            ((!starredOnly && !data.getPosts.data.length) ||
              (starredOnly && !data2.getSavedPosts.length)) && (
              <Empty
                description={
                  <span>
                    <h3>
                      No prospects found with the configured filter settings
                    </h3>
                    <p>
                      Notify me when new prospects for this combination filter
                      are found
                    </p>
                  </span>
                }
              />
            )}

          {(!loading || networkStatus === NetworkStatus.fetchMore) && !error && (
            <UserRoleProtected
              component={List}
              userRole={"canViewProspects"}
              id={"prospect-list"}
              itemLayout="horizontal"
              dataSource={
                starredOnly
                  ? data2.getSavedPosts.map(sp => sp.post)
                  : data.getPosts.data
              }
              renderItem={item => (
                <ProspectItem
                  key={item.id}
                  id={item.id}
                  style={{ paddingTop: "1.5em" }}
                >
                  <List.Item.Meta
                    // avatar={
                    //   renderStrength(item)
                    // }
                    avatar={<PostAvatar post={item} evalTerms={evalTerms} />}
                    // title={<a href={item.url}>{item.description}</a>}
                    description={
                      <div>
                        <Info>
                          <Info style={{ flexGrow: 4, flexFlow: "row wrap" }}>
                            <InfoText style={{ flexGrow: 1.8 }}>
                              <span>{item.author} </span>
                              posted {parseTimestamp(item.timestamp)}
                              {item?.location ? (
                                <>
                                  <InfoIcon
                                    component={LocationIcon}
                                    alt="Date"
                                    style={{
                                      margin: "0 0 0 6px",
                                      fontSize: "14px",
                                    }}
                                  />
                                  {item.location}
                                </>
                              ) : null}
                            </InfoText>
                            <SourceText>
                              {item?.sourceType?.toLowerCase() == "fb_group"
                                ? "Facebook"
                                : item.source}
                              <SourceIcon
                                src={
                                  `/images/sources/${item?.sourceType?.toLowerCase() ==
                                    "fb_group"
                                    ? "facebook"
                                    : item?.sourceType?.toLowerCase()
                                  }.png` || "/images/sources/forum.png"
                                }
                                onError={e => {
                                  e.target.src = "/images/sources/forum.png"
                                }}
                              />
                            </SourceText>
                          </Info>
                        </Info>

                        <ThreadTitle>
                          {item?.threadTitle ? item.threadTitle : " "}
                        </ThreadTitle>
                        {renderParagraph(item, item.id)}
                        <BottomInfo>
                          <div>
                            {item.tags.map((t, index) => (
                              <TagColored key={index} color={TagColors(t)}>
                                {t}
                              </TagColored>
                            ))}
                          </div>
                          <ButtonInfo>
                            <TooltipButton
                              tooltip="Remove"
                              shape="circle"
                              onClick={() => {
                                item.status = ProspectStatus.REJECTED
                                changeProspectStatus(
                                  item.id,
                                  ProspectStatus.REJECTED
                                )
                              }}
                              component={
                                item.status === ProspectStatus.REJECTED
                                  ? RemoveActive
                                  : RemoveIcon
                              }
                              alt="Remove"
                            />
                            <TooltipButton
                              activeclass={savedActive}
                              active={
                                item.status === ProspectStatus.SAVED
                                  ? "true"
                                  : undefined
                              }
                              tooltip="Save"
                              shape="circle"
                              onClick={() => {
                                item.status =
                                  item.status === ProspectStatus.SAVED
                                    ? ProspectStatus.VIEWED
                                    : ProspectStatus.SAVED
                                changeProspectStatus(item.id, item.status)
                              }}
                              component={
                                item.status === ProspectStatus.SAVED
                                  ? StarIconActive
                                  : StarIcon
                              }
                              alt="Favorite"
                            />
                            <TooltipButton
                              tooltip="Respond"
                              type={"primary"}
                              shape="circle"
                              onClick={() => {
                                setSelectedPost(item)
                                setResponseVisible(true)
                              }}
                              component={ChatIcon}
                              alt="Chat"
                            />
                          </ButtonInfo>
                          {getCognitoRoles(accessPayload) &&
                            getCognitoRoles(accessPayload).includes(
                              "LABELER"
                            ) && (
                              <div>
                                <Tooltip
                                  placement="topLeft"
                                  title="Mark as right"
                                >
                                  <Icon
                                    style={{
                                      fontSize: "20px",
                                      paddingLeft: "4px",
                                      paddingRight: "2px",
                                      verticalAlign: "sub",
                                    }}
                                    theme="twoTone"
                                    type="check-circle"
                                    twoToneColor={
                                      item.review === true
                                        ? "#52c41a"
                                        : "#b8b8b8"
                                    }
                                    onClick={() =>
                                      updateReview(item.id, item.review, true)
                                    }
                                  />
                                </Tooltip>
                                <Tooltip
                                  placement="topLeft"
                                  title="Mark as wrong"
                                >
                                  <Icon
                                    style={{
                                      fontSize: "20px",
                                      paddingLeft: "2px",
                                      paddingRight: "4px",
                                      verticalAlign: "sub",
                                    }}
                                    theme="twoTone"
                                    type="close-circle"
                                    twoToneColor={
                                      item.review === false ? "red" : "#b8b8b8"
                                    }
                                    onClick={() =>
                                      updateReview(item.id, item.review, false)
                                    }
                                  />
                                </Tooltip>
                                <a
                                  href={`https://aingine-prod.funnelai.com/post/${item.id}/edit`}
                                  target={"_blank"}
                                >
                                  <Button>Edit Labels</Button>
                                </a>
                              </div>
                            )}
                        </BottomInfo>
                      </div>
                    }
                  />
                </ProspectItem>
              )}
            />
          )}
          <LoadingCntr>
            <Spin
              spinning={loading || (scrollLoading && !allResultsShown)}
              tip={
                loading ? "Loading prospects..." : "Loading more prospects..."
              }
            />
            {allResultsShown &&
              rangeFilter &&
              !viewingOlderPosts &&
              !loading ? (
              <>
                <Button
                  type={"link"}
                  onClick={() => {
                    setAllResultsShown(false)
                    setScrollLoading(true)
                    setViewingOlderPosts(true)
                    setRangeFilter(null)
                  }}
                >
                  Click to view older prospects
                </Button>
                <h4>-- End of matches --</h4>
              </>
            ) : allResultsShown &&
              !loading &&
              ((!starredOnly && data.getPosts.data.length) ||
                (starredOnly && data2.getSavedPosts.length)) ? (
              <h4>-- No more matches --</h4>
            ) : null}
          </LoadingCntr>
        </ContentBody>
        {/* Manage filters Modal */}
        <Modal
          title={
            <Tabs
              defaultActiveKey="2"
              size="small"
              tabPosition="top"
              animated={false}
            >
              <TabPane tab="Locations" key="1">
                {userCurrentFilters &&
                  userCurrentFilters
                    .filter(
                      filter =>
                        filter.type === "Text" &&
                        filter.typeName.indexOf("Location") == 0
                    )
                    .map(filter => (
                      <Tag key={filter.id}>
                        {filter.value}{" "}
                        <SVGIcon
                          component={CloseIconBlue}
                          alt="Remove"
                          onClick={() => removeFilterText(filter.id)}
                        />
                      </Tag>
                    ))}
                <br />
                <br />
                <InputButtonGroup>
                  <TextInput
                    style={{ flex: 2 }}
                    reference={locationTag}
                    placeholder={"Add location filter"}
                    name={"locationTag"}
                    onKeyUp={e =>
                      e.keyCode === 13 && saveFilterText("Location")
                    }
                    small
                  />
                  <Button
                    style={{ flex: 1 }}
                    onClick={() => saveFilterText("Location")}
                  >
                    <SVGIcon component={AddIcon} alt="Add" />
                  </Button>
                </InputButtonGroup>
                <br />
                <SwitchContainer>
                  <SwitchCustom
                    disabled={
                      userCurrentFilters.filter(
                        f =>
                          f.type === "Text" &&
                          f.typeName.indexOf("Location") === 0
                      ).length === 0
                        ? true
                        : false
                    }
                    checked={hasUnknownLocationFilter()}
                    onChange={saveUnknownLocationFilter}
                  />{" "}
                  Include posts with unknown locations
                </SwitchContainer>
              </TabPane>
              <TabPane tab="Keywords" key="2">
                {userCurrentFilters &&
                  userCurrentFilters
                    .filter(
                      filter =>
                        filter.type === "Text" &&
                        filter.typeName.indexOf("Keyword") == 0
                    )
                    .map(filter => (
                      <Tag key={filter.id}>
                        {filter.value}{" "}
                        <SVGIcon
                          component={CloseIconBlue}
                          alt="Remove"
                          onClick={() => removeFilterText(filter.id)}
                        />
                      </Tag>
                    ))}
                <br />
                <br />
                <InputButtonGroup>
                  <TextInput
                    style={{ flex: 2 }}
                    reference={keywordTag}
                    placeholder={"Add keyword filter"}
                    name={"keywordTag"}
                    onKeyUp={e => e.keyCode === 13 && saveFilterText("Keyword")}
                    small
                  />
                  <Button
                    style={{ flex: 1 }}
                    onClick={() => saveFilterText("Keyword")}
                  >
                    <SVGIcon component={AddIcon} alt="Add" />
                  </Button>
                </InputButtonGroup>
                <br />
                <SwitchContainer>
                  <SwitchCustom
                    disabled={
                      userCurrentFilters.filter(
                        f =>
                          f.type === "Text" &&
                          f.typeName.indexOf("Keyword") === 0
                      ).length === 0
                        ? true
                        : false
                    }
                    checked={hasMatchAllOptionForKeywordFilter()}
                    onChange={saveFilterAllOrAnyOption}
                    id="KeywordMatchAllSwitch"
                  />{" "}
                  Match All Keywords
                </SwitchContainer>
              </TabPane>
              <TabPane tab="Sources" key="3">
                {multiselectsSubgroup["Sources"] &&
                  multiselectsSubgroup["Sources"].map((filter, index) => (
                    <TestTag key={index} checked={filter.checked}>
                      {filter.value}{" "}
                      {filter.checked ? (
                        <SVGIcon
                          component={CheckIconBlue}
                          alt="Remove"
                          onClick={() => checkFilter(filter, false)}
                        />
                      ) : (
                        <SVGIcon
                          component={AddIcon}
                          alt="Add"
                          onClick={() => checkFilter(filter, true)}
                        />
                      )}
                    </TestTag>
                  ))}
              </TabPane>
            </Tabs>
          }
          visible={manageFiltersVisible}
          onOk={() => setManageFiltersVisible(false)}
          onCancel={() => {
            setManageFiltersVisible(false)
            refreshProspects()
          }}
          bodyStyle={{ padding: 0 }}
          footer={
            // showFilterModalReminder === "true" ? (
            <>
              <ModalReminderCntr>
                <Icon
                  type={"info-circle"}
                  style={{
                    marginTop: "3px",
                    marginRight: "6px",
                    color: Colors.primaryBrandBlue,
                  }}
                />
                <p>Close this window to save filters.</p>
              </ModalReminderCntr>
              {/*<div*/}
              {/*  style={{*/}
              {/*    textAlign: "left",*/}
              {/*    margin: "6px 0 10px 18px",*/}
              {/*  }}*/}
              {/*>*/}
              {/*  <Checkbox onChange={handleCheckFilterReminder}>*/}
              {/*    Do not show message again*/}
              {/*  </Checkbox>*/}
              {/*</div>*/}
            </>
            // ) : null
          }
        />
        {/* Filter settings Modal */}
        <EditPresetModal
          visible={settingsVisible}
          onOk={() => setSettingsVisible(false)}
          onCancel={() => setSettingsVisible(false)}
          presets={userFiltersSets}
          onConfirm={confirmUpdateFilterSet}
          onDelete={updateFilterSet}
        />
        {/* Add preset Modal */}
        <Modal
          title="Add a preset to favorites"
          visible={addPresetVisible}
          onOk={() => setAddPresetVisible(false)}
          onCancel={() => setAddPresetVisible(false)}
          footer={null}
        >
          <ActionGroup>
            <TextInput
              reference={name}
              placeholder={"Enter preset name"}
              name={"name"}
              small
            />
            <ButtonCustom type="primary" onClick={() => saveFilterSet()}>
              Add to favorites
            </ButtonCustom>
          </ActionGroup>
          {!isValidPresetName && (
            <InfoText
              style={{ padding: 8, flexGrow: 1.8, minHeight: 24, color: "red" }}
            >
              Invalid name
            </InfoText>
          )}
        </Modal>
        {/* Prospect response Modal */}
        <Modal
          width={700}
          title={
            selectedPost
              ? `Response to ${selectedPost.name || "..."} from ${selectedPost.source
              }`
              : "Response"
          }
          visible={responseVisible}
          onOk={() => setResponseVisible(false)}
          onCancel={() => {
            setResponseVisible(false)
            response.current.value = ""
          }}
          footer={
            <ActionGroup>
              <TextInput
                id="text"
                reference={response}
                placeholder={"Type a response"}
                name={"response"}
                small
              />
              <Dropdown
                overlay={responsesMenu(userFilters, handleResponseMenuClick)}
                placement={"bottomRight"}
              >
                <ButtonCustom shape="circle">
                  <SVGIcon component={ResponseIcon} alt="Response" />
                </ButtonCustom>
              </Dropdown>
              <TooltipButton
                type="primary"
                tooltip="Copy response & Go to post"
                shape="circle"
                onClick={() => {
                  const responseMessage = response.current.value
                  if (responseMessage.trim()) {
                    handleInitialResponse(responseMessage, selectedPost.id)
                  }
                  changeProspectStatus(
                    selectedPost.id,
                    ProspectStatus.ACCEPTED,
                    selectedPost.url,
                    selectedPost.sourceType !== "CRAIGSLIST"
                  )
                }}
                component={AirplaneIconWhite}
                alt="Accept"
              />
            </ActionGroup>
          }
        >
          {selectedPost && (
            <div>
              <ResponseTitle>
                <p style={{ flex: 9 }}>PROSPECT'S POST</p>
                <p style={{ flex: 1 }}>
                  {moment(selectedPost.timestamp).format("MM.DD.YYYY")}
                </p>
              </ResponseTitle>
              <ResponseBody>{selectedPost.body}</ResponseBody>
            </div>
          )}
        </Modal>
        {selectedPost && (
          <ScreenNameModel
            visible={showScreenNameModal}
            setVisible={setShowScreenNameModal}
            post={selectedPost}
            submitScreenName={submitScreenName}
          />
        )}
      </Content>
    </Container>
  )
}

const Prospect = ({ authData }) => {
  return (
    <UserRoleProtected
      component={Router}
      userRole={"canViewProspects"}
      basepath="/prospect"
      defaultComponent={NoPermissionAlert}
    >
      <ProspectPage authData={authData} path="/" />
    </UserRoleProtected>
  )
}

export default Prospect
