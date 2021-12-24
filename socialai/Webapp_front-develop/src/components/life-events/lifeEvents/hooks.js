import { useMutation, useQuery } from "@apollo/react-hooks"
import { UPDATE_USER_FILTERS } from "../../../graphql/mutation"
import {
  LIFE_EVENTS,
  sanitizeData,
  multiSelectFilterSelector,
  rangeFilterSelector,
  EVENTS,
  SOURCES,
} from "./utils"
import { GET_DISPLAY_FILTERS } from "../../../graphql/query"

// Get sidebar filters
export const useDisplayFilters = () => {
  const {
    data: filtersData,
    loading: filtersLoading,
    error: filtersError,
    refetch: refetchUserFilters,
  } = useQuery(GET_DISPLAY_FILTERS, {})

  const filters = filtersData?.getUserDisplayFilters
  // Filter by typename and type
  const multiSelectFilters = filters?.filter(multiSelectFilterSelector(EVENTS))

  const sourcesMultiSelectFilters = filters?.filter(
    multiSelectFilterSelector(SOURCES)
  )

  const rangeFilters = filters?.filter(
    rangeFilterSelector
  ).sort((x1, x2) => {
    if(Number(x1.selectionOption.query) > Number(x2.selectionOption.query)) return 1;
    if(Number(x1.selectionOption.query) <= Number(x2.selectionOption.query)) return -1;
  }) || []

  return {
    filtersData,
    filtersLoading,
    filtersError,
    multiSelectFilters,
    refetchUserFilters,
    rangeFilters,
    sourcesMultiSelectFilters,
  }
}

// Loading view with new filters
export const useUpdateFilters = () => {
  // This function update current set filters from me { filters, filterSets }
  const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)
  // It receives a filters array which will be sanitized and send with a setType
  const updateFilters = filters => {
    return updateUserFilters({
      variables: { filters: sanitizeData(filters), setType: LIFE_EVENTS },
    })
  }

  return updateFilters
}

// Add filters to preset
// const [updateUserFilters] = useMutation(UPDATE_USER_FILTERS)
// const [saveUserFilterSet] = useMutation(SAVE_USER_FILTER_SET)

// Select user filter
// const [selectFilterSet] = useMutation(SELECT_FILTER_SET)

// Edit or delete preset
// const [updateUserFilterSet] = useMutation(UPDATE_USER_FILTER_SET)
