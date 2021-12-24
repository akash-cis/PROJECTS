import React, { useRef } from "react"
import Typography from "../../library/typography"
import styled from "styled-components"
import { Button, List, Icon } from "antd"
import TextInput from "../../library/textInput"
import { useQuery, useMutation } from "@apollo/react-hooks"
import { FILTER_TYPE } from "../../graphql/query"
import {
  SAVE_SELECTION_OPTION,
  REMOVE_SELECTION_OPTION,
} from "../../graphql/mutation"
import { Colors } from "../../library/constants"

const Container = styled.div`
  margin: 18px auto;
`

const InlineFormCntr = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`

const HdrCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`

const DeleteIcon = styled(Icon)`
  font-size: 20px;
  color: ${Colors.darkRed};
  cursor: pointer;
`

const SelectionOptions = ({ filterType, goBack }) => {
  const valueRef = useRef("")
  const queryRef = useRef("")

  const { data, refetch: refetchFilterTypes } = useQuery(FILTER_TYPE, {
    variables: { id: filterType.id },
  })

  const [saveSelectionOption, { loading: savingOption }] = useMutation(
    SAVE_SELECTION_OPTION
  )
  const [removeSelectionOption, response] = useMutation(REMOVE_SELECTION_OPTION)

  const handleAdd = () => {
    const value = valueRef.current.value
    const query = queryRef.current.value
    if (
      value.trim() !== "" &&
      data.filterType.selectionOptions.findIndex(x => x.value === value) === -1
    ) {
      let vars = {
        filterTypeId: filterType.id,
        value: value,
      }
      if (query.trim() !== "") {
        vars.query = query
      }
      saveSelectionOption({
        variables: vars,
      })
        .then(res => {
          if (res.data.saveSelectionOption.ok) {
            refetchFilterTypes()
            valueRef.current.value = ""
            queryRef.current.value = ""
          } else {
            //TODO: handle errors
            console.log("Error: Please try again")
          }
        })
        .catch(err => console.log("Error: Please try again", err))
    }
  }

  const handleRemove = id => {
    removeSelectionOption({
      variables: {
        id: id,
      },
    }).then(res =>
      res.data.removeSelectionOption.ok
        ? refetchFilterTypes()
        : console.log("Error: please try again")
    )
  }

  return (
    <Container>
      <HdrCntr>
        <div>
          <Typography>
              Add / Remove Selection Options for {filterType.name}
          </Typography>
          {filterType.type === "MULTISELECT" && (<Typography variant="small">To introduce multiple query string values for the same option use | as a separator.</Typography>)}
        </div>
        <div>
          <Button onClick={goBack}>Close</Button>
        </div>
      </HdrCntr>
      <InlineFormCntr>
        <TextInput
          name={"value"}
          placeholder={"Option value"}
          reference={valueRef}
        />
        <TextInput
          name={"query"}
          placeholder={"Option query string"}
          reference={queryRef}
        />
        <InlineFormButton
          type={"primary"}
          icon={"plus-circle"}
          onClick={handleAdd}
          loading={savingOption}
        >
          Add
        </InlineFormButton>
      </InlineFormCntr>
      <List
        dataSource={data ? data.filterType.selectionOptions : []}
        rowKey={"id"}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <DeleteIcon
                  type={"delete"}
                  onClick={() => handleRemove(item.id)}
                />
              }
              title={item.value}
              description={item.query}
            />
          </List.Item>
        )}
      />
    </Container>
  )
}

export default SelectionOptions
