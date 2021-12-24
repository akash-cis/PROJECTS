import { Table } from "antd"
import React from "react"
import { Tag } from "../basicComponents"
import { ProgressBar } from "./elements"

const { Column } = Table

// const dataSource = [
//   {
//     tag: "Yo",
//     name: "Carmen Beltran",
//     time: "1h 27min",
//     engaged: { value: 18, total: 20 },
//     provided: { value: 13, total: 20 },
//     converted: { value: 12, total: 30 },
//     crm: { value: 15, total: 34 },
//     conversion: { value: 20, total: 40 },
//   },
//   {
//     tag: "Yo",
//     name: "Gopichad Sana",
//     time: "1h 27min",
//     engaged: { value: 10, total: 20 },
//     provided: { value: 11, total: 20 },
//     converted: { value: 8, total: 30 },
//     crm: { value: 1, total: 34 },
//     conversion: { value: 2, total: 40 },
//   },
// ]

const TeamLeaderboard = ({ data }) => {
  const { items, totals } = data
  // const totals = getTotals(data)

  return (
    <Table pagination={false} dataSource={items} rowKey={item => item.userName}>
      <Column
        title=""
        dataIndex="tag"
        key="tag"
        render={(tag, record, index) => (
          <Tag gray small>
            Top {index + 1}
          </Tag>
        )}
      />
      <Column title={() => <b>NAME</b>} dataIndex="userName" key="userName" />
      <Column
        title={() => <b>TIME IN APP</b>}
        dataIndex="time"
        key="time"
        sorter={(b, a) => a.time - b.time}
        render={time => (
          <ProgressBar value={time} total={totals?.time || 0} time />
        )}
      />
      <Column
        title={() => <b>LEADS ENGAGED</b>}
        dataIndex="engaged"
        key="engaged"
        sorter={(b, a) => a.engaged - b.engaged}
        render={value => (
          <ProgressBar value={value} total={totals?.engaged || 0} />
        )}
      />
      <Column
        title={() => <b>LEADS PROVIDED</b>}
        dataIndex="provided"
        key="provided"
        sorter={(b, a) => a.provided - b.provided}
        render={value => (
          <ProgressBar value={value} total={totals?.provided || 0} />
        )}
      />
      <Column
        title={() => <b>LEADS CONVERTED</b>}
        dataIndex="converted"
        key="converted"
        sorter={(b, a) => a.converted - b.converted}
        defaultSortOrder="ascend"
        render={value => (
          <ProgressBar value={value} total={totals?.converted || 0} />
        )}
      />
      <Column
        title={() => <b>LEADS TO CRM</b>}
        dataIndex="crm"
        key="crm"
        sorter={(b, a) => a.crm - b.crm}
        render={value => <ProgressBar value={value} total={totals?.crm || 0} />}
      />
      <Column
        title={() => <b>CONVERSION</b>}
        dataIndex="conversion"
        key="conversion"
        sorter={(b, a) => a.conversion - b.conversion}
        render={value => <ProgressBar value={value} percentage total={100} />}
      />
    </Table>
  )
}

export default TeamLeaderboard
