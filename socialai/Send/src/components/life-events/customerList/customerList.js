import { useQuery, useMutation } from "@apollo/react-hooks"
import { Button, Input, Table, Dropdown, Menu, Icon, Tag, Tooltip } from "antd"
import { navigate } from "gatsby"

import React, { useContext, useState, useRef } from "react"
import { UserContext } from "../../../amplify/authenticator-provider"
import { formatPhoneNumber, isValidPhoneNumber } from "react-phone-number-input"
import {
  GET_PAGINATED_LEADS,
  GET_LEAD_SOURCES,
  GET_ALL_VEHICLE_OF_INTEREST,
  GET_CAMPAIGN_PAGINATED_LIST,
  GET_LEAD_STATUS_TYPES,
} from "../../../graphql/query"
import {
  ContentBody,
  IconCustom,
  SecondaryButton,
  NoPaddingButton,
  FilterButtonGroup,
  InputButtonGroup,
} from "../../../library/basicComponents"
import ModifyButtons from "../../../library/modifyButtons"
import { Spacer, parseLocation } from "../../../library/utils"
import { Layout } from "../layout"
import { CustomTable } from "./elements"
import { useEffect } from "react"
import isUndefined from "lodash/isUndefined"
import isEmpty from "lodash/isEmpty"
import { Subject } from "rxjs"
import { debounceTime, distinctUntilChanged } from "rxjs/operators"
import LeadEditModal from "./leadEditModal"
// import { PERSON_MUTATION } from "../../../graphql/mutation"
import { DELETE_LEAD } from "../../../graphql/mutation"
import { toSnake } from "../../../utils"
import LeadGridView from "./LeadGridView"
import CsvImport from "../csvImport"
import FilterDropdown from "../../../library/filterDropdown"
import FilterTextBox from "../../../library/filterTextbox"
import SelectSchedule from "../../../library/selectSchedule"
import styled from "styled-components"
import LeadCampaignModalPopup from "../../engagements/leadCampaignModel"

const { Search } = Input
const { Column } = Table

const Plink = styled.p`
  cursor: pointer;
  color: #00648d;
`
const ContentBodyWrap = styled(ContentBody)`
  .ant-table-body {
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      height: 7px;
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
const FilterButtonGroupWrap = styled(FilterButtonGroup)`
  width: 80%;
  justify-content: flex-end;
  @media only screen and (max-width: 1024px) {
    width: 100%;
    justify-content: center;
    align-items: center;
    padding: 5px;
    .ant-btn {
      margin: 10px 0;
    }
  }
`

const SpacerWrap = styled(Spacer)`
  margin-left: 15px;
  @media only screen and (max-width: 1024px) {
    text-align: center;
  }
`

const TextWrap = styled.div`
  wordwrap: break-word !important;
  wordbreak: break-word !important;
