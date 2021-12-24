import { useLocation } from "@reach/router"

export const useBasePath = () => {
  const { pathname } = useLocation()
  return `/${pathname.split("/")[1]}/`
}
