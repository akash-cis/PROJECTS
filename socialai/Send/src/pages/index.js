import React from "react"
import { SignIn } from "aws-amplify-react"
import "../../i18n"

const Index = ({ authState, authData }) => {
  return (
    <section>
      {authState !== "signedIn" ? (
        <SignIn authState={authState} />
      ) : (
        <>
          <h1>Loading...</h1>
        </>
      )}
    </section>
  )
}

export default Index
