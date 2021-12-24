import React, { useContext, useEffect, useState, useRef } from "react"
import { UserContext } from "../amplify/authenticator-provider"
import { Link, navigate } from "gatsby"
import { Auth } from "aws-amplify"
import styled from "styled-components"
import {
  Avatar,
  Menu,
  Dropdown,
  Icon,
  Modal,
  Alert,
  Input,
  message,
  Badge,
  Empty,
  List,
  Divider,
  Select,
} from "antd"
import InfiniteScroll from "react-infinite-scroller"
import { SVGIcon } from "../library/basicComponents"
import BellIcon from "../../static/icons/BellIconBlue.svg"
import NotificationIcon from "../../static/icons/BellIcon.svg"
import AnalyticsIcon from "../../static/icons/AnalyticsIcon.svg"
import ProspectsIcon from "../../static/icons/ProspectsIcon.svg"
import ConversationsIcon from "../../static/icons/ConversationsIcon.svg"
import LifeEventsIcn from "../../static/icons/LifeEventsIcn.svg"
import EngagementIcon from "../../static/icons/MailIcon.svg"

import CogIcon from "../../static/icons/CogIcon.svg"
import ExportIcon from "../../static/icons/ExportIcon.svg"
import Logo from "../../static/Logo.svg"
import { getCognitoRoles } from "../hooks/utils"
import { useQuery, useLazyQuery, useMutation } from "@apollo/react-hooks"
import gql from "graphql-tag"
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATIONS_COUNT,
} from "../graphql/query"
import {
  CREATE_USAGE_EVENT,
  SUBMIT_SUPPORT_TICKET,
  UPDATE_NOTIFICATION,
  UPDATE_USER_FILTERS,
  UPDATE_USER_DEFAULT_COMPANY_ID,
  CREATE_FCM_DEVICE,
  DELETE_FCM_DEVICE,
} from "../graphql/mutation"
import { useInterval, usePageVisibilityWithBeatTracker } from "../hooks"
import moment from "moment"
import { Colors, FilterSetTypes } from "../library/constants"
import { parseTimestamp } from "../library/utils"
import UserRoleProtected from "./userRoleProtected"

import Toast from "./toast/Toast"
import checkIcon from "../icons/svg/Toast/check.svg"
import errorIcon from "../icons/svg/Toast/error.svg"
import infoIcon from "../icons/svg/Toast/info.svg"
import warningIcon from "../icons/svg/Toast/warning.svg"
import firebase from "../components/firebaseInit/firebase"
import { getMessaging, getToken } from "firebase/messaging"

import io from "socket.io-client"

let endPoint = (
  process.env.GATSBY_API_URL || "http://localhost:5000/graphql"
).replace("/graphql", "")

const ME = gql`
  query ME {
    me {
      id
      email
      firstName
      lastName
      fullName
      isDisabled
      company {
        id
        name
        isDisabled
        aingineSourceId
        timezone
        locationLink
        isOptinConsentMethod
        userRoles {
          id
          companyId
          userId
          role {
            name
            canCreateUsers
            canCreateTeams
            canViewProspects
            isCompanyAdmin
            canViewAutoAnalytics
            canViewAdExport
            canViewClm
            canViewGle
            canViewEngagements
          }
        }
      }
      userAccounts {
        isDisabled
        company {
          id
          name
          isDisabled
          aingineSourceId
          isOptinConsentMethod
        }
      }
      role {
        name
        canCreateUsers
        canCreateTeams
        canViewProspects
        isCompanyAdmin
        canViewAutoAnalytics
        canViewAdExport
        canViewClm
        canViewGle
        canViewEngagements
      }
      teamsLeader {
        id
      }
    }
  }
`

const fsIdentify = process.env.GATSBY_FS_ORG_ID
  ? user => {
      window.FS.identify(`${user.id}`, {
        displayName: `${user.fullName}`,
        email: `${user.email}`,
        company: `${user.company.name}`,
      })
    }
  : user => {
      console.log("Fullstory dev env placeholder: " + user.fullName)
    }

const MainContainer = styled.div`
  display: flex;
  /*height: 100vh;*/
`

/**
 * A styled navigation bar
 */
