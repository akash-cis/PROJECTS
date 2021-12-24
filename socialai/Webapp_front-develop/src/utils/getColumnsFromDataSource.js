// Converts a data structure of the like:
// const data = [
//   {
//     key: '1',
//     name: 'John Brown',
//     age: 32,
//     address: 'New York No. 1 Lake Park',
//   },
// ];
// To an object with the fields:
// {
//   title: 'Name',
//   dataIndex: 'name',
//   key: 'name',
// },
// {
//   title: 'Age',
//   dataIndex: 'age',
//   key: 'age',
// },
// {
//   title: 'Address',
//   dataIndex: 'address',
//   key: 'address',
// },
import { toKebabCase } from "./index"

const constructColumn = key => ({
  dataIndex: key,
  key,
  title: toKebabCase(key),
})

export const getColumnsFromDataSource = (dataSource) => {
  if (!dataSource || !dataSource[0]) return []
  const keys = Object.keys(dataSource[0])
  const ids = ["id", "key"]
  const keysWithoutIds = keys.filter(key => !ids.includes(key))
  const columns = keysWithoutIds.map(key => constructColumn(key))

  return columns
}
