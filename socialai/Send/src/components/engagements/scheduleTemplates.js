import React, { useEffect, useRef, useState } from "react"
import {
  Button,
  Switch,
  Table,
  Modal,
  Icon,
  Input,
  Alert,
  message,
  Row,
  Col,
  Checkbox,
} from "antd"
import styled from "styled-components"
import {
  ContainerNavigation,
  IconCustom,
  NoPaddingButton,
  FilterButtonGroup,
} from "../../library/basicComponents"
import SelectSchedule from "../../library/selectSchedule"
import { Colors } from "../../library/constants"
import { showConfirmationModal } from "../../library/helpers"

import isEmpty from "lodash/isEmpty"
import isUndefined from "lodash/isUndefined"
import omit from "lodash/omit"
import { useQuery, useMutation } from "@apollo/react-hooks"
import {
  CREATE_CAMPAIGN_TEMPLATE,
  UPDATE_CAMPAIGN_TEMPLATE,
  DELETE_CAMPAIGN_TEMPLATE,
} from "../../graphql/mutation"
import { GET_ALL_CAMPAIGN_TEMPLATES } from "../../graphql/query"

import TemplateDrawer from "./templateDrawer"
const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

const ContainerBody = styled.div`
  padding: ${props => (props.spaced ? "1.5rem" : "1em")};
  padding: ${props => (props.noVertical ? "0 1rem" : "1em")};
  margin-bottom: 1rem;
`

const FlxeContainer = styled.div`
  padding: ${props => (props.spaced ? "1.5rem" : "1em")};
  padding: ${props => (props.noVertical ? "0 1rem" : "1em")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgb(232, 232, 232);
  @media (max-width: 992px) {
    align-items: flex-start;
  }
`

const SelectCntr = styled.div`
  width: 180px;
  & > div > div {
    border-color: ${Colors.lightGray};
    margin-right: 0.5rem;
  }
`

const ButtonCntr = styled.div`
  margin-right: 15px;
  min-width: 180px;
`
const TableIcon = styled(Icon)`
  margin: 0 4px;
  font-size: 18px;
`

const getScheduleName = obj => {
  if (obj) {
    let name =
      obj.numericValue == 0
        ? "IMMEDIATE"
        : (obj.numericValue || "") + " " + (obj.temporalValue || "")
    if (obj.type === "REPEAT") {
      name = "Every " + name
    }
    return name
  } else {
    return ""
  }
}

