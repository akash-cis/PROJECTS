import React, { useContext, useState, useEffect, useRef } from "react"
import isEmpty from "lodash/isEmpty"
import PanelHeader from "../../library/panelHeader"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_ENGAGEMENT_MESSAGE_TEMPLATES } from "../../graphql/query"
import {
  SAVE_ENAGEMENT_MESSAGE_TEMPLATE,
  DELETE_ENAGEMENT_MESSAGE_TEMPLATE,
} from "../../graphql/mutation"
import { UserContext } from "../../amplify/authenticator-provider"
import {
  NoPaddingButton,
  FilterButtonGroup,
} from "../../library/basicComponents"
import {
  Button,
  Input,
  message,
  Row,
  Col,
  Table,
  Icon,
  Alert,
  Switch,
  Tag,
  Checkbox,
} from "antd"
import styled from "styled-components"
import Typography from "../../library/typography"
import { CustomTable } from "../life-events/customerList/elements"
import { showConfirmationModal } from "../../library/helpers"

const MODAL_TITLE = `Do you want to continue?`
const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`
const BtnCntr = styled.div`
  margin: 18px auto 0 auto;
  text-align: right;
`
const InputCntr = styled.div`
  margin: 18px auto 0 auto;
`
const TableIcon = styled(Icon)`
  margin: 0 4px;
  font-size: 18px;
`
const SpanWrap = styled.div`
  padding-top: 5px;
  padding-right: 5px;
`
const Require = styled.span`
  color: red;
  margin-left: 2px;
