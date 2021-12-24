import React, { useRef, useState, useEffect } from "react"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_FILTER_TYPES } from "../../graphql/query"
import { DELETE_FILTER_TYPE, SAVE_FILTER_TYPE } from "../../graphql/mutation"
import { Button, Table, Select, Popconfirm } from "antd"
import styled from "styled-components"
import TextInput from "../../library/textInput"
import Typography from "../../library/typography"
import SelectionOptions from "./selectionOptions"

const types = [
  { name: "Multiselect", value: "MULTISELECT" },
  { name: "Select", value: "SELECT" },
  { name: "Text", value: "TEXT" },
  { name: "Template", value: "TEMPLATE" },
  { name: "Range", value: "RANGE" },
]

const InlineFormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`

const InlineSelectCntr = styled.div`
  margin: 8px 16px;
`

const Tags = () => {
  const { loading, data, refetch: refetchTypes } = useQuery(GET_FILTER_TYPES)
  const [editingFilterTypeOptions, setEditingFilterTypeOptions] = useState("")
  const [editingFilterType, setEditingFilterType] = useState("")

  const [saveFilterType, { data: newFilterType }] = useMutation(
    SAVE_FILTER_TYPE
  )

  const [deleteFilterType, response] = useMutation(DELETE_FILTER_TYPE)

  const goBackToList = () => {
    refetchTypes()
    setEditingFilterTypeOptions("")
  }

  const submitDeleteFilterType = filter => {
    deleteFilterType({
      variables: {
        filterId: filter.id,
      },
    }).then(() => refetchTypes())
  }

  return (
    <div>
      <Typography variant={"h4"}>Filter Types</Typography>
      {editingFilterTypeOptions ? (
        <SelectionOptions
          filterType={editingFilterTypeOptions}
          goBack={goBackToList}
        />
      ) : (
        <React.Fragment>
          <FilterTypeForm
            saveFilterType={saveFilterType}
            editFilterType={editingFilterType}
            setEditingFilterType={setEditingFilterType}
            refetchTypes={refetchTypes}
          />
          {data && (
            <FilterTable
              filters={data.getFilterTypes}
              setFilterType={setEditingFilterTypeOptions}
              setEditFilterType={setEditingFilterType}
              deleteFilterType={submitDeleteFilterType}
            />
          )}
        </React.Fragment>
      )}
    </div>
  )
}

export default Tags

const FilterTable = ({
  filters,
  setFilterType,
  setEditFilterType,
  deleteFilterType,
}) => {
  const { Column } = Table

  return (
    <Table
      dataSource={filters}
      rowKey={"id"}
      pagination={false}
      tableLayout={"auto"}
    >
      <Column title={"Name"} dataIndex={"name"} key={"name"} width={"33%"} />
      <Column title={"Type"} dataIndex={"type"} key={"type"} />
      <Column
        title={"Query on field"}
        dataIndex={"filterField"}
        key={"filterField"}
      />
      <Column
        title={"# of options"}
        dataIndex={"optionsCount"}
        key={"optionsCount"}
        width={"15%"}
        render={(optionCount, record) =>
          record.type === "TEXT" ? "N/A" : optionCount
        }
      />
      <Column
        title={"Add options"}
        key={"add"}
        width={"10%"}
        render={(text, record) => (
          <Button
            type={"primary"}
            icon={"plus"}
            size={"small"}
            disabled={record.type === "TEXT"}
            onClick={() => setFilterType(record)}
          >
            Add
          </Button>
        )}
      />
      <Column
        title={"Edit"}
        key={"edit"}
        width={"8%"}
        render={(text, record) => (
          <Button
            icon={"edit"}
            // size={"small"}
            onClick={() => setEditFilterType(record)}
          />
        )}
      />
      <Column
        title={"Delete"}
        key={"edit"}
        width={"8%"}
        render={(text, record) => (
          <Popconfirm
            title={
              <p>
                Are you sure you want to delete this Filter?
                <br />
                WARNING: This will delete any user filters using this filter
                type!
              </p>
            }
            onConfirm={() => deleteFilterType(record)}
            okText={"Yes Delete"}
            okType={"danger"}
          >
            <Button
              icon={"delete"}
              // size={"small"}
              type={"danger"}
              ghost
            />
          </Popconfirm>
        )}
      />
    </Table>
  )
}

const FilterTypeForm = ({
  saveFilterType,
  editFilterType,
  refetchTypes,
  setEditingFilterType,
}) => {
  const nameRef = useRef(editFilterType ? editFilterType.name : "")
  const queryRef = useRef(editFilterType ? editFilterType.filterField : "")
  const [type, setType] = useState(
    editFilterType ? editFilterType.type : undefined
  )
  const [reset, setReset] = useState(false)

  const { Option } = Select

  const resetForm = () => {
    nameRef.current.value = ""
    queryRef.current.value = ""
    setType(undefined)
    setReset(true)
  }

  const submitFilterType = () => {
    const filterType = {
      name: nameRef.current.value,
      type: capitalizeFirstLetter(type),
      filterField: queryRef.current.value,
    }
    if (editFilterType) {
      filterType.id = editFilterType.id
    }
    if (validateFilterType(filterType)) {
      saveFilterType({ variables: filterType }).then(d => {
        refetchTypes()
        setEditingFilterType("")
        resetForm()
      })
    }
  }

  useEffect(() => {
    if (reset) {
      setReset(false)
    }
  }, [reset])

  useEffect(() => {
    if (editFilterType) {
      nameRef.current.value = editFilterType.name
      queryRef.current.value = editFilterType.filterField
      setType(editFilterType.type)
    }
  }, [editFilterType])

  return (
    <InlineFormCntr>
      <TextInput
        reference={nameRef}
        placeholder={"Name"}
        name={"name"}
        defaultValue={editFilterType ? editFilterType.name : undefined}
      />
      <TextInput
        reference={queryRef}
        placeholder={"Field to query"}
        name={"filterField"}
        defaultValue={editFilterType ? editFilterType.filterField : undefined}
      />
      <InlineSelectCntr>
        <Select
          defaultValue={type}
          value={type}
          onChange={setType}
          placeholder={"Select a type"}
          style={{ minWidth: "200px", marginTop: "4px" }}
        >
          {types.map(t => (
            <Option value={t.value} key={t.value}>
              {t.name}
            </Option>
          ))}
        </Select>
      </InlineSelectCntr>
      <InlineFormButton type={"primary"} onClick={submitFilterType}>
        {editFilterType ? "Update" : "Create"}
      </InlineFormButton>
    </InlineFormCntr>
  )
}

const validateFilterType = filterType =>
  filterType.type && filterType.filterField && filterType.name.trim() !== ""

const capitalizeFirstLetter = text =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
