import React, { useState } from "react"
import PanelHeader from "../../library/panelHeader"
import { Button, Select, Table, Alert, Popconfirm } from "antd"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { GET_FILTER_TYPES, GET_COMPANY_FILTERS } from "../../graphql/query"
import { SAVE_COMPANY_FILTERS } from "../../graphql/mutation"
import Typography from "../../library/typography"
import styled from "styled-components"

const Header = styled(Typography)`
  margin: 18px 0;
`

const FormCntr = styled.div`
  margin: 18px 0;
`

const CustomSelect = styled(Select)`
  width: 280px;
`

const SaveButton = styled(Button)`
  margin-left: 14px;
`

const CompanyFilters = ({ company, setCompany, setActiveTab, newCoSetup }) => {
  const [error, setError] = useState("")
  const [companyFilters, setCompanyFilters] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const { data: filterTypesData } = useQuery(GET_FILTER_TYPES)
  const { data: companyFiltersData, refetch: refetchCompanyFilters } = useQuery(
    GET_COMPANY_FILTERS,
    {
      variables: {
        id: company.id,
      },
      fetchPolicy: "no-cache",
      onCompleted: res => {
        const filters = groupFiltersByType(res.company.filters)
        setCompanyFilters(filters)
      },
    }
  )
  const [saveCompanyFilters, response] = useMutation(SAVE_COMPANY_FILTERS)
  const handleSave = () => {
    setError("")
    const industryFilter = companyFilters.find(x => x.typeName === "Industry")
    if (industryFilter && industryFilter.values.length > 0) {
      let allHaveValues = true
      companyFilters.map(coFilter => {
        if (coFilter.values.length === 0) {
          allHaveValues = false
        }
      })
      if (allHaveValues) {
        const formattedFilters = []

        companyFilters.forEach(x => {
          x.values.forEach(y => {
            formattedFilters.push({
              filterField: x.filterField,
              id: y.companyFilterId,
              selectionOption: { id: y.optionId },
              type: x.type,
              typeName: x.typeName,
              userCanChange: x.userCanChange,
              value: y.value,
            })
          })
        })

        saveCompanyFilters({
          variables: {
            filters: formattedFilters,
            companyId: company.id,
          },
        })
          .then(res => {
            if (res.data.saveCompanyFilters.ok) {
              refetchCompanyFilters().then(res => {
                setHasChanges(false)
                if (newCoSetup) {
                  setActiveTab("Roles")
                }
              })
            } else {
              setError(
                <div>
                  Cannot remove the following filters because there are presets
                  using them:{" "}
                  {res.data.saveCompanyFilters.conflicts.map(x => (
                    <>
                      <br />
                      {x.selectionOption.filterType.name} /{" "}
                      {x.selectionOption.value}
                    </>
                  ))}
                </div>
              )
              refetchCompanyFilters().then(res => {
                let filters = groupFiltersByType(res.data.company.filters)
                setCompanyFilters(filters)
              })
            }
          })
          .catch(() => {
            setError("Error occurred while updating filters. Please try again.")
          })
      } else {
        setError(
          "All added filter types must have at least one allowed filter or be removed"
        )
      }
    } else {
      setError("Company must have an industry filter to continue")
    }
  }

  return (
    <React.Fragment>
      <PanelHeader title={"Company filters - " + company.name}>
        {!newCoSetup ? (
          <React.Fragment>
            {hasChanges ? (
              <Popconfirm
                title={"Leave without saving changes?"}
                onConfirm={() => setCompany(null)}
                okText={"Leave"}
                cancelText={"Stay"}
              >
                <Button>Close</Button>
              </Popconfirm>
            ) : (
              <Button onClick={() => setCompany(null)}>Close</Button>
            )}
            <SaveButton type={"primary"} onClick={handleSave}>
              Save
            </SaveButton>
          </React.Fragment>
        ) : (
          <SaveButton type={"primary"} onClick={handleSave}>
            Save & Continue
          </SaveButton>
        )}
      </PanelHeader>
      {error && (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ margin: "0 -24px" }}
        />
      )}
      <Header>Set up allowed filters for company</Header>
      {filterTypesData && (
        <CompanyFilterForm
          filterTypes={filterTypesData.getFilterTypes}
          companyFilters={companyFilters}
          setCompanyFilters={setCompanyFilters}
        />
      )}
      {companyFilters && filterTypesData && (
        <CompanyFiltersTable
          companyFilters={companyFilters}
          setCompanyFilters={setCompanyFilters}
          filterTypes={filterTypesData.getFilterTypes}
          setHasChanges={setHasChanges}
        />
      )}
    </React.Fragment>
  )
}

