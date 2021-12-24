import React, {
  useState,
  useReducer,
  useRef,
  useContext,
  useEffect,
} from "react"
import {
  Button,
  Dropdown,
  Icon,
  Modal,
  message,
  Alert,
} from "antd"
import { AnalyticsLayout } from "../../components/analytics/kpis"
import TextInput from "../../library/textInput"
import {
  PaddedCol,
  ContainerNavigation,
  Container,
  SVGIcon,
  ActionGroup,
  Content,
  ContentBody,
  CenteredContainer,
  LoadingIcon,
  ButtonGroupCustom,
} from "../../library/basicComponents"
import { TabsContainer, InlineTabs } from "../../components/analytics/dashboard"
import {
  GET_USER_FILTERS,
  GET_ANALYTICS_POSTS,
  GET_ANALYTICS_CATEGORIES,
} from "../../graphql/query"
import { useQuery, useMutation } from "@apollo/react-hooks"
import AddItemIcon1 from "../../../static/icons/AddItemIcon1.svg"
import { Spacer } from "../../library/utils"
import {
  SAVE_USER_FILTER_SET,
  UPDATE_USER_FILTERS,
  SELECT_FILTER_SET,
  UPDATE_USER_FILTER_SET,
} from "../../graphql/mutation"
import {
  PeriodsMenu,
  TWO_WEEKS,
  periodsMenu,
} from "../../library/optionsWrapper"
import BarChart from "../../library/barChart"
import { Colors } from "../../library/constants"
import TreeMap from "../../library/treeMap"
import Sidebar, { useSidebarFilters } from "../../library/filtersSidebar"
import { showConfirmationModal } from "../../library/helpers"
import { navigate } from "gatsby"
import { ManageFilters } from "../../components/commons/manageFilters"
import { useDisplayFilters } from "../../components/commons/hooks"
import { EditPresetModal } from "../../library/preset/EditPresetModal"
import { presetMenu } from "../../library/preset/PresetMenu"
import { InfoText } from "../../components/commons/infoText"

//constants
const MULTISELECT = "Multiselect"
const TEMPLATE = "Template"
const SELECT = "Select"
const TOGGLE_ARRAY = "TOGGLE_ARRAY"
const SET_ARRAY = "SET_ARRAY"
const ADD_FILTER = "ADD_FILTER"
const REMOVE_FILTER = "REMOVE_FILTER"
const ADD_SIDEBAR_FILTERS = "ADD_FILTERS"
const FILTERS = {
  SOURCES: "Sources",
  LOCATION: "Location",
  KEYWORD: "Keyword",
  RANGE: "Range"
}
const FILTER_SECTIONS = {
  SIDEBAR: "Sidebar",
  MODAL: "Modal"
}

const filtersReducer = (filters, action) => {
  switch (action.type) {
    case ADD_FILTER:
      return [...filters, action.payload]
    case REMOVE_FILTER:
      const newFilters = filters.filter(
        item => item.value !== action.payload.value
      )
      return newFilters
    case TOGGLE_ARRAY:
      if (filters.length === action.payload.length) {
        return []
      }
      return action.payload
    case SET_ARRAY:
      return action.payload
    case ADD_SIDEBAR_FILTERS:
      // remove all sidebar filters (selects and multiselects)
      // because sidebar onChange gives us its complete new state
      const withoutSidebarFilters = filters
        .filter(item => item.typeName === FILTERS.SOURCES || item.typeName === FILTERS.LOCATION || item.typeName === FILTERS.KEYWORD)
      return [...withoutSidebarFilters, ...action.payload]
    default:
      throw new Error("Please use one of the known cases")
  }
}

const filterSidebarFilters = data =>
  data.filter(item => item.type === MULTISELECT)

const DashboardContext = React.createContext({})

