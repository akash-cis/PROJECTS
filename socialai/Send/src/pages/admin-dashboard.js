import React, { useEffect, useState } from "react"
import AllCompanies from "../components/admin-dashboard/allCompanies"
import Company from "../components/admin-dashboard/company"
import Panel from "../library/panel"
import Tabs from "../library/tabs"
import TabPanelHeader from "../library/tabHeader"
import { Button, AutoComplete } from "antd"
import Tags from "../components/admin-dashboard/tags"
import { useQuery, useLazyQuery } from "@apollo/react-hooks"
import { GET_COMPANIES, SEARCH_COMPANIES } from "../graphql/query"
import withCognitoRole from "../components/withCognitoRole"
import styled from "styled-components"
import EngagementMessageTemplates from "../components/admin-dashboard/enagementMessageTemplate"

const FlexCntr = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
`

const SearchInput = styled.div`
  margin-right: 18px;
`

const AdminDashboard = () => {
  const [company, setCompany] = useState(null)

  const {
    loading: loadingCompanies,
    error: companiesError,
    data: companies,
    refetch: refreshCompanies,
  } = useQuery(GET_COMPANIES)

  const [searchCompanies, { data: searchCompanyData }] = useLazyQuery(
    SEARCH_COMPANIES
  )

  useEffect(() => {
    if (company === null) {
      refreshCompanies()
    }
  }, [company])

  const handleSearchEvent = val => {
    const name = val
    if (name.trim().length > 2) {
      searchCompanies({
        variables: { name: name },
      })
    }
  }

  const handleSearchSelect = id => {
    const selectedCompany = searchCompanyData.searchCompanyByName.filter(
      x => x.id === id
    )[0]
    setCompany(selectedCompany)
  }

  const { Option } = AutoComplete
  const searchOptions =
    searchCompanyData &&
    searchCompanyData.searchCompanyByName.map(co => (
      <Option key={co.id}>{co.name}</Option>
    ))

  return (
    <div>
      {company ? (
        <Company
          company={company}
          setCompany={setCompany}
          refreshCompanies={refreshCompanies}
        />
      ) : (
        <Panel>
          <Tabs.Cntr defaultTab={"companies"}>
            <TabPanelHeader>
              <div>
                <Tabs.Nav
                  name={"companies"}
                  typography={{ variant: "big", weight: "normal" }}
                >
                  Companies
                </Tabs.Nav>
                <Tabs.Nav
                  name={"filters"}
                  typography={{ variant: "big", weight: "normal" }}
                >
                  Filters
                </Tabs.Nav>
                <Tabs.Nav
                  name={"engagement_templates"}
                  typography={{ variant: "big", weight: "normal" }}
                >
                  Engagement Message Templates
                </Tabs.Nav>
              </div>
              <Tabs.Panel name={"companies"}>
                <FlexCntr>
                  <SearchInput>
                    <AutoComplete
                      placeholder={"Search companies by name"}
                      onSearch={handleSearchEvent}
                      onSelect={handleSearchSelect}
                      style={{ width: "240px" }}
                    >
                      {searchOptions}
                    </AutoComplete>
                  </SearchInput>

                  <Button
                    type={"primary"}
                    icon={"plus"}
                    onClick={() => setCompany("new")}
                  >
                    New Company
                  </Button>
                </FlexCntr>
              </Tabs.Panel>
            </TabPanelHeader>
            <Tabs.Panel name={"companies"}>
              <AllCompanies
                setCompany={setCompany}
                loadingCompanies={loadingCompanies}
                companiesError={companiesError}
                companies={companies}
                refreshCompanies={refreshCompanies}
              />
            </Tabs.Panel>
            <Tabs.Panel name={"filters"}>
              <Tags />
            </Tabs.Panel>
            <Tabs.Panel name={"engagement_templates"}>
              <EngagementMessageTemplates />
            </Tabs.Panel>
          </Tabs.Cntr>
        </Panel>
      )}
    </div>
  )
}

export default withCognitoRole(AdminDashboard, "ADMIN")
