import React from "react"
import { ForgotPassword } from "aws-amplify-react"
import styled from "styled-components"
import { LoginContainter, Form } from "./customSignIn"
import Footer from "./../commons/footer"

const Logo = styled.img`
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 70%;
`

const LoginButton = styled.button`
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  background-color: #006593;
  color: #fff;
  font-weight: bold;
  padding: 0.5em;
  font-size: 16px;
`

const Label = styled.label`
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  font-weight: bold;
  color: #000;
  padding-bottom: 0.5em;
  padding-top: 1em;
`

const Input = styled.input`
  display: block;
  margin-left: auto;
  margin-right: auto;
  color: #000;
  width: 100%;
  padding: 0.5em;
  border: 1px solid #006593;
`

const Title = styled.div`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #000;
`

const ForgotSection = styled.div`
  font-size: 14px;
  text-align: center;
`

class CustomForgotPassword extends ForgotPassword {
  constructor(props) {
    super(props)

    this._validAuthStates = ["forgotPassword"]
  }

  showComponent() {
    const { hide } = this.props
    if (hide && hide.includes(CustomForgotPassword)) {
      return null
    }

    return (
      <LoginContainter>
        <Form>
          <Logo src="images/Logo2.png" />
          <br />
          <Title>Reset your password</Title>
          <br />
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              key="username"
              name="username"
              onChange={this.handleInputChange}
              type="text"
            />
          </div>
          <br />
          <br />

          <LoginButton type="button" onClick={() => super.send()}>
            Send code
          </LoginButton>
          <br />
          <br />
          <br />
          <ForgotSection>
            <a onClick={() => super.changeState("signIn")}>Back to Login</a>
          </ForgotSection>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <Footer />
          <br />
        </Form>
      </LoginContainter>
    )
  }
}

export default CustomForgotPassword
