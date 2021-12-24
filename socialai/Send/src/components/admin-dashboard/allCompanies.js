import React from "react"
import { Table, Switch } from "antd"
import { useMutation } from "@apollo/react-hooks"
import { UPDATE_COMPANY } from "../../graphql/mutation"

const AllCompanies = ({
  setCompany,
  loadingCompanies,
  companiesError,
  companies,
  refreshCompanies,
}) => {
  const [updateCompanyActive, response] = useMutation(UPDATE_COMPANY, {
    onCompleted: res => {
      if (res.updateCompany.ok) {
        refreshCompanies()
      }
    },
  })

  if (companiesError) {
    return <h2>Error</h2>
  }

  if (loadingCompanies) {
    return <h2>...Loading</h2>
  }

  return (
    <React.Fragment>
      {companies && (
        <CompaniesTable
          companies={companies.getCompanies}
          setCompany={setCompany}
          updateCompanyActive={updateCompanyActive}
        />
      )}
    </React.Fragment>
  )
}

export default AllCompanies

const CompaniesTable = ({ companies, setCompany, updateCompanyActive }) => {
  const { Column } = Table

  const handleActiveToggle = (checked, e) => {
    const company = companies.filter(x => x.id === e.target.id)[0]
    company.isDisabled = !checked
    updateCompanyActive({ variables: company })
  }

  return (
    <Table
      dataSource={companies}
      rowKey={"id"}
      onRow={record => {
        return {
          onClick: e =>
            !e.target.className.includes("ant-switch") && setCompany(record),
        }
      }}
    >
      <Column
        title={"Company"}
        dataIndex={"name"}
        key={"name"}
        defaultSortOrder={"ascend"}
        sorter={(a, b) => a.name.localeCompare(b.name)}
      />
      <Column
        title={"Users"}
        dataIndex={"userCount"}
        key={"userCount"}
        sorter={(a, b) => a.userCount - b.userCount}
        align={"center"}
      />
      <Column
        title={"Created At"}
        dataIndex={"dateCreated"}
        key={"dateCreated"}
        align={"center"}
        sorter={(a, b) => new Date(a.dateCreated) - new Date(b.dateCreated)}
        render={value => {
          const d = new Date(value)
          return value
            ? `${d.getMonth() + 1}.${d.getDate()}.${d.getFullYear()}`
            : "null"
        }}
      />
      <Column
        title={"Active"}
        dataIndex={"isDisabled"}
        key={"isDisabled"}
        align={"center"}
        render={(value, record) => (
          <Switch
            defaultChecked={value !== null && !value}
            onChange={handleActiveToggle}
            id={record.id}
          />
        )}
      />
    </Table>
  )
}
