import { useLocation } from "@reach/router"

export const useLocationState = key => {
  const { state } = useLocation()

  return state[key]
}
