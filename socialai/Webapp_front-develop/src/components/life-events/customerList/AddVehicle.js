import React, { useState, useEffect } from "react"
import { useQuery } from "@apollo/react-hooks"
import {
  Table,
  Button,
  Row,
  Col,
  Icon,
  Checkbox,
  message,
  Select,
  Card,
} from "antd"
import {
  Container,
  ContainerNavigation,
} from "../../../library/basicComponents"
import styled from "styled-components"
import Typography from "../../../library/typography"
import isEmpty from "lodash/isEmpty"
import SelectSchedule from "../../../library/selectSchedule"
import { GET_VEHICLE_MAKES, GET_VEHICLE_MODELS } from "../../../graphql/query"
import { getVehicleYears } from "../../../library/helpers"
import moment from "moment"

const { Option } = Select

const ContainerNavigationWrap = styled(ContainerNavigation)`
  border-bottom: 0;
  padding: 0;
  .ant-card-body {
    padding: 12px;
  }
`

const FormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px 5px;
  align-items: center;
`
const LabelWrap = styled.label`
  margin-bottom: 5px;
`
const ColWrap = styled.div`
  margin: 0 5px;
  width: 100%;
`
const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`
const ContainerWrap = styled(Container)`
  margin-top: 10px;
  .ant-modal-body {
    padding-top: 10px;
  }
  border: 0;
`
const customerInterestData = [
  { id: "BUY", name: "Buy" },
  { id: "SELL", name: "Sell" },
  { id: "TRADE", name: "Trade" },
  { id: "NONE", name: "None" },
]

