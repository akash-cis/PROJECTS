import gql from "graphql-tag"

export const CREATE_COMPANY = gql`
  mutation CreateCompany(
    $name: String!
    $phone: String
    $address: String
    $city: String
    $state: String
    $postalCode: String
    $country: String
    $timezone: String
    $locationLink: String
    $facebookLink: String
    $googleLink: String
    $isOptinConsentMethod: Boolean
  ) {
    createCompany(
      name: $name
      phone: $phone
      address: $address
      city: $city
      state: $state
      postalCode: $postalCode
      country: $country
      timezone: $timezone
      locationLink: $locationLink
      facebookLink: $String
      googleLink: $String
      isOptinConsentMethod: $isOptinConsentMethod
    ) {
      company {
        id
        name
      }
    }
  }
`

export const UPDATE_COMPANY = gql`
  mutation UPDATECompany(
    $id: Int!
    $name: String!
    $phone: String!
    $address: String!
    $city: String!
    $state: String!
    $postalCode: String!
    $country: String!
    $industry: String
    $website: String
    $addressDetail: String
    $isDisabled: Boolean
    $automaticEngagement: Boolean
    $timezone: String
    $locationLink: String
    $facebookLink: String
    $googleLink: String
    $isOptinConsentMethod: Boolean
  ) {
    updateCompany(
      id: $id
      name: $name
      phone: $phone
      address: $address
      city: $city
      state: $state
      postalCode: $postalCode
      country: $country
      industry: $industry
      website: $website
      addressDetail: $addressDetail
      isDisabled: $isDisabled
      automaticEngagement: $automaticEngagement
      timezone: $timezone
      locationLink: $locationLink
      facebookLink: $facebookLink
      googleLink: $googleLink
      isOptinConsentMethod: $isOptinConsentMethod
    ) {
      ok
      company {
        id
        name
        phone
        address
        city
        state
        postalCode
        country
        website
        industry
        addressDetail
        isDisabled
        dateCreated
        userCount
        automaticEngagement
        timezone
        locationLink
        facebookLink
        googleLink
        isOptinConsentMethod
      }
    }
  }
`

export const ADD_USER = gql`
  mutation CreateUser(
    $email: String!
    $firstName: String!
    $lastName: String!
    $companyId: Int
    $roleId: Int
    $phone: String
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      companyId: $companyId
      roleId: $roleId
      phone: $phone
    ) {
      user {
        id
        email
        fullName
        phone
      }
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $userId: Int!
    $firstName: String!
    $lastName: String!
    $email: String
    $oldPass: String
    $newPass: String
    $roleId: Int
    $companyId: Int
    $phone: String
  ) {
    updateUser(
      userId: $userId
      firstName: $firstName
      lastName: $lastName
      email: $email
      oldPass: $oldPass
      newPass: $newPass
      roleId: $roleId
      companyId: $companyId
      phone: $phone
    ) {
      ok
    }
  }
`

export const UPDATE_USER_FILTERS = gql`
  mutation UpdateUserFilters(
    $filters: [FilterInputs]!
    $userId: Int
    $setType: String
  ) {
    updateUserFilters(filters: $filters, userId: $userId, setType: $setType) {
      userFilters {
        id
        value
        type
        typeName
        companyFilterId
      }
    }
  }
`
export const CREATE_USAGE_EVENT = gql`
  mutation CreateUsageEvent(
    $verb: String!
    $context: String
    $duration: Float!
    $eventId: Int
  ) {
    createUsageEvent(
      verb: $verb
      context: $context
      duration: $duration
      eventId: $eventId
    ) {
      event {
        id
        timestamp
        verb
        subjectId
        context
        duration
      }
    }
  }
`

export const SAVE_USER_FILTER_SET = gql`
  mutation SaveUserFilterSet($name: String!, $setType: String!) {
    saveUserFilterSet(name: $name, setType: $setType) {
      filterSet {
        id
        userId
        name
        setType
      }
    }
  }
`

export const UPDATE_USER_FILTER_SET = gql`
  mutation UpdateUserFilterSet(
    $delete: Boolean
    $id: Int!
    $name: String!
    $setType: String!
  ) {
    updateUserFilterSet(
      delete: $delete
      id: $id
      name: $name
      setType: $setType
    ) {
      ok
    }
  }
`

export const SELECT_FILTER_SET = gql`
  mutation SelectFilterSet($id: Int!, $setType: String!) {
    selectFilterSet(filterSetId: $id, setType: $setType) {
      userFilters {
        type
        typeName
        value
        companyFilterId
        id
        setType
      }
    }
  }
`

export const PROSPECT_ACTION = gql`
  mutation ProspectAction($action: String!, $id: Int!, $postType: String) {
    prospectAction(action: $action, aingineDataId: $id, postType: $postType) {
      ok
    }
  }
`

export const UPDATE_DEAL = gql`
  mutation UpdateDeal(
    $email: String
    $firstName: String
    $followupDate: DateTime
    $id: Int!
    $lastName: String
    $location: String
    $phone: String
    $status: String
    $strength: String
    $userId: Int
    $allowNotifications: Boolean
  ) {
    updateDeal(
      email: $email
      firstName: $firstName
      followupDate: $followupDate
      id: $id
      lastName: $lastName
      location: $location
      phone: $phone
      status: $status
      strength: $strength
      userId: $userId
      allowNotifications: $allowNotifications
    ) {
      ok
      deal {
        id
        userId
        companyId
        aingineDataId
        screenName
        firstName
        lastName
        email
        phone
        location
        url
        profileUrl
        source
        strength
        status
        dateCreated
        followupDate
        subscribed
        allowNotifications
        tags
        conversations {
          id
          type
          message
          postTime
          aingineUserId
          aingineDataId
        }
      }
    }
  }
`

