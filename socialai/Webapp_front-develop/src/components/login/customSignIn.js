import React from "react"
import { SignIn } from "aws-amplify-react"
import styled from "styled-components"
import Footer from "./../commons/footer"
import { Tooltip, Icon } from "antd"

export const LoginContainter = styled.div`
  width: 100%;
  height: 100vh;
  background: url("/images/background.png") no-repeat center center fixed;
  background-size: cover;
  padding: 5em;
  font-family: Helvetica;
  @media (max-width: 678px) {
    padding: 0;
  }
`

export const Form = styled.form`
  margin: 0 auto;
  width: 500px;
  height: 100%;
  border: 1px solid #fff;
  background: #fff;
  padding: 2em;
  @media (max-width: 678px) {
    width: 100%;
  }
`

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

const HelpContainer = styled.ul`
  padding-left: 20px;
  margin-bottom: 0;
  font-size: 12px;
`

export class CustomSignIn extends SignIn {
  constructor(props) {
    super(props)
    this._validAuthStates = ["signIn", "signedOut", "signedUp"]
  }

  showComponent() {
    const { hide = [], override = [] } = this.props
    if (hide && hide.includes(CustomSignIn)) {
      return null
    }
    return (
      <LoginContainter>
        <Form>
          <Logo src="/images/Logo2.png" />
          <br />
          <Title>Log In</Title>
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
            <Label htmlFor="password">
              Password{" "}
              <Tooltip
                title={
                  <div>
                    <HelpContainer>
                      <li>8 characters minimum</li>
                      <li>Require numbers</li>
                      <li>Require special character</li>
                      <li>Require uppercase letters</li>
                      <li>Require lowercase letters</li>
                    </HelpContainer>
                  </div>
                }
              >
                <Icon type="question-circle" />
              </Tooltip>
            </Label>
            <Input
              id="password"
              key="password"
              name="password"
              onChange={this.handleInputChange}
              type="password"
              onKeyUp={e => e.keyCode === 13 && super.signIn()}
            />
          </div>
          <br />
          <br />

          <LoginButton type="button" onClick={() => super.signIn()}>
            Log In
          </LoginButton>
          <br />
          {/* <p>Keep me logged in</p> */}
          <br />
          <ForgotSection>
            <a onClick={() => super.changeState("forgotPassword")}>
              Forgot password?
            </a>
          </ForgotSection>
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
