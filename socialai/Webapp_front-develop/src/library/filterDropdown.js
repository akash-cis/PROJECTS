import React, { useState, useEffect } from "react"
import { Button, Input, Checkbox, Spin } from "antd"
import styled from "styled-components"
import { LoadingIcon } from "./basicComponents"

const FilterDropdownContainer = styled.div`
  padding: 15px;
`
const FilterDropdownList = styled.div`
  max-height: 40vh;
  overflow: auto;
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
`
const FilterTitle = styled.div`
	margin-bottom: 10px
	color: rgba(0, 0, 0, 0.85);
	font-weight: 500;
`
const FilterFooter = styled.div`
  margin-bottom: 10px;
  border-bottom: 1px solid #f1ecec;
  padding-top: 10px;
`
const FilterItem = styled.div`
  line-height: 30px;
`
const ButtonRow = styled.div`
  margin-bottom: 15px;
`

const FilterDropdown = ({
  dataIndex,
  filters,
  setSelectedKeys,
  clearFilters,
  confirm,
  selectedKeys,
  loading = false,
  onSearch,
}) => {
  const [selected, setSelected] = useState(selectedKeys || [])
  const [checkedAll, setCheckedAll] = useState(false)
  const [searchKeyword, onSetSearch] = useState("")

  const onSelect = (e, value) => {
    let _selected = selected
    if (!_selected.includes(value)) {
      _selected.push(value)
    } else {
      _selected.splice(_selected.indexOf(value), 1)
    }
    setSelected([..._selected])
  }

  const renderOptions = () => {
    return (filters || []).map((option, i) => (
      <FilterItem key={`key__${option.value}__${i.toString()}`}>
        <Checkbox
          checked={selected.includes(option.value)}
          onChange={e => onSelect(e, option.value)}
        />
        <span>{option.text}</span>
      </FilterItem>
    ))
  }

  const onConfirm = () => {
    if (selected.length === 0) {
      confirm([])
    } else {
      setSelectedKeys(selected)
      confirm(selected)
    }
    clearFilters()
  }

  const onReset = () => {
    setSelected([])
    confirm([])
    clearFilters()
  }

  const onSelectAll = e => {
    if (!e.target.checked) {
      setSelected([])
      //clearFilters()
    } else {
      const items = (filters || []).map(el => el.value)
      setSelected(items)
    }
    setCheckedAll(e.target.checked)
  }

  const renderButtons = () => {
    return (
      <FilterFooter>
        <ButtonRow>
          <Button size="small" type={"primary"} onClick={e => onConfirm()}>
            Apply
          </Button>{" "}
          <Button size="small" onClick={e => onReset()}>
            Reset
          </Button>
        </ButtonRow>
        <p>
          <Checkbox
            key="chk_select_all"
            checked={checkedAll}
            onChange={onSelectAll}
          >
            Select/Unselect All
          </Checkbox>
        </p>
        {onSearch && (
          <p>
            <Input.Search
              onSearch={value => onSearch(value)}
              placeholder={"Type and serach"}
              name={"search"}
              allowClear={true}
              allowSearchOnClear={true}
              value={searchKeyword}
              onChange={e => onSetSearch(e.target.value)}
            />
          </p>
        )}
      </FilterFooter>
    )
  }

  return (
    <FilterDropdownContainer>
      <FilterTitle>
        <div>Filter by {dataIndex}</div>
      </FilterTitle>
      {renderButtons()}
      <FilterDropdownList>
        {loading ? (
          <Spin
            spinning={true}
            indicator={
              <LoadingIcon type="loading" style={{ marginLeft: "2rem" }} />
            }
          />
        ) : (
          renderOptions()
        )}
      </FilterDropdownList>
    </FilterDropdownContainer>
  )
}
export default FilterDropdown
