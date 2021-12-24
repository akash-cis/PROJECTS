import React from "react"
import { Button, Drawer, Calendar, Badge } from "antd"
import styled from "styled-components"
import AppointmentView from "./appointment"
const DrawerBody = styled.div`
  & .ant-list-item {
    &:last-child {
      border-bottom: 1px solid #f1ecec;
    }
  }
`

const DrawerFooter = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  padding: 10px 16px;
  background: #fff;
  text-align: right;
  border-top: 1px solid rgb(232, 232, 232);
`

const AppointmentModal = ({
  lead = null,
  openAppointmentDrawer = false,
  setOpenDrawer,
  onClick,
}) => {
  return (
    <Drawer
      title={<b>{`Add Appointment for ${lead?.fullName || ""}`}</b>}
      placement="right"
      closable={false}
      width={"95%"}
      onClose={() => setOpenDrawer(false)}
      visible={openAppointmentDrawer}
    >
      <DrawerBody>
        <AppointmentView
          lead={lead}
          onBackClick={() => setOpenDrawer(false)}
          onClick={onClick}
        />
      </DrawerBody>
      <DrawerFooter>
        <Button
          style={{ marginRight: 20 }}
          onClick={() => setOpenDrawer(false)}
        >
          Close
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}

export default AppointmentModal