export default CompanyFilters

const capitalizeFirstLetter = text =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

const CompanyFilterForm = ({
  filterTypes,
  companyFilters,
  setCompanyFilters,
}) => {
  const [selectedType, setSelectedType] = useState(null)
  const [selectedBoolean, setSelectedBoolean] = useState(null)

  const handleTypeChange = value => {
    const type = filterTypes.filter(x => x.id === value)
    setSelectedType(type[0])
  }

  const handleBoolChange = value => {
    setSelectedBoolean(value)
  }

  const handleAddClick = () => {
    if (selectedType && selectedBoolean !== null) {
      setCompanyFilters([
        ...companyFilters,
        {
          typeName: selectedType.name,
          type: capitalizeFirstLetter(selectedType.type),
          filterField: selectedType.filterField,
          userCanChange: selectedBoolean === 1,
          values: [],
        },
      ])
      setSelectedType(null)
      setSelectedBoolean(null)
    }
  }

  const { Option } = Select

  return (
    <FormCntr>
      <CustomSelect
        placeholder={"Select a Filter Type"}
        value={selectedType ? selectedType.id : undefined}
        onChange={handleTypeChange}
      >
        {filterTypes.map(
          filterType =>
            filterType.type !== "TEXT" && (
              <Option
                key={filterType.id}
                value={filterType.id}
                disabled={
                  companyFilters.length > 0 &&
                  1 <
                    companyFilters.findIndex(
                      coFilter => coFilter.typeName === filterType.name
                    )
                }
              >
                <Typography inline>{filterType.name}</Typography> -{" "}
                {capitalizeFirstLetter(filterType.type)} -{" "}
                {filterType.filterField} ({filterType.optionsCount})
              </Option>
            )
        )}
      </CustomSelect>
      <Select
        placeholder="Can User Toggle"
        value={
          selectedBoolean || selectedBoolean === 0 ? selectedBoolean : undefined
        }
        style={{ width: "180px", margin: "0 18px" }}
        onChange={handleBoolChange}
      >
        <Option
          key={"true"}
          value={1}
          disabled={selectedType && selectedType.name === "Industry"}
        >
          Yes
        </Option>
        <Option key={"false"} value={0}>
          No
        </Option>
      </Select>
      <Button type={"primary"} onClick={handleAddClick}>
        Add type
      </Button>
    </FormCntr>
  )
}

