import React, { useContext, useEffect, useState, useRef } from "react"
import { useQuery, useMutation, useLazyQuery } from "@apollo/react-hooks"
import {
  GET_MY_COMPANY,
  GET_CRM_INTEGRATION,
  GET_CRM_USERS,
  GET_VIN_CRM_USER,
} from "../../graphql/query"
import {
  CREATE_CRM_INTEGRATION,
  DELETE_CRM_INTEGRATION,
  UPDATE_CRM_INTEGRATION_USER,
} from "../../graphql/mutation"
import { Button, Select, Alert, Icon, Row, Col, message } from "antd"
import {
  ContainerNavigation,
  Content,
  ContentBody,
  SettingsSectionTitle,
  Label,
  Divider,
} from "../../library/basicComponents"
import TextInput from "../../library/textInput"
import { UserContext } from "../../amplify/authenticator-provider"
import styled from "styled-components"
import { Colors } from "../../library/constants"

const FormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const DisplayCntr = styled.div`
  padding-top: 9px;
`

const SelectCntr = styled.div`
  width: auto;
  margin-top: 9px;
  & > div > div {
    height: 37px;
    border-color: ${Colors.lightGray};
  }
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`

const DeleteIcon = styled(Icon)`
  font-size: 20px;
  color: ${Colors.darkRed};
  cursor: pointer;
`

const CrmIntegration = ({ companyData }) => {
  const { user } = useContext(UserContext)
  const [company, setCompany] = useState(null)
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(
    user && user.role ? user.role.isCompanyAdmin : false
  )
  const { data, refetch: refreshCompany } = useQuery(GET_MY_COMPANY, {
    onCompleted: res => setCompany(res.me.company),
  })
  useEffect(() => {
    if (user && user.role) {
      setIsCompanyAdmin(user.role.isCompanyAdmin)
    }
  }, [user])

  return (
    <React.Fragment>
      <ContainerNavigation>
        <SettingsSectionTitle>CRM Integration</SettingsSectionTitle>
      </ContainerNavigation>
      <Content>
        <ContentBody>
          {company && (
            <CrmIntegrationForm
              company={company}
              isCompanyAdmin={isCompanyAdmin}
              user={user || {}}
            />
          )}
        </ContentBody>
      </Content>
    </React.Fragment>
  )
}

export default CrmIntegration