const DashboardProvider = ({ children }) => {
  const [filters, dispatch] = useReducer(filtersReducer, [])
  const makeAction = query => payload => dispatch({ type: query, payload })

  const toggleArray = makeAction(TOGGLE_ARRAY)
  const addFilter = makeAction(ADD_FILTER)
  const removeFilter = makeAction(REMOVE_FILTER)
  const setArray = makeAction(SET_ARRAY)
  const addSidebarFilters = makeAction(ADD_SIDEBAR_FILTERS)
  const sidebarFilters = filterSidebarFilters(filters)

  const [skipFetch, setSkipFetch] = useState(true);

  const filtersStore = {
    toggleArray,
    addFilter,
    removeFilter,
    addSidebarFilters,
    setArray,
    filters,
    sidebarFilters,
  }

  const analyticsPosts = useQuery(GET_ANALYTICS_POSTS, {
    variables: { range: 14 },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: skipFetch
  })

  const analyticsCategories = useQuery(GET_ANALYTICS_CATEGORIES, {
    variables: { range: 14 },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: skipFetch
  })

  const userFilters = useQuery(GET_USER_FILTERS, {
    fetchPolicy: "network-only",
    onCompleted: (x) => {
      setArray(sanitizeData(x?.me?.filters?.filter(filterBySetType)))
    }
  })

  // we use a store to share data and actions on our data
  const value = {
    filtersStore,
    analyticsPosts,
    userFilters,
    analyticsCategories,
    setSkipFetch
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// store hooks
// the rationale is to have a less verbose way to use our data
const useUserFilters = () => {
  const { userFilters } = useContext(DashboardContext)
  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)
  const { filters, setArray } = useFilters()
  const updateFilters = (toUpdate=[], type) => {

    let filtersToUpdate = [];

    if (type === FILTER_SECTIONS.SIDEBAR) {
      filtersToUpdate = filters.filter(item => (item.typeName === FILTERS.SOURCES || item.typeName === FILTERS.LOCATION || item.typeName === FILTERS.KEYWORD || item.typeName === FILTERS.RANGE))
    } else if(type === FILTER_SECTIONS.MODAL) {
      filtersToUpdate = filters.filter(item => !(item.typeName === FILTERS.SOURCES || item.typeName === FILTERS.LOCATION || item.typeName === FILTERS.KEYWORD))
    }

    filtersToUpdate.push(...toUpdate)

    return updateUserFilters({
      variables: { filters: sanitizeData(filtersToUpdate || filters), setType: GENERAL },
    }).then(()=>setArray(sanitizeData(filtersToUpdate || filters)))
  }

  return { ...userFilters, updateFilters, localFilters: filters }
}

const useSkipFetch = () => {
  const { setSkipFetch: skipFetch } = useContext(DashboardContext)
  return skipFetch
}

const useAnalyticsPosts = () => {
  const { analyticsPosts } = useContext(DashboardContext)
  return analyticsPosts
}

const useAnalyticsCategories = () => {
  const { analyticsCategories } = useContext(DashboardContext)
  return analyticsCategories
}

const useFilters = () => {
  const { filtersStore } = useContext(DashboardContext)
  return filtersStore
}

const showMessage = string => {
  return message.success(string)
}

const AddPreset = onSave => {
  const [modal, setModal] = useState(false)
  const [saveUserFilterSet] = useMutation(SAVE_USER_FILTER_SET)
  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)
  const { refetch: refetchUserFilters } = useUserFilters()
  const { filters } = useFilters()
  const name = useRef("")
  const [isValid, setIsValid] = useState(true)

  const onSaveFilter = value => {
    const trimmedValue = value?.trim();
    if (!!trimmedValue) {
      setIsValid(true)
      updateUserFilters({
        variables: { filters: sanitizeData(filters), setType: GENERAL },
      }).then(() => {
        saveUserFilterSet({
          variables: { name: trimmedValue, setType: GENERAL },
        }).then(() => {
          refetchUserFilters()
          setModal(false)
        })
      })
    } else {
      setIsValid(false)
    }
  }

  return (
    <>
      <Button onClick={() => setModal(true)}>
        Add to filters preset
        <SVGIcon component={AddItemIcon1} alt="Prospects" />
      </Button>

      {/* Modal */}
      <Modal
        title="Add a preset to favorites"
        visible={modal}
        onOk={() => setModal(false)}
        onCancel={() => setModal(false)}
        footer={null}
      >
        <ActionGroup>
          <TextInput
            reference={name}
            placeholder="Enter preset name"
            name="name"
            small
          />
          <Button
            type="primary"
            onClick={() => onSaveFilter(name.current.value)}
          >
            Add to favorites
          </Button>
        </ActionGroup>
        {!isValid && <InfoText style={{ padding: 8, flexGrow: 1.8, minHeight: 24, color: "red" }}>Invalid name</InfoText>}
      </Modal>
    </>
  )
}

// filters
const filterBySetType = item => item.setType === GENERAL

