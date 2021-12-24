import React, { useState, createContext } from "react"
const ScheduleContext = createContext({})

const ScheduleProvider = ({ children, ...props }) => {
  const [schedule, setSchedule] = useState({})
  return (
    <ScheduleContext.Provider value={{ schedule, setSchedule }}>
      {children}
    </ScheduleContext.Provider>
  )
}
export { ScheduleProvider, ScheduleContext }
