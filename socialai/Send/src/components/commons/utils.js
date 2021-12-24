export const SOURCES = "Sources"
export const EVENTS = "Events"
export const MULTISELECT = "Multiselect"


export const multiSelectFilterSelector = typeName => item =>
  item.typeName === typeName && item.type === MULTISELECT 