import { Button, Modal } from "antd"
import React, { useRef, useState } from "react"
import AddItemIcon1 from "../../../../static/icons/AddItemIcon1.svg"
import { ActionGroup, SVGIcon } from "../../../library/basicComponents"
import { InfoText } from "../../../library/feedPost/elements"
import TextInput from "../../../library/textInput"

export const AddPreset = ({ onSave }) => {
  const [modal, setModal] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const name = useRef("")

  const saveAndClose = value => {
    const trimmedValue = name?.current?.value?.trim();
    if (!!trimmedValue) {
      setIsValid(true)
      onSave(trimmedValue)
      setModal(false)
    } else {
      setIsValid(false)
    }
  }

  return (
    <>
      <Button onClick={() => setModal(true)}>
        Add to filters preset
        <SVGIcon component={AddItemIcon1} alt="Prospects" />
      </Button>

      {/* Modal */}
      <Modal
        title="Add a preset to favorites"
        visible={modal}
        onOk={() => setModal(false)}
        onCancel={() => setModal(false)}
        footer={null}
      >
        <ActionGroup>
          <TextInput
            reference={name}
            placeholder="Enter preset name"
            name="name"
            small
          />
          <Button
            type="primary"
            onClick={() => saveAndClose(name.current.value)}
          >
            Add to favorites
          </Button>
        </ActionGroup>
        {!isValid && <InfoText style={{ padding: 8, flexGrow: 1.8, minHeight: 24, color: "red" }}>Invalid name</InfoText>}
      </Modal>
    </>
  )
}
