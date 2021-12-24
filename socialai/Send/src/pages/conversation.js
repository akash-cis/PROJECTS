import React, { Fragment, useState, useRef, useEffect } from "react"
import { useQuery, useLazyQuery } from "@apollo/react-hooks"
import {
  GET_DEALS,
  GET_USER_TEAM,
  SEARCH_DEALS,
  GET_MY_COMPANY,
} from "../graphql/query"
import { useMutation } from "@apollo/react-hooks"
import {
  UPDATE_DEAL,
  ADD_COMMENT,
  UPDATE_DEAL_SUBSCRIPTIOM,
  SAVE_INITIAL_SENT,
  PUSH_DEAL_TO_CRM,
} from "../graphql/mutation"
import styled, { css } from "styled-components"
import moment from "moment"
import {
  Input,
  Divider,
  Button,
  Menu,
  Dropdown,
  Icon,
  Checkbox,
  List,
  Avatar,
  Modal,
  Empty,
  DatePicker,
  Timeline,
  message,
  Select,
  Tooltip,
  Alert,
} from "antd"
import TextInput from "../library/textInput"
import {
  Colors,
  DealStatus,
  DealStatusFilters,
  SourceFilters,
  DealStatusSelects,
  TagColors,
  TypeFiltersSelects,
} from "../library/constants"
import {
  ButtonCustom,
  SVGIcon,
  SwitchCustom,
  RadioButtonCustom,
  RadioGroupCustom,
  ActionGroup,
  Tag,
  TagColored,
  Container,
  ContainerNavigation,
  Content,
  ContentSidebar,
  ContentBody,
  LoadingIcon,
  TooltipButton,
  TooltipIcon,
  Label,
} from "../library/basicComponents"

import NoteIcon from "../../static/icons/AddNoteIcon.svg"
import AirplaneIconWhite from "../../static/icons/AirplaneIconWhite.svg"
import RemoveIcon from "../../static/icons/RemoveIcon.svg"
import HandshakeIcon from "../../static/icons/HandshakeIcon.svg"
import ChatIcon2 from "../../static/icons/ChatIcon2.svg"
import LocationIcon from "../../static/icons/LocationIcon2.svg"
import MailIcon from "../../static/icons/MailIcon.svg"
import RemoteCallIcon from "../../static/icons/RemoteCallIcon.svg"
import ContactIcon from "../../static/icons/ContactIcon.svg"
import PhoneIcon from "../../static/icons/PhoneIcon.svg"
import HotIcon from "../../static/icons/HotIcon.svg"
import WarmIcon from "../../static/icons/WarmIcon.svg"
import ColdIcon from "../../static/icons/ColdIcon.svg"
import CloseIcon from "../../static/icons/CloseIcon.svg"
import { UserContext } from "../amplify/authenticator-provider"
import { useContext } from "react"
import NoPermissionAlert from "./no-permission"

import {
  CSVIconWhite,
  XLSIconWhite,
  XMLIconWhite,
  ChatIconWhite,
  UploadIconWhite,
  CheckIconBlue,
  ContainerCustom,
  ContentCustom,
  ContentSidebarCustom,
  FiltersContainer,
  Conversations,
  ContentBodyConversations,
  SelectedDealCntr,
  DealInfoSideBar,
  RadioGroupTitle,
  InternalDivider,
  InfoText,
  OptionContainer,
  ButtonOptionContainer,
  OptionGroup,
  OptionGroupTitle,
  OptionGroupIcon,
  DateOption,
  ExportGroup,
  ExportButton,
  Author,
  Card,
  CardTitle,
  CardSubTitle,
  MessagesContainer,
  MessageBox,
  MessageBoxInfo,
  SwitchContainer,
  TimelineItem,
  DealsContainer,
  TagsContainer,
  InputWithoutBorder,
  ColdProgressBar,
  ColdProgressBadge,
  HotProgressBar,
  HotProgressBadge,
  WarmProgressBar,
  WarmProgressBar2,
  WarmProgressBadge,
  SVGIconBadge,
  PostIconWhite,
  SidebarArrow,
  DealContainer,
  DealProgressContainer,
  DealDataContainer,
  DealData,
  DealInfoText,
  DealInfo,
  PushToCrmContainer,
  FormContainer,
} from "../library/activityComponents"

function handleClick(e) {
  console.log("click", e)
}

const responseMenu = (
  <Menu onClick={handleClick}>
    <Menu.Item key="1">1st item</Menu.Item>
    <Menu.Item key="2">2nd item</Menu.Item>
  </Menu>
)
const signatureMenu = (
  <Menu onClick={handleClick}>
    <Menu.Item key="1">1st item</Menu.Item>
    <Menu.Item key="2">2nd item</Menu.Item>
  </Menu>
)
const todayMenu = (
  <Menu onClick={handleClick}>
    <Menu.Item key="1">Today</Menu.Item>
    <Menu.Item key="2">3 days</Menu.Item>
    <Menu.Item key="3">This week</Menu.Item>
  </Menu>
)

const dateFormat = "YYYY/MM/DD"

const DealStatusIcon = ({ status }) => {
  switch (status) {
    case "ACTIVE":
      return (
        <>
          <SVGIcon
            style={{ fontSize: "14px", marginRight: "4px" }}
            component={ChatIcon2}
            alt={"Active"}
          />
          Active
        </>
      )
    case "DEAL_WON":
      return (
        <>
          <SVGIcon
            style={{ fontSize: "16px", marginRight: "4px" }}
            component={HandshakeIcon}
            alt={"Deal won"}
          />
          Deal Won
        </>
      )
    case "ARCHIVED":
      return (
        <>
          <SVGIcon
            style={{ fontSize: "14px", marginRight: "4px" }}
            component={RemoveIcon}
            alt={"Archived"}
          />
          Archived
        </>
      )
    case "DEAL_LOST":
      return (
        <>
          <SVGIcon
            style={{ fontSize: "14px", marginRight: "4px" }}
            component={CloseIcon}
            alt={"Deal lost"}
          />
          Deal Lost
        </>
      )
    default:
      return status
  }
}