const NavBar = styled.div`
  background-color: #ffffff;
  position: fixed;
  top: 0;
  display: flex;
  overflow: hidden;
  width: 100%;
  height: 3em;
  z-index: 5;
  border: 1px solid #eeeef1;
  font-family: Helvetica;
  font-size: 22px;
  color: #00648d;
  letter-spacing: 0;
  padding-right: 16px;
  a {
    margin-right: 4px;
  }
`

/**
 * A styled main menu
 */
const MenuBar = styled.div`
  background-color: #ffffff;
  /*height: 100%;*/
  margin-top: 76px;
  z-index: 0;
  flex: 0 98px;
  display: inline-block;
  border: 1px solid #eeeef1;
  border-top: 0;
  font-family: Helvetica;
  //font-size: 24px;
  color: #00648d;
  letter-spacing: 0;
  //padding: 0.5em;
  text-align: center;
  @media (max-width: 668px) {
    display: none;
  }
`

/**
 * The styled content
 */

const Content = styled.div`
  background-color: #f5f6fa;
  min-height: 98vh;
  z-index: ${props => (props.fullScreen ? "9" : "0")};
  flex: 400px;
  display: inline-block;
  /*padding: 5em 2em 2em 2em;*/
  font-family: Helvetica;
  max-width: 100%;
  padding: ${props => (props.fullScreen ? "0" : "5em 2em 2em 2em")};
  @media (max-width: 1024px) {
    padding-right: ${props => (props.fullScreen ? "0" : "10px")};
    padding-left: ${props => (props.fullScreen ? "0" : "10px")};
    max-width: auto !important;
  }
`

const Title = styled.div`
  height: 3em;
  line-height: 3em;
  padding-left: 1.5em;
  flex: 20;
  @media (max-width: 668px) {
    padding-left: 18px;
  }
  @media (max-width: 668px) {
    padding-left: 18px;
    font-size: 20px;
    line-height: 3.5em;
  }
`

/**
 * Must change background color when is active
 */
const MenuButton = styled(Link)`
  font-family: Helvetica;
  font-size: 13px;
  color: #5e5e5e;
  letter-spacing: 0;
  text-align: center;
  line-height: 18px;
  border-radius: 4px;
  text-decoration: none;
`

const MenuIcon = styled.div`
  background: #fbfafa;
  border-radius: 4px;
  height: 30px;
  width: 30px;
  margin: 0.5em auto;
  margin-top: 0.8em;
  &.active {
    background: #e6f0ff; // <Thing> when hovered
  }
`

const MenuImg = styled(SVGIcon)`
  margin-top: 20%;
  font-size: 28px;
`

const HomeButton = styled(Link)`
  text-align: center;
  flex: 0 70px;
  margin: 0.5em 0 0 0;
`

const HomeImg = styled(SVGIcon)`
  font-size: 48px;
`

const DropdownMenu = styled.a`
  margin-top: 0.5em;
  flex: 1;
  max-width: 50px;
`

const ProfileButton = styled(Avatar)`
  background-color: #e6f0ff;
  color: #00648d;
`

const SettingsIcon = styled(Icon)`
  width: 30px;
  margin: 0;
`

const MobileMenu = styled(Icon)`
  font-size: 22px;
  color: ${Colors.darkGray};
  margin-top: 25px;
  display: none;
  cursor: pointer;
  @media (max-width: 668px) {
    display: initial;
  }
`

const MobileDropdown = styled(Dropdown)`
  display: none;
  @media (max-width: 668px) {
     {
      display: initial;
    }
  }
`

const MobileMenuIcon = styled(SVGIcon)`
  font-size: 16px;
  margin-right: 8px;
`

const NotificationTitle = styled.div`
  color: #c4c1c2;
  font-size: 12px;
  padding: 10px;
`

const NotificationType = styled.div`
  color: #c4c1c2;
  font-size: 12px;
`

const NotificationBody = styled.div`
  font-size: 12px;
  color: #5e5e5e;
`

const NotificationDate = styled.div`
  font-size: 10px;
  color: #c4c1c2;
`

const NotificationContainer = styled.div`
  display: flex;
`

const NotificationContent = styled.div`
  padding-left: 10px;
`

const NotificationIconContainer = styled.div`
  background-color: #fbfafa;
  height: 40px;
  width: 40px;
  border-radius: 45px;
  text-align: center;
  vertical-align: middle;
`

