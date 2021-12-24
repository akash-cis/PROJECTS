import React, { useState, useEffect } from "react"
import { Auth } from "aws-amplify"
import { ApolloProvider } from "@apollo/react-hooks"
import Layout from "../components/layout"
import { CustomSignIn } from "../components/login/customSignIn"
import CustomForgotPassword from "../components/login/customForgotPassword"
import {
  ConfirmSignIn,
  ConfirmSignUp,
  ForgotPassword,
  RequireNewPassword,
  SignIn,
  SignUp,
  VerifyContact,
  withAuthenticator,
} from "aws-amplify-react"
import CustomRequireNewPassword from "../components/login/CustomRequireNewPassword"
import CustomVerifyContact from "../components/login/customVerifyContact"
import ApolloClient from "apollo-boost"
import { InMemoryCache } from "apollo-cache-inmemory"
import resolvers from "../graphql/resolvers"
import typeDefs from "../graphql/typeDefs"

const getJwtToken = async () => {
  return new Promise((resolve, reject) => {
    let storedToken = sessionStorage.getItem("token")
    let exp = sessionStorage.getItem("exp")
    let isExpired = false
    if (exp) {
      let expiredDate = new Date(parseInt(exp))
      isExpired = expiredDate <= new Date()
    }
    if (!storedToken || !exp || isExpired) {
      Auth.currentSession()
        .then(session => session.getAccessToken())
        .then(accessToken => {
          const jwtToken = accessToken.getJwtToken()
          sessionStorage.setItem("token", jwtToken)
          sessionStorage.setItem(
            "exp",
            (accessToken.payload.exp * 1000).toString()
          )
          resolve(jwtToken)
        })
    } else {
      resolve(storedToken)
    }
  })
}

const refreshToken = () => {
  return new Promise(async (resolve, reject) => {
    let storedToken = sessionStorage.getItem("token")
    let exp = sessionStorage.getItem("exp")
    let almostExpired = false
    if (exp) {
      let expiredDate = new Date(parseInt(exp) - 15 * 60 * 1000)
      almostExpired = expiredDate <= new Date()
    }
    if (!storedToken || !exp || almostExpired) {
      try {
        const cognitoUser = await Auth.currentAuthenticatedUser()
        const currentSession = await Auth.currentSession()
        cognitoUser.refreshSession(
          currentSession.refreshToken,
          (err, session) => {
            const { idToken, refreshToken, accessToken } = session
            const jwtToken = accessToken.getJwtToken()
            sessionStorage.setItem("token", jwtToken)
            sessionStorage.setItem(
              "exp",
              (accessToken.payload.exp * 1000).toString()
            )
            resolve(jwtToken)
          }
        )
      } catch (e) {
        console.log("Unable to refresh Token", e)
        reject()
      }
    } else {
      resolve(storedToken)
    }
  })
}

export const UserContext = React.createContext()

const AuthenticatorProvider = props => {
  const [client, setClient] = useState(null)
  const [token, setToken] = useState(null)
  const [auth, setAuth] = useState(null)
  const [fullScreen, setMaximizeScreen] = useState(false)
  const [notificationData, setNotificationData] = useState(null)

  const [user, setUser] = useState({
    email: "",
    fullName: "",
    isDisabled: false,
    company: {
      name: "",
      isDisabled: false,
      aingineSourceId: null,
      isOptinConsentMethod: false,
    },
    role: {
      name: "default",
      canCreateTeams: false,
      canCreateUsers: false,
      canViewProspects: false,
    },
    teamsLeader: null,
  })

  const updateUser = user => {
    user.token = token
    const allActiveUserAccounts = user.userAccounts.filter(res => {
      if (!res.company.isDisabled && !res.isDisabled) {
        return true
      }
    })
    const allUserAccounts = allActiveUserAccounts.map(res => {
      return res.company
    })
    let userRoleObj = user.role
    // if(typeof user.company.userRoles.length >0 ){
    //   userRoleObj=user.company.userRoles[0].role;
    // }
    if (user?.company?.userRoles?.length > 0) {
      const found = user.company.userRoles.find(
        x => x.userId === Number(user.id)
      )
      userRoleObj = found ? found.role : userRoleObj
    }
    const userTemp = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isDisabled: user.isDisabled,
      company: {
        id: user.company.id,
        name: user.company.name,
        isDisabled: user.company.isDisabled,
        aingineSourceId: user.company.aingineSourceId,
        timezone: user.company.timezone,
        isOptinConsentMethod: user.company.isOptinConsentMethod,
      },
      // role: user.role,
      role: userRoleObj,
      teamsLeader: user.teamsLeader,
      userAccounts: allUserAccounts.sort((a, b) => (a.name > b.name ? 1 : -1)),
    }
    user = userTemp
    console.log('-------------------')
    console.log(user)
    setUser(user)
  }

  useEffect(() => {
    getJwtToken().then(t => {
      setToken(t)
    })
    setClient(
      new ApolloClient({
        uri: process.env.GATSBY_API_URL || "http://localhost:5000/graphql",
        cache: new InMemoryCache(),
        request: operation => {
          const sesstionToken = sessionStorage.getItem("token")
          const _token = sesstionToken ? sesstionToken : token
          operation.setContext({
            headers: {
              authorization: _token ? `Bearer ${_token}` : "",
            },
          })
        },
        resolvers,
        typeDefs,
      })
    )
    const refreshInterval = setInterval(() => {
      refreshToken().then(newToken => {
        setToken(newToken)
        Auth.currentSession().then(session => {
          Auth.currentAuthenticatedUser().then(cognitoUser => {
            setAuth(cognitoUser)
          })
        })
      })
    }, 5 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [token])

  return client ? (
    <ApolloProvider client={client}>
      <UserContext.Provider
        value={{
          user: user,
          fullScreen,
          setMaximizeScreen,
          notificationData,
          setNotificationData,
        }}
      >
        <Layout authData={auth ? auth : props.authData} updateUser={updateUser}>
          {React.cloneElement(props.children, {
            authState: props.authState,
            authData: props.authData,
          })}
        </Layout>
      </UserContext.Provider>
    </ApolloProvider>
  ) : null
}

export default withAuthenticator(AuthenticatorProvider, false, [
  <CustomSignIn />,
  <ConfirmSignIn />,
  <CustomVerifyContact />,
  <SignUp />,
  <ConfirmSignUp />,
  <CustomForgotPassword />,
  <CustomRequireNewPassword />,
])
