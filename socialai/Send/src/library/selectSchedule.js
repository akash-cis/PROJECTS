import React from "react"
import { Select } from "antd"

const { Option } = Select

const mystyle = {
  color: "red",
}

const SelectSchedule = ({
  keyName,
  mode,
  value,
  onChange,
  placeholder,
  width = "100%",
  showAll = false,
  data = [],
  size = "middle",
  disableRemove = false,
  disabled = false,
  showSearch = false,
  loading = false,
}) => {
  return (
    <Select
      key={keyName}
      mode={mode}
      size={size}
      placeholder={placeholder}
      style={{ width: width }}
      onChange={onChange}
      value={value}
      disabled={disabled}
      showSearch={showSearch}
      loading={loading}
    >
      {showAll && <Option value="All">All</Option>}
      {(data || []).map(el => {
        let colorCode = el?.hasTemplate
        return (
          <Option
            value={el.id}
            disabled={el?.hasTemplate && value.includes(el.id)}
            className={mystyle}
          >
            {!colorCode && disableRemove ? (
              <span style={{ color: "red" }}>{el.name}</span>
            ) : (
              <span style={{ color: "#000000a6" }}>{el.name}</span>
            )}
          </Option>
        )
      })}
    </Select>
  )
}
export default SelectSchedule
