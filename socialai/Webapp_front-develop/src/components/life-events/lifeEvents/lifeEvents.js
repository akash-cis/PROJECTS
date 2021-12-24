import { useMutation, useQuery } from "@apollo/react-hooks"
import { List, message, Spin } from "antd"
import React, { useEffect, useReducer, useState, useContext } from "react"
import InfiniteScroll from "react-infinite-scroller"
import {
  PROSPECT_ACTION,
  SAVE_USER_FILTER_SET,
  SELECT_FILTER_SET,
  UPDATE_USER_FILTER_SET,
} from "../../../graphql/mutation"
import { GET_LIFE_EVENTS_POSTS, GET_USER_FILTERS, GET_SAVED_POSTS } from "../../../graphql/query"
import {
  CenteredContainer,
  Container,
  ContainerNavigation,
  Content,
  ContentBody,
  PaddedCol,
  SwitchCustom,
} from "../../../library/basicComponents"
import { FeedPost } from "../../../library/feedPost"
import Sidebar from "../../../library/filtersSidebar"
import { Spacer } from "../../../library/utils"
import { AddPreset } from "./addPreset"
import { InfiniteContainer } from "./elements"
import { useDisplayFilters, useUpdateFilters } from "./hooks"
import { ManageFilters } from "../../commons/manageFilters"
import { PeriodSelector } from "./periodSelector"
import { PresetSelector } from "./presetSelector"
import { SidebarTopButtons } from "./sidebarTopButtons"
import { filterBySetType, LIFE_EVENTS } from "./utils"
import FilterBreadcrumbs from "../../commons/filterBreadcrumbs"
import { InfoText } from "../../commons/infoText"
import { UserContext } from "../../../amplify/authenticator-provider"
import { Link } from "gatsby"


const UPDATE_SIDEBAR = "UPDATE_SIDEBAR"
const UPDATE_MENU = "UPDATE_MENU"
const REPLACE_FILTERS = "REPLACE_FILTERS"

const initialState = { filters: [], sidebarFilters: [], menuFilters: [] }

const reducer = ({ filters, menuFilters, sidebarFilters }, action) => {
  const newFilters = action.payload

  switch (action.type) {
    case UPDATE_SIDEBAR:
      return {
        menuFilters,
        sidebarFilters: newFilters,
        filters: [...menuFilters, ...newFilters],
      }
    case UPDATE_MENU:
      return {
        sidebarFilters,
        menuFilters: newFilters,
        filters: [...sidebarFilters, ...newFilters],
      }
    case REPLACE_FILTERS:
      return {
        menuFilters,
        sidebarFilters,
        filters: newFilters,
      }
    default:
      return { menuFilters, sidebarFilters, filters }
  }
}

const LifeEventsList = ({ feed, loading, updateStatus, onMore, hasMore, userRole }) => {
  const lastPost = feed[feed.length - 1]

  return (
    <InfiniteContainer>
      <InfiniteScroll
        loadMore={() => onMore(lastPost?.timestamp)}
        initialLoad={false}
        useWindow={false}
        hasMore={hasMore}
        pageStart={0}
        loader={
          <CenteredContainer noHeight>
            <Spin
              spinning={feed?.length > 0 && loading}
              tip="Loading more prospects..."
            />
          </CenteredContainer>
        }
      >
        <List
          loading={loading}
          dataSource={feed}
          renderItem={item => (
            <FeedPost
              hideSource
              key={item.id}
              item={item}
              updateStatus={updateStatus}
              authorRenderer={(item)=>{
                return userRole.canViewClm && item.personFullName && item.personId ? <Link to={`/life-events/customers/${item.personId}/profile`}> <span style={{fontSize: 14, fontWeight: 'bold'}}>{item.personFullName || item.author}</span> </Link>: <span>{item.author} </span>
              }}
            />
          )}
        />
      </InfiniteScroll>
    </InfiniteContainer>
  )
}

