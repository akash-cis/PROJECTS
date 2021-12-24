import React from "react"
import { Modal } from "antd"
import { PresetModalField } from "./PresetModalField"

export const EditPresetModal = ({visible, onOk, onCancel, presets, onConfirm, onDelete}) => (
  <Modal
    title="All favorites"
    visible={visible}
    onOk={onOk}
    onCancel={onCancel}
    footer={null}
  >
    {presets &&
      presets.map(item => (
        <PresetModalField
          key={item.id}
          item={item}
          onConfirm={onConfirm}
          onDelete={onDelete}
        />
      ))}
    {(!presets || presets.length === 0) && <div>No presets.</div>}
  </Modal>
)