const CompanyFiltersTable = ({
  companyFilters,
  setCompanyFilters,
  filterTypes,
  setHasChanges,
}) => {
  const { Option } = Select
  const { Column } = Table

  const handleFiltersOnChange = (record, options, allOptions) => {
    const selectAll = options.findIndex(x => x.props.value === "all")
    const deselectAll = options.findIndex(x => x.props.value === "none")

    let updatedValues = []
    if (selectAll >= 0) {
      updatedValues = allOptions.map(x => ({ optionId: x.id, value: x.value }))
    } else if (deselectAll >= 0) {
      updatedValues = []
    } else {
      updatedValues = options.map(val => {
        return { optionId: val.props.value, value: val.props.children }
      })
    }
    const updatedFilters = companyFilters.map(filter => {
      if (filter.typeName === record.typeName) {
        filter.values = updatedValues.map(x => {
          return filter.values.find(y => y.optionId === x.optionId) || x
        })
      }
      return filter
    })
    setCompanyFilters(updatedFilters)
    setHasChanges(true)
  }

  const handleDelete = name => {
    const updatedCompanyFilters = companyFilters.filter(
      coFilter => coFilter.typeName !== name
    )
    setCompanyFilters(updatedCompanyFilters)
  }

  return (
    <Table dataSource={companyFilters} rowKey={"typeName"} pagination={false}>
      <Column title={"Name"} key={"typeName"} dataIndex={"typeName"} />
      <Column title={"Type"} key={"type"} dataIndex={"type"} />
      <Column
        title={"Query on field"}
        key={"filterField"}
        dataIndex={"filterField"}
        width={"15%"}
        align={"center"}
      />
      <Column
        title={"Users can toggle"}
        key={"userCanChange"}
        dataIndex={"userCanChange"}
        align={"center"}
        width={"15%"}
        render={(value, record) => (value ? "Yes" : "No")}
      />
      <Column
        title={"Allowed Filters"}
        key={"values"}
        dataIndex={"values"}
        width={"30%"}
        render={(values, record) => {
          if (record) {
            const rowType = filterTypes.filter(x => x.name === record.typeName)
            return (
              <Select
                mode={"multiple"}
                placeholder={"Select Options to add"}
                style={{ width: "100%" }}
                value={values.map(x => x.optionId)}
                onChange={(value, options) =>
                  handleFiltersOnChange(
                    record,
                    options,
                    rowType[0].selectionOptions
                  )
                }
              >
                {rowType[0].selectionOptions.length > 2 &&
                  rowType[0].selectionOptions.length > values.length && (
                    <Option key={"all"} value={"all"}>
                      Select All
                    </Option>
                  )}
                {rowType[0].selectionOptions.length > 2 &&
                  rowType[0].selectionOptions.length === values.length && (
                    <Option key={"none"} value={"none"}>
                      Deselect All
                    </Option>
                  )}
                {rowType[0].selectionOptions.map(option => (
                  <Option key={option.id} value={option.id}>
                    {option.value}
                  </Option>
                ))}
              </Select>
            )
          } else {
            return null
          }
        }}
      />
      <Column
        title={"Remove"}
        key={"remove"}
        width={"10%"}
        align={"center"}
        render={(text, record) => (
          <Button
            type={"danger"}
            icon={"delete"}
            ghost
            onClick={() => handleDelete(record.typeName)}
          />
        )}
      />
    </Table>
  )
}

const groupFiltersByType = filters => {
  const typeIdx = []
  if (filters.length === 0) {
    return []
  } else if (filters.length === 1) {
    return [
      {
        typeName: filters[0].typeName,
        type: filters[0].type,
        filterField: filters[0].filterField,
        userCanChange: filters[0].userCanChange,
        values: [
          {
            companyFilterId: filters[0].id,
            value: filters[0].value,
            optionId: filters[0].selectionOption.id,
          },
        ],
      },
    ]
  } else {
    return filters.reduce((acc, cur, idx) => {
      if (idx === 1) {
        typeIdx.push(acc.typeName)
        acc = [
          {
            typeName: acc.typeName,
            type: acc.type,
            filterField: acc.filterField,
            userCanChange: acc.userCanChange,
            values: [
              {
                companyFilterId: acc.id,
                value: acc.value,
                optionId: acc.selectionOption.id,
              },
            ],
          },
        ]
      }
      if (typeIdx.includes(cur.typeName)) {
        acc[typeIdx.indexOf(cur.typeName)].values.push({
          companyFilterId: cur.id,
          value: cur.value,
          optionId: cur.selectionOption.id,
        })
        return acc
      } else {
        acc.push({
          typeName: cur.typeName,
          type: cur.type,
          filterField: cur.filterField,
          userCanChange: cur.userCanChange,
          values: [
            {
              companyFilterId: cur.id,
              value: cur.value,
              optionId: cur.selectionOption.id,
            },
          ],
        })
        typeIdx.push(cur.typeName)
        return acc
      }
    })
  }
}