const InfiniteScrollContainer = styled.div`
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: auto;
  height: 300px;
  scrollbar-width: thin !important;
  &::-webkit-scrollbar {
    width: 7px;
    background-color: #f1f1f1;
  }

  &::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 0px grey;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    -webkit-box-shadow: inset 0 0 6px grey;
    background-color: #fcfcfc;
  }
`

const NotificationDivider = styled(Divider)`
  margin: 0;
`

const SupportButton = styled.div`
  margin-top: 0.5em;
  flex: 1;
  cursor: pointer;
  max-width: 50px;
  margin-right: 4px;
`

const notifTypeMap = {
  RESPONSE: NotificationIcon,
  LIFE_EVENTS: LifeEventsIcn,
  PROSPECTS: ProspectsIcon,
  ANALYTICS: AnalyticsIcon,
  CONVERSATIONS: ConversationsIcon,
  OTHER: NotificationIcon,
}

const mobileMenu = (token, setShowSupportOrg, deleteFcmDeviceOrg) => (
  <Menu>
    {getCognitoRoles(token) === "ADMIN" && (
      <Menu.Item>
        <Link to={"/admin-dashboard"}>
          <MobileMenuIcon component={CogIcon} alt="Admin" />
          Admin
        </Link>
      </Menu.Item>
    )}
    {getCognitoRoles(token) !== "ADMIN" && (
      <Menu.Item>
        <Link to={"/analytics/kpis"}>
          <MobileMenuIcon component={AnalyticsIcon} alt="Analytics" />
          Analytics
        </Link>
      </Menu.Item>
    )}
    {getCognitoRoles(token) !== "ADMIN" && (
      <Menu.Item>
        <Link to={"/prospect"}>
          <MobileMenuIcon component={ProspectsIcon} alt="Prospects" />
          Prospects
        </Link>
      </Menu.Item>
    )}
    {/* {getCognitoRoles(token) !== "ADMIN" && (
      <UserRoleProtected component={Menu.Item} userRole={"canViewClm"}>
        <Link to={"/life-events"}>
          <MobileMenuIcon component={LifeEventsIcn} alt="Life Events" />
          Life Events
        </Link>
      </UserRoleProtected>
    )} */}
    {getCognitoRoles(token) !== "ADMIN" && (
      <UserRoleProtected component={Menu.Item} userRole={"canViewEngagements"}>
        <Link to={"/engagements"}>
          <MobileMenuIcon component={EngagementIcon} alt="Engagements" />
          Engagements
        </Link>
      </UserRoleProtected>
    )}
    {/* {getCognitoRoles(token) !== "ADMIN" && (
      <UserRoleProtected component={Menu.Item} userRole={"canViewEngagements"}>
        <Link to={"/engagements/dashboard"}>
          <MobileMenuIcon component={EngagementIcon} alt="Engagements" />
          Engagements
        </Link>
      </UserRoleProtected>
    )} */}
    {getCognitoRoles(token) !== "ADMIN" && (
      <Menu.Item>
        <Link to={"/conversation"}>
          <MobileMenuIcon component={ConversationsIcon} alt="Conversations" />
          Conversations
        </Link>
      </Menu.Item>
    )}
    {getCognitoRoles(token) !== "ADMIN" && (
      <UserRoleProtected component={Menu.Item} userRole={"canViewAdExport"}>
        <Link to={"/personalized-ads"}>
          <MobileMenuIcon component={ExportIcon} alt="Personalized Ad Export" />
          Personalized Ads Export
        </Link>
      </UserRoleProtected>
    )}
    <Menu
      onClick={e =>
        handleProfileMenuClick(e, setShowSupportOrg, deleteFcmDeviceOrg)
      }
      style={{ marginRight: "5px", marginTop: "-2px", paddingLeft: "0px" }}
    >
      <Menu.Item key="support" style={{ paddingLeft: "5px" }}>
        <span>
          <SettingsIcon
            type="question-circle"
            style={{ marginRight: "0px", paddingRight: "0px" }}
          />{" "}
          Support
        </span>
      </Menu.Item>
    </Menu>
  </Menu>
)