export const ADD_COMMENT = gql`
  mutation AddDealComment($dealId: Int!, $message: String!) {
    addDealComment(dealId: $dealId, message: $message) {
      ok
      deal {
        id
        userId
        companyId
        aingineDataId
        screenName
        firstName
        lastName
        email
        phone
        location
        url
        profileUrl
        source
        strength
        status
        dateCreated
        followupDate
        conversations {
          id
          type
          message
          postTime
          aingineUserId
          aingineDataId
        }
      }
    }
  }
`
export const SAVE_FILTER_TYPE = gql`
  mutation SaveFilterType(
    $id: Int
    $name: String!
    $type: String!
    $filterField: String!
  ) {
    saveFilterType(
      id: $id
      name: $name
      type: $type
      filterField: $filterField
    ) {
      ok
      filterType {
        id
        name
        type
        filterField
        optionsCount
      }
    }
  }
`

export const DELETE_FILTER_TYPE = gql`
  mutation DeleteFilterType($filterId: Int!) {
    deleteFilterType(filterId: $filterId) {
      ok
    }
  }
`

export const SAVE_SELECTION_OPTION = gql`
  mutation SaveSelectionOption(
    $filterTypeId: Int!
    $value: String!
    $query: String
  ) {
    saveSelectionOption(
      filterTypeId: $filterTypeId
      value: $value
      query: $query
    ) {
      ok
      selectionOption {
        id
        value
        query
      }
    }
  }
`

export const REMOVE_SELECTION_OPTION = gql`
  mutation RemoveSelectionOption($id: Int!) {
    removeSelectionOption(id: $id) {
      ok
    }
  }
`

export const SAVE_COMPANY_FILTERS = gql`
  mutation SaveCompanyFilters(
    $filters: [CompanyFilterInput]!
    $companyId: Int!
  ) {
    saveCompanyFilters(filters: $filters, companyId: $companyId) {
      ok
      conflicts {
        id
        selectionOption {
          id
          value
          filterType {
            id
            name
          }
        }
      }
    }
  }
`

export const SAVE_RESPONSE_TEMPLATE = gql`
  mutation SaveResponseTemplate(
    $id: Int
    $isInitialResponse: Boolean!
    $message: String!
    $userId: Int
  ) {
    saveResponseTemplate(
      id: $id
      isInitialResponse: $isInitialResponse
      message: $message
      userId: $userId
    ) {
      ok
      responseTemplate {
        id
        message
        isInitialResponse
      }
    }
  }
`

export const DELETE_REPONSE_TEMPLATE = gql`
  mutation DeleteResponseTemplate($id: Int!, $userId: Int) {
    deleteResponseTemplate(id: $id, userId: $userId) {
      ok
    }
  }
`

export const UPDATE_USER_DISABLED_STATUS = gql`
  mutation UpdateUserDisabledStatus($userId: Int!, $isDisabled: Boolean!) {
    updateUserDisabledStatus(userId: $userId, isDisabled: $isDisabled) {
      ok
    }
  }
`
export const UPDATE_USER_DISABLED_COMPANY_STATUS = gql`
  mutation UpdateUserDisabledCompanyStatus(
    $userId: Int!
    $companyId: Int!
    $isDisabled: Boolean!
  ) {
    updateUserDisabledCompanyStatus(
      userId: $userId
      companyId: $companyId
      isDisabled: $isDisabled
    ) {
      ok
    }
  }
`
export const CREATE_TEAM = gql`
  mutation createTeam(
    $companyId: Int!
    $name: String!
    $leaderId: Int!
    $members: [TeamMemberInputs]!
  ) {
    createTeam(
      companyId: $companyId
      name: $name
      leaderId: $leaderId
      members: $members
    ) {
      team {
        id
        name
        leaderId
        members {
          id
          memberId
        }
      }
    }
  }
`

export const UPDATE_TEAM = gql`
  mutation updateTeam(
    $id: Int!
    $name: String!
    $leaderId: Int!
    $members: [TeamMemberInputs]!
  ) {
    updateTeam(id: $id, name: $name, leaderId: $leaderId, members: $members) {
      team {
        id
        name
        leaderId
        members {
          id
          memberId
        }
      }
    }
  }
`

export const DELETE_TEAM = gql`
  mutation deleteTeam($id: Int!) {
    deleteTeam(id: $id) {
      ok
    }
  }
`

export const CREATE_ROLE = gql`
  mutation CreateRole(
    $companyId: Int
    $name: String!
    $canCreateUsers: Boolean!
    $canCreateTeams: Boolean!
    $canViewProspects: Boolean!
    $isCompanyAdmin: Boolean!
    $canViewAutoAnalytics: Boolean!
    $canViewAdExport: Boolean!
    $canViewClm: Boolean!
    $canViewGle: Boolean!
    $canViewEngagements: Boolean!
  ) {
    createRole(
      companyId: $companyId
      name: $name
      canCreateUsers: $canCreateUsers
      canCreateTeams: $canCreateTeams
      canViewProspects: $canViewProspects
      isCompanyAdmin: $isCompanyAdmin
      canViewAutoAnalytics: $canViewAutoAnalytics
      canViewAdExport: $canViewAdExport
      canViewClm: $canViewClm
      canViewGle: $canViewGle
      canViewEngagements: $canViewEngagements
    ) {
      ok
    }
  }
`

export const EDIT_ROLE = gql`
  mutation EditRole(
    $companyId: Int
    $roleId: Int!
    $name: String!
    $canCreateUsers: Boolean!
    $canCreateTeams: Boolean!
    $canViewProspects: Boolean!
    $isCompanyAdmin: Boolean!
    $canViewAutoAnalytics: Boolean!
    $canViewAdExport: Boolean!
    $canViewClm: Boolean!
    $canViewGle: Boolean!
    $canViewEngagements: Boolean!
  ) {
    editRole(
      companyId: $companyId
      roleId: $roleId
      name: $name
      canCreateUsers: $canCreateUsers
      canCreateTeams: $canCreateTeams
      canViewProspects: $canViewProspects
      isCompanyAdmin: $isCompanyAdmin
      canViewAutoAnalytics: $canViewAutoAnalytics
      canViewAdExport: $canViewAdExport
      canViewClm: $canViewClm
      canViewGle: $canViewGle
      canViewEngagements: $canViewEngagements
    ) {
      ok
    }
  }
`

