import { Button, Dropdown, Icon, message } from "antd"
import React, { useState } from "react"
import {
  ButtonGroupCustom,
} from "../../../library/basicComponents"
import { showConfirmationModal } from "../../../library/helpers"
import { EditPresetModal } from "../../../library/preset/EditPresetModal"
import { presetMenu } from "../../../library/preset/PresetMenu"

export const PresetSelector = ({
  filterSets,
  onClickPreset,
  onEditPreset,
}) => {
  const [preset, setPreset] = useState(null)
  const [modal, setModal] = useState(false)

  const CHOOSE_A_PRESET = "Choose a preset"

  const onClick = async preset => {
    // Set selected preset as current
    setPreset(preset?.item?.props?.children)
    // Key is the id of the preset
    onClickPreset(preset?.key)
  }

  const updateFilterSet = async ({ id, name }, shouldDelete) => {
    const key = "preset"
    message.loading({
      content: "Updating...",
      key,
      duration: 60,
    })
    const updatedFilterSet = {
      id,
      name,
      delete: shouldDelete,
    }
    if (shouldDelete && name === preset) {
      setPreset(CHOOSE_A_PRESET)
    }

    await onEditPreset(updatedFilterSet)
    // await updateUserFilterSet({ variables: updatedFilterSet })
    // refetchUserFilters()
    if (shouldDelete) {
      return message.success({
        content: "Deleted!",
        key,
      })
    }

    message.success({
      content: "Updated!",
      key,
    })
  }

  return (
    <>
      <ButtonGroupCustom size={2}>
        <Dropdown overlay={presetMenu(filterSets, onClick)}>
          <Button>
            {preset || CHOOSE_A_PRESET} <Icon type="down" />
          </Button>
        </Dropdown>
        <Button onClick={() => setModal(modal => !modal)}>
          <Icon type="setting" />
        </Button>
      </ButtonGroupCustom>

      {/* Modal */}
      <EditPresetModal
        visible={modal}
        onOk={() => setModal(false)}
        onCancel={() => setModal(false)}
        presets={filterSets}
        onConfirm={item =>
          showConfirmationModal(
            "Do you want to update this preset?",
            "When clicked the OK button, the preset will be updated with the current selected filters",
            () => {
              updateFilterSet(item, false)
              setPreset(null)
            }
          )
        }
        onDelete={updateFilterSet}
      />
    </>
  )
}