const AddVehicleForm = ({
  vehicles,
  saveVehicle,
  removeVehicle,
  loading = false,
  selectedVehicle = null,
  showPreviousVechile = true,
}) => {
  //const [vehicles, setVehicles] = useState([])
  const yearData = getVehicleYears().map(el => ({ id: el, name: el }))
  const [editVehicle, setEditVehicle] = useState(null)
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState(moment().year())
  const [customerInterest, setCustomerInterest] = useState("")
  const [previousVehicle, setPreviousVehicle] = useState(false)
  const [isPrimary, setPrimaryVehicle] = useState(false)

  const [modelData, setModelData] = useState([])
  const [makeData, setMakeData] = useState([])

  const [modelVeriables, setModelVariables] = useState({
    search: "",
    year: year,
    makeName: "",
  })

  useEffect(() => {
    if (selectedVehicle) {
      handleEdit(selectedVehicle)
    }
  }, [selectedVehicle])

  const { data, loading: modelLoading } = useQuery(GET_VEHICLE_MODELS, {
    variables: { ...modelVeriables },
    onCompleted: resp => {
      const _modelData = (resp?.getVehicleModels?.data || []).map(el => ({
        id: el.ModelName,
        name: el.ModelName,
      }))
      setModelData(_modelData)
    },
  })

  const [makeVeriables, setMakeVariables] = useState({
    page: 1,
    pageSize: 25,
  })

  const { data: makeResp, loading: makeLoading } = useQuery(GET_VEHICLE_MAKES, {
    variables: { ...makeVeriables },
    onCompleted: res => {
      const makes = (res?.getVehicleMakes?.data || []).map(el => ({
        id: el.MakeName,
        name: el.MakeName,
      }))
      setMakeData(makes)
    },
  })

  const resetForm = () => {
    setMake("")
    setYear("")
    setModel("")
    setCustomerInterest("")
    setEditVehicle(null)
    setPreviousVehicle(false)
    setPrimaryVehicle(false)
  }

  const submitVehicle = () => {
    if (isEmpty(make) || isEmpty(model) || year == "") {
      message.error("Please enter vehicle make, model and year")
      return
    }

    saveVehicle({
      id: editVehicle ? editVehicle?.id : null,
      make: make,
      model: model,
      year: year,
      customerInterest: customerInterest,
      isCurrent: ["SELL", "TRADE", "NONE"].includes(customerInterest)
        ? true
        : previousVehicle,
      isPrimary: isPrimary || false,
    })
    resetForm()
  }

  const handleEdit = payload => {
    if (payload) {
      setMake(payload?.make)
      setYear(payload?.year)
      setModel(payload?.model)
      setCustomerInterest(payload?.customerInterest)
      setModelVariables({
        ...modelVeriables,
        makeName: payload?.make,
        year: payload?.year,
      })
    }
    setEditVehicle(payload)
    setPreviousVehicle(payload?.isCurrent)
    setPrimaryVehicle(payload?.isPrimary || false)
  }

  const handleSearch = e => {
    setMakeVariables(prevState => {
      let newState = { ...prevState }
      newState.search = e
      return newState
    })
  }

  return (
    <ContainerWrap auto>
      <Row gutter={[4, 16]}>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 6 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Year</LabelWrap>
          <SelectSchedule
            keyName={"year"}
            mode={"single"}
            value={year}
            placeholder={"Select Year"}
            showAll={false}
            showSearch={true}
            onChange={e => {
              setYear(e)
              setMake("")
              setModel("")
            }}
            data={yearData}
          />
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 6 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Make</LabelWrap>
          <Select
            key={"keyName"}
            size={"medium"}
            placeholder={"Select make"}
            style={{ width: "100%" }}
            onChange={e => {
              setMake(e)
              setModel("")
              setModelVariables({
                ...modelVeriables,
                makeName: e,
                year: year,
              })
            }}
            value={make}
            showSearch={true}
            onSearch={handleSearch}
            filterOption={false}
            loading={makeLoading}
          >
            {(makeData || []).map(el => {
              return (
                <Option key={el.name} value={el.id}>
                  {el.name}
                </Option>
              )
            })}
          </Select>
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 6 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Model</LabelWrap>
          <SelectSchedule
            keyName={"model"}
            mode={"single"}
            value={model}
            placeholder={"Select Model"}
            showAll={false}
            showSearch={true}
            onChange={e => setModel(e)}
            data={modelData}
            loading={modelLoading}
          />
        </Col>
        <Col
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 6 }}
          xl={{ span: 6 }}
          lg={{ span: 6 }}
        >
          <LabelWrap>Customer Interest</LabelWrap>
          <SelectSchedule
            keyName={"interest"}
            mode={"single"}
            value={customerInterest}
            placeholder={"Select customer interest"}
            showAll={false}
            showSearch={true}
            onChange={e => {
              setCustomerInterest(e)
              setPreviousVehicle(["SELL", "TRADE", "NONE"].includes(e))
            }}
            data={customerInterestData}
          />
        </Col>
      </Row>
      {/* </FormCntr> */}
      <FormCntr>
        <div>
          <Checkbox
            checked={isPrimary}
            onChange={e => setPrimaryVehicle(e.target.checked)}
          >
            Is Primary Vehicle?
          </Checkbox>
          {showPreviousVechile ? (
            <Checkbox
              checked={previousVehicle}
              onChange={e => setPreviousVehicle(e.target.checked)}
              style={{ marginLeft: 5 }}
            >
              Previous/Current Vehicle?
            </Checkbox>
          ) : (
            <div> </div>
          )}
        </div>
        <InlineFormButton
          type={"primary"}
          onClick={submitVehicle}
          loading={loading}
          //disabled={lead}
        >
          {editVehicle ? "Update" : "Add"}
        </InlineFormButton>
      </FormCntr>
      <VehicleTable
        vehiclesList={vehicles}
        onDeleteVehicle={removeVehicle}
        onEditVehicle={handleEdit}
      />
    </ContainerWrap>
  )
}
export default AddVehicleForm

const CardWrapper = styled(Card)`
  box-shadow: 0 2px 4px 1px rgb(0 0 0 / 15%) !important;
  & .ant-card-head-title {
    color: #00648d !important;
  }
  .ant-card-actions {
    background-color: #fff;
  }
  width: 100%;
  /*@media (max-width: 992px) {
    width: 240px !important;
  }*/
`

const AncherLink = styled.a`
  margin: 0 15px;
`
const TextWrap = styled.div`
  wordwrap: break-word;
  wordbreak: break-word;
  width: 100%;
  @media (max-width: 992px) {
    width: 50px !important;
  }
`

