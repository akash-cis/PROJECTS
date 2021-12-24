import { useQuery } from "@apollo/react-hooks"

import {
  multiSelectFilterSelector,
  EVENTS,
  SOURCES,
} from "./utils"
import { GET_DISPLAY_FILTERS } from "../../graphql/query"

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

  return {
    filtersData,
    filtersLoading,
    filtersError,
    multiSelectFilters,
    refetchUserFilters,
    sourcesMultiSelectFilters,
  }
}
