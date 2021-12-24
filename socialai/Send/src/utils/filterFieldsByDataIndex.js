
export const filterFieldsByDataIndex = (toInclude=[], fields=[]) => {
  return fields.filter(x => toInclude.includes(x.dataIndex))
}
