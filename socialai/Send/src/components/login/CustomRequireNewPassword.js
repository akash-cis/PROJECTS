import React from "react"
import { RequireNewPassword } from "aws-amplify-react"
import styled from "styled-components"
import { Tooltip, Icon } from "antd"
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

const HelpContainer = styled.ul`
  padding-left: 20px;
  margin-bottom: 0;
  font-size: 12px;
`

class CustomRequireNewPassword extends RequireNewPassword {
  constructor(props) {
    super(props)
    this._validAuthStates = ["requireNewPassword"]
  }

  showComponent() {
    const { hide } = this.props
    if (hide && hide.includes(CustomRequireNewPassword)) {
      return null
    }
    return (
      <LoginContainter>
        <Form>
          <Logo src="images/Logo2.png" />
          <br />
          <Title>Set your password</Title>
          <br />
          <div>
            <Label htmlFor="password">
              New Password{" "}
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
              onKeyUp={e => {
                e.preventDefault()
                e.stopPropagation()
                return false
              }}
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  e.preventDefault()
                  e.stopPropagation()
                  super.change()
                }
              }}
            />
          </div>
          <br />
          <br />

          <LoginButton type="button" onClick={() => super.change()}>
            Save
          </LoginButton>
          <br />
          <br />
          <div style={{ textAlign: "center" }}>
            <a href="" onClick={() => super.changeState("signIn")}>
              Back to Login
            </a>
          </div>
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

export default CustomRequireNewPassword