const PresetSelector = ({ refetch: refetchData, setCurrentFilters, setRangeFilter }) => {
  const [preset, setPreset] = useState(null)
  const [modal, setModal] = useState(false)
  const { data: userFilters } = useUserFilters()
  const [selectFilterSet] = useMutation(SELECT_FILTER_SET)
  const { setArray } = useFilters()
  const filterSets = userFilters?.me?.filterSets.filter(filterBySetType)
  const { refetch: refetchUserFilters } = useUserFilters()
  const [updateUserFilterSet] = useMutation(UPDATE_USER_FILTER_SET)

  const CHOOSE_A_PRESET = "Choose a preset"

  const onClick = async preset => {
    setPreset(preset?.item?.props?.children)
    message.loading({
      content: "Loading preset...",
      key: "preset",
      duration: 60,
    })
    const { data } = await selectFilterSet({
      variables: { id: preset?.key, setType: GENERAL },
    })
    const filters = data?.selectFilterSet?.userFilters.filter(filterBySetType);
    setCurrentFilters(filters)

    const currentRangeFilter = filters.find(x => x.type === "Range")?.value

    if(currentRangeFilter) {
      setRangeFilter(currentRangeFilter)
    }

    refetchData()
    message.destroy()
  }

  const updateFilterSet = async ({ id, name }, shouldDelete) => {
    const updatedFilterSet = {
      id,
      name,
      delete: shouldDelete,
      setType: GENERAL
    }
    if (shouldDelete && name === preset) {
      setPreset(CHOOSE_A_PRESET)
    }

    await updateUserFilterSet({ variables: updatedFilterSet })
    refetchUserFilters()
    if (shouldDelete) return showMessage("Deleted")

    return showMessage("Updated")
  }
  return (
    <>
      <ButtonGroupCustom size={2}>
        <Dropdown overlay={presetMenu(filterSets, onClick)}>
          <Button>
            {preset || CHOOSE_A_PRESET} <Icon type="down" />
          </Button>
        </Dropdown>
        <Button onClick={() => setModal(modal => !modal)}>
          <Icon type="setting" />
        </Button>
      </ButtonGroupCustom>

      {/* Modal */}
      <EditPresetModal
        visible={modal}
        onOk={() => setModal(false)}
        onCancel={() => setModal(false)}
        presets={filterSets}
        onConfirm={(item) =>
          showConfirmationModal(
            "Do you want to update this preset?",
            "When clicked the OK button, the preset will be updated with the current selected filters",
            () => {
              updateFilterSet(item, false)
              setPreset(null)
            }
          )
          }
          onDelete={updateFilterSet}
      />
    </>
  )
}

const PeriodSelector = ({ rangeFilter, onClick, options, refetch: refetchData }) => {
  return <PeriodsMenu options={options} period={rangeFilter} onClick={onClick} />
}

const SOURCES = "Sources"
const ANALYTICS = "ANALYTICS"
const GENERAL = "GENERAL"

const TYPENAMES = {
  MAKE: "Make",
  CATEGORY: "Category",
  MODEL: "Model",
}

const sanitizeData = data =>
  data.map(item => ({
    value: item?.value,
    typeName: item?.typeName,
    type: item?.type,
  }))

// filters

const DashboardControllers = ({ location, title, children, result, skipFetch }) => {
  const {
    data,
    loading: loadingData,
    networkStatus,
    error: errorData,
    refetch: refetchData,
  } = result
  const {
    loading: userLoading,
    data: userFilters,
    error: userError,
    updateFilters,
    refetch: refetchUserFilters
  } = useUserFilters()
  const {
    multiSelectFilters,
    filtersError,
    filtersLoading,
    selectFilters,
    rangeFilters,
  } = useSidebarFilters({filterFunction: item => item.typeName !== "Events" })
  const [rangeFilter, setRangeFilter] = useState();
  const [currentFilters, setCurrentFilters] = useState()
  const [checkedDefaultRange, setCheckedDefaultRange] = useState(false);

  const { sourcesMultiSelectFilters } = useDisplayFilters()

  const setDefaultRange = (currentFilters, rangesGroup) => {
    const filtersToUpdate = currentFilters.filter(x => x.type !== 'Range')
    const found = rangesGroup.reduce((a, b) => (a.y > b.y ? a : b))
    if (found) {
      filtersToUpdate.push(found)
      setRangeFilter(found.value)
    }
    updateFilters(filtersToUpdate).then((value) => refetchData())
  }



  useEffect(() => {
    const filtersFromNetwork = userFilters?.me?.filters?.filter(filterBySetType)
    if (Array.isArray(filtersFromNetwork) && filtersFromNetwork.length > 0)
      setRangeFilter(filtersFromNetwork.find(x => x.type === "Range")?.value)
      return setCurrentFilters(filtersFromNetwork)
  }, [userFilters])

  const { addSidebarFilters, setArray } = useFilters()

  useEffect(() => {
    const filtersFromNetwork = userFilters?.me?.filters?.filter(filterBySetType)
    const currentRangeFilter = filtersFromNetwork?.find(x => x.type === "Range")
    if (!checkedDefaultRange && !rangeFilter && rangeFilters && rangeFilters.length > 0 && !currentRangeFilter && filtersFromNetwork) {
        setDefaultRange(filtersFromNetwork, rangeFilters);
        setCheckedDefaultRange(true)
        skipFetch(false)
    } else if(currentRangeFilter && !checkedDefaultRange){
        setCheckedDefaultRange(true)
        skipFetch(false)
        refetchData()
    }

  }, [userFilters, rangeFilter, rangeFilters, checkedDefaultRange])

  const onButtonClick = (filters) => {updateFilters(filters, FILTER_SECTIONS.SIDEBAR).then(() => { refetchData();})}

  return (
    <AnalyticsLayout location={location}>
      <PaddedCol>
        <Container auto noMargin>
          <ContainerNavigation noVertical>
            {title && title}
            <Spacer>
              <ManageFilters
                sources={sourcesMultiSelectFilters}
                refetch={refetchData}
                currentFilters={currentFilters}
                onSave={(filters) => {updateFilters(filters, FILTER_SECTIONS.MODAL).then(() => { refetchData();}) }}
              />
              <PresetSelector
                refetch={() => {refetchUserFilters(); refetchData(); }}
                setCurrentFilters={setCurrentFilters}
                setRangeFilter={setRangeFilter}
              />
              <AddPreset />
              <PeriodSelector
                onClick={(filter) => {
                  const filters = currentFilters.filter(x => x.type !== "Range");
                  filters.push(rangeFilters.find(x => x.value === filter));
                  setRangeFilter(filter);
                  setArray(filters);
                  updateFilters(filters).then(() => refetchData())
                }
                }
                rangeFilter={rangeFilter}
                options={rangeFilters}
              />
            </Spacer>
          </ContainerNavigation>
          <Content>
            {!userLoading && !userError && (
              <Sidebar
                selectFilters={selectFilters}
                multiSelectFilters={multiSelectFilters}
                filtersError={filtersError}
                filtersLoading={filtersLoading}
                currentFilters={currentFilters}
                onButtonClick={onButtonClick}
                typeNameOrder={[TYPENAMES.MAKE, TYPENAMES.CATEGORY]}
              />
            )}
            <ContentBody>
              {(loadingData || networkStatus === 4) && (
                <CenteredContainer height="450px">
                  <LoadingIcon type="loading" />
                </CenteredContainer>
              )}
              {!loadingData && !errorData && data && children(data)}
              {errorData && (
                <Alert
                  message={"Something went wrong. Please contact support."}
                  type={"error"}
                  banner
                />
              )}
            </ContentBody>
          </Content>
        </Container>
      </PaddedCol>
    </AnalyticsLayout>
  )
}

