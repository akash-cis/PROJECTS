 import React from "react"
 import {
   render,
   fireEvent,
 } from "@testing-library/react"
 import FiltersSidebar from "../library/filtersSidebar"

 const data = [
   {
     id: "131",
     type: "Multiselect",
     typeName: "Make",
     value: "Audi",
   },
   {
     id: "132",
     type: "Multiselect",
     typeName: "Make",
     value: "BMW",
   },
   {
     id: "133",
     type: "Multiselect",
     typeName: "Make",
     value: "Cadillac",
   },
   {
     id: "134",
     type: "Multiselect",
     typeName: "Make",
     value: "Chevrolet",
   },
   {
     id: "135",
     type: "Multiselect",
     typeName: "Make",
     value: "Ford",
   },
   {
     id: "136",
     type: "Multiselect",
     typeName: "Make",
     value: "Jeep",
   },
   {
     id: "137",
     type: "Multiselect",
     typeName: "Make",
     value: "Lexus",
   },
   {
     id: "138",
     type: "Multiselect",
     typeName: "Make",
     value: "Mercedes-benz",
   },
   {
     id: "139",
     type: "Multiselect",
     typeName: "Make",
     value: "Mitsubishi",
   },
   {
     id: "140",
     type: "Select",
     typeName: "New/Used",
     value: "New",
   },
   {
     id: "141",
     type: "Select",
     typeName: "New/Used",
     value: "Used",
   },
   {
     id: "142",
     type: "Multiselect",
     typeName: "Sources",
     value: "Forum",
   },
 ]

 const selectFilters = data.filter(item => item.type === "Select")
 const multiSelectFilters = data.filter(item => item.type === "Multiselect")
 const CHECKBOX_CHECKED = "ant-checkbox-checked"
 const RADIO_BUTTON_CHECKED = "ant-radio-button-checked"

 test("toggle multiselects", async () => {
   // function mock
   const onChange = jest.fn()
   const { getAllByTestId } = render(
     <FiltersSidebar
       selectFilters={selectFilters}
       multiSelectFilters={multiSelectFilters}
       onChange={onChange}
     />
   )

   const multiSelects = getAllByTestId("multiSelect")
   const firstMultiSelect = multiSelects[0]

   // first click on item
   fireEvent.click(firstMultiSelect)
   // should check it
   expect(firstMultiSelect.parentElement).toHaveClass(CHECKBOX_CHECKED)

   // second click on item
   fireEvent.click(firstMultiSelect)
   // should un-check it
   expect(firstMultiSelect.parentElement).not.toHaveClass(CHECKBOX_CHECKED)

   // first render, toggle click, second click
   expect(onChange).toBeCalledTimes(3)
 })

 test("select selects", () => {
   // function mock
   const onChange = jest.fn()
   const { getAllByTestId } = render(
     <FiltersSidebar
       selectFilters={selectFilters}
       multiSelectFilters={multiSelectFilters}
       onChange={onChange}
     />
   )

   const selects = getAllByTestId("select")
   const firstSelect = selects[0]
   const secondSelect = selects[1]

   // first click should select it
   fireEvent.click(firstSelect)
   expect(firstSelect.parentElement).toHaveClass(RADIO_BUTTON_CHECKED)

   // click on second item should select the second
   fireEvent.click(secondSelect)
   expect(secondSelect.parentElement).toHaveClass(RADIO_BUTTON_CHECKED)
   // and un-select the first
   expect(firstSelect).not.toHaveClass(RADIO_BUTTON_CHECKED)

   // first render, first click, second click
   expect(onChange).toBeCalledTimes(3)
 })

 test("toggle all multiselect", () => {
   const onChange = jest.fn()
   const { getAllByTestId, getByTestId } = render(
     <FiltersSidebar
       selectFilters={selectFilters}
       multiSelectFilters={multiSelectFilters}
       onChange={onChange}
     />
   )

   const toggleAllButton = getByTestId("toggle-all-multiSelect")
   // first toggle
   fireEvent.click(toggleAllButton)
   const multiSelects = getAllByTestId("multiSelect")
   // match if every multiselect has the checked class
   multiSelects.forEach(multiSelect =>
     expect(multiSelect.parentElement).toHaveClass(CHECKBOX_CHECKED)
   )
   //second toggle
   fireEvent.click(toggleAllButton)
   // match if every toggle does not have the checked class
   multiSelects.forEach(multiSelect =>
     expect(multiSelect.parentElement).not.toHaveClass(CHECKBOX_CHECKED)
   )

   // render and clicks
   expect(onChange).toBeCalledTimes(3)
 })

 test("it cleans selects", () => {
   const onChange = jest.fn()
   const { getAllByTestId, getByTestId } = render(
     <FiltersSidebar
       selectFilters={selectFilters}
       multiSelectFilters={multiSelectFilters}
       onChange={onChange}
     />
   )

   const selectAllButton = getByTestId("all-button")
   const selects = getAllByTestId("select")
   const firstSelect = selects[0]

   // click on the first select
   fireEvent.click(firstSelect)
   // it should have the checked class
   expect(firstSelect.parentElement).toHaveClass(RADIO_BUTTON_CHECKED)

   // click on select all button
   fireEvent.click(selectAllButton)
   // every other select should be clean
   selects.forEach(select => {
     expect(select.parentElement).not.toHaveClass(RADIO_BUTTON_CHECKED)
   })

   // render, two clicks
   expect(onChange).toBeCalledTimes(3)
 })

 test("sets current filters", () => {
   const onChange = jest.fn()
   // make some current filters
   const currentFilters = multiSelectFilters.slice(
     0,
     multiSelectFilters.length - 2
   )
   const { getAllByTestId } = render(
     <FiltersSidebar
       selectFilters={selectFilters}
       multiSelectFilters={multiSelectFilters}
       onChange={onChange}
       currentFilters={currentFilters}
     />
   )

   const multiSelects = getAllByTestId("multiSelect")
   multiSelects.forEach(multiSelect => {
     if (
       currentFilters.find(
         item => item.value === multiSelect.getAttribute("data-key")
       )
     ) {
       expect(multiSelect.parentElement).toHaveClass(CHECKBOX_CHECKED)
     }
   })
 })
