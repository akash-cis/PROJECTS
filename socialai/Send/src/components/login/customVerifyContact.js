import React from "react"
import { VerifyContact } from "aws-amplify-react"
import styled from "styled-components"
import { Radio } from "antd"
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
  width: 180px;
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

const InfoSection = styled.div`
  font-size: 11px;
  color: #5e5e5e;
`

class CustomVerifyContact extends VerifyContact {
  constructor(props) {
    super(props)
    this._validAuthStates = ["verifyContact"]
  }

  showComponent() {
    const { hide } = this.props
    if (hide && hide.includes(CustomVerifyContact)) {
      return null
    }
    let location = window.location.pathname
    if (location == "/") {
      location = "/analytics/kpis"
    }

    return (
      <LoginContainter>
        {/* <FirebaseNotificationInit /> */}
        <Form>
          <Logo src="images/Logo2.png" />
          <br />
          <br />
          <Title>Verify your email</Title>
          <br />
          {this.state.verifyAttr ? (
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                key="code"
                name="code"
                autoComplete="off"
                onChange={this.handleInputChange}
                type="code"
              />
              <br />
              <br />
              <LoginButton type="button" onClick={() => super.submit()}>
                Verify
              </LoginButton>
            </div>
          ) : (
            <React.Fragment>
              <Radio
                key="email"
                name="contact"
                value="email"
                onChange={this.handleInputChange}
              >
                Email
              </Radio>
              <br />
              <LoginButton type="button" onClick={() => super.verify()}>
                Send code
              </LoginButton>
            </React.Fragment>
          )}
          <br />
          <br />
          <div style={{ textAlign: "center" }}>
            <a href={location}>Skip</a>
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
          <Footer />
          <br />
        </Form>
      </LoginContainter>
    )
  }
}

export default CustomVerifyContact