const ScheduleTemplateTable = ({
  campaignId,
  schedules,
  sources,
  onRefetch = () => {},
}) => {
  const [mode, setMode] = useState("add")
  const [openTemplateModal, setTemaplateModalVisible] = useState(false)
  const [selectedSchedule, setFilterSchedule] = useState("All")
  const [selectedSource, setFilterSource] = useState("All")
  const [error, setError] = useState("")
  const [selectedTemplate, setEditableTemplate] = useState(null)
  const [variables, setVariables] = useState({
    page: 1,
    pageSize: 25,
  })

  const { data: resp, refetch: refetchTemplates, loading } = useQuery(
    GET_ALL_CAMPAIGN_TEMPLATES,
    {
      fetchPolicy: "network-only",
      variables: {
        ...variables,
        campaignId: campaignId || 0,
      },
    }
  )

  const templates = resp?.getCampaignTemplates?.data || []

  const [createCampaignTemplate] = useMutation(CREATE_CAMPAIGN_TEMPLATE)
  const [updateCampaignTemplate] = useMutation(UPDATE_CAMPAIGN_TEMPLATE)
  const [deleteCampaignTemplate] = useMutation(DELETE_CAMPAIGN_TEMPLATE)

  const { Column } = Table

  const handleActiveToggle = (checked, e, record) => {
    e.stopPropagation()
    updateCampaignTemplate({
      variables: {
        id: parseInt(record?.id),
        scheduleId: parseInt(record?.scheduleId),
        sourceId: parseInt(record?.sourceId),
        templateText: record.templateText,
        isActive: checked,
      },
    }).then(() => {
      refetchTemplates()
      onRefetch()
      message.success("Template successfully updated")
    })
  }

  const handleAddNewTemplateClick = () => {
    if (schedules.length > 0) {
      setError("")
      setTemaplateModalVisible(true)
      setEditableTemplate(null)
      setMode("add")
    } else {
      setError("Please select at least one schedule for add template")
    }
  }

  const handleTemplateVisible = () => {
    setTemaplateModalVisible(false)
    setEditableTemplate(null)
  }

  const handleSave = payload => {
    if (mode === "edit") {
      updateCampaignTemplate({
        variables: {
          id: parseInt(selectedTemplate?.id),
          scheduleId: parseInt(selectedTemplate?.scheduleId),
          sourceId: parseInt(payload.source),
          templateText: payload.template,
        },
      }).then(() => {
        refetchTemplates()
        onRefetch()
        message.success("Template successfully updated")
      })
    } else if (mode === "add") {
      const index = templates.findIndex(
        el => el.scheduleId == payload.schedule && el.sourceId == payload.source
      )
      if (index > -1) {
        setError(`Template is alredy exists for selected schedule and source`)
        return
      }
      setTemaplateModalVisible(false)
      let sourceIds = []
      if (payload.copySource) {
        sources.forEach(el => {
          const index = templates.findIndex(
            e => e.scheduleId == payload.schedule && e.sourceId == el.id
          )
          if (index <= -1) {
            sourceIds.push(parseInt(el.id))
          }
        })
      } else if (payload.source == 0) {
        sourceIds.push(null)
      } else {
        sourceIds.push(parseInt(payload.source))
      }
      createCampaignTemplate({
        variables: {
          campaignId: parseInt(campaignId),
          scheduleId: parseInt(payload.schedule),
          sources: sourceIds,
          templateText: payload.template,
          isActive: payload.isActive,
        },
      }).then(() => {
        refetchTemplates()
        onRefetch()
        message.success("Template successfully created")
      })
    }
  }

  const onEditTemplate = template => {
    if (template) {
      setMode("edit")
      setError("")
      setEditableTemplate({
        ...template,
      })
      setTemaplateModalVisible(true)
    }
  }

  const deleteTemplate = template => {
    if (template) {
      setError("")
      deleteCampaignTemplate({
        variables: {
          id: parseInt(template?.id),
        },
      }).then(() => {
        refetchTemplates()
        onRefetch()
      })
    }
  }

  const handleRowClick = record => {
    setMode("edit")
    setEditableTemplate({
      ...record,
    })
    setTemaplateModalVisible(true)
  }

  const handleScheduleFilter = e => {
    setFilterSchedule(e)
    let objVariables = { ...variables }
    if (e == "All") {
      delete objVariables["scheduleId"]
    } else {
      objVariables = {
        ...objVariables,
        scheduleId: parseInt(e),
      }
    }
    setVariables({
      ...objVariables,
    })
  }

  const handleSourceFilter = e => {
    setFilterSource(e)
    let objVariables = { ...variables }
    if (e == "All") {
      delete objVariables["sourceId"]
    } else {
      objVariables = {
        ...objVariables,
        sourceId: parseInt(e),
      }
    }
    setVariables({
      ...objVariables,
    })
  }

  return (
    <>
      <ContainerNavigation>
        <div>
          <b>Templates</b>
        </div>
        <div>{error && <Alert message={error} type={"error"} />}</div>
        <FilterButtonGroup>
          <ButtonCntr>
            <SelectSchedule
              keyName={"filter_source"}
              mode={"single"}
              value={selectedSource}
              placeholder={"Filter By Source"}
              showAll={true}
              onChange={e => handleSourceFilter(e)}
              data={sources}
            />
          </ButtonCntr>
          <ButtonCntr>
            <SelectSchedule
              keyName={"filter_schedule"}
              mode={"single"}
              value={selectedSchedule}
              placeholder={"Filter By Schedule"}
              showAll={true}
              onChange={e => handleScheduleFilter(e)}
              data={schedules}
            />
          </ButtonCntr>
          <Button type={"primary"} onClick={() => handleAddNewTemplateClick()}>
            Add Template
            <IconCustom type="plus-circle" />
          </Button>
        </FilterButtonGroup>
      </ContainerNavigation>
      <ContainerBody>
        <Table
          dataSource={templates}
          loading={loading}
          rowKey={"id"}
          onRow={record => ({
            onClick: () => handleRowClick(record),
          })}
          pagination={{
            defaultCurrent: variables.page,
            current: variables.page,
            defaultPageSize: variables.pageSize,
            pageSize: variables.pageSize,
            total: templates.count,
            showTotal: (total, range) =>
              `Total: ${total} ${total === 1 ? "template" : "templates"}`,
            pageSizeOptions: ["5", "25", "50"],
            showSizeChanger: true,
          }}
          onChange={(pagination, filters, sorter) => {
            let newVariables = {
              ...variables,
              page:
                variables.pageSize !== pagination.pageSize
                  ? 1
                  : pagination.current,
              pageSize: pagination.pageSize,
            }
            setVariables(newVariables)
          }}
        >
          <Column
            title={"Template"}
            dataIndex={"templateText"}
            key={"templateText"}
            width={"45%"}
            defaultSortOrder={"ascend"}
          />
          <Column
            title={"Schedule"}
            dataIndex={"schedule"}
            key={"schedule"}
            width={"15%"}
            render={(value, record) => {
              return getScheduleName(
                record?.campaignSchedules?.campaignSchedulesOption || {}
              )
            }}
          />
          <Column
            title={"Source"}
            dataIndex={"sourceId"}
            key={"sourceId"}
            width={"15%"}
            render={(value, record) => {
              if (record?.leadSource) {
                return record?.leadSource.name
              } else {
                return "Default For All"
              }
            }}
          />
          <Column
            title={"Active"}
            dataIndex={"activeInd"}
            key={"activeInd"}
            align={"center"}
            width={"10%"}
            render={(value, record) => (
              <Switch
                checked={value !== null && value}
                checkedChildren={"Active"}
                unCheckedChildren={"Inactive"}
                onChange={(checked, e) =>
                  handleActiveToggle(checked, e, record)
                }
                id={record.id}
              />
            )}
          />
          <Column
            title={"Edit"}
            key={"edit"}
            width={"6%"}
            render={record => (
              <TableIcon
                type={"edit"}
                onClick={e => {
                  e.stopPropagation()
                  onEditTemplate(record)
                }}
              />
            )}
          />
          <Column
            title={"Delete"}
            key={"delete"}
            width={"10%"}
            render={record => (
              <TableIcon
                type={"delete"}
                onClick={e => {
                  e.stopPropagation()
                  showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
                    deleteTemplate({ ...record })
                  )
                }}
              />
            )}
          />
        </Table>
      </ContainerBody>
      {openTemplateModal && (
        <TemplateModal
          visible={openTemplateModal}
          setVisible={handleTemplateVisible}
          template={selectedSchedule === "All" ? "Immediate" : selectedSchedule}
          editableTemplate={selectedTemplate}
          onSave={handleSave}
          schedules={schedules}
          sources={sources}
        />
      )}
    </>
  )
}
export default ScheduleTemplateTable

