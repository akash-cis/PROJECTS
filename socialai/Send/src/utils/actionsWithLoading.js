import { message } from "antd"

export const actionsWithLoading = async cbList => {
  const key = "fn"
  message.loading({ content: "Saving", key, duration: 10 })
  try {
    for (let cb of cbList) {
      await cb()
    }
    message.success({ content: "Success", key })
  } catch (e) {
    message.error({ content: "Error", key })
  }
}