import React, { useRef, useState, useEffect } from "react"
import PanelHeader from "../../library/panelHeader"
import { Button, Select, Alert, Icon } from "antd"
import TextInput from "../../library/textInput"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_CRM_INTEGRATION } from "../../graphql/query"
import { CREATE_CRM_INTEGRATION, DELETE_CRM_INTEGRATION } from "../../graphql/mutation"
import Typography from "../../library/typography"
import styled from "styled-components"
import { Colors } from "../../library/constants"
import { Label } from "../../library/basicComponents"

const FormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const DisplayCntr = styled.div`
  width: auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
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

const CrmIntegration = ({ company, setCompany, setActiveTab, newCoSetup }) => {
  return (
    <React.Fragment>
      <PanelHeader title={"CRM Integration"}>
        {!newCoSetup ? (
          <Button onClick={() => setCompany(null)}>Close</Button>
        ) : (
          <Button type={"primary"} onClick={() => setCompany(null)}>
            Complete setup
          </Button>
        )}
      </PanelHeader>
      {company &&
      <CrmIntegrationForm 
        company={company}
      />
      }
    </React.Fragment>
  )
}

export default CrmIntegration

const CrmIntegrationForm = ({company}) => {
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState(null)
  const [showADFOptions, setShowADFOptions] = useState(false)
  const [showDSOptions, setShowDSOptions] = useState(false)
  const [showVINOptions, setShowVINOptions] = useState(false)
  const [crmIntegration, setCrmIntegration] = useState({})
  const adfEmail = useRef('')
  const crmDealerId = useRef('')
  const vsLeadSourceId = useRef('')
  const { data: crmIntegrationData, refetch: refreshCrmIntegration } = useQuery(
    GET_CRM_INTEGRATION,
    {
      variables: {
        companyId: company.id,
      },
      onCompleted: res => {
        setCrmIntegration(res.crmIntegration);
      },
    },
  )
  const [createCrmIntegrationMutation, { data: createCrmIntegrationResult }] = useMutation(
    CREATE_CRM_INTEGRATION
  )
  const createCrmIntegration = crmIntegrationInput => {
    createCrmIntegrationMutation(
      { 
        variables: crmIntegrationInput 
      }
    ).then(() => {
      refreshCrmIntegration().then(res => setCrmIntegration(res.data.crmIntegration));
    })
  }
  const [deleteCrmIntegrationMutation, { data: deleteCrmIntegrationResult }] = useMutation(
    DELETE_CRM_INTEGRATION
  )
  const deleteCrmIntegration = crmIntegrationInput => {
    deleteCrmIntegrationMutation(
      {
        variables: crmIntegrationInput,
      }
    ).then(() => {
        refreshCrmIntegration().then(res => setCrmIntegration(res.data.crmIntegration));
    })
  }
  const handleTypeChange = (value) => {
    console.log(`handleTypeChange(${value})`)
    switch (value) {
      case 'ADF':
        setShowADFOptions(true)
        setShowDSOptions(false)
        setShowVINOptions(false)
        break
      case 'DealerSocket':
        setShowADFOptions(false)
        setShowDSOptions(true)
        setShowVINOptions(false)
        break
      case 'Vin Solutions':
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
      crmIntegrationInput.integrationType == 'ADF' &&
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(crmIntegrationInput.adfEmail) == false) {
      setError("You have entered an invalid email address")
      adfEmailValidated = false
    }
    if (
      crmIntegrationInput.integrationType !== "" &&

      (crmIntegrationInput.integrationType == 'ADF' &&
      crmIntegrationInput.adfEmail.trim() !== "") ||

      ((crmIntegrationInput.integrationType == 'DealerSocket' ) &&
      crmIntegrationInput.crmDealerId.trim() !== "") ||

      (crmIntegrationInput.integrationType == 'Vin Solutions' &&
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
      adfEmail: adfEmail.current ? adfEmail.current.value : '',
      crmDealerId: crmDealerId.current ? crmDealerId.current.value : '',
      vsLeadSourceId: vsLeadSourceId.current ? vsLeadSourceId.current.value : '',
    }

    if (validateCrmIntegrationInputs(crmIntegrationInput, setError)) {
      setError("")
      createCrmIntegration(crmIntegrationInput)
    }
    
  }

  const handleDeleteClick = () => {
    const crmIntegrationInput = {
      crmIntegrationId: crmIntegration.id
    }
    deleteCrmIntegration(crmIntegrationInput)
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
      {crmIntegration && crmIntegration.id ? 
        (
          <DisplayCntr>
            <Label>
              <strong>Integration Type: </strong>{crmIntegration.integrationType}
            </Label>
            {crmIntegration.integrationType == 'ADF' && (
              <Label>
                <strong>Email: </strong>{crmIntegration.adfEmail}
              </Label>
            )}
            {(crmIntegration.integrationType == 'DS' || 
              crmIntegration.integrationType == 'VIN') && 
            (
              <Label>
                <strong>Dealer ID: </strong>{crmIntegration.crmDealerId}
              </Label>
            )}
            {crmIntegration.integrationType == 'VIN' && 
            (
              <Label>
                <strong>Lead Source ID: </strong>{crmIntegration.vsLeadSourceId}
              </Label>
            )}
            <DeleteIcon type={"delete"} onClick={handleDeleteClick} />
          </DisplayCntr>
        )
        :
        (
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
        )
      }
    </React.Fragment>
  )
}