export const DELETE_ROLE = gql`
  mutation DeleteRole($companyId: Int!, $roleId: Int!) {
    deleteRole(companyId: $companyId, roleId: $roleId) {
      ok
    }
  }
`

export const ADD_SCREEN_NAME = gql`
  mutation AddScreenName(
    $screenName: String!
    $source: String
    $sourceId: Int
    $sourceUrl: String
    $id: Int
  ) {
    addScreenName(
      screenName: $screenName
      source: $source
      sourceId: $sourceId
      sourceUrl: $sourceUrl
      id: $id
    ) {
      ok
      screenName {
        id
        screenName
      }
    }
  }
`

export const CREATE_CRM_INTEGRATION = gql`
  mutation CreateCrmIntegration(
    $companyId: Int!
    $integrationType: String!
    $adfEmail: String!
    $crmDealerId: String!
    $vsLeadSourceId: String!
  ) {
    createCrmIntegration(
      companyId: $companyId
      integrationType: $integrationType
      adfEmail: $adfEmail
      crmDealerId: $crmDealerId
      vsLeadSourceId: $vsLeadSourceId
    ) {
      ok
    }
  }
`

export const DELETE_CRM_INTEGRATION = gql`
  mutation DeleteCrmIntegration($crmIntegrationId: Int!) {
    deleteCrmIntegration(crmIntegrationId: $crmIntegrationId) {
      ok
    }
  }
`

export const UPDATE_DEAL_SUBSCRIPTIOM = gql`
  mutation UpdateDealSubscription($dealId: Int!, $subscribed: Boolean!) {
    updateDealSubscription(dealId: $dealId, subscribed: $subscribed) {
      ok
    }
  }
`

export const SAVE_INITIAL_SENT = gql`
  mutation SaveInitialConversationSent($aingineId: Int!, $response: String!) {
    saveSentConversation(aingineId: $aingineId, response: $response) {
      ok
    }
  }
`

export const PUSH_DEAL_TO_CRM = gql`
  mutation PushDealToCrm(
    $companyId: Int!
    $dealId: Int!
    $aingineDataId: Int
    $typeOfLead: String!
    $status: String
    $interest: String!
    $year: String!
    $make: String!
    $model: String!
    $contactFirstName: String!
    $contactLastName: String!
    $contactFullName: String
    $contactEmail: String
    $contactPhoneNumber: String!
    $contactAddressLine1: String!
    $contactAddressLine2: String
    $city: String
    $state: String!
    $zip: String
    $country: String!
    $comments: String!
    $vehicles: [VehicleInputs]
  ) {
    pushDealToCrm(
      companyId: $companyId
      dealId: $dealId
      aingineDataId: $aingineDataId
      typeOfLead: $typeOfLead
      status: $status
      interest: $interest
      year: $year
      make: $make
      model: $model
      contactFirstName: $contactFirstName
      contactLastName: $contactLastName
      contactFullName: $contactFullName
      contactEmail: $contactEmail
      contactPhoneNumber: $contactPhoneNumber
      contactAddressLine1: $contactAddressLine1
      contactAddressLine2: $contactAddressLine2
      city: $city
      state: $state
      zip: $zip
      country: $country
      comments: $comments
      vehicles: $vehicles
    ) {
      statusCode
      message
    }
  }
`

export const SUBMIT_SUPPORT_TICKET = gql`
  mutation SubmitSupportTicket($message: String!, $subject: String!) {
    submitSupportTicket(message: $message, subject: $subject) {
      ok
    }
  }
`

export const RESEND_INVITE = gql`
  mutation ResendInvite($userId: Int!) {
    resendInvite(userId: $userId) {
      ok
    }
  }
`

export const UPDATE_NOTIFICATION = gql`
  mutation UpdateNotification($id: Int!, $read: Boolean) {
    updateNotification(id: $id, read: $read) {
      ok
    }
  }
`

export const DELETE_EXPORT_CONFIG = gql`
  mutation deleteExportConfig($id: Int!) {
    deleteExportConfig(id: $id) {
      ok
    }
  }
`

export const CREATE_EXPORT_CONFIG = gql`
  mutation createExportConfig(
    $email: String!
    $filters: [FilterInputs]!
    $name: String!
    $minimumCount: Int
    $emailTime: Time
    $frequency: Int
    $startDate: DateTime
    $endDate: DateTime
    $timezone: String
  ) {
    createExportConfig(
      email: $email
      filters: $filters
      name: $name
      minimumCount: $minimumCount
      emailTime: $emailTime
      frequency: $frequency
      startDate: $startDate
      endDate: $endDate
      timezone: $timezone
    ) {
      exportConfig {
        id
        userId
        name
        email
        minimumCount
        count
        frequency
        lastExported
        filters {
          typeName
          value
        }
        exports {
          id
          exportConfigId
          createdAt
          name
          path
        }
      }
    }
  }
`

export const UPDATE_EXPORT_CONFIG = gql`
  mutation updateExportConfig(
    $id: Int!
    $email: String!
    $filters: [FilterInputs]!
    $name: String!
    $minimumCount: Int
    $emailTime: Time
    $frequency: Int
    $timezone: String
  ) {
    updateExportConfig(
      id: $id
      email: $email
      filters: $filters
      name: $name
      minimumCount: $minimumCount
      frequency: $frequency
      emailTime: $emailTime
      timezone: $timezone
    ) {
      exportConfig {
        id
        frequency
        userId
        name
        email
        minimumCount
        count
        lastExported
        filters {
          typeName
          value
        }
      }
    }
  }
`

