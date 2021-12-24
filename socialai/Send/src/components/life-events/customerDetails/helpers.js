import { toKebabCase, toCamel } from "../../../utils"
import { BOOLEAN } from "../../../library/formGen"

export const createColumnsFromDescriptorArray = descriptor => {
  if (!descriptor || !Array.isArray(descriptor)) return []
  return descriptor.reduce((acc, curr) => {
    if (curr.fields.length > 0) {
      return {
        ...acc,
        [toCamel(curr.modelName)]: getColumnsFromFields(curr.fields),
      }
    }
    return acc
  }, {})
}

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

const getColumnsFromFields = fields => {
  return fields.map(field => {
    let camel = toCamel(field.name)

    if(camel === "addressLine_1") {
        camel = "addressLine1"
    }
    if(camel === "addressLine_2") {
        camel = "addressLine2"
    }
    const column = {
      title: toKebabCase(camel),
      dataIndex: camel,
      key: camel,
      ...field,
    }

    // If is of type boolean, add an render function
    if (field?.type === BOOLEAN) {
      column["render"] = renderBoolean
    }

    return column
  })
}

const renderBoolean = value => (value ? "Yes" : "No")
