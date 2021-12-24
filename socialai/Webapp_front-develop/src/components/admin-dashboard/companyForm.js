import React, { useRef, useState } from "react"
import TextInput from "../../library/textInput"
import PanelHeader from "../../library/panelHeader"
import styled from "styled-components"
import { Button, Select, message, Switch } from "antd"
import { timezones } from "../../library/constants"
import Typography from "../../library/typography"
import isEmpty from "lodash/isEmpty"
import moment from "moment-timezone"
const InputWrapper = styled.div`
  width: ${({ width }) => width};
  ${props => (props.noBorder ? "padding: 0;" : `padding: 8px;`)};
  position: relative;
`

const StyledLabel = styled(Typography)`
  margin: 4px 0;
`
const FormContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
`

const FormGroup = styled.div`
  width: 50%;
  @media (max-width: 1120px) {
    width: 100%;
  }
`
const SelectWrap = styled(Select)`
  width: 100%;
  .ant-select-selection {
    border: 1px solid #eeeef1;
    border-radius: 4px;
    color: #5e5e5e;
    box-sizing: border-box;
    font-size: 14px;
  }
`

const { Option } = Select
const CompanyForm = ({
  createCompany,
  updateCompany,
  company,
  setCompany,
  newCoSetup,
}) => {
  const [timeZone, setTimeZone] = useState(
    !newCoSetup ? company?.timezone : moment.tz.guess()
  )
  const name = useRef("")
  const phone = useRef("")
  const address = useRef("")
  const city = useRef("")
  const state = useRef("")
  const postalCode = useRef("")
  const country = useRef("")
  const locationLink = useRef("")

  const [explicitlyOptIn, setExplicitlyOptIn] = useState(
    !newCoSetup ? company?.isOptinConsentMethod : false
  )

  const submitCreateCompany = () => {
    if (isEmpty(name.current.value)) {
      message.error("Please enter company name.")
      return
    }
    const newCompany = {
      name: name.current.value,
      phone: phone.current.value,
      address: address.current.value,
      city: city.current.value,
      state: state.current.value,
      postalCode: postalCode.current.value,
      country: country.current.value,
      timezone: timeZone,
      locationLink: locationLink?.current?.value || "",
      isOptinConsentMethod: explicitlyOptIn,
    }
    if (newCompany.name.trim() !== "") createCompany({ variables: newCompany })
  }

  const submitUpdateCompany = () => {
    if (isEmpty(name.current.value)) {
      message.error("Please enter company name.")
      return
    }

    const updatedCompany = {
      id: company.id,
      name: name.current.value,
      phone: phone.current.value,
      address: address.current.value,
      city: city.current.value,
      state: state.current.value,
      postalCode: postalCode.current.value,
      country: country.current.value,
      timezone: timeZone,
      locationLink: locationLink?.current?.value || "",
      isOptinConsentMethod: explicitlyOptIn,
    }
    if (updatedCompany.name.trim() !== "") {
      updateCompany({ variables: updatedCompany })
    }
  }

  const Header = ({ loading }) => {
    if (newCoSetup) {
      return (
        <PanelHeader title={"Create a new company"}>
          <Button onClick={() => setCompany(null)}>Cancel</Button>
          <Button
            type={"primary"}
            loading={loading}
            onClick={submitCreateCompany}
          >
            Create
          </Button>
        </PanelHeader>
      )
    } else {
      return (
        <PanelHeader title={"Company details"}>
          <Button onClick={() => setCompany(null)}>Close</Button>
          <Button onClick={submitUpdateCompany} type={"primary"}>
            Save
          </Button>
        </PanelHeader>
      )
    }
  }

  return (
    <React.Fragment>
      <Header company={company} />
      <FormContainer>
        <FormGroup>
          <TextInput
            reference={name}
            placeholder={"Enter Company Name"}
            name={"name"}
            label={"Company Name"}
            defaultValue={!newCoSetup ? company.name : ""}
            require={true}
          />
          <TextInput
            reference={phone}
            placeholder={"Enter a Phone Number"}
            name={"phone"}
            label={"Phone"}
            defaultValue={!newCoSetup ? company.phone : ""}
          />
          <InputWrapper width={"100%"}>
            <StyledLabel variant={"regular"}>
              {"Explicitly opt-in consent?"}
            </StyledLabel>
            <Switch
              checked={explicitlyOptIn}
              onChange={e => setExplicitlyOptIn(e)}
            />
          </InputWrapper>
        </FormGroup>
        <FormGroup>
          <TextInput
            reference={address}
            placeholder={"Enter Company Address"}
            name={"address"}
            label={"Address"}
            defaultValue={!newCoSetup ? company.address : ""}
          />
          <TextInput
            reference={city}
            placeholder={"Enter City"}
            name={"city"}
            label={"City"}
            defaultValue={!newCoSetup ? company.city : ""}
          />
          <TextInput
            reference={state}
            placeholder={"Enter State/ Province"}
            name={"state"}
            label={"State/ Province"}
            defaultValue={!newCoSetup ? company.state : ""}
          />
          <TextInput
            reference={postalCode}
            placeholder={"Enter Postal Code"}
            name={"postalCode"}
            label={"Postal Code"}
            defaultValue={!newCoSetup ? company.postalCode : ""}
          />
          <TextInput
            reference={country}
            placeholder={"Enter Country"}
            name={"country"}
            label={"Country"}
            defaultValue={!newCoSetup ? company.country : ""}
          />
          <TextInput
            reference={locationLink}
            placeholder={"Enter Location URL"}
            name={"locationLink"}
            label={"locationLink"}
            defaultValue={!newCoSetup ? company.locationLink : ""}
          />
          <InputWrapper width={"100%"}>
            <StyledLabel variant={"regular"}>{"Timezone"}</StyledLabel>
            <SelectWrap
              value={timeZone == null ? moment.tz.guess() : timeZone}
              placeholder="Select timezone"
              onChange={e => setTimeZone(e)}
            >
              {timezones.map(timezone => (
                <Select.Option key={timezone.value} value={timezone.value}>
                  {timezone.name}
                </Select.Option>
              ))}
            </SelectWrap>
          </InputWrapper>
        </FormGroup>
      </FormContainer>
    </React.Fragment>
  )
}

export default CompanyForm