export const DELETE_EXPORT = gql`
  mutation deleteExport($id: Int!) {
    deleteExport(id: $id) {
      ok
    }
  }
`

export const DOWNLOAD_EXPORT_FILE = gql`
  mutation downloadExportFile($id: Int!) {
    downloadExportFile(id: $id) {
      url
    }
  }
`

export const UPDATE_PREDICTION_REVIEW = gql`
  mutation updatePrediction($postId: String!, $review: Boolean) {
    updatePrediction(postId: $postId, review: $review) {
      ok
    }
  }
`

// NOTE: Apollo Resolver
export const UPDATE_PREDICTION_REVIEW_RESOLVER = gql`
  mutation UpdatePredictionReview($id: String!, $review: Boolean) {
    updatePredictionReview(id: $id, review: $review) @client
  }
`

export const UPDATE_PROFILE_DATA = gql`
  mutation UpdateProfileData($id: Int!) {
    updateProfileData(id: $id) @client
  }
`
export const CREATE_PERSON = gql`
  mutation CreatePerson($companySourceId: Int!, $personData: PersonInput) {
    createPerson(companySourceId: $companySourceId, personData: $personData) {
      person {
        id
      }
      ok
    }
  }
`
export const CREATE_PERSON_USER_ACCOUNT = gql`
  mutation CreatePersonUserAccount(
    $personData: CreateUserAccountInput
    $personId: Int!
  ) {
    createPersonUserAccount(userAccountData: $personData, personId: $personId) {
      ok
    }
  }
`

export const UPDATE_USER_ACCOUNT = gql`
  mutation updateUserAccount($personData: UpdateUserAccountInput) {
    updateUserAccount(userAccountData: $personData) {
      ok
    }
  }
`
export const UNASSIGN_USER_ACCOUNT = gql`
  mutation unassignUserAccount($personId: Int!, $accountId: Int!) {
    unassignUserAccount(personId: $personId, accountId: $accountId) {
      ok
    }
  }
`
export const UPDATE_USER_ROLES = gql`
  mutation addCompanyReference($companyId: Int!, $roleId: Int!, $userId: Int!) {
    addCompanyReference(
      companyId: $companyId
      roleId: $roleId
      userId: $userId
    ) {
      ok
    }
  }
`
export const ADD_USER_ACCOUNT = gql`
  mutation addUserAccounts(
    $companyId: Int!
    $status: String!
    $userId: Int!
    $roleId: Int!
  ) {
    addUserAccounts(
      companyId: $companyId
      status: $status
      userId: $userId
      roleId: $roleId
    ) {
      userAccountId
    }
  }
`
export const UPDATE_USER_DEFAULT_COMPANY_ID = gql`
  mutation updateUserDefaultCompany($companyId: Int!, $userId: Int!) {
    updateUserDefaultCompany(companyId: $companyId, userId: $userId) {
      ok
    }
  }
`

export const CREATE_LEAD = gql`
  mutation CreateLead(
    $fullName: String!
    $leadSourceType: String!
    $firstName: String
    $lastName: String
    $leadSourceOriginalId: Int
    $phone: String
    $leadStatusTypeId: Int
    $leadStatusDescription: String
    $otherSource: String
  ) {
    createLead(
      fullName: $fullName
      leadSourceType: $leadSourceType
      firstName: $firstName
      lastName: $lastName
      leadSourceOriginalId: $leadSourceOriginalId
      phone: $phone
      leadStatusTypeId: $leadStatusTypeId
      leadStatusDescription: $leadStatusDescription
      otherSource: $otherSource
    ) {
      statusCode
      message
      lead {
        id
        fullName
        firstName
        lastName
        dateOfBirth
        leadSourceType
        leadSourceOriginalId
        companyId
        leadFileId
        crmIntegrationId
        status
        emailConsent
        emailConsentDate
        textConsent
        textConsentDate
        textConsentStatus
        otherSource
        emails {
          id
          leadId
          email
          emailType
        }
        phoneNumbers {
          id
          leadId
          phone
          phoneType
          lookupType
        }
        addresses {
          id
          leadId
          locationText
          addressLine1
          addressLine2
          city
          state
          postalCode
          country
        }
        vehicleOfInterest {
          id
          leadId
          year
          make
          model
          trim
          description
          budget
        }
        leadSource {
          id
          name
        }
      }
    }
  }
`

export const UPDATE_LEAD = gql`
  mutation UpdateLead(
    $id: Int!
    $fullName: String!
    $leadSourceType: String
    $firstName: String
    $lastName: String
    $dateOfBirth: Date
    $leadSourceOriginal: Int
    $status: String
    $emailConsent: Boolean
    $emailConsentDate: DateTime
    $textConsent: Boolean
    $textConsentDate: DateTime
    $phone: String
    $leadStatusTypeId: Int
    $leadStatusDescription: String
  ) {
    updateLead(
      leadId: $id
      fullName: $fullName
      leadSourceType: $leadSourceType
      firstName: $firstName
      lastName: $lastName
      dateOfBirth: $dateOfBirth
      leadSourceOriginalId: $leadSourceOriginal
      status: $status
      emailConsent: $emailConsent
      emailConsentDate: $emailConsentDate
      textConsent: $textConsent
      textConsentDate: $textConsentDate
      phone: $phone
      leadStatusTypeId: $leadStatusTypeId
      leadStatusDescription: $leadStatusDescription
    ) {
      statusCode
      message
      lead {
        id
        fullName
        firstName
        lastName
        dateOfBirth
        leadSourceType
        leadSourceOriginalId
        companyId
        leadFileId
        crmIntegrationId
        status
        emailConsent
        emailConsentDate
        textConsent
        textConsentDate
        textConsentStatus
        otherSource
        leadStatusType {
          id
          type
          status
        }
        leadSource {
          id
          name
        }
        leadNotes {
          id
          note
          createdOn
        }
      }
    }
  }
`

