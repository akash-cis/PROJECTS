import React, { useState, useRef, useEffect } from "react"
import Tabs from "../../library/tabs"
import TabPanelHeader from "../../library/tabHeader"
import { useQuery, useMutation, useLazyQuery } from "@apollo/react-hooks"
import { GET_COMPANY_USERS, USER_FILTERS_BY_ID } from "../../graphql/query"
import { UPDATE_USER_FILTERS } from "../../graphql/mutation"
import TextInput from "../../library/textInput"
import { Button, Popconfirm } from "antd"
import styled from "styled-components"
import SelectUserTable from "./selectUserTable"
import { FilterSetTypes } from "../../library/constants"
import { SwitchCustom } from "../../library/basicComponents"

const InlineFormCntr = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`

const InlineFormButton = styled(Button)`
  flex: 1;
`

const Tag = styled.div`
  display: inline-block;
  background-color: #e6f0ff;
  color: #00648d;
  border-radius: 20px;
  font-family: Helvetica;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 18px;
  padding: 0.7em 1em 0.7em 1em;
  margin: 0.5em;
  min-width: 50px;
  text-align: center;
  cursor: pointer;
`

const TagCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`

const SwitchContainer = styled.div`
  display: flex;
  justify-content: start;
  margin-bottom: 1em;
`

