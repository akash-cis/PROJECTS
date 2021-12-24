import React, { useState } from "react"
import { ButtonGroup } from "./elements"
import { Button } from "antd"
import { navigate } from "gatsby"
import { IconCustom, SecondaryButton } from "../../../library/basicComponents"
import CsvImport from "../csvImport"

export const SidebarTopButtons = () => {
  const [csvModalVisible, setCsvModalVisible] = useState(false)

  return (
    <ButtonGroup>
      <Button type="primary" onClick={() => navigate("/life-events/customers")}>
        Customer list
        <IconCustom type="usergroup-add" />
      </Button>
      <SecondaryButton type="primary" onClick={() => setCsvModalVisible(true)}>
        .csv import
        <IconCustom type="file-text" />
      </SecondaryButton>
      {csvModalVisible && (
        <CsvImport
          isVisible={csvModalVisible}
          setIsVisible={setCsvModalVisible}
        />
      )}
    </ButtonGroup>
  )
}