export const DELETE_LEAD = gql`
  mutation DeleteLead($leadId: Int!) {
    deleteLead(leadId: $leadId) {
      ok
    }
  }
`

export const CREATE_LEAD_EMAIL = gql`
  mutation CreateLeadEmail($leadId: Int!, $email: String!, $emailType: String) {
    createLeadEmail(leadId: $leadId, email: $email, emailType: $emailType) {
      leadEmail {
        id
        email
        emailType
      }
    }
  }
`

export const UPDATE_LEAD_EMAIL = gql`
  mutation UpdateLeadEmail($id: Int!, $email: String!, $emailType: String) {
    updateLeadEmail(leadEmailId: $id, email: $email, emailType: $emailType) {
      ok
      leadEmail {
        id
        email
        emailType
      }
    }
  }
`

export const DELETE_LEAD_EMAIL = gql`
  mutation DeleteLeadEmail($id: Int!) {
    deleteLeadEmail(leadEmail: $id) {
      ok
    }
  }
`

export const CREATE_LEAD_PHONE = gql`
  mutation CreateLeadPhone($leadId: Int!, $phone: String!, $phoneType: String) {
    createLeadPhone(leadId: $leadId, phone: $phone, phoneType: $phoneType) {
      statusCode
      message
      leadPhone {
        id
        phone
        phoneType
      }
    }
  }
`

export const UPDATE_LEAD_PHONE = gql`
  mutation UpdateLeadPhone($id: Int!, $phone: String!, $phoneType: String) {
    updateLeadPhone(leadPhoneId: $id, phone: $phone, phoneType: $phoneType) {
      statusCode
      message
      leadPhone {
        id
        phone
        phoneType
      }
    }
  }
`

export const DELETE_LEAD_PHONE = gql`
  mutation DeleteLeadPhone($id: Int!) {
    deleteLeadPhone(leadPhoneId: $id) {
      ok
    }
  }
`

export const CREATE_LEAD_ADDRESS = gql`
  mutation CreateLeadAddress(
    $leadId: Int!
    $addressLine1: String
    $addressLine2: String
    $city: String
    $country: String
    $locationText: String
    $postalCode: String
    $state: String
  ) {
    createLeadAddress(
      leadId: $leadId
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      city: $city
      country: $country
      locationText: $locationText
      postalCode: $postalCode
      state: $state
    ) {
      leadAddress {
        id
        leadId
        locationText
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
      }
    }
  }
`
export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign(
    $companyId: Int!
    $userId: Int!
    $name: String!
    $method: String
    $textMessage: String
    $startDate: DateTime
    $endDate: DateTime
    $activeInd: String
    $isDisabled: Boolean
    $isPrioritize: Boolean
  ) {
    createCampaign(
      companyId: $companyId
      userId: $userId
      name: $name
      method: $method
      textMessage: $textMessage
      startDate: $startDate
      endDate: $endDate
      activeInd: $activeInd
      isDisabled: $isDisabled
      isPrioritize: $isPrioritize
    ) {
      campaign {
        id
        name
      }
    }
  }
`

export const CLONE_CAMPAIGN = gql`
  mutation CloneCampaign($campaignId: Int!, $userId: Int!, $name: String!) {
    cloneCampaign(campaignId: $campaignId, userId: $userId, name: $name) {
      campaign {
        id
        name
      }
    }
  }
`

export const UPDATE_LEAD_ADDRESS = gql`
  mutation UpdateLeadAddress(
    $id: Int!
    $locationText: String
    $addressLine1: String
    $addressLine2: String
    $city: String
    $state: String
    $postalCode: String
    $country: String
  ) {
    updateLeadAddress(
      id: $id
      locationText: $locationText
      addressLine1: $addressLine1
      addressLine2: $addressLine2
      city: $city
      state: $state
      postalCode: $postalCode
      country: $country
    ) {
      leadAddress {
        id
        leadId
        locationText
        addressLine1
        addressLine2
        city
        state
        postalCode
        country
      }
      ok
    }
  }
`

export const DELETE_LEAD_ADDRESS = gql`
  mutation DeleteLeadAddress($id: Int!) {
    deleteLeadAddress(id: $id) {
      ok
    }
  }
`

export const CREATE_LEAD_VEHICLE_OF_INTEREST = gql`
  mutation CreateLeadVehicleOfInterest(
    $leadId: Int!
    $budget: String
    $description: String
    $make: String
    $model: String
    $trim: String
    $year: String
    $isCurrent: Boolean
    $customerInterest: String
    $isPrimary: Boolean
  ) {
    createLeadVehicleOfInterest(
      leadId: $leadId
      budget: $budget
      description: $description
      make: $make
      model: $model
      trim: $trim
      year: $year
      isCurrent: $isCurrent
      customerInterest: $customerInterest
      isPrimary: $isPrimary
    ) {
      leadVehicleOfInterest {
        id
        leadId
        budget
        description
        make
        model
        trim
        year
        isCurrent
        customerInterest
        isPrimary
      }
    }
  }
`

export const UPDATE_LEAD_VEHICLE_OF_INTEREST = gql`
  mutation UpdateLeadVehicleOfInterest(
    $id: Int!
    $budget: String
    $decription: String
    $make: String
    $model: String
    $trim: String
    $year: String
    $isCurrent: Boolean
    $customerInterest: String
    $isPrimary: Boolean
  ) {
    updateLeadVehicleOfInterest(
      id: $id
      budget: $budget
      description: $decription
      make: $make
      model: $model
      trim: $trim
      year: $year
      isCurrent: $isCurrent
      customerInterest: $customerInterest
      isPrimary: $isPrimary
    ) {
      leadVehicleOfInterest {
        id
        budget
        description
        make
        model
        year
        trim
        isCurrent
        customerInterest
        isPrimary
      }
      ok
    }
  }
`

export const DELETE_LEAD_VEHICLE_OF_INTEREST = gql`
  mutation DeleteLeadVehicleOfInterest($id: Int!) {
    deleteLeadVehicleOfInterest(id: $id) {
      ok
    }
  }