const INITIAL_MESSAGE = "Hi, {firstName}"

const TemplateModal = ({
  visible,
  setVisible,
  onSave,
  editableTemplate = null,
  schedules = [],
  sources = [],
}) => {
  const [body, setBody] = useState(INITIAL_MESSAGE)
  const [error, setError] = useState("")
  const [selectedSchedule, setSchedule] = useState("")
  const [selectedSource, setSource] = useState("")
  const [copySource, setCopySource] = useState(false)
  const [openTemplateDrawer, setOpenTemplateDrawer] = useState(false)

  useEffect(() => {
    if (editableTemplate) {
      setBody(editableTemplate.templateText)
      setSchedule(editableTemplate.scheduleId.toString())
      if (editableTemplate.sourceId) {
        setSource(editableTemplate.sourceId.toString())
      } else {
        setCopySource(true)
        setSource(sources[0].id)
      }
    }
  }, [editableTemplate])

  const handleSupportSubmit = () => {
    if (
      !isUndefined(selectedSchedule) &&
      !isEmpty(body) &&
      !isEmpty(selectedSource)
    ) {
      onSave({
        schedule: selectedSchedule,
        source: selectedSource,
        template: body,
        isActive: true,
        copySource: copySource,
      })
      setError("")
      setBody(INITIAL_MESSAGE)
      setSchedule("")
      setSource("")
      setVisible(false)
    } else {
      setError("Please make sure you have filled out all fields")
    }
  }

  const handleAddKeyword = keyword => {
    setBody(body + " " + keyword)
  }

  const onCopyChange = e => {
    if (e) {
      setCopySource(e?.target?.checked)
    }
  }

  const sourcesList = [...sources]
  sourcesList.unshift({ id: "0", name: "Default" })

  return (
    <Modal
      width={700}
      title={(editableTemplate ? "Edit" : "Add") + " Engagement Template"}
      visible={visible}
      closable={false}
      footer={null}
    >
      <Row>
        <Col span={24}>Click on placeholder to append into Text Message</Col>
      </Row>
      <Row gutter={[4, 24]}>
        <Col span={24}>
          <FilterButtonGroup>
            <NoPaddingButton
              type="link"
              onClick={() => handleAddKeyword("{firstName}")}
            >
              {"{firstName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={() => handleAddKeyword("{lastName}")}
            >
              {"{lastName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={() => handleAddKeyword("{sourceName}")}
            >
              {"{sourceName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={() => handleAddKeyword("{dealerName}")}
            >
              {"{dealerName}"}
            </NoPaddingButton>
            <NoPaddingButton
              type="link"
              onClick={() => handleAddKeyword("{previouVehicle}")}
            >
              {"{previousVehicle}"}{" "}
            </NoPaddingButton>
            <Button
              type={"primary"}
              style={{ marginLeft: "20px" }}
              onClick={() => setOpenTemplateDrawer(true)}
            >
              Select Template
            </Button>
          </FilterButtonGroup>
        </Col>
      </Row>
      <Row>
        <Col span={24}>Text Message</Col>
      </Row>
      <Row>
        <Col span={24}>
          <Input.TextArea
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            name={"body"}
          />
        </Col>
      </Row>
      <Row gutter={[6, 24]}>
        <Col span={12}>
          Schedule{" "}
          <SelectSchedule
            keyName={"template_schedule"}
            mode={"single"}
            value={selectedSchedule}
            placeholder={"Select Schedule"}
            onChange={e => setSchedule(e)}
            data={schedules}
            disabled={editableTemplate}
          />
        </Col>
        <Col span={12}>
          Source{" "}
          <SelectSchedule
            keyName={"template_source"}
            mode={"single"}
            showAll={false}
            value={selectedSource}
            placeholder={"Select Source"}
            onChange={e => setSource(e)}
            data={sourcesList}
            disabled={editableTemplate}
          />
        </Col>
      </Row>
      <Row gutter={[6, 24]}>
        <Col>
          <Checkbox
            onChange={onCopyChange}
            checked={copySource}
            disabled={editableTemplate}
          >
            Copy selected schedule template to all other sources
          </Checkbox>
        </Col>
      </Row>
      <br />
      {error && <Alert message={error} type={"error"} />}
      <br />

      <FlxeContainer>
        <div>
          <Button
            key="Cancel"
            onClick={() => {
              setBody(INITIAL_MESSAGE)
              setVisible(false)
            }}
          >
            Cancel
          </Button>
        </div>
        <FilterButtonGroup>
          <Button
            key="save"
            type={"primary"}
            onClick={() => {
              handleSupportSubmit()
            }}
          >
            Save
          </Button>
        </FilterButtonGroup>
      </FlxeContainer>
      <TemplateDrawer
        openTemplateDrawer={openTemplateDrawer}
        setOpenTemplateDrawer={setOpenTemplateDrawer}
        onApply={setBody}
      />
    </Modal>
  )
}