const CrmIntegrationForm = ({ company, isCompanyAdmin, user }) => {
  const availableIntegrationTypes = {
    ADF: "ADF",
    DS: "DealerSocket",
    VIN: "Vin Solutions",
  }
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState(null)
  const [showADFOptions, setShowADFOptions] = useState(false)
  const [showDSOptions, setShowDSOptions] = useState(false)
  const [showVINOptions, setShowVINOptions] = useState(false)
  const [crmIntegration, setCrmIntegration] = useState({})
  const [crmUsers, setCrmUsers] = useState([])
  const [selectedCrmUser, setSelectedCrmUser] = useState("")
  const adfEmail = useRef("")
  const crmDealerId = useRef("")
  const vsLeadSourceId = useRef("")

  const [getVinCrmUser] = useLazyQuery(GET_VIN_CRM_USER, {
    fetchPolicy: "network-only",
    onCompleted: res => {
      setSelectedCrmUser(res?.getVinCrmUser?.vsUserId || null)
    },
  })

  const { data: crmIntegrationData, refetch: refreshCrmIntegration } = useQuery(
    GET_CRM_INTEGRATION,
    {
      variables: {
        companyId: company.id,
      },
      onCompleted: res => {
        setCrmIntegration(res.crmIntegration)
      },
    }
  )
  const { data: resp, loading } = useQuery(GET_CRM_USERS, {
    onCompleted: res => {
      setCrmUsers(res?.getCrmUsers || [])
      getVinCrmUser({
        variables: {
          crmIntegrationId: crmIntegration?.id,
          userId: user?.id,
        },
      })
    },
  })

  useEffect(() => {
    if (crmIntegration) {
      getVinCrmUser({
        variables: {
          crmIntegrationId: crmIntegration?.id,
          userId: user?.id,
        },
      })
    }
  }, [crmIntegration])

  const [
    createCrmIntegrationMutation,
    { data: createCrmIntegrationResult },
  ] = useMutation(CREATE_CRM_INTEGRATION)
  const createCrmIntegration = crmIntegrationInput => {
    createCrmIntegrationMutation({
      variables: crmIntegrationInput,
    }).then(() => {
      refreshCrmIntegration().then(res =>
        setCrmIntegration(res.data.crmIntegration)
      )
    })
  }
  const [
    deleteCrmIntegrationMutation,
    { data: deleteCrmIntegrationResult },
  ] = useMutation(DELETE_CRM_INTEGRATION)
  const deleteCrmIntegration = crmIntegrationInput => {
    deleteCrmIntegrationMutation({
      variables: crmIntegrationInput,
    }).then(() => {
      refreshCrmIntegration().then(res =>
        setCrmIntegration(res.data.crmIntegration)
      )
    })
  }

  const [updateCrmUser] = useMutation(UPDATE_CRM_INTEGRATION_USER)

  const handleTypeChange = value => {
    switch (value) {
      case "ADF":
        setShowADFOptions(true)
        setShowDSOptions(false)
        setShowVINOptions(false)
        break
      case "DealerSocket":
        setShowADFOptions(false)
        setShowDSOptions(true)
        setShowVINOptions(false)
        break
      case "Vin Solutions":
        setShowADFOptions(false)
        setShowDSOptions(false)
        setShowVINOptions(true)
        break
    }
    setSelectedType(value)
  }
  const validateCrmIntegrationInputs = (crmIntegrationInput, setError) => {
    let adfEmailValidated = true
    let requirmentsSatisfied = false
    if (
      crmIntegrationInput.integrationType == "ADF" &&
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
        crmIntegrationInput.adfEmail
      ) == false
    ) {
      setError("You have entered an invalid email address")
      adfEmailValidated = false
    }
    if (
      (crmIntegrationInput.integrationType !== "" &&
        crmIntegrationInput.integrationType == "ADF" &&
        crmIntegrationInput.adfEmail.trim() !== "") ||
      (crmIntegrationInput.integrationType == "DealerSocket" &&
        crmIntegrationInput.crmDealerId.trim() !== "") ||
      (crmIntegrationInput.integrationType == "Vin Solutions" &&
        crmIntegrationInput.vsLeadSourceId.trim() !== "" &&
        crmIntegrationInput.crmDealerId.trim() !== "")
    ) {
      requirmentsSatisfied = true
    } else {
      setError("All fields required")
    }
    return adfEmailValidated && requirmentsSatisfied
  }
  const handleSaveClick = () => {
    const crmIntegrationInput = {
      companyId: company.id,
      integrationType: selectedType,
      adfEmail: adfEmail.current ? adfEmail.current.value : "",
      crmDealerId: crmDealerId.current ? crmDealerId.current.value : "",
      vsLeadSourceId: vsLeadSourceId.current
        ? vsLeadSourceId.current.value
        : "",
    }
    if (validateCrmIntegrationInputs(crmIntegrationInput, setError)) {
      setError("")
      createCrmIntegration(crmIntegrationInput)
    }
  }
  const handleDeleteClick = () => {
    const crmIntegrationInput = {
      crmIntegrationId: crmIntegration.id,
    }
    deleteCrmIntegration(crmIntegrationInput)
  }
  const handleCrmUserChange = e => {
    if (e) {
      setSelectedCrmUser(e)
      updateCrmUser({
        variables: {
          userId: user.id,
          crmIntegrationId: crmIntegration.id,
          vinUserId: e,
        },
      }).then(res => {
        if (res?.data?.updateCrmIntegrationUser?.ok) {
          message.success("CRM user successfully updated")
        }
      })
    }
  }

  const { Option } = Select

  return (
    <React.Fragment>
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      {crmIntegration && crmIntegration.id ? (
        <DisplayCntr>
          <Row>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              <Label>
                <strong>Integration Type: </strong>
              </Label>
            </Col>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              <Label>
                {availableIntegrationTypes.hasOwnProperty(
                  crmIntegration.integrationType
                ) ? (
                  <span>
                    {availableIntegrationTypes[crmIntegration.integrationType]}
                  </span>
                ) : (
                  <span>{crmIntegration.integrationType}</span>
                )}
              </Label>
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              {crmIntegration.integrationType == "ADF" && (
                <Label>
                  <strong>Email: </strong>
                </Label>
              )}
              {(crmIntegration.integrationType == "DS" ||
                crmIntegration.integrationType == "VIN") && (
                <Label>
                  <strong>Dealer ID: </strong>
                </Label>
              )}
              {crmIntegration.integrationType == "VIN" && (
                <Label>
                  <strong>Lead Source ID: </strong>
                </Label>
              )}
            </Col>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              {crmIntegration.integrationType == "ADF" && (
                <Label>
                  <span>{crmIntegration.adfEmail}</span>
                </Label>
              )}
              {(crmIntegration.integrationType == "DS" ||
                crmIntegration.integrationType == "VIN") && (
                <Label>
                  <span>{crmIntegration.crmDealerId}</span>
                </Label>
              )}
              {crmIntegration.integrationType == "VIN" && (
                <Label>
                  <span>{crmIntegration.vsLeadSourceId}</span>
                </Label>
              )}
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={12} md={8} lg={8} xl={8}>
              {isCompanyAdmin && (
                <Button type={"danger"} onClick={handleDeleteClick}>
                  Delete
                </Button>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <Divider />
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <SettingsSectionTitle>CRM User Integration</SettingsSectionTitle>
            </Col>
          </Row>
          <Row>
            <Col md={24}>
              <Divider />
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              {" "}
              {availableIntegrationTypes[crmIntegration.integrationType]} User
            </Col>
            <Col xs={12} sm={12} md={6} lg={4} xl={4}>
              <Select
                placeholder="Select a CRM User"
                value={crmUsers.length > 0 ? selectedCrmUser : ""}
                style={{ width: "180px" }}
                loading={loading}
                onChange={handleCrmUserChange}
              >
                {(crmUsers || []).map(el => (
                  <Option key={`key__${el.id}`} value={el.id}>
                    {el.userName}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </DisplayCntr>
      ) : (
        <FormCntr>
          <SelectCntr>
            <Select
              placeholder="Select a CRM Integration Type"
              value={selectedType ? selectedType : undefined}
              style={{ width: "180px", margin: "0 18px" }}
              onChange={handleTypeChange}
            >
              <Option key={"ADF"} value={"ADF"}>
                ADF
              </Option>
              <Option key={"DS"} value={"DealerSocket"}>
                DealerSocket
              </Option>
              <Option key={"VIN"} value={"Vin Solutions"}>
                Vin Solutions
              </Option>
            </Select>
          </SelectCntr>
          {showADFOptions && (
            <TextInput
              reference={adfEmail}
              placeholder={"ADF Email"}
              name={"adfEmail"}
            />
          )}
          {(showDSOptions || showVINOptions) && (
            <TextInput
              reference={crmDealerId}
              placeholder={"Dealer ID"}
              name={"crmDealerId"}
            />
          )}
          {showVINOptions && (
            <TextInput
              reference={vsLeadSourceId}
              placeholder={"Lead Source ID"}
              name={"vsLeadSourceId"}
            />
          )}
          <InlineFormButton type={"primary"} onClick={handleSaveClick}>
            Save
          </InlineFormButton>
        </FormCntr>
      )}
    </React.Fragment>
  )
}