const VehicleTable = ({ vehiclesList, onDeleteVehicle, onEditVehicle }) => {
  const { Column } = Table
  let columns = [
    <Column
      title={"Vehicle Make"}
      dataIndex={"make"}
      key={"make"}
      defaultSortOrder={"ascend"}
      sorter={(a, b) => a.make.localeCompare(b.make)}
    />,
    <Column title={"Vehicle Model"} dataIndex={"model"} key={"model"} />,
    <Column title={"Vehicle Year"} dataIndex={"year"} key={"year"} />,
    <Column
      title={"Customer Interest"}
      dataIndex={"customerInterest"}
      key={"customerInterest"}
    />,
    <Column
      title={"Is Primary"}
      dataIndex={"isPrimary"}
      key={"isPrimary"}
      render={(text, record) => {
        return <>{record?.isPrimary ? "Yes" : "No"}</>
      }}
    />,
    <Column
      title={"Current/Previus Vehicle"}
      dataIndex={"isCurrent"}
      key={"isCurrent"}
      render={(text, record) => {
        return <>{record?.isCurrent ? "Yes" : "No"}</>
      }}
    />,
    <Column
      title={"Edit"}
      key={"edit"}
      render={(text, record) => (
        <Icon type={"edit"} onClick={() => onEditVehicle(record)} />
      )}
    />,
    <Column
      title="Delete"
      width={85}
      key="delbutton"
      render={({ id }) => (
        <Icon
          type={"delete"}
          onClick={e => {
            e.stopPropagation()
            onDeleteVehicle(id)
          }}
        />
      )}
    />,
  ]
  if (window.innerWidth <= 1024) {
    columns = [
      <Column
        width={"100%"}
        key={"edit"}
        render={(text, record) => {
          let voi = ""
          voi = voi + record?.make + " "
          voi = voi + record?.model + " "
          voi = voi + record?.year + " "

          return (
            <CardWrapper
              title={
                <ContainerNavigationWrap>
                  <TextWrap>{voi}</TextWrap>
                </ContainerNavigationWrap>
              }
              actions={[
                <AncherLink>
                  <Icon type={"edit"} onClick={() => onEditVehicle(record)} />
                </AncherLink>,
                <AncherLink>
                  <Icon
                    type={"delete"}
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteVehicle(id)
                    }}
                  />
                </AncherLink>,
              ]}
            >
              <Row>
                <Col
                  xs={{ span: 24 }}
                  sm={{ span: 24 }}
                  md={{ span: 6 }}
                  xl={{ span: 6 }}
                  lg={{ span: 6 }}
                >
                  <Typography variant={"h4"} weight={"medium"} inline>
                    Make:{" "}
                  </Typography>
                  {record.make || ""}
                </Col>
                <Col
                  xs={{ span: 24 }}
                  sm={{ span: 24 }}
                  md={{ span: 6 }}
                  xl={{ span: 6 }}
                  lg={{ span: 6 }}
                >
                  <Typography variant={"h4"} weight={"medium"} inline>
                    Model:{" "}
                  </Typography>
                  {record.model || ""}
                </Col>
                <Col
                  xs={{ span: 24 }}
                  sm={{ span: 24 }}
                  md={{ span: 4 }}
                  xl={{ span: 4 }}
                  lg={{ span: 4 }}
                >
                  <Typography variant={"h4"} weight={"medium"} inline>
                    Year:{" "}
                  </Typography>
                  {record.year || ""}
                </Col>
                <Col
                  xs={{ span: 24 }}
                  sm={{ span: 24 }}
                  md={{ span: 8 }}
                  xl={{ span: 8 }}
                  lg={{ span: 8 }}
                >
                  <Typography variant={"h4"} weight={"medium"} inline>
                    Previous/Current Vehicle:{" "}
                  </Typography>
                  {record.isCurrent ? "Yes" : "No"}
                </Col>
                <Col
                  xs={{ span: 24 }}
                  sm={{ span: 24 }}
                  md={{ span: 8 }}
                  xl={{ span: 8 }}
                  lg={{ span: 8 }}
                >
                  <Typography variant={"h4"} weight={"medium"} inline>
                    Is Primary Vehicle:{" "}
                  </Typography>
                  {record?.isPrimary ? "Yes" : "No"}
                </Col>
              </Row>
            </CardWrapper>
          )
        }}
      />,
    ]
  }

  return (
    <Table
      dataSource={vehiclesList}
      rowKey={"id"}
      pagination={false}
      //showHeader={false}
    >
      {columns}
    </Table>
  )
}