// constants for dashboard
const BAR = "Bar Chart"
const TREE = "Treemap"
const GRAPH_TYPES = [TREE, BAR]
const NO_DATA_MESSAGE = "Not enough data to display"

const GeneralDashboard = ({ location }) => {
  const [graphType, setGraphType] = useState(GRAPH_TYPES[0])
  const analyticsPosts = useAnalyticsPosts()
  const skipFetch = useSkipFetch();
  const analyticsCategories = useAnalyticsCategories()
  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)

  const {
    localFilters
  } = useUserFilters()

  // bar needs analytics posts and tree neds analytics categories
  const result = graphType === BAR ? analyticsPosts : analyticsCategories

  return (
    <DashboardControllers
      location={location}
      result={result}
      skipFetch={skipFetch}
      title={
        <TabsContainer>
          {GRAPH_TYPES &&
            GRAPH_TYPES.map(type => (
              <InlineTabs
                active={type === graphType}
                key={type}
                onClick={() => setGraphType(type)}
              >
                {type}
              </InlineTabs>
            ))}
        </TabsContainer>
      }
    >
      {data => (
        <>
          {graphType === BAR && (
            <BarChart
              dateLabels
              color={Colors.primaryBrandBlue}
              noLegend
              data={data?.getAnalyticsPosts}
              minHeight="450px"
              yAxis
              labels
              noDataMessage={NO_DATA_MESSAGE}
            />
          )}
          {graphType === TREE && (
            <TreeMap
              noDataMessage={NO_DATA_MESSAGE}
              data={data?.getAnalyticsCategories}
              onLevel1Click={(element, parent) => {
                const filtersToUpdate = [{
                  value: parent.name,
                  typeName: TYPENAMES.MAKE,
                  type: MULTISELECT,
                }, ...localFilters.filter(x => !(x.typeName === TYPENAMES.MAKE || x.typeName === TYPENAMES.MODEL))];
                if(element.name !== "Unspecified Model"){
                  filtersToUpdate.push(
                    {
                      value: `{"name": "${parent.name}", "value":"${element.name}", "condition": "and"}`,
                      typeName: TYPENAMES.MODEL,
                      type: TEMPLATE,
                    }
                  );
                }

                updateUserFilters({
                  variables: { filters: filtersToUpdate, setType: GENERAL },
                }).then(() => {navigate("/prospect")});
              }}
            />
          )}
        </>
      )}
    </DashboardControllers>
  )
}

const withProvider = Component => props => {
  return (
    <DashboardProvider>
      <Component {...props} />
    </DashboardProvider>
  )
}
export default withProvider(GeneralDashboard)