const UserFilters = ({ company, setCompany, setActiveTab, newCoSetup }) => {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [keywords, setKeywords] = useState([])
  const [locations, setLocations] = useState([])
  const [matchAllKeywords, setMatchAllKeywords] = useState(false)
  const [matchAllLocations, setMatchAllLocations] = useState(false)
  const [filtersSaved, setFiltersSaved] = useState(false)
  const [initialState, setInitialState] = useState(true)

  const { data: userData } = useQuery(GET_COMPANY_USERS, {
    variables: { id: company.id },
    onCompleted: data => {
      if (
        newCoSetup &&
        typeof data?.company?.userAccounts[0]?.user === "undefined"
      ) {
        const userIds = (data?.company?.userAccounts[0]?.user || []).map(
          x => x.id
        )
        setSelectedUsers(userIds)
      }
    },
  })

  const [
    getUserFilters,
    { data: userFilters, refetch: refetchUserFilters },
  ] = useLazyQuery(USER_FILTERS_BY_ID, {
    fetchPolicy: "network-only",
    onCompleted: data => {
      let keywords = []
      let locations = []
      data.user.filters
        .filter(filter => filter.setType == "GENERAL")
        .map(filter => {
          if (filter.typeName.indexOf("Keyword") == 0) {
            keywords.push(filter.value)
          } else if (filter.typeName.indexOf("Location") == 0) {
            locations.push(filter.value)
          }
        })
      setKeywords(keywords)
      setMatchAllKeywords(hasMatchAllOptionForKeywordFilter(data.user.filters))
      setLocations(locations)
      setMatchAllLocations(false)
    },
  })

  const [updateUserFilters, response] = useMutation(UPDATE_USER_FILTERS)

  useEffect(() => {
    if (!newCoSetup && selectedUsers.length > 0) {
      setInitialState(true)
      getUserFilters({ variables: { id: selectedUsers[0] } })
    }
  }, [selectedUsers])

  const saveFilters = () => {
    const userFilters = []
    if (keywords.length > 0) {
      let typeName = matchAllKeywords ? "Keyword (All)" : "Keyword (Any)"
      keywords.forEach(keyword => {
        userFilters.push({
          type: "Text",
          typeName: typeName,
          value: keyword,
        })
      })
    }
    if (locations.length > 0) {
      let typeName = matchAllLocations ? "Location (All)" : "Location (Any)"
      locations.forEach(location => {
        userFilters.push({
          type: "Text",
          typeName: typeName,
          value: location,
        })
      })
    }

    selectedUsers.forEach((userId, idx) => {
      updateUserFilters({
        variables: {
          userId: userId,
          filters: userFilters,
          setType: FilterSetTypes.GENERAL,
        },
      }).then(res => {
        if (newCoSetup && idx === selectedUsers.length - 1) {
          setActiveTab("Response templates")
        } else if (!newCoSetup) {
          setFiltersSaved(true)
          refetchUserFilters()
        }
      })
    })
  }

  const hasMatchAllOptionForKeywordFilter = userCurrentFilters => {
    return userCurrentFilters.filter(
      f => f.type === "Text" && f.typeName === "Keyword (All)"
    ).length > 0
      ? true
      : false
  }

  const onChangeMatchAllOption = (filterType, enable) => {
    if (filterType === "keyword") {
      if (matchAllKeywords != enable) {
        setMatchAllKeywords(enable)
        setFiltersSaved(false)
        setInitialState(false)
      }
    }
  }

  const FilterButton = () => {
    if (newCoSetup && keywords.length === 0 && locations.length === 0) {
      return (
        <Button
          onClick={() => {
            setActiveTab("Response templates")
          }}
        >
          Continue
        </Button>
      )
    } else if (newCoSetup) {
      return (
        <Button type={"primary"} onClick={saveFilters}>
          Save & Continue
        </Button>
      )
    } else {
      return (
        <div>
          {!initialState && !filtersSaved ? (
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
          {!initialState && (
            <Button
              onClick={saveFilters}
              type={filtersSaved ? "default" : "primary"}
              style={{ marginLeft: "14px" }}
            >
              {filtersSaved ? "Saved" : "Save Changes"}
            </Button>
          )}
        </div>
      )
    }
  }

  return (
    <Tabs.Cntr defaultTab={"keyword"}>
      <TabPanelHeader>
        <div>
          <Tabs.Nav
            name={"keyword"}
            typography={{ variant: "big", weight: "normal" }}
          >
            Keyword Filters
          </Tabs.Nav>
          <Tabs.Nav
            name={"location"}
            typography={{ variant: "big", weight: "normal" }}
          >
            Location Filters
          </Tabs.Nav>
        </div>
        <FilterButton />
      </TabPanelHeader>
      {userData && (
        <SelectUserTable
          users={userData.company.users}
          setSelectedUsers={setSelectedUsers}
          selectedUsers={selectedUsers}
          newCoSetup={newCoSetup}
        />
      )}
      <Tabs.Panel name={"keyword"}>
        <FilterAdder
          filterType="keyword"
          filters={keywords}
          setFilters={setKeywords}
          matchAllKeywords={matchAllKeywords}
          setMatchAllKeywords={onChangeMatchAllOption}
          setFiltersSaved={setFiltersSaved}
          setInitialState={setInitialState}
        />
      </Tabs.Panel>
      <Tabs.Panel name={"location"}>
        <FilterAdder
          filterType="location"
          filters={locations}
          matchAllKeywords={matchAllLocations}
          setMatchAllKeywords={setMatchAllLocations}
          setFilters={setLocations}
          setFiltersSaved={setFiltersSaved}
          setInitialState={setInitialState}
        />
      </Tabs.Panel>
    </Tabs.Cntr>
  )
}

export default UserFilters

const FilterAdder = ({
  filterType,
  filters,
  setFilters,
  matchAllKeywords,
  setMatchAllKeywords,
  setFiltersSaved,
  setInitialState,
}) => {
  const filterRef = useRef("")

  const addFilter = () => {
    const filter = filterRef.current.value.trim()
    if (filter && !filters.includes(filter)) {
      setFilters([...filters, filter])
      setFiltersSaved(false)
      setInitialState(false)
    }
    filterRef.current.value = ""
  }

  const removeFilter = filter => {
    setFilters(filters.filter(x => x !== filter))
    setFiltersSaved(false)
    setInitialState(false)
  }

  const onChangeMatchAllKeywordOption = checked => {
    setMatchAllKeywords("keyword", checked)
  }

  return (
    <div>
      <InlineFormCntr>
        <TextInput
          name={"filter"}
          placeholder={"Enter new filter"}
          reference={filterRef}
        />
        <InlineFormButton
          type={"primary"}
          icon={"plus-circle"}
          onClick={addFilter}
        >
          Add
        </InlineFormButton>
      </InlineFormCntr>
      {filterType === "keyword" && (
        <SwitchContainer>
          <SwitchCustom
            disabled={filters.length === 0 ? true : false}
            checked={matchAllKeywords}
            onChange={onChangeMatchAllKeywordOption}
          />{" "}
          Match All
        </SwitchContainer>
      )}
      <TagCntr>
        {filters.map(filter => (
          <Tag key={filter} onClick={() => removeFilter(filter)}>
            {filter}
          </Tag>
        ))}
      </TagCntr>
    </div>
  )
}