const notificationsDropdown = (
  list,
  setShowNotifModal,
  setSelectedNotif,
  getMoreNotifications,
  hasMore
) => {
  return (
    <InfiniteScrollContainer>
      <NotificationTitle>NOTIFICATIONS</NotificationTitle>
      <NotificationDivider />
      <InfiniteScroll
        initialLoad={false}
        pageStart={0}
        loadMore={() => getMoreNotifications()}
        hasMore={hasMore}
        useWindow={false}
      >
        <List
          style={{ padding: 10 }}
          dataSource={list && list.getNotifications}
          renderItem={n => (
            <List.Item
              style={{ cursor: "pointer" }}
              key={n.id}
              onClick={() =>
                handleNotifMenuClick(n, setShowNotifModal, setSelectedNotif)
              }
            >
              <NotificationContainer>
                <NotificationIconContainer>
                  <Badge count={n.read ? 0 : 1} dot>
                    <SVGIcon
                      component={notifTypeMap[n.notificationType]}
                      alt="Notifications"
                      style={{ fontSize: "24px", marginTop: 7 }}
                    />
                  </Badge>
                </NotificationIconContainer>
                <NotificationContent>
                  <NotificationType>{n.notificationType}</NotificationType>
                  <NotificationBody>{n.text}</NotificationBody>
                  <NotificationDate>
                    {parseTimestamp(moment.utc(n.date))}
                  </NotificationDate>
                </NotificationContent>
              </NotificationContainer>
            </List.Item>
          )}
        ></List>
      </InfiniteScroll>
    </InfiniteScrollContainer>
  )
}

const profileMenu = (setShowSupport, deleteFcmDevice) => (
  <Menu
    onClick={e => handleProfileMenuClick(e, setShowSupport, deleteFcmDevice)}
    style={{ width: "140px", marginRight: "12px", marginTop: "-2px" }}
  >
    <Menu.Item key="settings">
      <div>
        <SettingsIcon type="setting" /> Settings
      </div>
    </Menu.Item>
    <Menu.Item key="support">
      <div>
        <SettingsIcon type="question-circle" /> Support
      </div>
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item key="logout">
      <div>
        <SettingsIcon type="logout" />
        Log out
      </div>
    </Menu.Item>
  </Menu>
)

function handleProfileMenuClick(e, setShowSupport, deleteFcmDevice) {
  const signOut = () => {
    Auth.signOut().then(data => {
      let regData = {
        registrationId: sessionStorage.getItem("fcmToken"),
      }
      const res = deleteFcmDevice({
        variables: {
          ...regData,
        },
      }).then(res => {})
      sessionStorage.clear()
    })
  }
  switch (e.key) {
    case "logout":
      navigate("/")
      signOut()
      break
    case "settings":
      navigate("/settings")
      break
    case "support":
      setShowSupport(true)
      break
    default:
      break
  }
}

function handleNotifMenuClick(notif, setShowNotifModal, setSelectedNotif) {
  setShowNotifModal(true)
  setSelectedNotif(notif)
}

const titleMap = {
  "/analytics": "Analytics",
  "/prospect": "Prospects",
  "/life-events": "Life Events",
  "/engagements": "Engagements",
  "/conversation": "Conversations",
  "/admin-dashboard": "Admin Dashboard",
  "/settings": "Settings",
  "/personalized-ads": "Personalized Ad Export",
}

