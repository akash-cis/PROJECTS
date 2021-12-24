import React, { useEffect, useRef, useState } from "react"
import PanelHeader from "../../library/panelHeader"
import { Button, Checkbox, Table, Icon, Modal, Alert } from "antd"
import styled from "styled-components"
import TextInput from "../../library/textInput"
import { useMutation, useQuery } from "@apollo/react-hooks"
import { CREATE_ROLE, EDIT_ROLE, DELETE_ROLE } from "../../graphql/mutation"
import { ROLES } from "../../graphql/query"
import { Colors } from "../../library/constants"

const FormCntr = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`

const InputCntr = styled.div`
  width: 320px;
`

const CheckCntr = styled.div`
  min-width: 180px;
  padding: 12px;
  & p {
    color: ${Colors.medDarkgray};
    margin: 0 0 0 26px;
    font-size: 13px;
  }
  & strong {
    font-size: 14px;
    color: ${Colors.darkGray};
    margin-right: 4px;
  }
`

const PermissionsCntr = styled.div`
  //min-width: 500px;
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  padding: 12px 0;
`

const InlineFormButton = styled(Button)`
  margin: 12px 0 0 16px;
`

const DeleteIcon = styled(Icon)`
  font-size: 20px;
  color: ${Colors.darkRed};
  cursor: pointer;
`

const EditIcon = styled(Icon)`
  font-size: 20px;
  color: ${Colors.lightPrimaryBrandBlue};
  cursor: pointer;
