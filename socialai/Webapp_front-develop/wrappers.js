import React, {useState} from "react"
import Amplify from "aws-amplify"
import { AuthenticatorProvider } from "./src/amplify"
import * as am4core from "@amcharts/amcharts4/core"
import ApolloClient from "apollo-boost"
import { ApolloProvider } from "@apollo/react-hooks"
import { InMemoryCache } from "apollo-cache-inmemory"
import resolvers from "./src/graphql/resolvers"
import typeDefs from "./src/graphql/typeDefs"

const doNotAuthenticate = ["/foo", "/bar/baz"]



export const wrapPageElement = ({ element, props }) => {
  // remove logo
  am4core.options.commercialLicense = true
  if (
    Array.isArray(doNotAuthenticate) &&
    (doNotAuthenticate.includes(props.path) ||
      props.path.indexOf("/acal/") !== -1)
  ) {
    return  <ApolloProvider client={apolloClient()}>{element}</ApolloProvider>
  } else {
    // TODO: remove configuration values from being hardcoded.
    Amplify.configure({
      region: "us-east-1",
      userPoolId: process.env.GATSBY_COGNITO_POOL_ID,
      userPoolWebClientId: process.env.GATSBY_COGNITO_CLIENT_ID,
    })
    return <AuthenticatorProvider>{element}</AuthenticatorProvider>
  }
}

const apolloClient = () => {
  return new ApolloClient({
    uri: process.env.GATSBY_API_URL || "http://localhost:5000/lead_graphql",
    cache: new InMemoryCache(),
    resolvers,
    typeDefs,
  })
}