`

const CloseButton = ({ onBackClick }) => {
  return (
    <Button
      type={"default"}
      onClick={() => (onBackClick ? onBackClick() : navigate("/life-events/"))}
    >
      Back
    </Button>
  )
}

const CamapignButton = ({ onClick, disabled }) => {
  return (
    <Button
      type={"primary"}
      onClick={onClick}
      disabled={disabled}
      style={{ marginRight: 15 }}
    >
      Create Campaign
    </Button>
  )
}

const createMenu = (items, onClick) => (
  <Menu selectable>
    {items.map(([value, text]) => (
      <Menu.Item
        data-testid="menu-item"
        key={value}
        onClick={() => onClick(value)}
      >
        {text}
      </Menu.Item>
    ))}
  </Menu>
)

export const AddLeadMenuButton = ({ options, onClick: onMenuClick }) => {
  return (
    <Dropdown
      overlay={createMenu(
        options.map(x => [x.value, x.text]),
        onMenuClick
      )}
    >
      <SecondaryButton type={"primary"}>
        Add Lead(s)
        <Icon type="down" />
      </SecondaryButton>
    </Dropdown>
  )
}

const menuOptions = [
  { value: "single-lead", text: "Single Lead" },
  { value: "upload-file", text: "Upload File" },
]
const SearchRow = ({
  refetch,
  aingineSourceId,
  onSearchboxChange,
  showFirstRow,
  showCampaign,
  onCreateCampaign,
  onCloseClick,
  selectedRows = null,
  campaigns = [],
  onCampaignFilterChange,
}) => {
  const [modal, setModal] = useState("")
  const [selectedSource, setFilterSource] = useState("All")
  let campaginList = [...campaigns]
  campaginList.unshift({
    id: -1,
    name: "Show leads without campaign",
  })

  return (
    <>
      <Search
        onChange={e => onSearchboxChange(e.target.value)}
        placeholder="Search leads by details"
        //style={{ width: "30%" }}
        allowClear={true}
      />
      <FilterButtonGroupWrap>
        <label style={{ padding: "5px" }}>Filter By Campaign:</label>
        <SelectSchedule
          mode={"single"}
          value={selectedSource}
          placeholder={"Filter By Campaign"}
          showAll={true}
          onChange={e => {
            setFilterSource(e)
            onCampaignFilterChange(e)
          }}
          data={campaginList}
          width={"20%"}
        />
        <SpacerWrap>
          {showFirstRow ? (
            <SecondaryButton
              type={"primary"}
              onClick={() => setModal(modal => !modal)}
              disabled={!aingineSourceId}
            >
              Add person of interest
              <IconCustom type="plus-circle" />
            </SecondaryButton>
          ) : (
            <>
              <CamapignButton
                onClick={onCreateCampaign}
                disabled={selectedRows && selectedRows.length <= 0}
              />
              <AddLeadMenuButton
                options={menuOptions}
                onClick={e => setModal(e)}
              />
              {!isUndefined(showCampaign) && (
                <CloseButton onBackClick={onCloseClick} />
              )}
            </>
          )}
        </SpacerWrap>
      </FilterButtonGroupWrap>
      {modal === menuOptions[0].value && (
        <LeadEditModal
          refetch={refetch}
          visibleModal={modal === menuOptions[0].value}
          setModelVisible={() => setModal("")}
          lead={null}
        />
      )}

      {modal === menuOptions[1].value && (
        <CsvImport
          isVisible={modal === menuOptions[1].value}
          setIsVisible={payload => {
            setModal(false)
            if (payload?.fileId) {
              refetch()
            }
          }}
        />
      )}
    </>
  )
}

let searchInput$ = new Subject()

export const CustomerList = ({
  showTitleRow,
  showCampaign,
  onRowClick,
  onBackClick,
  onCreadCampaignClick,
}) => {
  const { user } = useContext(UserContext)
  const searchInputRef = useRef("")
  const aingineSourceId = user?.company?.aingineSourceId
  const [selectedRows, setSelectedRows] = useState([])
  const [voiVariables, setVoiVariables] = useState({
    search: "",
    source: [],
    sourceOriginal: [],
    combinedSource: [],
    page: 1,
    pageSize: 50,
  })
  const [variables, setVariables] = useState({
    search: "",
    source: [],
    sourceOriginal: [],
    combinedSource: [],
    voi: [],
    page: 1,
    pageSize: 25,
    orderBy: "full_name",
    orderDirection: "asc",
    leadStatusTypes: [],
  })

  const [openEditPopup, setOpenEditPopup] = useState(false)
  const [selectedLead, setSelectedLead] = useState({})
  const [openCampignPopup, setOpenCampignPopup] = useState(false)

  const { data, refetch, loading } = useQuery(GET_PAGINATED_LEADS, {
    fetchPolicy: "network-only",
    variables: { ...variables },
  })

  const { data: sourcesData } = useQuery(GET_LEAD_SOURCES)

  let sources = (sourcesData?.leadSources || []).map(el => ({
    text: el?.name,
    value: el?.id,
  }))
  sources.unshift({
    text: "Unknown",
    value: 0,
  })

  const { data: resp } = useQuery(GET_LEAD_STATUS_TYPES)

  const leadStatus = (resp?.leadStatusTypes || []).map(item => ({
    text: item?.type + " / " + item?.status.replace(/_/g, " "),
    value: item?.id,
  }))

  const {
    data: vehicleData,
    loading: vehicleLoading,
    refetch: refetchVOI,
  } = useQuery(GET_ALL_VEHICLE_OF_INTEREST, {
    variables: {
      ...voiVariables,
    },
  })

  const vehicleofInterestList = (vehicleData?.getAllVoi || []).map(el => ({
    text: el,
    value: el,
  }))

  const { data: campaignData } = useQuery(GET_CAMPAIGN_PAGINATED_LIST, {
    variables: {
      companyId: user?.company?.id || 0,
    },
  })

  const [deleteCustomer] = useMutation(DELETE_LEAD)

  const onDeleteCustomer = row => {
    deleteCustomer({
      variables: {
        leadId: row.variables.id,
      },
    }).then(() => refetch())
  }

  useEffect(() => {
    searchInput$ = new Subject()

    searchInput$.pipe(debounceTime(500), distinctUntilChanged()).subscribe({
      next: search => {
        setVariables({ ...variables, page: 1, search })
      },
    })

    return () => {
      searchInput$.unsubscribe()
    }
  }, [])

  const handleRowClick = (id, showTitleRow = true) => {
    if (!showTitleRow) {
      if (data?.getLeads?.data) {
        const lead = data?.getLeads?.data.find(item => item.id === id)
        onRowClick({ data: lead, tab: "lead-center" })
      }
    } else {
      navigate(`/life-events/customers/${id}/profile`)
    }
  }

  const onCustomerActivity = id => {
    if (data?.getLeads?.data) {
      const lead = data?.getLeads?.data.find(item => item.id === id)
      onRowClick({ data: lead, tab: "activity-center" })
    }
  }

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRows(selectedRows)
    },
  }
  const handleCreateCampaignClick = selectedRows => {
    if (showCampaign) {
      onCreadCampaignClick(selectedRows)
    } else {
      onRowClick({ data: selectedRows, tab: "campaigns" })
    }
  }

  const handleSourceSearch = e => {
    if (e) {
      setVariables({
        ...variables,
        page: 1,
        sourceOriginal: e == "0" ? [null] : e,
      })
    }
  }

  const handleVehicleSearch = e => {
    if (e) {
      setVariables({ ...variables, page: 1, voi: e })
    }
  }

  const handleLeadStatusSearch = e => {
    if (e) {
      setVariables({
        ...variables,
        page: 1,
        leadStatusTypes: e,
      })
    }
  }

  const handleEditPopup = (e, record) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
      setSelectedLead(record)
      setOpenEditPopup(true)
    }
  }

  const handleNameSearch = e => {
    setVariables({ ...variables, page: 1, search: e })
  }

  const handleListSearch = value => {
    setVoiVariables({
      ...voiVariables,
      search: value ? value : "",
    })
  }

  const handleCampaignFilterChange = e => {
    if (e == "All") {
      let obj = { ...variables, page: 1 }
      delete obj["campaignId"]
      setVariables(obj)
    } else {
      setVariables({ ...variables, page: 1, campaignId: e })
    }
  }

  const handleCamapignClick = (e, record) => {
    setSelectedLead(record)
    setOpenCampignPopup(true)
  }

  const ConsentIcon = consent => {
    const color = `${
      consent == "ACCEPTED"
        ? "check-circle"
        : consent == "PENDING" && user?.company?.isOptinConsentMethod
        ? "clock-circle"
        : consent == "PENDING" && !user?.company?.isOptinConsentMethod
        ? "check-circle"
        : consent == "DECLINED"
        ? "close-circle"
        : "exclamation-circle"
    }`
    return color
  }

  const ConsentStatusColor = consent => {
    return `${
      consent == "ACCEPTED"
        ? "#52c41a"
        : consent == "PENDING" && user?.company?.isOptinConsentMethod
        ? "orange"
        : consent == "PENDING" && !user?.company?.isOptinConsentMethod
        ? "green"
        : consent == "DECLINED"
        ? "#FC5A5A"
        : "grey"
    }`
  }
  const ConsentStatus = consent => {
    return `${
      consent == "ACCEPTED"
        ? "Opted-In"
        : consent == "PENDING" && user?.company?.isOptinConsentMethod
        ? "Pending Consent"
        : consent == "PENDING" && !user?.company?.isOptinConsentMethod
        ? "Implied Consent"
        : consent == "DECLINED"
        ? "Opted-Out"
        : "Send Consent"
    }`
  }

  return (
    <Layout
      containerProps={{
        auto: true,
        style: { width: window.innerWidth > 1024 ? "94%" : "100%" },
      }}
      title="Lead List"
      buttons={<CloseButton />}
      showFirstRow={showTitleRow}
      secondRow={
        <SearchRow
          onSearchboxChange={value => handleNameSearch(value)}
          refetch={refetch}
          aingineSourceId={aingineSourceId}
          showFirstRow={showTitleRow}
          showCampaign={showCampaign}
          onCloseClick={onBackClick}
          onCreateCampaign={() => handleCreateCampaignClick(selectedRows)}
          selectedRows={selectedRows}
          campaigns={campaignData?.getCampaigns?.data || []}
          onCampaignFilterChange={handleCampaignFilterChange}
        />
      }
    >
      <ContentBodyWrap>
        {window.innerWidth > 1024 ? (
          <CustomTable
            rowClassName={(record, index) => {
              const hasPreviousVehicle =
                (record?.vehicleOfInterest || []).filter(
                  el => el.isCurrent == false
                ).length > 0
              return hasPreviousVehicle ? "table-row-dark" : "table-row-light"
            }}
            loading={loading}
            dataSource={data?.getLeads?.data || []}
            rowKey="id"
            rowSelection={{
              type: "checkbox",
              ...rowSelection,
            }}
            onChange={(pagination, filters, sorter) => {
              const parsedSorter = {}

              switch (sorter.order) {
                case "ascend":
                  parsedSorter.orderDirection = "asc"
                  break
                case "descend":
                  parsedSorter.orderDirection = "desc"
                  break
                default:
                  parsedSorter.orderDirection = null
                  break
              }

              parsedSorter.orderBy = toSnake(sorter.columnKey) || ""

              let newVariables = {
                ...variables,
                ...parsedSorter,
                page:
                  variables.pageSize !== pagination.pageSize
                    ? 1
                    : pagination.current,
                pageSize: pagination.pageSize,
              }

              if (!parsedSorter.orderBy || !parsedSorter.orderDirection) {
                delete newVariables.orderBy
                delete newVariables.orderDirection
              }

              setVariables(newVariables)
            }}
            pagination={{
              defaultCurrent: variables.page,
              current: variables.page,
              defaultPageSize: variables.pageSize,
              pageSize: variables.pageSize,
              total: data?.getLeads?.count,
              showTotal: (total, range) =>
                `Total: ${total} ${total === 1 ? "lead" : "leads"}`,
              pageSizeOptions: ["5", "25", "50"],
              showSizeChanger: true,
            }}
            scroll={{ x: 1200 }}
          >
            <Column
              title="Name"
              width={250}
              sorter
              defaultSortOrder="ascend"
              dataIndex="fullName"
              key="fullName"
              render={(text, record) => (
                <a
                  onClick={
                    showCampaign
                      ? null
                      : () => handleRowClick(record?.id, showTitleRow)
                  }
                >
                  <TextWrap>{text || "Unknown"}</TextWrap>
                </a>
              )}
              filterIcon={filtered => (
                <Icon
                  type="search"
                  style={{ color: filtered ? "#1890ff" : undefined }}
                />
              )}
              filterDropdown={props => (
                <FilterTextBox
                  {...props}
                  searchInputRef={searchInputRef}
                  confirm={e => handleNameSearch(e)}
                />
              )}
              //onFilter={(value, record) => record.fullName.includes(value)}
            />
            <Column
              width={240}
              title="Phone Number"
              dataIndex="phoneNumbers[0].phone"
              key="phone"
              align="left"
              render={(text, record) => {
                const phone = !isUndefined(record?.phoneNumbers[0]?.phone)
                  ? record?.phoneNumbers[0]?.phone
                  : ""

                return (
                  <>
                    {!isEmpty(phone) &&
                    phone != null &&
                    isValidPhoneNumber(phone) ? (
                      <Tooltip title={ConsentStatus(record?.textConsentStatus)}>
                        <Icon
                          type={ConsentIcon(record?.textConsentStatus)}
                          style={{
                            color: ConsentStatusColor(
                              record?.textConsentStatus
                            ),
                            fontSize: 20,
                          }}
                        />
                      </Tooltip>
                    ) : null}
                    <NoPaddingButton
                      type="link"
                      onClick={
                        showCampaign
                          ? null
                          : () => onCustomerActivity(record?.id)
                      }
                    >
                      {<>{formatPhoneNumber(phone)}</>}
                    </NoPaddingButton>
                    <Plink onClick={e => handleCamapignClick(e, record)}>
                      <TextWrap>
                        <Icon type="ci" style={{ fontSize: 20 }} />{" "}
                        {"View Campaigns"}
                      </TextWrap>
                    </Plink>
                  </>
                )
              }}
            />
            <Column
              width={200}
              title="Address"
              dataIndex="addresses[0].addressLine1"
              key="address"
              render={(text, record) => {
                return <TextWrap>{parseLocation(record)}</TextWrap>
              }}
            />
            <Column
              width={280}
              title="Email"
              dataIndex="emails[0].email"
              key="email"
              render={(text, record) => {
                const email = record.emails[0]?.email || ""
                return (
                  <>
                    {(record?.emails || []).length > 0 && !isEmpty(email) && (
                      <>{email}</>
                    )}
                  </>
                )
              }}
            />
            <Column
              width={210}
              title="Lead Status"
              sorter
              dataIndex="leadStatusType"
              key="leadStatusType"
              filters={leadStatus}
              filterDropdown={props => (
                <FilterDropdown
                  {...props}
                  confirm={e => handleLeadStatusSearch(e)}
                  dataIndex={"leadStatusType"}
                />
              )}
              render={(text, record) => {
                if (record?.leadStatusType) {
                  const name = record?.leadStatusType?.status || "OTHER"
                  return (
                    <>
                      <a onClick={e => handleEditPopup(e, record)}>
                        {record?.leadStatusType?.type || ""}
                        {" / " + name.replace(/_/g, " ")}
                      </a>
                    </>
                  )
                } else {
                  return null
                }
              }}
            />
            <Column
              width={150}
              title="Source"
              sorter
              dataIndex="leadSourceType"
              key="leadSourceType"
              filters={sources}
              filterDropdown={props => (
                <FilterDropdown
                  {...props}
                  confirm={e => handleSourceSearch(e)}
                  dataIndex={"Source"}
                />
              )}
              render={(text, record) => {
                const name = record?.leadSource?.name || "Unknown"
                return (
                  <>
                    {record?.leadSourceType || ""}
                    {" / " + name}
                  </>
                )
              }}
            />
            <Column
              width={250}
              title="Vehicles"
              key="Vehicle_of_interest"
              render={(text, record) => {
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
                        <Tooltip
                          placement="topLeft"
                          title={
                            record?.vehicleOfInterest[i]?.isCurrent
                              ? "Previous/Current Vehicle"
                              : "Vehicle of Interest"
                          }
                        >
                          <Tag
                            color={
                              record?.vehicleOfInterest[i]?.isCurrent
                                ? "magenta"
                                : "blue"
                            }
                          >
                            {voi}
                          </Tag>
                        </Tooltip>
                      </p>
                    )
                  })
                }
                return <>{tags}</>
              }}
              filters={vehicleofInterestList}
              filterDropdown={props => (
                <FilterDropdown
                  {...props}
                  dataIndex={"Vehicles"}
                  confirm={e => handleVehicleSearch(e)}
                  loading={vehicleLoading}
                  onSearch={e => handleListSearch(e)}
                />
              )}
            />
            {(!showCampaign || isUndefined(showCampaign)) && (
              <Column
                title="Actions"
                width={160}
                align={"center"}
                key="button"
                fixed="right"
                render={(text, record) => {
                  return (
                    <InputButtonGroup style={{ margin: 0 }}>
                      <ModifyButtons
                        id={record.id}
                        activity={onCustomerActivity}
                      />
                      <Icon
                        type={"edit"}
                        onClick={e => handleEditPopup(e, record)}
                        style={{ marginLeft: 15, marginRight: 15 }}
                      />
                      <ModifyButtons id={record.id} remove={onDeleteCustomer} />
                    </InputButtonGroup>
                  )
                }}
              />
            )}
          </CustomTable>
        ) : (
          <LeadGridView
            data={data?.getLeads?.data || []}
            count={data?.getLeads?.count || 0}
            variables={variables}
            setVariables={setVariables}
            onTitleClick={handleRowClick}
            onLeadActivity={onCustomerActivity}
            onEditClick={handleEditPopup}
            onDeleteClick={onDeleteCustomer}
            ConsentStatus={ConsentStatus}
            ConsentIcon={ConsentIcon}
            ConsentStatusColor={ConsentStatusColor}
            loading={loading}
            showCampaign={showCampaign}
            showTitleRow={showTitleRow}
            handleCamapignClick={handleCamapignClick}
          />
        )}
      </ContentBodyWrap>
      {openEditPopup && (
        <LeadEditModal
          lead={selectedLead}
          visibleModal={openEditPopup}
          setModelVisible={payload => {
            refetch()
            setOpenEditPopup(payload)
          }}
        />
      )}
      {openCampignPopup && (
        <LeadCampaignModalPopup
          lead={selectedLead}
          visible={openCampignPopup}
          onCancel={() => setOpenCampignPopup(false)}
        />
      )}
    </Layout>
  )
}
