import React from "react"
import { Table } from "antd"

const SelectUserTable = ({ users, setSelectedUsers, selectedUsers, newCoSetup }) => {
  const { Column } = Table

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      if (newCoSetup) {
        setSelectedUsers(selectedRowKeys)
      } else {
        const selectedUser = selectedRowKeys.filter(id => {
          if (!selectedUsers.includes(id)) {
            return id
          }
        })
        setSelectedUsers(selectedUser)
      }
    },
    selectedRowKeys: selectedUsers,
  }

  return (
    <Table rowSelection={rowSelection} dataSource={users} rowKey={"id"}>
      <Column title={"Name"} key={"fullName"} dataIndex={"fullName"} />
      <Column title={"Email"} key={"email"} dataIndex={"email"} />
    </Table>
  )
}

export default SelectUserTable