`

const EngagementMessageTemplates = ({
  company,
  setCompany,
  newCoSetup,
  setActiveTab,
  showTitle,
}) => {
  const { user } = useContext(UserContext)
  const htmlElRef = useRef(null)
  const [error, setError] = useState("")
  const [title, setTitle] = useState("")
  const [messageTemplate, setMessage] = useState("")
  const [editableMessageTemplate, setEditableTemplate] = useState(null)

  const [isCompanyAdmin, setIsCompanyAdmin] = useState(
    user && user.role
      ? user.role.isCompanyAdmin
      : company == null
      ? true
      : user.role == null
  )
  const [share, setShare] = useState(isCompanyAdmin)

  useEffect(() => {
    setTitle(editableMessageTemplate?.title || "")
    setMessage(editableMessageTemplate?.message || "")
  }, [editableMessageTemplate])

  const { data: resp, loading, refetch } = useQuery(
    GET_ENGAGEMENT_MESSAGE_TEMPLATES,
    {
      variables: { companyId: company?.id || null, templateType: "ALL" },
    }
  )

  const [saveResponseTemplate] = useMutation(SAVE_ENAGEMENT_MESSAGE_TEMPLATE)
  const [deleteResponseTemplate] = useMutation(
    DELETE_ENAGEMENT_MESSAGE_TEMPLATE
  )

  const handleAddClick = e => {
    let saveObj = {
      userId: parseInt(user.id),
      companyId: parseInt(company?.id || null),
      message: messageTemplate,
      title: title,
      isCompanyShared: share,
    }
    if (editableMessageTemplate) {
      saveObj = {
        ...saveObj,
        id: editableMessageTemplate?.id,
      }
    }
    if (isEmpty(title)) {
      setError("Please enter the title")
    } else if (isEmpty(messageTemplate)) {
      setError("Please enter the message")
    } else {
      setError("")
      saveResponseTemplate({
        variables: { ...saveObj },
      }).then(() => {
        message.success("Engagement message template successfully saved")
        refetch()
        setTitle("")
        setMessage("")
        setEditableTemplate(null)
      })
    }
  }

  const handleDelete = record => {
    if (record) {
      deleteResponseTemplate({
        variables: { id: record.id, userId: parseInt(user.id) },
      }).then(resp => {
        if (resp?.data?.deleteEngagementMessageTemplate?.statusCode == 200) {
          refetch()
          setTitle("")
          setMessage("")
          setEditableTemplate(null)
          message.success(resp?.data?.deleteEngagementMessageTemplate?.message)
        } else {
          message.error(resp?.data?.deleteEngagementMessageTemplate?.message)
        }
      })
    }
  }

  const hanldeUpdateStatus = payload => {
    if (payload) {
      saveResponseTemplate({
        variables: { ...payload },
      }).then(resp => {
        if (resp?.data?.saveEngagementMessageTemplate?.statusCode == 200) {
          refetch()
          setTitle("")
          setMessage("")
          setEditableTemplate(null)
          message.success(resp?.data?.saveEngagementMessageTemplate?.message)
        } else {
          message.error(resp?.data?.saveEngagementMessageTemplate?.message)
        }
      })
    }
  }

  const handleAddKeyword = keyword => {
    setMessage(messageTemplate + " " + keyword)
    if (htmlElRef.current) {
      htmlElRef.current.focus()
    }
  }
  return (
    <React.Fragment>
      {showTitle && (
        <PanelHeader title={"Engagement Templates"}>
          {!newCoSetup ? (
            <>
              {setCompany && (
                <Button onClick={() => setCompany(null)}>Close</Button>
              )}
            </>
          ) : (
            <Button
              type={"primary"}
              onClick={() => setActiveTab("Manage Nudge Settings")}
            >
              Continue
            </Button>
          )}
        </PanelHeader>
      )}
      {error && (
        <Row>
          <Col sm="24" md="24" lg="24" xl="24">
            <div>
              <Alert message={error} type={"error"} />
            </div>
          </Col>
        </Row>
      )}

      <Row gutter={[4, 16]}>
        <Col sm="24" md="12" lg="12" xl="12">
          <InputCntr>
            <SpanWrap>
              <Typography variant={"small"} weight={"medium"}>
                Title<Require>*</Require>
              </Typography>
            </SpanWrap>

            <Input
              placeholder={"Message title"}
              onChange={e => setTitle(e.target.value)}
              defaultValue={title}
              value={title}
            />
          </InputCntr>
          <InputCntr>
            <FilterButtonGroup>
              <SpanWrap>
                <Typography variant={"small"} weight={"medium"}>
                  Message<Require>*</Require>
                </Typography>
              </SpanWrap>
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
            </FilterButtonGroup>

            <Input.TextArea
              ref={htmlElRef}
              placeholder={"Type your response template here"}
              rows={6}
              onChange={e => setMessage(e.target.value)}
              defaultValue={messageTemplate}
              value={messageTemplate}
            />
          </InputCntr>
          <InputCntr>
            <Checkbox
              checked={share}
              onChange={e => setShare(e.target.checked)}
              disabled={isCompanyAdmin}
            >
              Share with company?
            </Checkbox>
          </InputCntr>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col md="24">
          <BtnCntr>
            <Button type={"primary"} onClick={handleAddClick}>
              {editableMessageTemplate ? "Update" : "Save"}
            </Button>
          </BtnCntr>
        </Col>
      </Row>
      <Row gutter={[4, 16]}>
        <Col sm="24" md="24" lg="24" xl="24">
          <MessageTemplatesTable
            data={resp?.engagementMessageTemplates || []}
            setEditableTemplate={setEditableTemplate}
            deleteMessageTemplate={handleDelete}
            company={company}
            isCompanyAdmin={isCompanyAdmin}
            updateDisabledStatus={hanldeUpdateStatus}
            user={user}
          />
        </Col>
      </Row>
    </React.Fragment>
  )
}

export default EngagementMessageTemplates

const MessageTemplatesTable = ({
  isCompanyAdmin = false,
  company = null,
  data,
  setEditableTemplate,
  deleteMessageTemplate,
  updateDisabledStatus,
  user,
}) => {
  const { Column } = Table
  const handleActiveToggle = (checked, record) => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
      updateDisabledStatus({
        ...record,
        id: parseInt(record.id),
        isActive: checked,
      })
    )
  }

  const handleDelete = record => {
    if (!record.isActive) {
      showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () =>
        deleteMessageTemplate({
          ...record,
          id: parseInt(record.id),
        })
      )
    } else {
      message.error("Please inactive this message template before delete it.")
    }
  }
  return (
    <CustomTable
      dataSource={data}
      rowKey={"id"}
      pagination={false}
      rowClassName={(record, index) => {
        return company && record?.companyId == null
          ? "table-row-dark"
          : "table-row-light"
      }}
    >
      <Column
        title={"Title"}
        key={"title"}
        dataIndex={"title"}
        render={(val, record) => {
          return (
            <>
              <span style={{ marginRight: 8 }}>
                {val.length < 100 ? val : val.substring(0, 100) + "..."}
              </span>
              {company && record?.companyId == null && (
                <Tag color="magenta">Global</Tag>
              )}
            </>
          )
        }}
        sorter={(a, b) => a.title.localeCompare(b.title)}
      />
      <Column
        title={"Message"}
        key={"message"}
        dataIndex={"message"}
        render={val => (val.length < 100 ? val : val.substring(0, 100) + "...")}
        sorter={(a, b) => a.message.localeCompare(b.message)}
      />
      <Column
        title={"Active"}
        dataIndex={"isActive"}
        key={"isActive"}
        align={"center"}
        render={(value, record) => {
          return (
            <Switch
              checked={record?.isActive}
              onChange={e => handleActiveToggle(e, record)}
              id={record.id}
              disabled={!checkPermisson(user, isCompanyAdmin, record, company)}
            />
          )
        }}
      />

      <Column
        title={"Edit"}
        key={"edit"}
        width={"6%"}
        render={record => (
          <a disabled={!checkPermisson(user, isCompanyAdmin, record, company)}>
            <TableIcon
              type={"edit"}
              onClick={() => {
                setEditableTemplate({
                  ...record,
                })
              }}
            />
          </a>
        )}
      />

      {isCompanyAdmin && (
        <Column
          title={"Delete"}
          key={"delete"}
          width={"10%"}
          render={responseRecord => (
            <a disabled={company && responseRecord?.companyId == null}>
              <TableIcon
                type={"delete"}
                onClick={() => {
                  handleDelete({ ...responseRecord })
                }}
              />
            </a>
          )}
        />
      )}
    </CustomTable>
  )
}

const checkPermisson = (user, isCompanyAdmin, record, company) => {
  let hasAccess = false
  if (user?.id == record.userId && record.companyId != null) {
    hasAccess = true
  } else if (isCompanyAdmin && record.companyId != null) {
    hasAccess = true
  } else if (company == null && record.companyId == null) {
    hasAccess = true
  }
  return hasAccess
}