const Layout = ({ children, authData, updateUser }) => {
  const { user, fullScreen, setNotificationData } = useContext(UserContext)

  const [userFullName, setUserFullName] = useState(user ? user.fullName : "")
  const [userId, setUserId] = useState(user ? user.id : "")
  const [userAccounts, setUserAccounts] = useState(
    user ? user.userAccounts : ""
  )
  const [userAccountOptions, setUserAccountOptions] = useState(null)
  const [showUserAccountOptions, setShowUserAccountOptions] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showNotifModal, setShowNotifModal] = useState()
  const [selectedNotif, setSelectedNotif] = useState({})
  const [currentUserCompany, setcurrentUserCompany] = useState(user.company.id)
  const [canRedirect, setCanRedirect] = useState(true)
  const location = window.location.pathname
  const accessPayload = authData.signInUserSession.accessToken.payload

  const [list, setList] = useState([])
  let toastProperties = null
  let checkValue = true
  let autoDeleteTime = 10

  const showToast = (type, title, message) => {
    const id = Math.floor(Math.random() * 101 + 1)

    switch (type) {
      case "success":
        toastProperties = {
          id,
          title: title,
          description: message,
          backgroundColor: "#5cb85c",
          icon: checkIcon,
        }
        break
      case "danger":
        toastProperties = {
          id,
          title: title,
          description: message,
          backgroundColor: "#d9534f",
          icon: errorIcon,
        }
        break
      case "info":
        toastProperties = {
          id,
          title: title,
          description: message,
          backgroundColor: "#5bc0de",
          icon: infoIcon,
        }
        break
      case "warning":
        toastProperties = {
          id,
          title: title,
          description: message,
          backgroundColor: "#f0ad4e",
          icon: warningIcon,
        }
        break
    }
    setList([...list, toastProperties])
  }

  const [createFcmDevice] = useMutation(CREATE_FCM_DEVICE)
  const [deleteFcmDevice] = useMutation(DELETE_FCM_DEVICE)

  const [getMe, { data: meData, error: meError }] = useLazyQuery(ME, {
    fetchPolicy: "network-only",
    onCompleted: result => {
      const allActiveUserAccounts = result.me.userAccounts.filter(res => {
        if (!res.company.isDisabled && !res.isDisabled) {
          return true
        }
      })
      const allUserAccounts = allActiveUserAccounts.map(res => {
        return res.company
      })
      const isUserActiveInCompany = allActiveUserAccounts.filter(res => {
        if (result.me.company.id == res.company.id) {
          return res.company
        }
      })
      if (
        (result.me.company.isDisabled || isUserActiveInCompany.length == 0) &&
        allUserAccounts.length > 0
      ) {
        updateUserDefaultCompanyId({
          variables: { companyId: allUserAccounts[0].id, userId: result.me.id },
        })
        setCanRedirect(false)
        user.company.isDisabled = false
      }
    },
  })

  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)

  const {
    data: notifications,
    refetch: refetchNotifications,
    fetchMore: fetchMoreNotifications,
  } = useQuery(GET_NOTIFICATIONS)
  const [updateNotification] = useMutation(UPDATE_NOTIFICATION, {
    onCompleted: res => {
      refetchNotifications()
      refetchNotificationsCount()
    },
  })
  const [
    updateUserDefaultCompanyId,
    setUpdateUserDefaultCompanyId,
  ] = useMutation(UPDATE_USER_DEFAULT_COMPANY_ID, {
    onCompleted: res => {
      window.location.href = "/"
    },
  })
  const {
    data: notificationsCount,
    refetch: refetchNotificationsCount,
  } = useQuery(GET_UNREAD_NOTIFICATIONS_COUNT)
  const [hasMore, setHasMore] = useState(true)

  const [createUsageEvent] = useMutation(CREATE_USAGE_EVENT, {
    onCompleted: res => {
      let now = moment()
      let eventId = sessionStorage.getItem("eventId")
      let controlTime = sessionStorage.getItem("controlTime")
      let diff = now.diff(controlTime, "days")
      // let diff = now.diff(controlTime, 'minutes') // test only
      if (!eventId) {
        sessionStorage.setItem("eventId", res.createUsageEvent.event.id)
        sessionStorage.setItem("controlTime", now)
      } else if (eventId && diff >= 1) {
        sessionStorage.removeItem("eventId")
        sessionStorage.removeItem("controlTime")
      }
    },
  })
  function handleChange(value) {
    setcurrentUserCompany(user.company.id)
    updateUserDefaultCompanyId({
      variables: { companyId: value, userId: user.id },
    })
  }

  usePageVisibilityWithBeatTracker(({ verb, context, duration }) => {
    if (Auth.user) {
      let storedEventId = sessionStorage.getItem("eventId")
      createUsageEvent({
        variables: {
          verb,
          // context: typeof context !== "undefined" ? context : null,
          context: location,
          duration,
          eventId: storedEventId !== undefined ? storedEventId : null,
        },
      })
    }
  })

  // Ask for new notifications each minute
  useInterval(() => {
    refetchNotifications()
    refetchNotificationsCount()
  }, 60000)

  useEffect(() => {
    if (meData) {
      updateUser(meData.me)
      fsIdentify(user)
      const fcmToken = sessionStorage.getItem("fcmToken") || ""
      const messaging = getMessaging()
      if (fcmToken == "" || fcmToken == null) {
        getToken(messaging, {
          vapidKey:
            "BD9Q8PAslpLGvoeuQCN1a_fv73mWko26NSgto01DqjkyxYxvsK4PqL8Hs9ykuLZpIHGD16USpahBy0_fQnvdcfM",
        })
          .then(currentToken => {
            if (currentToken) {
              let data = {
                registrationId: currentToken,
              }
              const res = createFcmDevice({
                variables: {
                  ...data,
                },
              }).then(res => {
                if (res?.data?.createFcmDevice?.statusCode == 200) {
                  sessionStorage.setItem("fcmToken", currentToken)
                }
              })
            } else {
              console.log(
                "No registration token available. Request permission to generate one."
              )
            }
          })
          .catch(err => {
            console.log("An error occurred while retrieving token. ", err)
          })
      }
    }
  }, [meData])

  useEffect(() => {
    getMe()
  }, [location])

  useEffect(() => {
    if (location === "/") {
      if (getCognitoRoles(accessPayload)[0] === "ADMIN") {
        navigate("/admin-dashboard")
      } else {
        navigate("/analytics/kpis")
      }
    }
    if (user) {
      setUserFullName(user.fullName)
      setcurrentUserCompany(user.company.id)
      let socket = io.connect(`${endPoint}`)
      socket.on("received_message", data => {
        if (data && data.user_id == parseInt(user.id)) {
          showToast("success", "New Message", data.message)
          setNotificationData({ ...data })
        }
      })
      return () => socket.disconnect()
    }
  }, [user])
  useEffect(() => {
    if (user.userAccounts) {
      setUserAccounts(user.userAccounts)
      if (
        user.userAccounts.length > 1 &&
        getCognitoRoles(accessPayload)[0] !== "ADMIN"
      ) {
        setShowUserAccountOptions(true)
      }
      let userAccountOpts = user.userAccounts.map(userAccount => (
        <Option
          key={userAccount.id}
          title={userAccount.name}
          value={userAccount.id}
        >
          {userAccount.name}
        </Option>
      ))
      setUserAccountOptions(userAccountOpts)
    }
  }, [user])

  useEffect(() => {
    if (meError) {
      if (meError.message.includes("Unauthorized")) {
        Auth.signOut().then(data => {
          sessionStorage.clear()
        })
      } else if (meError.message.includes("Signature has expired")) {
        Auth.currentSession()
          .then(session => session.getRefreshToken())
          .then(refreshToken => Auth.user.refreshSession(refreshToken))
      }
    }
  }, [meError])

  if (
    user &&
    user.company &&
    (user.isDisabled || user.company.isDisabled) &&
    canRedirect
  ) {
    Auth.signOut().then(data => {
      sessionStorage.clear()
    })
  }

  const markeNotifAsRead = () => {
    updateNotification({ variables: { id: selectedNotif.id, read: true } })
  }

  const getMoreNotifications = () => {
    const lastNotification =
      notifications.getNotifications[notifications.getNotifications.length - 1]
    fetchMoreNotifications({
      variables: { older: lastNotification.date },
      updateQuery: (prev, { fetchMoreResult }) => {
        return {
          getNotifications: [
            ...prev.getNotifications,
            ...fetchMoreResult.getNotifications,
          ],
        }
      },
    }).then(d => {
      if (d.notifications && d.notifications.getNotifications.length === 0) {
        setHasMore(false)
      }
    })
  }
  const currentPath = `/${children.props.location.pathname.split("/")[1]}`

  return (
    <div>
      <NavBar>
        <HomeButton to={"/prospect"}>
          <HomeImg component={Logo} alt="SocialMiningAi" />
        </HomeButton>
        <Toast
          toastList={list}
          autoDelete={checkValue}
          autoDeleteTime={autoDeleteTime}
        />
        <MobileDropdown
          overlay={mobileMenu(
            accessPayload[0],
            setShowSupportModal,
            deleteFcmDevice
          )}
        >
          <MobileMenu type={"menu"} />
        </MobileDropdown>
        <Title>{titleMap[currentPath]}</Title>
        <>
          <Select
            value={currentUserCompany}
            style={{
              minWidth: "200px",
              paddingTop: "17px",
              paddingRight: "15px",
              display: showUserAccountOptions ? "block" : "none",
            }}
            onChange={handleChange}
          >
            {userAccountOptions}
          </Select>
          <Dropdown
            overlay={notificationsDropdown(
              notifications,
              setShowNotifModal,
              setSelectedNotif,
              getMoreNotifications,
              hasMore
            )}
            trigger={["click"]}
            placement={"bottomRight"}
          >
            <DropdownMenu title="Notifications" href="#">
              <Badge
                count={
                  notificationsCount
                    ? notificationsCount.getUnreadNotificationsCount
                    : 0
                }
                style={{ backgroundColor: "red" }}
              >
                <ProfileButton title="Notifications" shape="circle">
                  <SVGIcon
                    title="Notifications"
                    component={BellIcon}
                    alt="Notifications"
                    style={{ fontSize: "14px" }}
                  />
                </ProfileButton>
              </Badge>
            </DropdownMenu>
          </Dropdown>

          <SupportButton
            title="Support"
            onClick={e =>
              handleProfileMenuClick(
                { key: "support" },
                setShowSupportModal,
                deleteFcmDevice
              )
            }
          >
            <Badge style={{ backgroundColor: "#00648D" }}>
              <ProfileButton title="Support" shape="circle">
                <Icon title="Support" type="question-circle" />
              </ProfileButton>
            </Badge>
          </SupportButton>

          <Dropdown
            overlay={profileMenu(setShowSupportModal, deleteFcmDevice)}
            trigger={["click"]}
            placement={"bottomRight"}
          >
            <DropdownMenu href="#" style={{ paddingTop: "0.1em" }}>
              <ProfileButton>{convertToInitials(userFullName)}</ProfileButton>
            </DropdownMenu>
          </Dropdown>
        </>
      </NavBar>
      <MainContainer style={{ position: "relative" }}>
        <MenuBar>
          {getCognitoRoles(accessPayload)[0] === "ADMIN" && (
            <MenuButton to={"/admin-dashboard"}>
              <MenuIcon>
                <MenuImg component={CogIcon} alt="Admin" />
              </MenuIcon>
              Admin
            </MenuButton>
          )}
          {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <MenuButton to={"/analytics/kpis"}>
              <MenuIcon>
                <MenuImg component={AnalyticsIcon} alt="Analytics" />
              </MenuIcon>
              Analytics
              <br />
              <br />
            </MenuButton>
          )}
          {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <UserRoleProtected
              component={MenuButton}
              userRole={"canViewProspects"}
              to={"/prospect"}
            >
              <MenuIcon>
                <MenuImg component={ProspectsIcon} alt="Prospects" />
              </MenuIcon>
              Prospects
              <br />
              <br />
            </UserRoleProtected>
          )}
          {/* {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <UserRoleProtected
              component={MenuButton}
              userRoles={["canViewClm", "canViewGle"]}
              to={"/life-events"}
            >
              <MenuIcon>
                <MenuImg component={LifeEventsIcn} alt="clm" />
              </MenuIcon>
              Life Events
              <br />
              <br />
            </UserRoleProtected>
          )} */}
          {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <UserRoleProtected
              component={MenuButton}
              userRoles={["canViewEngagements"]}
              to={"/engagements"}
            >
              <MenuIcon>
                <MenuImg component={EngagementIcon} alt="clm" />
              </MenuIcon>
              {"Engagements"}
              <br />
              <br />
            </UserRoleProtected>
          )}
          {getCognitoRoles(accessPayload)[0] !== "ADMIN" &&
            user &&
            user.role &&
            (user.role["canViewClm"] || user.role["canViewProspects"]) && (
              <MenuButton to={"/conversation"}>
                <MenuIcon>
                  <MenuImg component={ConversationsIcon} alt="Conversations" />
                </MenuIcon>
                Conversations
                <br />
                <br />
              </MenuButton>
            )}
          {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <UserRoleProtected
              component={MenuButton}
              userRole={"canViewAdExport"}
              to={"/personalized-ads"}
            >
              <MenuIcon>
                <MenuImg component={ExportIcon} alt="Ad Export" />
              </MenuIcon>
              {"Personalized \n Ads Export"}
              <br />
              <br />
            </UserRoleProtected>
          )}

          {getCognitoRoles(accessPayload)[0] !== "ADMIN" && (
            <Menu
              onClick={e =>
                handleProfileMenuClick(e, setShowSupportModal, deleteFcmDevice)
              }
              id="supportmenu"
              className="cokRuL"
              style={{
                borderRight: "none",
                left: "3px",
                bottom: "80px",
                position: "absolute",
              }}
              title="Feedback/Support"
            >
              <Menu.Item
                key="support"
                style={{
                  marginRight: "0px",
                  backgroundColor: "#ffffff",
                  color: "rgb(133, 133, 133)",
                  height: "75px",
                  lineHeight: "20px",
                  padding: "0 10px",
                }}
                title="Feedback/Support"
              >
                {
                  <Icon
                    title="Feedback/Support"
                    type="question-circle"
                    style={{
                      fontSize: "28px",
                      marginRight: "0px",
                      marginTop: "0px",
                      display: "block",
                      paddingBottom: "5px",
                    }}
                  />
                }
                Feedback / <br /> Support
              </Menu.Item>
            </Menu>
          )}
        </MenuBar>
        <Content fullScreen={fullScreen || false}>{children}</Content>
      </MainContainer>
      {showNotifModal && (
        <NotificationModal
          visible={showNotifModal}
          setVisible={setShowNotifModal}
          notification={selectedNotif}
          markAsRead={markeNotifAsRead}
        />
      )}
      {showSupportModal && (
        <SupportModal
          visible={showSupportModal}
          setVisible={setShowSupportModal}
        />
      )}
    </div>
  )
}