`

const Roles = ({ setCompany, setActiveTab, newCoSetup, company }) => {
  const [editableRole, setEditableRole] = useState(null)
  const [error, setError] = useState(null)

  const { data: roleData, refetch: refreshRoles } = useQuery(ROLES, {
    variables: {
      companyId: company.id,
    },
    fetchPolicy: "network-only",
  })

  const [createRole, response] = useMutation(CREATE_ROLE)
  const [editRole, editRes] = useMutation(EDIT_ROLE)
  const [deleteRole, deleteRes] = useMutation(DELETE_ROLE)

  const submitRole = role => {
    setError(null)
    createRole({
      variables: {
        companyId: company.id,
        ...role,
      },
    })
      .then(() => refreshRoles())
      .catch(err => {
        console.log(err)
        setError(
          "Error occured while saving role. Please try again or contact support"
        )
      })
  }

  const submitEditRole = role => {
    setError(null)
    editRole({
      variables: {
        companyId: company.id,
        ...role,
      },
    })
      .then(() => {
        refreshRoles().then(() => setEditableRole(null))
      })
      .catch(err => {
        console.log(err)
        setError(
          "Error occured while updating role. Please try again or contact support"
        )
      })
  }

  const submitDeleteRole = roleId => {
    deleteRole({
      variables: {
        companyId: company.id,
        roleId: roleId,
      },
    }).then(() => refreshRoles())
  }

  return (
    <React.Fragment>
      <PanelHeader title={"Roles"}>
        {!newCoSetup ? (
          <Button onClick={() => setCompany(null)}>Close</Button>
        ) : (
          <Button type={"primary"} onClick={() => setActiveTab("Users")}>
            Continue
          </Button>
        )}
      </PanelHeader>
      {error ? (
        <Alert
          message={error}
          type={"error"}
          banner
          style={{ width: "100%" }}
        />
      ) : null}
      <RolesForm
        submitRole={submitRole}
        createLoading={response.loading}
        editableRole={editableRole}
        setEditableRole={setEditableRole}
        submitEditRole={submitEditRole}
        editLoading={editRes.loading}
      />
      <RolesTable
        roles={roleData ? roleData.roles : []}
        deleteRole={submitDeleteRole}
        setEditableRole={setEditableRole}
      />
    </React.Fragment>
  )
}

export default Roles

const RolesForm = ({
  submitRole,
  createLoading,
  editableRole,
  setEditableRole,
  submitEditRole,
  editLoading,
}) => {
  const nameRef = useRef("")
  const [canCreateUsers, setCanCreateUsers] = useState(false)
  const [canCreateTeams, setCanCreateTeams] = useState(false)
  const [canViewProspects, setCanViewProspects] = useState(false)
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false)
  const [canViewAutoAnalytics, setCanViewAutoAnalytics] = useState(false)
  const [canViewAdExport, setCanViewAdExport] = useState(false)
  const [canViewClm, setCanViewClm] = useState(false)
  const [canViewGle, setCanViewGle] = useState(false)
  const [canViewEngagements, setCanViewEngagements] = useState(false)

  const handleSubmitRole = () => {
    const role = {
      name: nameRef.current.value,
      canCreateUsers: canCreateUsers,
      canCreateTeams: canCreateTeams,
      canViewProspects: canViewProspects,
      isCompanyAdmin: isCompanyAdmin,
      canViewAutoAnalytics: canViewAutoAnalytics,
      canViewAdExport: canViewAdExport,
      canViewClm: canViewClm,
      canViewGle: canViewGle,
      canViewEngagements: canViewEngagements,
    }
    submitRole(role)
    resetForm()
  }

  const handleEditRole = () => {
    console.log("canViewEngagements :>> ", canViewEngagements)
    const role = {
      roleId: editableRole.id,
      name: nameRef.current.value,
      canCreateUsers: canCreateUsers,
      canCreateTeams: canCreateTeams,
      canViewProspects: canViewProspects,
      isCompanyAdmin: isCompanyAdmin,
      canViewAutoAnalytics: canViewAutoAnalytics,
      canViewAdExport: canViewAdExport,
      canViewClm: canViewClm,
      canViewGle: canViewGle,
      canViewEngagements: canViewEngagements,
    }
    submitEditRole(role)
  }

  const quickAddAdmin = () => {
    submitRole({
      name: "Admin",
      canCreateUsers: true,
      canCreateTeams: true,
      canViewProspects: true,
      isCompanyAdmin: true,
      canViewAutoAnalytics: false,
      canViewAdExport: false,
      canViewClm: false,
      canViewGle: false,
      canViewEngagements: false,
    })
  }

  const quickAddProspect = () => {
    submitRole({
      name: "Prospect",
      canCreateUsers: false,
      canCreateTeams: false,
      canViewProspects: true,
      isCompanyAdmin: false,
      canViewAutoAnalytics: false,
      canViewAdExport: false,
      canViewClm: false,
      canViewGle: false,
      canViewEngagements: false,
    })
  }

  const quickAddAllFeatures = () => {
    submitRole({
      name: "All features",
      canCreateUsers: true,
      canCreateTeams: true,
      canViewProspects: true,
      isCompanyAdmin: true,
      canViewAutoAnalytics: true,
      canViewAdExport: true,
      canViewClm: true,
      canViewGle: true,
      canViewEngagements: true,
    })
  }

  const resetForm = () => {
    nameRef.current.value = ""
    setCanCreateUsers(false)
    setCanCreateTeams(false)
    setCanViewProspects(false)
    setIsCompanyAdmin(false)
    setCanViewAutoAnalytics(false)
    setCanViewAdExport(false)
    setCanViewClm(false)
    setCanViewGle(false)
    setCanViewEngagements(false)
  }

  useEffect(() => {
    if (editableRole) {
      nameRef.current.value = editableRole.name
      setCanCreateUsers(!!editableRole.canCreateUsers)
      setCanCreateTeams(!!editableRole.canCreateTeams)
      setCanViewProspects(!!editableRole.canViewProspects)
      setIsCompanyAdmin(!!editableRole.isCompanyAdmin)
      setCanViewAutoAnalytics(!!editableRole.canViewAutoAnalytics)
      setCanViewAdExport(!!editableRole.canViewAdExport)
      setCanViewClm(!!editableRole.canViewClm)
      setCanViewGle(!!editableRole.canViewGle)
      setCanViewEngagements(!!editableRole.canViewEngagements)
    } else {
      resetForm()
    }
  }, [editableRole])

  return (
    <FormCntr>
      <InputCntr>
        <TextInput
          reference={nameRef}
          placeholder={"Role name"}
          name={"name"}
        />
      </InputCntr>
      {editableRole ? (
        <>
          <InlineFormButton
            type={"primary"}
            onClick={handleEditRole}
            loading={editLoading}
          >
            Update Role
          </InlineFormButton>
          <InlineFormButton onClick={() => setEditableRole(null)}>
            Cancel
          </InlineFormButton>
        </>
      ) : (
        <>
          <InlineFormButton
            type={"primary"}
            onClick={handleSubmitRole}
            loading={createLoading}
          >
            Add
          </InlineFormButton>
          <div>
            <InlineFormButton icon={"thunderbolt"} onClick={quickAddAdmin}>
              Quick Add Admin
            </InlineFormButton>
            <InlineFormButton icon={"thunderbolt"} onClick={quickAddProspect}>
              Quick Add Prospect
            </InlineFormButton>
            <InlineFormButton
              icon={"thunderbolt"}
              onClick={quickAddAllFeatures}
            >
              Quick Add All Features
            </InlineFormButton>
          </div>
        </>
      )}
      <PermissionsCntr>
        <CheckCntr>
          <Checkbox
            checked={isCompanyAdmin}
            onChange={() => setIsCompanyAdmin(!isCompanyAdmin)}
          >
            <strong>Company Admin</strong>
            <p>Can edit company</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canCreateUsers}
            onChange={() => setCanCreateUsers(!canCreateUsers)}
          >
            <strong>Users</strong>
            <p>Can create users</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canCreateTeams}
            onChange={() => setCanCreateTeams(!canCreateTeams)}
          >
            <strong>Teams</strong>
            <p>Can create teams</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewProspects}
            onChange={() => setCanViewProspects(!canViewProspects)}
          >
            <strong>Prospects</strong>
            <p>Can view prospects</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewAutoAnalytics}
            onChange={() => setCanViewAutoAnalytics(!canViewAutoAnalytics)}
          >
            <strong>Auto Analytics</strong>
            <p>Can view Auto Analytics</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewAdExport}
            onChange={() => setCanViewAdExport(!canViewAdExport)}
          >
            <strong>Ad Exports</strong>
            <p>Can view ad export</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewClm}
            onChange={() => setCanViewClm(!canViewClm)}
          >
            <strong>CLM/ Life Events</strong>
            <p>Can view CLM/ Life Events</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewGle}
            onChange={() => setCanViewGle(!canViewGle)}
          >
            <strong>GLE/ Global Life Events</strong>
            <p>Can view GLE/ Global Life Events</p>
          </Checkbox>
        </CheckCntr>
        <CheckCntr>
          <Checkbox
            checked={canViewEngagements}
            onChange={() => setCanViewEngagements(!canViewEngagements)}
          >
            <strong>Engagements</strong>
            <p>Can view engagements</p>
          </Checkbox>
        </CheckCntr>
      </PermissionsCntr>
    </FormCntr>
  )
}

const RolesTable = ({ roles, deleteRole, setEditableRole }) => {
  const { Column } = Table

  return (
    <Table dataSource={roles} rowKey={"id"} pagination={false}>
      <Column title={"Name"} dataIndex={"name"} key={"name"} />
      <Column
        title={"Company Admin"}
        dataIndex={"isCompanyAdmin"}
        key={"companyAdmin"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Users"}
        dataIndex={"canCreateUsers"}
        key={"users"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Teams"}
        dataIndex={"canCreateTeams"}
        key={"teams"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Prospects"}
        dataIndex={"canViewProspects"}
        key={"prospects"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Auto Analytics"}
        dataIndex={"canViewAutoAnalytics"}
        key={"autoAnalytics"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Ad Exports"}
        dataIndex={"canViewAdExport"}
        key={"adExport"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"CLM/ Life Events"}
        dataIndex={"canViewClm"}
        key={"clm"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"GLE/ Global Life Events"}
        dataIndex={"canViewGle"}
        key={"clm"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Engagements"}
        dataIndex={"canViewEngagements"}
        key={"engagements"}
        align={"center"}
        render={text => <TrueFalse bool={text} />}
      />
      <Column
        title={"Edit"}
        dataIndex={"id"}
        key={"edit"}
        align={"center"}
        render={(text, record) => (
          <EditIcon type={"edit"} onClick={() => setEditableRole(record)} />
        )}
      />
      {/* <Column
        title={"Delete"}
        dataIndex={"id"}
        key={"delete"}
        align={"center"}
        render={(text, record) => (
          <DeleteIcon type={"delete"} onClick={() => deleteRole(record.id)} />
        )}
      /> */}
    </Table>
  )
}

const TrueFalse = ({ bool }) => (
  <Icon
    type={bool ? "check" : "stop"}
    style={
      bool
        ? { color: Colors.green, fontSize: "20px" }
        : { color: Colors.red, fontSize: "20px" }
    }
  />
)