`

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign(
    $id: Int!
    $name: String!
    $method: String
    $textMessage: String
    $startDate: DateTime
    $endDate: DateTime
    $activeInd: String
    $isDisabled: Boolean
    $isAcceptTerms: Boolean
    $isPrioritize: Boolean
  ) {
    updateCampaign(
      id: $id
      name: $name
      method: $method
      textMessage: $textMessage
      startDate: $startDate
      endDate: $endDate
      activeInd: $activeInd
      isDisabled: $isDisabled
      isAcceptTerms: $isAcceptTerms
      isPrioritize: $isPrioritize
    ) {
      campaign {
        id
        name
        campaignSelections {
          id
          type
          value
        }
      }
    }
  }
`
export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: Int!) {
    deleteCampaign(id: $id) {
      ok
    }
  }
`

export const UPDATE_CAMPAIGN_SCHEDULE = gql`
  mutation UpdateCampaignSchedules(
    $id: Int!
    $type: String!
    $numericValue: Int!
    $temporalValue: String!
    $title: String!
    $sortOrder: Int!
  ) {
    updateCampaignSchedules(
      id: $id
      type: $type
      numericValue: $numericValue
      temporalValue: $temporalValue
      title: $title
      sortOrder: $sortOrder
    ) {
      campaignSchedule {
        id
        type
        numericValue
        temporalValue
        title
        sortOrder
      }
    }
  }
`
export const CREATE_CAMPAIGN_SCHEDULE = gql`
  mutation CreateCampaignSchedule(
    $campaignId: Int!
    $type: String!
    $numericValue: Int!
    $temporalValue: String!
    $title: String!
    $sortOrder: Int!
  ) {
    createCampaignSchedule(
      campaignId: $campaignId
      type: $type
      numericValue: $numericValue
      temporalValue: $temporalValue
      title: $title
      sortOrder: $sortOrder
    ) {
      campaignSchedule {
        id
        type
        numericValue
        temporalValue
        title
        sortOrder
      }
    }
  }
`

export const CREATE_CAMPAIGN_TEMPLATE = gql`
  mutation CreateCampaignTemplates(
    $campaignId: Int!
    $scheduleId: Int!
    $sources: [Int]!
    $templateText: [String]!
    $afterHourTemplateText: [String]!
    $isAfterHour: Boolean!
  ) {
    createCampaignTemplates(
      campaignId: $campaignId
      scheduleId: $scheduleId
      sources: $sources
      templateText: $templateText
      afterHourTemplateText: $afterHourTemplateText
      isAfterHour: $isAfterHour
    ) {
      campaignTemplates {
        id
      }
    }
  }
`
export const UPDATE_CAMPAIGN_SCHEDULE_TEMPLATE = gql`
  mutation UpdateCampaignScheduleTemplates(
    $campaignId: Int!
    $scheduleId: Int!
    $sources: [Int]!
    $templateText: [String]!
    $afterHourTemplateText: [String]!
    $isAfterHour: Boolean!
  ) {
    updateCampaignScheduleTemplates(
      campaignId: $campaignId
      scheduleId: $scheduleId
      sources: $sources
      templateText: $templateText
      afterHourTemplateText: $afterHourTemplateText
      isAfterHour: $isAfterHour
    ) {
      ok
      campaignTemplates {
        id
      }
    }
  }
`
export const UPDATE_CAMPAIGN_SCHEDULE_SORT_ORDERS = gql`
  mutation UpdateCampaignSchedulesSortorder(
    $schedules: [Int]!
    $sortOrder: [Int]!
  ) {
    updateCampaignSchedulesSortorder(
      schedules: $schedules
      sortOrder: $sortOrder
    ) {
      ok
      campaignSchedules {
        id
        type
        numericValue
        temporalValue
        title
        sortOrder
      }
    }
  }
`

export const UPDATE_CAMPAIGN_TEMPLATE = gql`
  mutation UpdateCampaignTemplate(
    $id: Int!
    $scheduleId: Int
    $sourceId: Int
    $templateText: String
    $isActive: Boolean
  ) {
    updateCampaignTemplate(
      id: $id
      scheduleId: $scheduleId
      sourceId: $sourceId
      templateText: $templateText
      isActive: $isActive
    ) {
      campaignTemplate {
        id
      }
    }
  }
`
export const DELETE_CAMPAIGN_TEMPLATE = gql`
  mutation DeleteCampaignTemplate($id: Int!) {
    deleteCampaignTemplate(id: $id) {
      ok
    }
  }
`
export const DELETE_CAMPAIGN_SCHEDULE = gql`
  mutation DeleteCampaignSchedule($id: Int!) {
    deleteCampaignSchedule(id: $id) {
      ok
    }
  }
`

export const DELETE_CAMPAIGN_SCHEDULE_OPTION = gql`
  mutation DeleteCampaignScheduleOption($id: Int!) {
    deleteCampaignScheduleOption(id: $id) {
      ok
    }
  }
`

// export const CREATE_CAMPAIGN_SCHEDULE_OPTION = gql`
//   mutation CreateCampaignScheduleOption(
//     $type: String!
//     $numericValue: Int!
//     $temporalValue: String!
//   ) {
//     createCampaignScheduleOption(
//       type: $type
//       numericValue: $numericValue
//       temporalValue: $temporalValue
//     ) {
//       campaignScheduleOption {
//         id
//       }
//     }
//   }
// `
export const CREATE_CAMPAIGN_SELECTIONS = gql`
  mutation CreateCampaignSelections(
    $campaignId: Int!
    $type: String!
    $values: [SelectionInputs]!
    $secondaryType: String
    $secondaryValues: [SelectionInputs]
  ) {
    createCampaignSelections(
      campaignId: $campaignId
      type: $type
      values: $values
      secondaryType: $secondaryType
      secondaryValues: $secondaryValues
    ) {
      campaignSelections {
        id
      }
    }
  }
`
// export const CREATE_CAMPAIGN_SCHEDUEL = gql`
//   mutation CreateCampaignSchedule($campaignId: Int!, $schedulesOptionId: Int!) {
//     createCampaignSchedule(
//       campaignId: $campaignId
//       schedulesOptionId: $schedulesOptionId
//     ) {
//       campaignSchedule {
//         id
//         schedulesOptionId
//         campaignSchedulesOption {
//           id
//           type
//           numericValue
//           temporalValue
//         }
//       }
//     }
//   }
// `
export const CREATE_CAMPAIGN_LEAD_SUMMARY = gql`
  mutation CreateCampaignLeadSummary($campaignId: Int!) {
    createCampaignLeadSummary(campaignId: $campaignId) {
      ok
    }
  }
`

