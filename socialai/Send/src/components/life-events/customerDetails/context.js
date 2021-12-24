import React from "react"

export const DetailsContext = React.createContext()

export const DetailsProvider = ({ children, ...props }) => (
  <DetailsContext.Provider value={props}>{children}</DetailsContext.Provider>
)