const renderDeal = (item, selectedDeal) => {
  return (
    <DealContainer>
      <DealProgressContainer>
        {item.strength === "COLD" && (
          <>
            <ColdProgressBar />
            <ColdProgressBadge>
              <SVGIconBadge component={ColdIcon} />
            </ColdProgressBadge>
          </>
        )}

        {item.strength === "WARM" && (
          <>
            <WarmProgressBar2 />
            <WarmProgressBar />
            <WarmProgressBadge>
              <SVGIconBadge component={WarmIcon} />
            </WarmProgressBadge>
          </>
        )}

        {item.strength === "HOT" && (
          <>
            <HotProgressBar />
            <HotProgressBadge>
              <SVGIconBadge component={HotIcon} />
            </HotProgressBadge>
          </>
        )}
      </DealProgressContainer>
      <DealDataContainer>
        <DealData>
          <DealInfo flex={1} align={"initial"}>
            <DealInfoText fontSize={14}>
              {item.source.toUpperCase()}
            </DealInfoText>
            <DealInfoText fontSize={18}>{item.screenName}</DealInfoText>
          </DealInfo>
          <DealInfo flex={1} align={"end"}>
            <DealInfoText fontSize={12}>
              {moment(item.dateCreated).format("MM.DD.YYYY")}
            </DealInfoText>
            <DealInfoText fontSize={14}>
              {item.location && (
                <SVGIcon
                  component={LocationIcon}
                  alt="Date"
                  style={{ fontSize: "14px", verticalAlign: "text-top" }}
                />
              )}
              {item.location}
            </DealInfoText>
            <DealInfoText>
              <DealStatusIcon status={item.status} />
            </DealInfoText>
          </DealInfo>
        </DealData>
        <br />
        <TagsContainer selected={selectedDeal && item.id === selectedDeal.id}>
          {item.tags &&
            item.tags.map((t, index) => (
              <TagColored key={index} color={TagColors(t)}>
                {t}
              </TagColored>
            ))}
        </TagsContainer>
      </DealDataContainer>
    </DealContainer>
  )
}

const sampleTags = ["Cold", "New Car", "BMW"]

const doneTypingInterval = 2000