export const CREATE_MESSAGE = gql`
  mutation CreateMessage(
    $leadId: Int!
    $userId: Int!
    $channelId: Int
    $campaignId: Int
    $campaignTemplateId: Int
    $direction: String
    $content: String!
    $toPhone: String!
  ) {
    createMessage(
      leadId: $leadId
      userId: $userId
      channelId: $channelId
      campaignId: $campaignId
      campaignTemplateId: $campaignTemplateId
      direction: $direction
      content: $content
      toPhone: $toPhone
    ) {
      statusCode
      message
      leadMessage {
        id
        systemUserId
        leadId
        userId
        channelId
        campaignId
        campaignTemplateId
        direction
        dateSent
        dateReceived
        content
        messageLog {
          id
          fromPhone
          toPhone
        }
      }
    }
  }
`

export const CREATE_MESSAGE_LOG = gql`
  mutation CreateMessageLog($messageId: Int!, $toPhone: String!) {
    createMessageLog(messageId: $messageId, toPhone: $toPhone) {
      messageLog {
        id
        fromPhone
        toPhone
      }
    }
  }
`

export const CREATE_CHANNEL = gql`
  mutation CreateChannel($name: String!, $channelType: String!) {
    createChannel(name: $name, channelType: $channelType) {
      channel {
        id
        name
        channelType
      }
    }
  }
`

export const UPDATE_CHANNEL = gql`
  mutation UpdateChannel($id: Int!, $name: String!, $channelType: String!) {
    updateChannel(id: $id, name: $name, channelType: $channelType) {
      channel {
        id
        name
        channelType
      }
      ok
    }
  }
`

export const DELETE_CHANNEL = gql`
  mutation DeleteChannel($id: Int!) {
    deleteChannel(id: $id) {
      ok
    }
  }
`

export const UPDATE_CRM_INTEGRATION_USER = gql`
  mutation UpdateCrmIntegrationUser(
    $userId: Int!
    $crmIntegrationId: Int!
    $vinUserId: Int!
  ) {
    updateCrmIntegrationUser(
      userId: $userId
      crmIntegrationId: $crmIntegrationId
      vinUserId: $vinUserId
    ) {
      vinSolutionsUser {
        id
      }
      ok
    }
  }
`

export const SAVE_ENAGEMENT_MESSAGE_TEMPLATE = gql`
  mutation SaveEngagementMessageTemplate(
    $userId: Int!
    $companyId: Int
    $title: String!
    $message: String!
    $id: Int
    $isActive: Boolean
    $isCompanyShared: Boolean
  ) {
    saveEngagementMessageTemplate(
      userId: $userId
      companyId: $companyId
      title: $title
      message: $message
      id: $id
      isActive: $isActive
      isCompanyShared: $isCompanyShared
    ) {
      message
      statusCode
      engagementMessageTemplate {
        id
      }
    }
  }
`

export const DELETE_ENAGEMENT_MESSAGE_TEMPLATE = gql`
  mutation DeleteEngagementMessageTemplate($id: Int!, $userId: Int!) {
    deleteEngagementMessageTemplate(id: $id, userId: $userId) {
      message
      statusCode
    }
  }
`
export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment(
    $leadId: Int!
    $startDate: DateTime!
    $endDate: DateTime!
    $summary: String!
    $description: String
    $appointmentTimezone: String!
    $discussedVoiId: Int
  ) {
    createAppointment(
      leadId: $leadId
      startDate: $startDate
      endDate: $endDate
      summary: $summary
      description: $description
      appointmentTimezone: $appointmentTimezone
      discussedVoiId: $discussedVoiId
    ) {
      appointment {
        id
      }
      ok
    }
  }
`
export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment(
    $appointmentId: Int!
    $startDate: DateTime!
    $endDate: DateTime!
    $summary: String!
    $description: String
    $appointmentTimezone: String!
    $status: String
    $discussedVoiId: Int
  ) {
    updateAppointment(
      appointmentId: $appointmentId
      startDate: $startDate
      endDate: $endDate
      summary: $summary
      description: $description
      appointmentTimezone: $appointmentTimezone
      appointmentStatus: $status
      discussedVoiId: $discussedVoiId
    ) {
      appointment {
        id
      }
      ok
    }
  }
`
export const RESCHEDULE_APPOINTMENT = gql`
  mutation rescheduleAppointment(
    $appointmentId: Int!
    $startDate: DateTime!
    $endDate: DateTime!
    $appointmentTimezone: String!
  ) {
    rescheduleAppointment(
      appointmentId: $appointmentId
      startDate: $startDate
      endDate: $endDate
      appointmentTimezone: $appointmentTimezone
    ) {
      appointment {
        id
        startDatetime
        endDatetime
        status
        appointmentStatus
      }
      statusCode
      message
    }
  }
`

export const UPDATE_LEAD_CONSENT = gql`
  mutation UpdateLeadConsentStatus($leadId: Int!) {
    updateLeadConsentStatus(id: $leadId) {
      ok
      lead {
        id
        textConsentDate
        textConsentStatus
      }
    }
  }
`

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($appointmentId: Int!) {
    deleteAppointment(appointmentId: $appointmentId) {
      ok
    }
  }
