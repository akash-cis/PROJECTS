import React from "react"
import { Tag, List, Card, Icon, Tooltip } from "antd"
import styled from "styled-components"
import Typography from "../../../library/typography"
import ModifyButtons from "../../../library/modifyButtons"
import { parseLocation } from "../../../library/utils"
import {
  NoPaddingButton,
  ContainerNavigation,
} from "../../../library/basicComponents"
import isUndefined from "lodash/isUndefined"
import isEmpty from "lodash/isEmpty"
import { formatPhoneNumber, isValidPhoneNumber } from "react-phone-number-input"

const TextWrap = styled.div`
  wordwrap: break-word;
  wordbreak: break-word;
`

const CardWrapper = styled(Card)`
  box-shadow: 0 2px 4px 1px rgb(0 0 0 / 15%) !important;
  min-height: 450px;
  max-height: 450px;
  & .ant-card-head-title {
    color: #00648d !important;
  }
  .ant-card-actions {
    background-color: #fff;
  }
  .ant-card-body {
    padding: 15px 24px;
    overflow-x: auto;
    height: 335px;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 7px;
      background-color: #f1f1f1;
    }

    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 0px grey;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 3px;
      -webkit-box-shadow: inset 0 0 6px grey;
      background-color: #fcfcfc;
    }
  }
`

const ContainerNavigationWrap = styled(ContainerNavigation)`
  border-bottom: 0;
  padding: 0;
`

const renderPhone = (
  record,
  ConsentStatus,
  ConsentIcon,
  ConsentStatusColor,
  showCampaign,
  onLeadActivity
) => {
  const phone = !isUndefined(record?.phoneNumbers[0]?.phone)
    ? record?.phoneNumbers[0]?.phone
    : ""

  return (
    <>
      {!isEmpty(phone) && phone != null && isValidPhoneNumber(phone) ? (
        <Tooltip title={ConsentStatus(record?.textConsentStatus)}>
          <Icon
            type={ConsentIcon(record?.textConsentStatus)}
            style={{
              color: ConsentStatusColor(record?.textConsentStatus),
              fontSize: 20,
              marginLeft: 5,
            }}
          />
        </Tooltip>
      ) : null}
      <NoPaddingButton
        type="link"
        onClick={showCampaign ? null : () => onLeadActivity(record.id)}
      >
        {<>{formatPhoneNumber(phone)}</>}
      </NoPaddingButton>
    </>
  )
}

const renderVehicles = record => {
  let tags = []
  if (record?.vehicleOfInterest.length > 0) {
    record?.vehicleOfInterest.forEach((el, i) => {
      let voi = ""
      if (record?.vehicleOfInterest[i]?.make?.length > 0)
        voi = voi + record?.vehicleOfInterest[i]?.make + " "
      if (record?.vehicleOfInterest[i]?.model?.length > 0)
        voi = voi + record?.vehicleOfInterest[i]?.model + " "
      if (record?.vehicleOfInterest[i]?.year?.length > 0)
        voi = voi + record?.vehicleOfInterest[i]?.year + " "
      if (record?.vehicleOfInterest[i]?.trim?.length > 0)
        voi = voi + record?.vehicleOfInterest[i]?.trim
      tags.push(
        <p>
          <Tag
            color={record?.vehicleOfInterest[i]?.isCurrent ? "magenta" : "blue"}
          >
            {voi}
          </Tag>
        </p>
      )
    })
  }
  return <>{tags}</>
}

const columnCount = () => {
  return window.innerWidth > 1024
    ? 6
    : window.innerWidth <= 1024 && window.innerWidth > 980
    ? 3
    : window.innerWidth <= 980 && window.innerWidth > 480
    ? 2
    : 1
}

const LeadGridView = ({
  data,
  count,
  variables,
  setVariables,
  onTitleClick,
  onLeadActivity,
  onEditClick,
  onDeleteClick,
  ConsentStatus,
  ConsentIcon,
  ConsentStatusColor,
  loading = false,
  showCampaign = false,
  showTitleRow = false,
  handleCamapignClick,
}) => {
  return (
    <List
      key={"lead_grid_view"}
      grid={{
        gutter: 16,
        column: columnCount(),
      }}
      dataSource={data}
      loading={loading}
      pagination={
        count < 5
          ? null
          : {
              defaultCurrent: variables.page,
              current: variables.page,
              defaultPageSize: variables.pageSize,
              pageSize: variables.pageSize,
              total: count || 0,
              showTotal: (total, range) =>
                `Total: ${total} ${total === 1 ? "campaign" : "campaigns"}`,
              pageSizeOptions: ["5", "25", "50"],
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                let newVariables = {
                  ...variables,
                  page: page,
                  pageSize: pageSize,
                }
                setVariables(newVariables)
              },
              onShowSizeChange: (current, size) => {
                let newVariables = {
                  ...variables,
                  page: current,
                  pageSize: size,
                }
                setVariables(newVariables)
              },
            }
      }
      renderItem={(item, i) => (
        <List.Item>
          <CardWrapper
            title={
              <ContainerNavigationWrap>
                <a onClick={() => onTitleClick(item?.id, showTitleRow)}>
                  {item.fullName}
                </a>
                <a onClick={e => handleCamapignClick(e, item)}>
                  <Icon type="ci" style={{ fontSize: 20 }} /> {"View Campaigns"}
                </a>
              </ContainerNavigationWrap>
            }
            actions={[
              <ModifyButtons
                id={item.id}
                activity={() => onLeadActivity(item.id)}
              />,
              <Icon
                type={"edit"}
                onClick={e => onEditClick(e, item)}
                style={{ marginLeft: 15, marginRight: 15 }}
              />,
              <ModifyButtons id={item.id} remove={onDeleteClick} />,
            ]}
          >
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Phone:{" "}
              </Typography>
              {renderPhone(
                item,
                ConsentStatus,
                ConsentIcon,
                ConsentStatusColor,
                showCampaign,
                onLeadActivity
              )}
            </p>
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Email:{" "}
              </Typography>
              {item.emails[0]?.email || ""}
            </p>
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Address:{" "}
              </Typography>
              {<TextWrap>{parseLocation(item)}</TextWrap>}
            </p>
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Leads Status:{" "}
              </Typography>
              <a onClick={e => onEditClick(e, item)}>
                {item?.leadStatusType?.type || ""}
                {" / " +
                  (item?.leadStatusType?.status || "OTHER").replace(/_/g, " ")}
              </a>
            </p>
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Sources:{" "}
              </Typography>
              {item?.leadSourceType || ""}
              {" / " + (item?.leadSource?.name || "Unknown")}
            </p>
            <p>
              <Typography variant={"h4"} weight={"medium"} inline>
                Vehicles:{" "}
              </Typography>
              {renderVehicles(item)}
            </p>
          </CardWrapper>
        </List.Item>
      )}
    />
  )
}
export default LeadGridView