export const LifeEvents = () => {
  // State
  const [{ filters, sidebarFilters, menuFilters }, dispatch] = useReducer(
    reducer,
    initialState
  )
  const [prospectAction] = useMutation(PROSPECT_ACTION)
  const [currentFilters, setCurrentFilters] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const { user } = useContext(UserContext)
  const [showCustomersLifeEvents, setShowCustomersLifeEvents] = useState(!user.role["canViewGle"])
  const [starredOnly, setStarredOnly] = useState(false)
  const [totalHitsText, setTotalHitsText] = useState("")

  // Actions
  const updateSidebar = filters => {
    dispatch({ type: UPDATE_SIDEBAR, payload: filters })
  }

  const updateMenu = filters => {
    dispatch({ type: UPDATE_MENU, payload: filters })
  }

  const replaceFilters = filters => {
    dispatch({ type: REPLACE_FILTERS, payload: filters })
  }

  useEffect(() => {
    if(currentFilters){
      updateMenu(currentFilters.filter(x => x.typeName !== "Events"));
      updateSidebar(currentFilters.filter(x => x.typeName === "Events"));
    }
  }, [currentFilters]);

  const [checkedDefaultRange, setCheckedDefaultRange] = useState(false);

  // All data related hooks
  // Fetch life events posts
  const lifeEventsPosts = useQuery(GET_LIFE_EVENTS_POSTS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    variables: { range: "90", globalEvents: !showCustomersLifeEvents },
    skip: !checkedDefaultRange,
  })

  const onMore = timestamp => {
    if (!lifeEventsPosts.loading) {
      lifeEventsPosts.fetchMore({
        variables: { older: timestamp },
        updateQuery: (prev, { fetchMoreResult }) => {
          setHasMore(fetchMoreResult.getLifeEventsPosts.data.length >= 10)
          return {
            getLifeEventsPosts: {
              ...prev.getLifeEventsPosts,
              data: [
                ...prev.getLifeEventsPosts.data,
                ...fetchMoreResult.getLifeEventsPosts.data,
              ],
          },
          }
        },
      })
    }
  }

  const {
    data: savedPostsData,
    refetch: refetchSavedPosts,
    loading: loadingSavedPosts,
  } = useQuery(GET_SAVED_POSTS, { fetchPolicy: "network-only",
    variables: {
    setType: LIFE_EVENTS
  }})

  // These are the set filters, they live on me { filters { ... } filtersSets { ... }}
  const userFilters = useQuery(GET_USER_FILTERS)
  // Filters the user can filter by
  const { multiSelectFilters, sourcesMultiSelectFilters, rangeFilters } = useDisplayFilters()
  const [rangeFilter, setRangeFilter] = useState();

  // Mutations
  const updateFilters = useUpdateFilters()
  const [saveUserFilterSet] = useMutation(SAVE_USER_FILTER_SET)
  const [selectFilterSet] = useMutation(SELECT_FILTER_SET)
  const [updateUserFilterSet] = useMutation(UPDATE_USER_FILTER_SET)

  useEffect(() => {
    const filtersFromNetwork = userFilters.data?.me?.filters?.filter(filterBySetType)
    const lifeEventsFilters = filtersFromNetwork?.filter(filterBySetType);
    if (Array.isArray(lifeEventsFilters) && lifeEventsFilters.length > 0)
      setRangeFilter(lifeEventsFilters.find(x => x.type === "Range")?.value)
      return setCurrentFilters(lifeEventsFilters)
  }, [userFilters])


  useEffect(() => {
    const filtersFromNetwork = userFilters.data?.me?.filters?.filter(filterBySetType)
    const lifeEventsFilters = filtersFromNetwork?.filter(filterBySetType);

    const currentRangeFilter = lifeEventsFilters?.find(x => x.type === "Range")
    if (!checkedDefaultRange && !rangeFilter && rangeFilters && rangeFilters.length > 0 && !currentRangeFilter && lifeEventsFilters) {
        const filtersToUpdate = lifeEventsFilters.filter(x => x.type !== 'Range')
        const found = rangeFilters.reduce((a, b) => (a.y > b.y ? a : b))
        if(found){
          filtersToUpdate.push(found)
          setRangeFilter(found.value)
        }
        setCurrentFilters(filtersToUpdate)
        updateFilters(filtersToUpdate).then(() => setCheckedDefaultRange(true))
    } else if(currentRangeFilter && !checkedDefaultRange) {
        setCheckedDefaultRange(true)
    }
  }, [userFilters, rangeFilter, rangeFilters, checkedDefaultRange])

  const onSavePreset = async name => {
    const key = "preset"
    message.loading({
      content: "Saving...",
      key,
      duration: 60,
    })
    await updateFilters(filters)
    await saveUserFilterSet({ variables: { name, setType: LIFE_EVENTS } })
    message.success({
      content: "Success!",
      key,
    })
    userFilters.refetch()
  }

  const onClickManage = async newFilters => {
    const updatedFilters = await updateFilters([...sidebarFilters, ...newFilters])
    setCurrentFilters(updatedFilters.data.updateUserFilters.userFilters)
    setHasMore(true)
    lifeEventsPosts.refetch()
  }

  const onUpdateClick = async newFilters => {
    const updatedFilters = await updateFilters([...menuFilters, ...newFilters])
    setCurrentFilters(updatedFilters.data.updateUserFilters.userFilters)
    setHasMore(true)
    lifeEventsPosts.refetch()
  }

  const removeFilter = async filter => {
    const id = filter.id || filter
    const newFilters = currentFilters.filter(f => f.id !== id)
    const updatedFilters = await updateFilters([...newFilters])
    setCurrentFilters(updatedFilters.data.updateUserFilters.userFilters)
  }

  const clearAllFilters = async () => {
    setCurrentFilters([])
    setRangeFilter(null)
    await updateFilters([])
  }

  const onClickPeriod = range => {
    lifeEventsPosts.refetch({ range })
  }

  const onClickPreset = async id => {
    const key = "preset"
    message.loading({
      content: "Loading preset...",
      key,
      duration: 60,
    })
    const filterSet = await selectFilterSet({
      variables: { id, setType: LIFE_EVENTS },
    })

    // Destroy message
    message.destroy({ key })

    const presetFilters = filterSet?.data?.selectFilterSet?.userFilters.filter(
      filterBySetType
    )

    setRangeFilter(presetFilters?.find(x => x.type === "Range")?.value);

    // Replace filter state
    replaceFilters(presetFilters)
    // Set current filters to pass data down to menu and sidebar
    setCurrentFilters(presetFilters)

    setHasMore(true)
    lifeEventsPosts.refetch()
    // refetchData()
  }

  const onEditPreset = async updatedFilterSet => {
    await updateUserFilterSet({ variables: {...updatedFilterSet, setType: LIFE_EVENTS } })
    return userFilters.refetch()
  }

  const changeProspectStatus = (id, action, url, shouldScreenName = true) => {
    prospectAction({ variables: { action, id, postType: "LIFE_EVENT" } }).then(
      data => {
        console.log(data)
      }
    )
    setTimeout(() => {
      setHasMore(true)
      refetchSavedPosts()
      lifeEventsPosts.refetch()
    }, 500)
  }

  // Data
  const feed = lifeEventsPosts?.data?.getLifeEventsPosts.data;
  const feedLoading =
    lifeEventsPosts?.loading || lifeEventsPosts?.networkStatus === 4
  const filterSets = userFilters?.data?.me?.filterSets?.filter(filterBySetType)

  const getTotalHitsText = count => `${count === 1 ? '1 result' : 1 < count && lifeEventsPosts?.data?.getLifeEventsPosts.count < 10 ? `${count} results` : count < 10000 ? `Showing ${(Math.ceil(count / 10) * 10).toLocaleString()} results` : `Showing more than ${(10000).toLocaleString()} results`} ${currentFilters.length > 0 ? ' for the selected filters' : ''}`

  const onChangeStarredOnly = (checked) => {
    setStarredOnly(checked)
    if (checked) {
      refetchSavedPosts()
    } else {
      lifeEventsPosts.refetch()
    }
  }

  useEffect(() => {
    if(!feedLoading){
      if (lifeEventsPosts?.data?.getLifeEventsPosts.count > 0) {
        setTotalHitsText(getTotalHitsText(lifeEventsPosts?.data?.getLifeEventsPosts.count))
      } else {
        setTotalHitsText("")
      }
    } else {
      setTotalHitsText("")
    }
  }, [lifeEventsPosts?.data, currentFilters, feedLoading]);

  return (
    <PaddedCol>
      <Container noMargin scroll>
        <ContainerNavigation>
          <div>
            Starred only <SwitchCustom disabled={feedLoading || loadingSavedPosts} onChange={onChangeStarredOnly} checked={starredOnly}/>
          {user.role["canViewClm"] && user.role["canViewGle"] && (
            <>
              Customer only <SwitchCustom onChange={(checked)=>{setShowCustomersLifeEvents(checked)}} checked={showCustomersLifeEvents}/>
            </>)
          }
          </div>
          <Spacer>
            <ManageFilters
              // TODO: show this for demo account
              sources={sourcesMultiSelectFilters}
              currentFilters={currentFilters}
              onSave={onClickManage}
            />
            <PresetSelector
              filterSets={filterSets}
              onClickPreset={onClickPreset}
              onEditPreset={onEditPreset}
            />
            <AddPreset onSave={onSavePreset} />
            <PeriodSelector
              onClick={(filter) => {
                  const filters = currentFilters.filter(x => x.type !== "Range");
                  const selectedFilter = rangeFilters.find(x => x.value === filter)
                  filters.push(selectedFilter);
                  setRangeFilter(selectedFilter.value);
                  setCurrentFilters(filters)
                  updateFilters(filters).then(() => lifeEventsPosts.refetch())
                }
              }
              rangeFilter={rangeFilter}
              options={rangeFilters}
            />
          </Spacer>
        </ContainerNavigation>
        <Content>
          {!userFilters.loading && multiSelectFilters && (
            <Sidebar
              buttonText="Update Life Events"
              multiSelectFilters={multiSelectFilters}
              onButtonClick={onUpdateClick}
              // onChange={onChangeSidebar}
              top={user.role["canViewClm"] ? <SidebarTopButtons /> : <div/>}
              currentFilters={currentFilters}
            />
          )}
          <ContentBody>
          {!starredOnly && <FilterBreadcrumbs
            userCurrentFilters={currentFilters}
            removeText={removeFilter}
            removeMulti={removeFilter}
            removeSelect={removeFilter}
            removeRange={(filter) => {removeFilter(filter); setRangeFilter(null);}}
            refresh={lifeEventsPosts.refetch}
            refreshingPosts={lifeEventsPosts.loading}
            clearAll={clearAllFilters}
          />
          }
          {!starredOnly && <InfoText style={{ flexGrow: 1.8, minHeight: 24, marginBottom: 10 }}>{totalHitsText}</InfoText>}
            {feed && (
              <LifeEventsList
                feed={starredOnly ? savedPostsData?.getSavedPosts?.map(sp => sp.post) : feed}
                loading={feedLoading}
                updateStatus={changeProspectStatus}
                onMore={onMore}
                hasMore={hasMore}
                userRole={user.role}
              />
            )}
          </ContentBody>
        </Content>
      </Container>
    </PaddedCol>
  )
}