const ConversationPage = () => {
  const search = useRef("")
  const text = useRef("")
  const messagesEndRef = useRef(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [assigned, setAssigned] = useState("")

  const [showSidebar, setShowSideBar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const [exportDealsVisible, setExportDealsVisible] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)
  const [customersOnly, setCustomersOnly] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Active")
  const [selectedOrderFilter, setSelectedOrderFilter] = useState(null)
  const [selectedOrderFilterDir, setSelectedOrderFilterDir] = useState(null)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL")
  const [inputUpdating, setInputUpdating] = useState(null)
  const [pushToCrmModalVisible, setPushToCrmModalVisible] = useState(false)
  const [userTeamData, setUserTeamData] = useState(null)

  const updateMobileResponsive = () => {
    setIsMobile(window.innerWidth < 1120)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    updateMobileResponsive()
    window.addEventListener("resize", updateMobileResponsive)
    return () => {
      window.removeEventListener("resize", updateMobileResponsive)
    }
  }, [])

  useEffect(() => {
    if (selectedDeal) {
      scrollToBottom()
      setTimeout(() => {
        setShowSideBar(!isMobile)
      }, 800)
    }
  }, [isMobile, selectedDeal])

  const { loading, error, data, refetch: refetchDeals } = useQuery(GET_DEALS, {
    variables: {
      status: selectedStatusFilter,
      postType: selectedTypeFilter,
      orderBy: selectedOrderFilter,
      orderDirection: selectedOrderFilterDir,
    },
    onCompleted: res => {
      setSelectedDeal(res.getDeals.length ? res.getDeals[0] : null)
      if (res.getDeals[0]) {
        setSelectedDealDetails(res.getDeals[0])
      }
    },
  })
  const { data: teamData, error: teamError } = useQuery(GET_USER_TEAM)
  const [searchDeals, { data: dealSearchData }] = useLazyQuery(SEARCH_DEALS)
  const [updateDeal] = useMutation(UPDATE_DEAL, {
    onCompleted: res => {
      if (res.updateDeal) {
        setSelectedDeal(res.updateDeal.deal)
      }
    },
  })
  const [addComment] = useMutation(ADD_COMMENT, {
    onCompleted: res => {
      if (res.addDealComment) {
        setSelectedDeal(res.addDealComment.deal)
      }
      refetchDeals()
    },
  })

  const [updateDealSubscription] = useMutation(UPDATE_DEAL_SUBSCRIPTIOM)
  const [saveResponseSent] = useMutation(SAVE_INITIAL_SENT)

  useEffect(() => {
    refetchDeals()
  }, [])

  useEffect(() => {
    if (assigned && selectedDeal && assigned !== selectedDeal.user_id) {
      updateDeal({
        variables: {
          id: selectedDeal.id,
          userId: assigned,
        },
      }).then(d => {
        refetchDeals().then(d => {
          if (d.data.getDeals.length > 0) {
            setSelectedDeal(d.data.getDeals[0])
            setSelectedDealDetails(d.data.getDeals[0])
          } else {
            setSelectedDeal(null)
          }
        })
      })
    }
  }, [assigned])

  const handleOrderFilter = e => {
    if (selectedOrderFilter === e && selectedOrderFilterDir === "asc") {
      setSelectedOrderFilterDir("desc")
    } else if (selectedOrderFilter === e && selectedOrderFilterDir === "desc") {
      setSelectedOrderFilterDir("asc")
    } else {
      setSelectedOrderFilterDir("desc")
    }
    setSelectedOrderFilter(e)
  }

  const updateStatusFilter = async key => {
    await setSelectedStatusFilter(key)
    refetchDeals()
  }

  function handleStatusFilter(e) {
    const key = e.key ? DealStatusFilters[e.key] : e.target.value
    setSelectedDeal(null)
    updateStatusFilter(key)
  }

  const StatusFilter = (
    <Menu onClick={handleStatusFilter}>
      {DealStatusFilters.map((f, index) => (
        <Menu.Item key={index}>{f}</Menu.Item>
      ))}
    </Menu>
  )

  const SourceFiltersM = (
    <Menu onClick={handleClick}>
      {SourceFilters.map((f, index) => (
        <Menu.Item key={index}>
          <SwitchContainer style={{ marginBottom: 0 }}>
            {f} <SwitchCustom onChange={onChangeSourceFilter} />
          </SwitchContainer>
        </Menu.Item>
      ))}
    </Menu>
  )

  const updateTypeFilter = async key => {
    await setSelectedTypeFilter(key)
    refetchDeals()
  }

  function handleTypeFilter(e) {
    setSelectedDeal(null)
    updateTypeFilter(e.key)
  }

  const TypeFilter = (
    <Menu onClick={handleTypeFilter}>
      {TypeFiltersSelects.map(status => (
        <Menu.Item key={status.value}>{status.display}</Menu.Item>
      ))}
    </Menu>
  )

  const setSelectedDealDetails = item => {
    setName(item.firstName)
    setPhone(item.phone)
    setEmail(item.email)
    setAssigned(item?.salesPerson?.id)
  }

  const updateDealDetails = () => {
    let updatedDeal = { id: selectedDeal.id }
    updatedDeal.email = email
    updatedDeal.firstName = name
    updatedDeal.phone = phone
    updateDeal({ variables: updatedDeal }).then(d => {
      refetchDeals()
      setInputUpdating(inputUpdating + "Done")
      setTimeout(() => {
        setInputUpdating(null)
      }, 3500)
    })
  }

  const changeDealStatus = async value => {
    if (selectedStatusFilter) {
      message.info(`Moving conversation to ${DealStatus[value]}`)
    }
    setTimeout(
      async () => {
        let updatedDeal = {
          id: selectedDeal.id,
          status: DealStatus[value],
        }
        await updateDeal({ variables: updatedDeal }).then(d => {
          refetchDeals().then(d => {
            const updatedSelected = d.data.getDeals.filter(
              deal => deal.id === selectedDeal.id
            )
            setSelectedDeal(updatedSelected[0])
          })
        })
      },
      selectedStatusFilter ? 800 : 0
    )
  }

  const addDealComment = () => {
    const note = text.current.value
    text.current.value = ""
    addComment({ variables: { dealId: selectedDeal.id, message: note } }).then(
      d => {
        refetchDeals().then(d => {
          const updatedSelected = d.data.getDeals.filter(
            deal => deal.id === selectedDeal.id
          )
          setSelectedDeal(updatedSelected[0])
        })
      }
    )
  }

  const copyClipboardAndOpenPost = url => {
    if (!selectedDeal) {
      message.error("No deal was selected")
    } else {
      const message = text.current.value
      var copyText = document.getElementById("text")
      copyText.select()
      document.execCommand("copy")
      //openPost(selectedDeal.url)
      if (message.trim()) {
        saveResponseSent({
          variables: {
            aingineId: selectedDeal.aingineDataId,
            response: message,
          },
        }).then(d => {
          text.current.value = ""
          refetchDeals().then(d => {
            const updatedSelected = d.data.getDeals.filter(
              deal => deal.id === selectedDeal.id
            )
            setSelectedDeal(updatedSelected[0])
          })
        })
      }
    }
  }

  const openPost = url => {
    if (!selectedDeal && !url) {
      message.error("No deal was selected")
    } else {
      window.open(url || selectedDeal.url, "_blank")
    }
  }

  const subscribeToPost = checked => {
    let curDeal = selectedDeal
    curDeal.subscribed = checked
    setSelectedDeal(curDeal)
    updateDealSubscription({
      variables: {
        dealId: selectedDeal.id,
        subscribed: checked,
      },
    }).then(d => {
      let curDeal = selectedDeal
      curDeal.subscribed = checked
      setSelectedDeal(curDeal)
      refetchDeals()
    })
  }

  const activateNotifications = checked => {
    const updatedDeal = { id: selectedDeal.id }
    updatedDeal.allowNotifications = checked

    updateDeal({ variables: updatedDeal }).then(d => {
      refetchDeals().then(d => {
        const updatedSelected = d.data.getDeals.filter(
          deal => deal.id === selectedDeal.id
        )
        setSelectedDeal(updatedSelected[0])
      })
    })
  }

  const onChangeSourceFilter = () => {
    console.log("change source filter")
  }

  const onChangeCustomersOnly = checked => {
    setCustomersOnly(checked)
  }

  let typingTimer

  const handleKeyupTimer = () => {
    clearTimeout(typingTimer)
    typingTimer = setTimeout(updateDealDetails, doneTypingInterval)
  }

  const handleKeyDownTimer = () => {
    clearTimeout(typingTimer)
  }

  const getTypeFilterName = () => {
    return TypeFiltersSelects.filter(t => t.value === selectedTypeFilter)[0]
      .display
  }

  useEffect(() => {
    if (teamData) {
      setUserTeamData(teamData)
    }
  }, [teamData])

  return (
    <ContainerCustom id={"conversation-cntr"}>
      {teamError && console.log("error", teamError)}
      <ContainerNavigation>
        <div>
          {/* NOTE: Temporary hidden */}
          {/* Customers only <SwitchCustom onChange={onChangeCustomersOnly} /> */}
        </div>
        <div>
          {/* {customersOnly && (
            <Dropdown overlay={todayMenu} trigger={["click"]}>
              <ButtonCustom>
                Life events <Icon type="down" />
              </ButtonCustom>
            </Dropdown>
          )} */}
          <Dropdown overlay={TypeFilter}>
            <ButtonCustom>
              {getTypeFilterName()} <Icon type="down" />
            </ButtonCustom>
          </Dropdown>
          <Dropdown overlay={StatusFilter}>
            <ButtonCustom>
              {selectedStatusFilter || "Select status filter"}{" "}
              <Icon type="down" />
            </ButtonCustom>
          </Dropdown>
          {/* NOTE: Temporary hidden */}
          {/* <Dropdown overlay={SourceFiltersM} trigger={['click']}>
            <ButtonCustom>
              {selectedSourceFilter || 'Select source filter'}  <Icon type="down" />
            </ButtonCustom>
          </Dropdown> */}
          <Dropdown overlay={todayMenu}>
            <ButtonCustom>
              Today <Icon type="down" />
            </ButtonCustom>
          </Dropdown>
        </div>
      </ContainerNavigation>
      <ContentCustom>
        {!showSidebar && (
          <Tooltip
            placement="topLeft"
            title={showSidebar ? "Hide Conversations" : "Show Conversations"}
          >
            <SidebarArrow left onClick={() => setShowSideBar(true)}>
              <Icon type="right" />
            </SidebarArrow>
          </Tooltip>
        )}
        {showSidebar && (
          <ContentSidebarCustom flex={4}>
            <Tooltip
              placement="top"
              title={showSidebar ? "Hide Conversations" : "Show Conversations"}
            >
              <SidebarArrow right onClick={() => setShowSideBar(false)}>
                <Icon type="left" />
              </SidebarArrow>
            </Tooltip>
            <FiltersContainer>
              <OptionContainer>
                <OptionGroup>
                  {showOptions ? "Hide options" : "Show options"}
                  <Icon
                    type="down"
                    onClick={() => setShowOptions(!showOptions)}
                  />
                </OptionGroup>
                {showOptions && (
                  <>
                    {/* TODO: filter by from here (copy nav filtering) */}
                    <RadioGroupTitle>FILTER BY</RadioGroupTitle>
                    <RadioGroupCustom
                      buttonStyle="solid"
                      value={selectedStatusFilter}
                      onChange={e => handleStatusFilter(e)}
                    >
                      <RadioButtonCustom key={0} value={"Active"}>
                        Active
                      </RadioButtonCustom>
                      <RadioButtonCustom key={1} value={"Deal Won"}>
                        Won
                      </RadioButtonCustom>
                      <RadioButtonCustom key={2} value={"Deal Lost"}>
                        Lost
                      </RadioButtonCustom>
                      <RadioButtonCustom key={3} value={""}>
                        All
                      </RadioButtonCustom>
                    </RadioGroupCustom>
                    {/* TODO: order by */}
                    <RadioGroupTitle>ORDER BY</RadioGroupTitle>
                    <RadioGroupCustom
                      buttonStyle="solid"
                      value={selectedOrderFilter}
                    >
                      <RadioButtonCustom
                        disabled
                        key={1}
                        value={"score"}
                        onClick={() => handleOrderFilter("score")}
                      >
                        Score
                      </RadioButtonCustom>
                      <RadioButtonCustom
                        disabled
                        key={2}
                        value={"credit"}
                        onClick={() => handleOrderFilter("credit")}
                      >
                        Credit
                      </RadioButtonCustom>
                      <RadioButtonCustom
                        key={3}
                        value={"date_created"}
                        onClick={() => handleOrderFilter("date_created")}
                      >
                        Time
                      </RadioButtonCustom>
                    </RadioGroupCustom>
                    {/* <InternalDivider/>
                <ExportButton onClick={() => setExportDealsVisible(true)}>
                  Export deals
                  <SVGIcon component={ExportIcon} alt="Export"/>
                </ExportButton> */}
                  </>
                )}
                <InternalDivider />
                <OptionGroup>
                  <Input.Search
                    onSearch={value => {
                      if (value.length > 0) {
                        setShowSearchResults(true)
                        searchDeals({
                          variables: {
                            searchTerm: value,
                          },
                        })
                      } else {
                        setShowSearchResults(false)
                      }
                    }}
                    placeholder={"Search deals"}
                    name={"search"}
                    allowClear={true}
                  />
                </OptionGroup>
              </OptionContainer>
              <InternalDivider />
            </FiltersContainer>
            <DealsContainer>
              {loading && <LoadingIcon type="loading" />}
              {error && <h4>Error...</h4>}
              {!loading && !error && !data.getDeals.length && (
                <Empty description={<span>No deals found</span>} />
              )}
              {!loading && !error && (
                <List
                  itemLayout="horizontal"
                  dataSource={
                    dealSearchData &&
                    dealSearchData.searchDeals.length > 0 &&
                    showSearchResults
                      ? dealSearchData.searchDeals
                      : data.getDeals
                  }
                  renderItem={item => (
                    <List.Item
                      key={item.id}
                      style={{
                        padding: "1em",
                        background:
                          selectedDeal && selectedDeal.id === item.id
                            ? "#E6F0FF"
                            : "none",
                      }}
                    >
                      <List.Item.Meta
                        title={<a href={item.url}>{item.description}</a>}
                        description={renderDeal(item, selectedDeal)}
                        onClick={() => {
                          setSelectedDeal(item)
                          setSelectedDealDetails(item)
                        }}
                      />
                    </List.Item>
                  )}
                />
              )}
            </DealsContainer>
          </ContentSidebarCustom>
        )}
        <SelectedDealCntr>
          <ContentBodyConversations>
            <Conversations>
              {/* TODO: sample, remove later */}
              {customersOnly && (
                <Card>
                  <CardTitle>
                    <div>
                      SAMPLE LIFE EVENT
                      <br />
                      <CardSubTitle>Date</CardSubTitle>
                    </div>
                    <div>
                      <ButtonCustom
                        style={{
                          backgroundColor: "#90246C",
                          borderColor: "#90246C",
                          color: "white",
                        }}
                      >
                        Open Post
                        <SVGIcon component={PostIconWhite} alt="Open Post" />
                      </ButtonCustom>
                      <ButtonCustom type="primary">
                        Respond
                        <SVGIcon component={ChatIconWhite} alt="Respond" />
                      </ButtonCustom>
                    </div>
                  </CardTitle>
                </Card>
              )}
              {selectedDeal &&
                selectedDeal.conversations.length > 0 &&
                selectedDeal.conversations
                  .filter(c => c.type === "NOTE")
                  .map(c => (
                    <Card key={c.id}>
                      <CardTitle>
                        NOTE
                        <div>
                          {selectedDeal.salesPerson?.fullName} posted at{" "}
                          {moment(c.postTime).format(
                            "ddd, MMMM Do YYYY, h:mm:ss A"
                          )}
                        </div>
                      </CardTitle>
                      <div>{c.message}</div>
                    </Card>
                  ))}
              <MessagesContainer>
                {selectedDeal &&
                  selectedDeal.conversations.length > 0 &&
                  selectedDeal.conversations
                    .filter(c => c.type === "ORIGINAL")
                    .map(c => (
                      <MessageBox key={c.id} original>
                        <h4>Original Message</h4>
                        {c.message}
                        <br />
                        <br />
                        <MessageBoxInfo>
                          {selectedDeal.screenName} posted at{" "}
                          {moment(c.postTime).format(
                            "ddd, MMMM Do YYYY, h:mm:ss A"
                          )}
                        </MessageBoxInfo>
                      </MessageBox>
                    ))}
                {selectedDeal &&
                  selectedDeal.conversations.length > 0 &&
                  selectedDeal.conversations
                    .filter(c => c.type !== "NOTE" && c.type !== "ORIGINAL")
                    .sort((a, b) => {
                      const aPostTime = moment(a.postTime).valueOf()
                      const bPostTime = moment(b.postTime).valueOf()
                      if (aPostTime < bPostTime) {
                        return -1
                      }
                      if (aPostTime > bPostTime) {
                        return 1
                      }
                      return 0
                    })
                    .map(c => (
                      <Fragment key={c.id}>
                        {c.type === "RECEIVED" ? (
                          <MessageBox key={c.id}>
                            {c.message}
                            <br />
                            <br />
                            <MessageBoxInfo>
                              {selectedDeal.screenName} posted at{" "}
                              {moment(c.postTime).format(
                                "ddd, MMMM Do YYYY, h:mm:ss A"
                              )}
                            </MessageBoxInfo>
                          </MessageBox>
                        ) : (
                          <MessageBox key={c.id} sent>
                            {c.message}
                            <br />
                            <br />
                            <MessageBoxInfo>
                              {selectedDeal.salesPerson?.fullName} posted at{" "}
                              {moment(c.postTime).format(
                                "ddd, MMMM Do YYYY, h:mm:ss A"
                              )}
                            </MessageBoxInfo>
                          </MessageBox>
                        )}
                      </Fragment>
                    ))}
              </MessagesContainer>
              <div ref={messagesEndRef} />
            </Conversations>

            <InternalDivider />
            <OptionContainer style={{ height: "25px" }}>
              <OptionGroup>
                <TextInput
                  id="text"
                  reference={text}
                  placeholder={"type a response..."}
                  name={"text"}
                  regular
                  noBorder
                />
                <TooltipButton
                  tooltip="Add Note"
                  disabled={!selectedDeal}
                  shape="circle"
                  onClick={() => addDealComment()}
                  component={NoteIcon}
                  alt="Notes"
                />
                {/* NOTE: Temporary hidden */}
                {/* TODO: add signatures feature */}
                {/* <Dropdown overlay={signatureMenu}>
                <ButtonCustom disabled={!selectedDeal} shape="circle">
                  <SVGIcon component={SignatureIcon} alt="Signatures" />
                </ButtonCustom>
              </Dropdown> */}
                {/* TODO: add responses feature */}
                {/* <Dropdown overlay={responseMenu}>
                <ButtonCustom disabled={!selectedDeal} shape="circle">
                  <SVGIcon component={ResponseIcon} alt="Responses" />
                </ButtonCustom>
              </Dropdown> */}
                <TooltipButton
                  tooltip="Copy text & Go to post"
                  type="primary"
                  disabled={!selectedDeal}
                  shape="circle"
                  onClick={() => copyClipboardAndOpenPost()}
                  component={AirplaneIconWhite}
                  alt="Send"
                />
              </OptionGroup>
            </OptionContainer>
            <InternalDivider />
          </ContentBodyConversations>
          <DealInfoSideBar flex={3}>
            <Avatar size={100}>
              {selectedDeal
                ? selectedDeal.avatar
                  ? selectedDeal.avatar
                  : selectedDeal.screenName
                  ? selectedDeal.screenName.substring(0, 1).toUpperCase()
                  : "X"
                : "X"}
            </Avatar>
            {selectedDeal && (
              <Author>
                <SVGIcon component={ChatIcon2} alt="Responses" />{" "}
                {selectedDeal.screenName}
              </Author>
            )}
            <br />
            <OptionContainer>
              <OptionGroup onClick={() => setShowDetails(!showDetails)}>
                <OptionGroupTitle>Prospect Details</OptionGroupTitle>
                <Icon type="down" />
              </OptionGroup>
              {showDetails && (
                <>
                  <br />
                  <OptionGroup>
                    <OptionGroupIcon component={ContactIcon} alt="Name" />
                    <InputWithoutBorder
                      placeholder="add a name"
                      value={name}
                      onKeyUp={handleKeyupTimer}
                      onKeyDown={handleKeyDownTimer}
                      onChange={e => {
                        setName(e.target.value)
                        setInputUpdating("name")
                      }}
                    />
                    {inputUpdating === "name" ? (
                      <Icon type={"loading"} />
                    ) : inputUpdating === "nameDone" ? (
                      <Icon type={"check"} />
                    ) : null}
                  </OptionGroup>
                  <InternalDivider />
                  <OptionGroup>
                    <OptionGroupIcon component={MailIcon} alt="Email" />
                    <InputWithoutBorder
                      placeholder="add an email"
                      value={email}
                      onKeyUp={handleKeyupTimer}
                      onKeyDown={handleKeyDownTimer}
                      onChange={e => {
                        setEmail(e.target.value)
                        setInputUpdating("email")
                      }}
                    />
                    {inputUpdating === "email" ? (
                      <Icon type={"loading"} />
                    ) : inputUpdating === "emailDone" ? (
                      <Icon type={"check"} />
                    ) : null}
                  </OptionGroup>
                  <InternalDivider />
                  <OptionGroup>
                    <OptionGroupIcon component={PhoneIcon} alt="Phone" />
                    <InputWithoutBorder
                      placeholder="add phone nr"
                      value={phone}
                      onKeyUp={handleKeyupTimer}
                      onKeyDown={handleKeyDownTimer}
                      onChange={e => {
                        setPhone(e.target.value)
                        setInputUpdating("phone")
                      }}
                    />
                    {inputUpdating === "phone" ? (
                      <Icon type={"loading"} />
                    ) : inputUpdating === "phoneDone" ? (
                      <Icon type={"check"} />
                    ) : null}
                  </OptionGroup>
                  <InternalDivider />
                  <OptionGroup>
                    <OptionGroupIcon component={RemoteCallIcon} alt="Date" />
                    <Select
                      placeholder="Choose a person"
                      defaultValue={selectedDeal?.salesPerson?.id}
                      value={assigned || selectedDeal?.salesPerson?.id}
                      onChange={value => setAssigned(value)}
                      style={{ width: "100%" }}
                      disabled={
                        !userTeamData ||
                        (userTeamData.me.teamsLeader.length === 0 &&
                          (!userTeamData.me.isCompanyAdmin ||
                            userTeamData.me.company.userAccounts.length === 0))
                      }
                    >
                      {userTeamData &&
                      userTeamData.me.isCompanyAdmin &&
                      userTeamData.me.company.userAccounts.length > 0 ? (
                        userTeamData.me.company.userAccounts.map(user => (
                          <Select.Option
                            value={user.user.id}
                            key={user.user.id}
                          >
                            {user.user.fullName}
                          </Select.Option>
                        ))
                      ) : userTeamData &&
                        userTeamData.me.teamsLeader.length > 0 ? (
                        teamMemberOptions(userTeamData.me.teamsLeader).map(
                          member => (
                            <Select.Option
                              value={member.member.id}
                              key={member.member.id}
                            >
                              {member.member.fullName}
                            </Select.Option>
                          )
                        )
                      ) : (
                        <Select.Option value={selectedDeal?.salesPerson?.id}>
                          {selectedDeal?.salesPerson?.fullName}
                        </Select.Option>
                      )}
                    </Select>
                  </OptionGroup>
                </>
              )}
              <InternalDivider />
              {/*<OptionGroup onClick={() => setShowTimeline(!showTimeline)}>*/}
              {/*  <OptionGroupTitle>*/}
              {/*    {!showTimeline ? "Show timeline" : "Posts timeline"}*/}
              {/*  </OptionGroupTitle>*/}
              {/*  <Icon type="down" />*/}
              {/*</OptionGroup>*/}
              {/*{!showTimeline && <InternalDivider />}*/}
              {/*{showTimeline && (*/}
              {/*  <>*/}
              {/*    <br />*/}
              {/*    <Timeline>*/}
              {/*      /!* TODO: add link icon *!/*/}
              {/*      {selectedDeal &&*/}
              {/*        selectedDeal.conversations.map(*/}
              {/*          c => (*/}
              {/*            <TimelineItem key={c.id} color="grey">*/}
              {/*              {moment(c.postTime).format("HH:mm MM.DD.YYYY")}*/}
              {/*            </TimelineItem>*/}
              {/*          )*/}
              {/*          // <SVGIcon style={{ fontSize: '14px'}} component={LinkIcon}/>*/}
              {/*        )}*/}
              {/*    </Timeline>*/}
              {/*    <InternalDivider />*/}
              {/*  </>*/}
              {/*)}*/}
            </OptionContainer>
            <br />
            {/* NOTE: Temporary hidden */}
            {/* <OptionContainer>
            <ButtonCustom disabled>
              Credit Score<SVGIcon component={CreditIcon} alt="Credit Score"/>
            </ButtonCustom>
          </OptionContainer>
          <br/> */}
            <ButtonOptionContainer>
              <SwitchContainer>
                Subscribe to post{" "}
                <SwitchCustom
                  disabled={selectedDeal?.subscribed === null}
                  checked={selectedDeal?.subscribed}
                  onChange={subscribeToPost}
                />
              </SwitchContainer>
              <SwitchContainer>
                Notifications{" "}
                <SwitchCustom
                  disabled={selectedDeal?.subscribed === null}
                  checked={
                    selectedDeal?.allowNotifications === null
                      ? true
                      : selectedDeal?.allowNotifications
                  }
                  onChange={activateNotifications}
                />
              </SwitchContainer>
              <OptionGroupTitle style={{ textAlign: "left" }}>
                Status
              </OptionGroupTitle>
              <Select
                disabled={!selectedDeal}
                // value={}
                value={selectedDeal ? selectedDeal.status : undefined}
                placeholder={"Update status"}
                onChange={e => changeDealStatus(e)}
              >
                {DealStatusSelects.map(status => (
                  <Select.Option value={status.value} key={status.value}>
                    {status.display}
                  </Select.Option>
                ))}
              </Select>
              <br />
              <ButtonCustom
                style={{
                  backgroundColor: "#90246C",
                  borderColor: "#90246C",
                  color: "white",
                  margin: 0,
                }}
                onClick={() => openPost()}
              >
                Open Post
                <SVGIcon component={PostIconWhite} alt="Open Post" />
              </ButtonCustom>
              <br />
              <ButtonCustom
                type="primary"
                style={{ margin: 0 }}
                onClick={() => setPushToCrmModalVisible(true)}
              >
                Push to CRM
                <SVGIcon component={UploadIconWhite} alt="Push to CRM" />
              </ButtonCustom>
            </ButtonOptionContainer>
          </DealInfoSideBar>
        </SelectedDealCntr>
        {/* Export Modal */}
        <Modal
          title="Export deals"
          visible={exportDealsVisible}
          onOk={() => setExportDealsVisible(false)}
          onCancel={() => setExportDealsVisible(false)}
          footer={null}
        >
          <ActionGroup style={{ flexDirection: "column" }}>
            <ExportGroup>
              <DateOption>
                Start Date
                <br />
                <DatePicker
                  defaultValue={moment("2015/01/01", dateFormat)}
                  format={dateFormat}
                />
              </DateOption>
              <DateOption>
                End Date
                <br />
                <DatePicker
                  defaultValue={moment("2015/01/01", dateFormat)}
                  format={dateFormat}
                />
              </DateOption>
            </ExportGroup>

            <br />
            <Checkbox checked={false}>All users</Checkbox>
            <br />

            <ExportGroup>
              <ButtonCustom type="primary">
                .csv
                <SVGIcon component={CSVIconWhite} alt="CSV" />
              </ButtonCustom>
              <ButtonCustom type="primary">
                Excel
                <SVGIcon component={XLSIconWhite} alt="XLS" />
              </ButtonCustom>
              <ButtonCustom type="primary">
                xml
                <SVGIcon component={XMLIconWhite} alt="XML" />
              </ButtonCustom>
            </ExportGroup>
          </ActionGroup>
        </Modal>
        {pushToCrmModalVisible && (
          <PushToCrmModal
            pushToCrmModalVisible={pushToCrmModalVisible}
            setPushToCrmModalVisible={setPushToCrmModalVisible}
            changeDealStatus={changeDealStatus}
            conversations={
              selectedDeal && selectedDeal.conversations.length
                ? selectedDeal.conversations
                : []
            }
            selectedDeal={selectedDeal}
          />
        )}
      </ContentCustom>
    </ContainerCustom>
  )
}