`

export const CREATE_LEAD_VEHICLES = gql`
  mutation createLeadVehicleOfInterests(
    $leadId: Int!
    $voiObject: [VehicleOfInterestObject]!
  ) {
    createLeadVehicleOfInterests(leadId: $leadId, voiObject: $voiObject) {
      ok
    }
  }
`

export const UPDATE_COMPANY_WORK_HOURS = gql`
  mutation updateWorkingHours(
    $companyId: Int!
    $inputWorkingHours: [WorkingHourInputs]!
  ) {
    updateWorkingHours(
      companyId: $companyId
      inputWorkingHours: $inputWorkingHours
    ) {
      statusCode
      message
      workingHours {
        id
        companyId
        weekDay
        isWorkingDay
        startTime
        endTime
      }
    }
  }
`
export const CREATE_CAMPANY_PHONE_BOT = gql`
  mutation CreateTwilioPhoneService(
    $phone: String!
    $serviceName: String!
    $type: String!
    $description: String
    $companyId: Int!
  ) {
    createTwilioPhoneService(
      phone: $phone
      serviceName: $serviceName
      phoneServiceType: $type
      description: $description
      companyId: $companyId
    ) {
      statusCode
      message
      twilioPhoneService {
        id
        companyId
        userId
        type
        serviceName
        description
        createdOn
        isActive
        user {
          id
          firstName
          lastName
          email
          phone
          companyId
        }
      }
    }
  }
`
export const UPDATE_CAMPANY_PHONE_BOT = gql`
  mutation UpdateTwilioPhoneService(
    $id: Int!
    $phone: String!
    $serviceName: String!
    $type: String!
    $description: String
    $isActive: Boolean
  ) {
    updateTwilioPhoneService(
      twilioPhoneServiceId: $id
      phone: $phone
      serviceName: $serviceName
      phoneServiceType: $type
      description: $description
      isActive: $isActive
    ) {
      statusCode
      message
      twilioPhoneService {
        id
        companyId
        userId
        type
        serviceName
        description
        createdOn
        isActive
        user {
          id
          firstName
          lastName
          email
          phone
          companyId
        }
      }
    }
  }
`

export const DELETE_PHONE_BOT = gql`
  mutation DeleteTwilioPhoneService($id: Int!) {
    deleteTwilioPhoneService(twilioPhoneServiceId: $id) {
      statusCode
      message
    }
  }
`
export const SAVE_LEAD_NOTE = gql`
  mutation SaveLeadNote($leadId: Int!, $note: String!) {
    saveLeadNote(leadId: $leadId, note: $note) {
      statusCode
      message
    }
  }
`

export const UPDATE_LEAD_CONVERSATION_STATUS = gql`
  mutation enableDisableLeadConversation(
    $leadId: Int!
    $disableConversation: Boolean!
  ) {
    enableDisableLeadConversation(
      leadId: $leadId
      disableConversation: $disableConversation
    ) {
      statusCode
      message
      lead {
        id
        conversationStatus {
          id
          userId
          disableConversation
          createdOn
        }
      }
    }
  }
`

export const CREATE_FCM_DEVICE = gql`
  mutation createFcmDevice($registrationId: String!) {
    createFcmDevice(registrationId: $registrationId) {
      statusCode
      message
    }
  }
`

export const DELETE_FCM_DEVICE = gql`
  mutation deleteFcmDevice($registrationId: String!) {
    deleteFcmDevice(registrationId: $registrationId) {
      statusCode
      message
    }
  }
`
export const UPDATE_COMPANY_NUDGE_SETTINGS = gql`
  mutation updateCompanyNudgeEvent(
    $companyId: Int!
    $companyNudgeEventInputs: [CompanyNudgeEventInputs]!
  ) {
    updateCompanyNudgeEvent(
      companyId: $companyId
      companyNudgeEventInputs: $companyNudgeEventInputs
    ) {
      statusCode
      message
      companyNudgeEvents {
        nudgeEvent {
          id
          code
          title
        }
        companyNudgeEvent {
          id
          nudgeEventId
          startDelay
          startDelayType
          frequency
          frequencyType
          firstTemplateText
          reminderTemplateText
          isSms
          isWebPush
          isActive
        }
      }
    }
  }
`



export const CREATE_REVIEW = gql`
  mutation CreateReview($email: String!, $head: String!, $body: String!, $company: Int!, $_type: String) {
    createReview(email: $email, head: $head, body: $body, company: $company, Type: $_type) {
      ok
    }
  }
`

// export const CREATE_REVIEW_MESSAGE = gql`
//   mutation CreateReviewMessage($to: String!, $body: String!) {
//     createReviewMessage(to: $to, body: $body) {
//       statusCode
//       message
//     }
//   }
// `


export const CREATE_REVIEW_TEMPLATE = gql`
  mutation CreateReviewTemplate($image: String!) {
    createReviewTemplate(image: $image) {
      statusCode
      message
    }
  }
`


export const CREATE_MMS_MESSAGE = gql`
  mutation CreateMmsMessage(
    $leadId: Int!
    $userId: Int!
    $channelId: Int
    $campaignId: Int
    $campaignTemplateId: Int
    $direction: String
    $content: String!
    $toPhone: String!
    $imageUrl: String!
  ) {
    createMmsMessage(
      leadId: $leadId
      userId: $userId
      channelId: $channelId
      campaignId: $campaignId
      campaignTemplateId: $campaignTemplateId
      direction: $direction
      content: $content
      toPhone: $toPhone
      imageUrl: $imageUrl
    ) {
      statusCode
      message
      leadMessage {
        id
        systemUserId
        leadId
        userId
        channelId
        campaignId
        campaignTemplateId
        direction
        dateSent
        dateReceived
        content
        messageLog {
          id
          fromPhone
          toPhone
        }
      }
    }
  }
`
