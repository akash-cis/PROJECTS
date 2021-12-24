import React from "react"
import { message } from "antd"
import EditIcon from "../../static/icons/EditIcon.svg"
import RemoveIcon from "../../static/icons/RemoveIcon.svg"
import PostIcon from "../../static/icons/PostIcon.svg"
import { TooltipButton } from "./basicComponents"
import { showConfirmationModal } from "./helpers"

const ModifyButtons = ({ id, edit, remove, download, activity }) => {
  const MODAL_TITLE = `Do you want to continue?`
  const MODAL_CONTENT = `When clicked the OK button, it cannot be recovered`

  const onClickDelete = id => {
    showConfirmationModal(MODAL_TITLE, MODAL_CONTENT, () => onConfirmDelete(id))
  }

  const onConfirmDelete = async id => {
    const key = "update"
    try {
      message.loading({ content: "Deleting...", key })
      await remove({ variables: { id } })
      message.success({ content: "Deleted", key })
    } catch (e) {
      message.error({ content: "Could not be deleted", key })
    }
  }

  const onClickDownload = id => {
    download({ variables: { id } })
  }

  const onClickActivity = id => {
    activity(id)
  }

  return (
    <>
      {edit && (
        <TooltipButton
          tooltip="Edit"
          shape="circle"
          onClick={() => edit(id)}
          component={EditIcon}
          alt="Edit"
        />
      )}
      {remove && (
        <TooltipButton
          tooltip="Delete"
          shape="circle"
          onClick={e => {
            e.stopPropagation()
            onClickDelete(id)
          }}
          component={RemoveIcon}
          alt="Delete"
        />
      )}
      {download && (
        <TooltipButton
          tooltip="Download"
          shape="circle"
          onClick={() => onClickDownload(id)}
          icon="download"
          alt="Download"
        />
      )}
      {activity && (
        <TooltipButton
          tooltip="Activity Center"
          shape="circle"
          onClick={e => {
            e.stopPropagation()
            onClickActivity(id)
          }}
          component={PostIcon}
          alt="Activity Center"
        />
      )}
    </>
  )
}

export default ModifyButtons