const Conversation = ({ authData }) => {
  const { user } = useContext(UserContext)
  if (
    user &&
    user.role &&
    (user.role["canViewClm"] || user.role["canViewProspects"])
  ) {
    return <ConversationPage authData={authData} />
  } else if (user && user.role.name !== "default") {
    return <NoPermissionAlert />
  } else {
    return null
  }
}

export default Conversation

const PushToCrmModal = ({
  pushToCrmModalVisible,
  setPushToCrmModalVisible,
  changeDealStatus,
  conversations,
  selectedDeal,
}) => {
  const combinedConversation = conversations.reduce(
    (accumulator, conversation) => {
      let author =
        conversation.type === "NOTE" || conversation.type === "SENT"
          ? "Me"
          : "Customer"
      return `${accumulator}${
        accumulator.length > 0 ? "\n" : ""
      }[${author} @ ${moment(conversation.postTime).format(
        "HH:mm MM.DD.YYYY"
      )}] ${conversation.message.trim().replace(/\s\s+/g, " ")}`
    },
    ""
  )
  const pushToCrmFormInitialValues = {
    companyId: selectedDeal.companyId,
    dealId: selectedDeal.id,
    aingineDataId: selectedDeal.aingineDataId,
    typeOfLead: "",
    status: "",
    interest: "",
    year: "0000",
    make: "N/A",
    model: "N/A",
    contactFirstName: selectedDeal.firstName ? selectedDeal.firstName : "",
    contactLastName: selectedDeal.lastName ? selectedDeal.lastName : "",
    contactFullName: `${(selectedDeal.firstName ? selectedDeal.firstName : "") +
      " " +
      (selectedDeal.lastName ? selectedDeal.lastName : "")}`,
    contactEmail: selectedDeal.email ? selectedDeal.email : "",
    contactPhoneNumber: selectedDeal.phone ? selectedDeal.phone : "",
    contactAddressLine1: "",
    contactAddressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    comments: combinedConversation,
  }
  const [error, setError] = useState("")
  const [pushToCrmForm, setPushToCrmForm] = useState(pushToCrmFormInitialValues)
  const year = useRef("")
  const make = useRef("")
  const model = useRef("")
  const contactFirstName = useRef("")
  const contactLastName = useRef("")
  const contactFullName = useRef("")
  const contactEmail = useRef(`${selectedDeal.email}`)
  const contactPhoneNumber = useRef(`${selectedDeal.phone}`)
  const contactAddressLine1 = useRef("")
  const contactAddressLine2 = useRef("")
  const city = useRef("")
  const state = useRef("")
  const zip = useRef("")
  const country = useRef("")
  const comments = useRef(combinedConversation)
  const [
    pushDealToCrm2,
    {
      loading: pushDealToCrmLoading,
      error: pushDealToCrmError,
      called: pushDealToCrmCalled,
    },
  ] = useMutation(PUSH_DEAL_TO_CRM)
  const pushDealToCrm = value => {
    pushDealToCrm2(value)
  }
  useEffect(() => {
    if (pushDealToCrmCalled) {
      if (!pushDealToCrmError) {
        changeDealStatus("DEAL_WON")
      }
      setPushToCrmModalVisible(false)
    }
  }, [pushDealToCrmCalled])

  const updatePushToCrmForm = (field, value) => {
    setPushToCrmForm(prevState => {
      const newState = { ...prevState }
      newState[field] = value
      return newState
    })
  }
  const validatePushToCrmSubmitValues = (pushToCrmSubmitValues, setError) => {
    let requirmentsSatisfied = true
    if (
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
        pushToCrmSubmitValues.contactEmail
      ) == false
    ) {
      setError("You have entered an invalid email address")
      requirmentsSatisfied = false
    }
    if (
      (!pushToCrmSubmitValues.contactEmail ||
        pushToCrmSubmitValues.contactEmail == "") &&
      (!pushToCrmSubmitValues.contactPhoneNumber ||
        pushToCrmSubmitValues.contactPhoneNumber == "")
    ) {
      requirmentsSatisfied = false
      setError("Email or Phone number must be entered")
    }
    if (
      !pushToCrmSubmitValues.contactLastName ||
      pushToCrmSubmitValues.contactLastName == ""
    ) {
      requirmentsSatisfied = false
      setError("Last name must be entered")
    }
    if (
      !pushToCrmSubmitValues.contactFirstName ||
      pushToCrmSubmitValues.contactFirstName == ""
    ) {
      requirmentsSatisfied = false
      setError("First name must be entered")
    }
    if (
      !pushToCrmSubmitValues.interest ||
      pushToCrmSubmitValues.interest == ""
    ) {
      requirmentsSatisfied = false
      setError("Interest (Buy/Sell) must be selected")
    }
    if (!pushToCrmSubmitValues.status || pushToCrmSubmitValues.status == "") {
      requirmentsSatisfied = false
      setError("Status (New/Used) must be selected")
    }
    if (
      !pushToCrmSubmitValues.typeOfLead ||
      pushToCrmSubmitValues.typeOfLead == ""
    ) {
      requirmentsSatisfied = false
      setError("Type of lead must be selected")
    }
    return requirmentsSatisfied
  }
  const handlePushToCrm = () => {
    const pushToCrmSubmitValues = {
      ...pushToCrmForm,
      year: pushToCrmForm.year ? pushToCrmForm.year : "0000",
      make: pushToCrmForm.make ? pushToCrmForm.make : "N/A",
      model: pushToCrmForm.model ? pushToCrmForm.model : "N/A",
    }
    if (validatePushToCrmSubmitValues(pushToCrmSubmitValues, setError)) {
      setError("")
      pushDealToCrm({
        variables: pushToCrmSubmitValues,
      })
      // changeDealStatus("DEAL_WON")
      // setPushToCrmModalVisible(false)
    }
  }
  const handleCancel = () => {
    setPushToCrmModalVisible(false)
  }
  const { Option } = Select
  const { TextArea } = Input

  return (
    <Modal
      title="Push To CRM"
      visible={pushToCrmModalVisible}
      onOk={() => setPushToCrmModalVisible(false)}
      onCancel={() => setPushToCrmModalVisible(false)}
      width={700}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handlePushToCrm}>
          Send
        </Button>,
      ]}
    >
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      <FormContainer>
        <Select
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          placeholder="Select the type of lead"
          onChange={value => updatePushToCrmForm("typeOfLead", value)}
        >
          <Option key={""} value={""} disabled>
            Select the type of lead
          </Option>
          <Option key={"sales"} value={"sales"}>
            Sales
          </Option>
          <Option key={"parts"} value={"parts"}>
            Parts
          </Option>
          <Option key={"service"} value={"service"}>
            Service
          </Option>
        </Select>
        <Select
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          placeholder="Select the condition"
          onChange={value => updatePushToCrmForm("status", value)}
        >
          <Option key={""} value={""} disabled>
            Select the condition
          </Option>
          <Option key={"new"} value={"new"}>
            New
          </Option>
          <Option key={"used"} value={"used"}>
            Used
          </Option>
        </Select>
        <Select
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          placeholder="Select the interest"
          onChange={value => updatePushToCrmForm("interest", value)}
        >
          <Option key={""} value={""} disabled>
            Select the interest
          </Option>
          <Option key={"buy"} value={"buy"}>
            Buy
          </Option>
          <Option key={"sell"} value={"sell"}>
            Sell
          </Option>
        </Select>
        <Input
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          reference={year}
          placeholder={"Year"}
          name={"year"}
          onChange={e => updatePushToCrmForm("year", e.target.value)}
        />
        <Input
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          reference={make}
          placeholder={"Make"}
          name={"make"}
          onChange={e => updatePushToCrmForm("make", e.target.value)}
        />
        <Input
          style={{ width: "180px", margin: "0 18px 10px 18px" }}
          reference={model}
          placeholder={"Model"}
          name={"model"}
          onChange={e => updatePushToCrmForm("model", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={contactFirstName}
          placeholder={"Contact First Name"}
          name={"contactFirstName"}
          defaultValue={`${
            selectedDeal.firstName ? selectedDeal.firstName : ""
          }`}
          onChange={e =>
            updatePushToCrmForm("contactFirstName", e.target.value)
          }
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={contactLastName}
          placeholder={"Contact Last Name"}
          name={"contactLastName"}
          defaultValue={`${selectedDeal.lastName ? selectedDeal.lastName : ""}`}
          onChange={e => updatePushToCrmForm("contactLastName", e.target.value)}
        />
        <Input
          style={{ width: "612px", margin: "0 18px 10px 18px" }}
          reference={contactFullName}
          placeholder={"Contact Full Name"}
          name={"contactFullName"}
          defaultValue={() => {
            var fullName = ""
            if (selectedDeal.firstName) {
              fullName = selectedDeal.firstName
            }
            if (selectedDeal.lastName) {
              fullName +=
                (fullName.length > 0 ? " " : "") + selectedDeal.lastName
            }
            return fullName
          }}
          onChange={e => updatePushToCrmForm("contactFullName", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={contactEmail}
          placeholder={"Contact Email"}
          name={"contactEmail"}
          defaultValue={`${selectedDeal.email ? selectedDeal.email : ""}`}
          onChange={e => updatePushToCrmForm("contactEmail", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={contactPhoneNumber}
          placeholder={"Contact Phone Number"}
          name={"contactPhoneNumber"}
          defaultValue={`${selectedDeal.phone ? selectedDeal.phone : ""}`}
          onChange={e =>
            updatePushToCrmForm("contactPhoneNumber", e.target.value)
          }
        />
        <Input
          style={{ width: "612px", margin: "0 18px 10px 18px" }}
          reference={contactAddressLine1}
          placeholder={"Contact Address Line 1"}
          name={"contactAddressLine1"}
          onChange={e =>
            updatePushToCrmForm("contactAddressLine1", e.target.value)
          }
        />
        <Input
          style={{ width: "612px", margin: "0 18px 10px 18px" }}
          reference={contactAddressLine2}
          placeholder={"Contact Address Line 2"}
          name={"contactAddressLine2"}
          onChange={e =>
            updatePushToCrmForm("contactAddressLine2", e.target.value)
          }
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={city}
          placeholder={"City"}
          name={"city"}
          onChange={e => updatePushToCrmForm("city", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={state}
          placeholder={"State"}
          name={"state"}
          onChange={e => updatePushToCrmForm("state", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={zip}
          placeholder={"ZIP"}
          name={"zip"}
          onChange={e => updatePushToCrmForm("zip", e.target.value)}
        />
        <Input
          style={{ width: "288px", margin: "0 18px 10px 18px" }}
          reference={country}
          placeholder={"Country"}
          name={"country"}
          onChange={e => updatePushToCrmForm("country", e.target.value)}
        />
        <TextArea
          rows={5}
          style={{ width: "612px", margin: "0 18px" }}
          reference={comments}
          placeholder={"Comments"}
          name={"comments"}
          defaultValue={`${combinedConversation}`}
          onChange={e => updatePushToCrmForm("comments", e.target.value)}
        />
      </FormContainer>
    </Modal>
  )
}

const teamMemberOptions = teamLeader => {
  const existingMembers = []
  teamLeader.map(tl => {
    tl.members.map(m => {
      if (!existingMembers.find(mx => mx.member.id === m.member.id)) {
        existingMembers.push(m)
      }
    })
  })
  return existingMembers
}
