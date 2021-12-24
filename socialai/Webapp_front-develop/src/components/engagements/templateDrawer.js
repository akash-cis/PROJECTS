import React, { useState, useContext } from "react"
import { Button, Drawer, Checkbox, List, Input, Radio, Row, Col } from "antd"
import styled from "styled-components"
import { useQuery } from "@apollo/react-hooks"
import { ContainerNavigation } from "../../library/basicComponents"
import { GET_ENGAGEMENT_MESSAGE_TEMPLATES } from "../../graphql/query"
import isEmpty from "lodash/isEmpty"
import { UserContext } from "../../amplify/authenticator-provider"
import { InternalDivider, DrawerFooter } from "../../library/activityComponents"

const { Search } = Input

const DrawerBody = styled.div`
  & .ant-list-item {
    &:last-child {
      border-bottom: 1px solid #f1ecec;
    }
  }
  .ant-drawer-body {
    padding: 0 10px;
    padding-top: 5px;
  }
`

const TemplateDrawer = ({
  openTemplateDrawer = false,
  setOpenTemplateDrawer,
  onApply,
}) => {
  const { user } = useContext(UserContext)
  const [variables, setVariables] = useState({
    userId: user?.id || 0,
    companyId: user?.company?.id || null,
    isActive: true,
    templateType: "OWN",
  })
  const [activeFilter, setActiveFilter] = useState("own")

  const [data, setData] = useState([])
  const { data: resp, loading, refetch } = useQuery(
    GET_ENGAGEMENT_MESSAGE_TEMPLATES,
    {
      variables: { ...variables },
      onCompleted: resp => {
        const data = (resp?.engagementMessageTemplates || []).map(el => ({
          ...el,
          checked: false,
        }))
        setData(data)
      },
    }
  )

  const onDrawerClose = () => {
    setOpenTemplateDrawer(false)
  }

  const onSearchboxChange = e => {
    if (!isEmpty(e)) {
      let templates = data.filter(el => {
        return (
          el.title.toLowerCase().includes(e.toLowerCase()) ||
          el.message.toLowerCase().includes(e.toLowerCase())
        )
      })
      setData(templates)
    } else {
      const data = (resp?.engagementMessageTemplates || []).map(el => ({
        ...el,
        checked: false,
      }))
      setData(data)
    }
  }

  const onDrawerApply = e => {
    const obj = data.find(el => el.checked == true)
    if (obj) {
      onApply(obj.message)
    }
    setOpenTemplateDrawer(false)
  }

  const handleChange = id => {
    let templates = data.map(el => {
      return { ...el, checked: el.id === id }
    })
    setData(templates)
  }

  const hanndlFilterChange = e => {
    let newVariables = { isActive: true, templateType: "GLOBAL" }
    switch (e.target.value) {
      case "all":
        newVariables = {
          ...newVariables,
          templateType: "ALL",
          companyId: user?.company?.id || null,
        }
        break
      case "own":
        newVariables = {
          ...newVariables,
          userId: user?.id || 0,
          templateType: "OWN",
          companyId: user?.company?.id || null,
        }
        break
      case "company":
        newVariables = {
          ...newVariables,
          companyId: user?.company?.id || null,
          templateType: "COMPANY",
        }
        break
      default:
        break
    }
    setVariables(newVariables)
    setActiveFilter(e.target.value)
  }

  return (
    <Drawer
      title="Select Message Template"
      placement="right"
      closable={false}
      width={"90%"}
      onClose={onDrawerClose}
      visible={openTemplateDrawer}
    >
      <Row gutter={[4, 16]}>
        <Col xs={24} sm={24} md={12} lg={16} xl={16}>
          <b>Filter By:</b>
          <Radio.Group
            value={activeFilter}
            buttonStyle="solid"
            style={{ marginLeft: 5 }}
            onChange={hanndlFilterChange}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="own">My Templates</Radio.Button>
            <Radio.Button value="company">Company Templates</Radio.Button>
            <Radio.Button value="global">Global Templates</Radio.Button>
          </Radio.Group>
        </Col>
        <Col xs={24} sm={24} md={12} lg={8} xl={8}>
          <Search
            onChange={e => onSearchboxChange(e.target.value)}
            placeholder="Search templates by name, message text"
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
      <InternalDivider />
      <DrawerBody>
        <List
          grid={{
            gutter: 16,
            column: 1,
          }}
          itemLayout="horizontal"
          size="large"
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Checkbox
                    key={`rdo__${item.id}`}
                    checked={item.checked}
                    onChange={() => handleChange(item.id)}
                  ></Checkbox>
                }
                title={item.title}
                description={item.message}
              />
            </List.Item>
          )}
        />
      </DrawerBody>
      <DrawerFooter>
        <Button
          onClick={onDrawerApply}
          type="primary"
          style={{ marginRight: "10px" }}
        >
          Apply
        </Button>
        <Button onClick={onDrawerClose}>Cancel</Button>
      </DrawerFooter>
    </Drawer>
  )
}
export default TemplateDrawer
