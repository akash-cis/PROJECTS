import React, { useState } from "react"
import { Button, Input } from "antd"
import styled from "styled-components"

const FilterDropdownContainer = styled.div`
  padding: 15px;
`
const FilterTitle = styled.div`
	margin-bottom: 10px
	color: rgba(0, 0, 0, 0.85);
	font-weight: 500;
`
const FilterFooter = styled.div`
	margin-top: 10px
	border-top: 1px solid #f1ecec;
	padding: 10px 0;
`
const FilterItem = styled.div`
  line-height: 30px;
`

const FilterTextBox = ({
  setSelectedKeys,
  selectedKeys,
  confirm,
  clearFilters,
  searchInputRef,
  searchKeyword,
}) => {
  const [searchText, setSearchText] = useState(searchKeyword || "")
  const handleReset = () => {
    setSearchText("")
    confirm("")
    clearFilters()
  }
  const handleSearch = () => {
    confirm(searchText)
    clearFilters()
  }
  const handleChange = e => {
    setSearchText(e.target.value ? e.target.value : "")
  }

  return (
    <FilterDropdownContainer>
      <Input
        ref={searchInputRef}
        placeholder={`Search ${"Full Name"}`}
        value={searchText}
        onChange={e => handleChange(e)}
        onPressEnter={handleSearch}
        style={{ marginBottom: 8, display: "block" }}
      />
      <FilterFooter>
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm, "fullName")}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: "2px" }}
        >
          Search
        </Button>{" "}
        <Button onClick={handleReset} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </FilterFooter>
    </FilterDropdownContainer>
  )
}
export default FilterTextBox