export default Layout

const convertToInitials = string => {
  if (typeof string !== "string") {
    return null
  }
  return string
    .split(" ")
    .slice(0, 2)
    .map(word => word.slice(0, 1).toUpperCase())
    .join("")
}

const NotificationModal = ({
  visible,
  setVisible,
  notification,
  markAsRead,
}) => {
  return (
    <Modal
      title="Notification"
      visible={visible}
      onOk={() => {
        markAsRead()
        setVisible(false)
      }}
      onCancel={() => setVisible(false)}
    >
      {/* {selectedNotif && selectedNotif.notificationType}<br/>
      {selectedNotif && selectedNotif.text}<br/>
      {selectedNotif && selectedNotif.date} */}
      {notification && (
        <NotificationContainer>
          <NotificationIconContainer>
            <Badge count={notification.read ? 0 : 1} dot>
              <SVGIcon
                component={notifTypeMap[notification.notificationType]}
                alt="Notifications"
                style={{ fontSize: "24px", marginTop: 7 }}
              />
            </Badge>
          </NotificationIconContainer>
          <NotificationContent>
            <NotificationType>{notification.notificationType}</NotificationType>
            <NotificationBody>{notification.text}</NotificationBody>
            <NotificationDate>
              {parseTimestamp(
                moment(new Date(notification.date), "DD/MM/YYYY HH:mm:ss")
              )}
            </NotificationDate>
          </NotificationContent>
        </NotificationContainer>
      )}
    </Modal>
  )
}

const SupportModal = ({ visible, setVisible }) => {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")

  const [submitSupport] = useMutation(SUBMIT_SUPPORT_TICKET)

  const handleSupportSubmit = () => {
    if (subject.trim() && body.trim()) {
      setError("")
      submitSupport({
        variables: {
          subject: subject,
          message: body,
        },
      }).then(d => {
        message.success("Message Sent")
        setVisible(false)
      })
    } else {
      setError("Please fill out all fields")
    }
  }

  return (
    <Modal
      title={"Need to report an issue? Have a question?"}
      visible={visible}
      onCancel={() => setVisible(false)}
      okText={"Send"}
      onOk={handleSupportSubmit}
    >
      <h4>Send us a message</h4>
      <p>
        Submit this form and a SocialMiningAi representative will contact you
        soon.
      </p>

      <label>Subject</label>
      <Input onChange={e => setSubject(e.target.value)} name={"subject"} />
      <br />
      <label>Message</label>
      <Input.TextArea
        rows={5}
        onChange={e => setBody(e.target.value)}
        name={"body"}
      />
      <br />
      {error && <Alert message={error} type={"error"} />}
    </Modal>
  )
}
