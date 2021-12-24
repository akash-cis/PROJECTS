import React, { useState } from "react"
import { Icon, Dropdown, Button } from "antd"
import { PickerText, Bubbles, createMenu } from "./elements"
import PropTypes from "prop-types"

const TeamPicker = ({ team, setOuter }) => {
  const [selected, setSelected] = useState(team)
  const MORE_THAN_THREE = "All of the team"

  const onClick = newItem => {
    // if the item is already selected
    if (selected.find(item => item.value === newItem.value)) {
      // we return an array without it
      return setSelected(selected =>
        selected.filter(item => item.value !== newItem.value)
      )
    }

    // otherwise we add it
    setSelected(selected => [...selected, newItem])
  }

  const onClickAll = () => {
    if (selected.length === team.length) return setSelected([])
    setSelected(team)
  }

  React.useEffect(() => {
    if (setOuter) {
      setOuter(selected)
    }
  }, [selected])

  if (!team || !selected) return null

  return (
    team &&
    selected && (
      <Dropdown
        overlay={createMenu(
          team,
          onClick,
          selected.map(item => item.value),
          onClickAll
        )}
      >
        <Button data-testid="picker">
          {selected.length > 0 && <Bubbles selected={selected} />}
          <PickerText>
            {selected.length === team.length && MORE_THAN_THREE}
            {selected.length <= 0 && "Please select one or more"}
          </PickerText>
          <Icon type="down" />
        </Button>
      </Dropdown>
    )
  )
}

TeamPicker.propTypes = {
  team: PropTypes.array,
}

export default TeamPicker
