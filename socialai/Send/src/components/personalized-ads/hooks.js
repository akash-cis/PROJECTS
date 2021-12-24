import { useQuery, useMutation } from "@apollo/react-hooks"
import { DOWNLOAD_EXPORT_FILE } from "../../graphql/mutation"
import {
  GET_EXPORTS,
  GET_EXPORT_CONFIGS,
  GET_DISPLAY_FILTERS,
} from "../../graphql/query"
import { SOURCES } from "../../library/constants"
import { useRef, useEffect } from "react"

// needs id
export const useDownloadExport = () => {
  return useMutation(DOWNLOAD_EXPORT_FILE, {
    onCompleted: res => {
      window.open(res.downloadExportFile.url, "_target")
    },
  })
}

export const useExportConfigs = () => {
  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_EXPORT_CONFIGS,
    {
      fetchPolicy: "network-only",
    }
  )
  const dataSource = data?.getExportConfigs

  return {
    dataSource,
    data,
    loading,
    error,
    networkStatus,
    refetch,
  }
}

export const useExports = () => {
  const { data, loading, error, refetch, networkStatus } = useQuery(
    GET_EXPORTS,
    {
      fetchPolicy: "network-only",
    }
  )
  const dataSource = data?.getExports

  return {
    dataSource,
    data,
    loading,
    error,
    networkStatus,
    refetch,
  }
}

export const useAvailableSources = () => {
  const { data, loading: sourcesLoading, error: sourcesError } = useQuery(
    GET_DISPLAY_FILTERS
  )
  const sources = data?.getUserDisplayFilters?.filter(
    item => item.typeName === SOURCES
  )
  return { sourcesLoading, sourcesError, sources }
}

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
