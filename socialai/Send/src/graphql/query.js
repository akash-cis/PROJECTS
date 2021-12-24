import gql from "graphql-tag"

export const GET_POSTS = gql`
  query GetPosts(
    $older: DateTime
    $newer: DateTime
    $range: Int
    $hideViewed: Boolean
  ) {
    getPosts(
      older: $older
      newer: $newer
      range: $range
      hideViewed: $hideViewed
    ) {
      data {
        id
        body
        url
        author
        authorProfileUrl
        location
        timestamp
        source
        status
        sourceType
        sourceId
        sourceUrl
        tags
        threadTitle
        review
      }
      count
    }
  }
`

export const GET_CURRENT_USER = gql`
  {
    me {
      id
      firstName
      lastName
      fullName
      phone
      company {
        id
        timezone
        isOptinConsentMethod
      }
      userAccounts {
        company {
          id
          name
          timezone
          isOptinConsentMethod
        }
      }
    }
  }
`

export const GET_CURRENT_USER_COMPANY_USERS = gql`
  {
    me {
      id
      firstName
      lastName
      fullName
      email
      phone
      company {
        id
        users {
          id
          firstName
          lastName
          fullName
          email
          isDisabled
          phone
        }
      }
    }
  }
`

export const GET_CURRENT_USER_COMPANY_TEAMS = gql`
  {
    getTeams {
      id
      name
      leaderId
      status
      leader {
        id
        fullName
      }
      members {
        memberId
        member {
          id
          fullName
        }
      }
    }
  }
`

export const GET_ALL_USERS = gql`
  query getUsers(
    $page: Int
    $pageSize: Int
    $search: String
    $companyId: Int!
  ) {
    getUsers(
      page: $page
      pageSize: $pageSize
      search: $search
      companyId: $companyId
    ) {
      data {
        companyId
        id
        firstName
        lastName
        fullName
        email
        isDisabled
        status
        phone
        userAccounts {
          id
          userId
          companyId
          isDisabled
          company {
            id
          }
        }
        role {
          id
          name
          canViewAutoAnalytics
          canViewAdExport
        }
      }
      count
    }
  }
`

export const GET_ALL_TEAMS = gql`
  query getTeams(
    $page: Int
    $pageSize: Int
    $search: String
    $companyId: Int!
  ) {
    getTeams(
      page: $page
      pageSize: $pageSize
      search: $search
      companyId: $companyId
    ) {
      data {
        id
        name
        leaderId
        status
        leader {
          id
          fullName
        }
        members {
          memberId
          member {
            id
            fullName
          }
        }
      }
      count
    }
  }
`

export const GET_ALL_ROLES = gql`
  query roles($companyId: Int!) {
    roles(companyId: $companyId) {
      id
      name
      canCreateUsers
      canCreateTeams
      canViewProspects
      isCompanyAdmin
      canViewAutoAnalytics
      canViewAdExport
      canViewClm
      canViewGle
      canViewEngagements
    }
  }
`

export const GET_USER_FILTERS = gql`
  {
    me {
      id
      filters {
        id
        type
        typeName
        value
        companyFilterId
        setType
      }
      filterSets {
        userId
        name
        setType
        id
      }
      responseTemplates {
        id
        message
        isInitialResponse
      }
    }
  }
`

export const GET_DISPLAY_FILTERS = gql`
  {
    getUserDisplayFilters {
      id
      type
      typeName
      value
      selectionOption {
        id
        value
        query
      }
    }
  }
`

export const ALL_EVENTS = gql`
  {
    allEvents {
      duration
      edges {
        node {
          id
        }
      }
    }
  }
`

export const GET_SAVED_POSTS = gql`
  query getSavedPosts($setType: String) {
    getSavedPosts(setType: $setType) {
      id
      userId
      companyId
      aingineDataId
      status
      post {
        id
        body
        url
        author
        authorProfileUrl
        location
        timestamp
        source
        status
        sourceId
        sourceUrl
        sourceType
        tags
        review
      }
    }
  }
`

export const GET_DEALS = gql`
  query GetDeals(
    $status: String
    $orderBy: String
    $orderDirection: String
    $postType: String
  ) {
    getDeals(
      status: $status
      postType: $postType
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      userId
      salesPerson {
        fullName
        id
      }
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
      tags
      allowNotifications
      conversations {
        id
        type
        message
        postTime
        aingineUserId
        aingineDataId
      }
      postType
    }
  }
`

export const GET_COMPANIES = gql`
  {
    getCompanies {
      id
      name
      address
      city
      state
      postalCode
      country
      phone
      userCount
      dateCreated
      isDisabled
      timezone
      locationLink
      facebookLink
      googleLink
      isOptinConsentMethod
    }
  }
`

export const GET_COMPANY = gql`
  query GetCompany($id: Int!) {
    company(id: $id) {
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
      userCount
      dateCreated
      isDisabled
      timezone
      locationLink
      facebookLink
      googleLink
      isOptinConsentMethod
    }
  }
`

export const GET_MY_COMPANY = gql`
  query GetMyCompany {
    me {
      id

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
        userCount
        dateCreated
        isDisabled
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

export const GET_COMPANY_USERS = gql`
  query GetCompanyUsers($id: Int!) {
    company(id: $id) {
      id
      name
      users {
        id
        fullName
        phone
      }
      userAccounts {
        isDisabled
        user {
          id
          fullName
          userRoles {
            id
            companyId
            roleId
            role {
              id
              name
            }
            company {
              id
              name
              timezone
              locationLink
              facebookLink
              googleLink
              isOptinConsentMethod
            }
          }
          firstName
          lastName
          email
          phone
          isDisabled
          dateCreated
          status
          responseTemplates {
            id
            message
            isInitialResponse
          }
          role {
            id
            name
          }
        }
      }
    }
  }
`

export const GET_FILTER_TYPES = gql`
  query GetFilterTypes {
    getFilterTypes {
      id
      type
      name
      filterField
      optionsCount
      selectionOptions {
        id
        value
        query
      }
    }
  }
`

export const FILTER_TYPE = gql`
  query FilterType($id: Int!) {
    filterType(id: $id) {
      selectionOptions {
        id
        value
        query
      }
    }
  }
`

export const GET_COMPANY_FILTERS = gql`
  query GetCompanyFilters($id: Int!) {
    company(id: $id) {
      filters {
        id
        value
        type
        typeName
        filterField
        userCanChange
        selectionOption {
          id
        }
      }
    }
  }
`

export const SEARCH_COMPANIES = gql`
  query SearchCompanyByName($name: String!) {
    searchCompanyByName(name: $name) {
      id
      name
      address
      city
      state
      postalCode
      country
      phone
      userCount
      dateCreated
      isDisabled
      timezone
      locationLink
      facebookLink
      googleLink
    }
  }
`

export const USER_FILTERS_BY_ID = gql`
  query GetUserFilters($id: Int!) {
    user(id: $id) {
      filters {
        id
        type
        typeName
        value
        setType
      }
    }
  }
`

export const ROLES = gql`
  query Roles($companyId: Int) {
    roles(companyId: $companyId) {
      id
      name
      canCreateUsers
      canCreateTeams
      canViewProspects
      isCompanyAdmin
      canViewAutoAnalytics
      canViewAdExport
      canViewClm
      canViewGle
      canViewEngagements
    }
  }
`

// TODO: add id ?
export const SCREEN_NAME_CHECK = gql`
  query ScreenNameCheck($sourceId: Int!) {
    screenNameCheck(sourceId: $sourceId) {
      hasScreenName
      screenName {
        id
        screenName
      }
    }
  }
`

export const GET_CRM_INTEGRATION = gql`
  query GetCrmIntegration($companyId: Int!) {
    crmIntegration: crmIntegrationByCompany(companyId: $companyId) {
      id
      companyId
      integrationType
      adfEmail
      crmDealerId
      vsLeadSourceId
    }
  }
`

export const GET_USER_TEAM = gql`
  query GetUserTeam {
    me {
      id
      teamsLeader {
        members {
          member {
            firstName
            lastName
            fullName
            id
          }
        }
      }
      isCompanyAdmin
      isDisabled
      company {
        id
        userAccounts {
          isDisabled
          user {
            firstName
            lastName
            fullName
            id
          }
        }
      }
    }
  }
`

export const SEARCH_DEALS = gql`
  query SearvhDeals($searchTerm: String!) {
    searchDeals(searchTerm: $searchTerm) {
      id
      userId
      salesPerson {
        fullName
        id
      }
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
      tags
      allowNotifications
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
`

// TODO: add id ?
export const GET_ANALYTICS_KPIS = gql`
  query GetAnalyticsKpis($range: Int!, $teamId: Int!, $allMembers: Boolean) {
    getAnalyticsKpis(range: $range, allMembers: $allMembers) {
      date
      userId
      status
      count
      source
      userName
    }
    team(id: $teamId) {
      members {
        member {
          id
          fullName
        }
      }
    }
  }
`

export const GET_USER_SCREENNAMES = gql`
  query GetUserScreenNames {
    me {
      id
      screenNames {
        id
        source
        sourceId
        screenName
        sourceUrl
      }
    }
  }
`

export const GET_SOURCES = gql`
  query GetSources {
    getSources {
      source
      sourceId
      sourceUrl
    }
  }
`

export const GET_USER_RESPONSE_TEMPLATES = gql`
  query GetUserResponseTemplates {
    me {
      id
      responseTemplates {
        id
        message
        isInitialResponse
      }
    }
  }
`

// TODO: add id ?
export const GET_APP_USAGE_ALL = gql`
  query getAppUsage {
    getAnalyticsAppUsage {
      date
      time
      userName
      converted
      provided
      engaged
      crm
    }
  }
`

// TODO: add id ?
export const GET_APP_USAGE = gql`
  query getAppUsage {
    getAnalyticsAppUsage {
      date
      time
      userName
    }
  }
`

// TODO: add id ?
export const GET_ANALYTICS_POSTS = gql`
  query getAnalyticsPosts($range: Int) {
    getAnalyticsPosts(range: $range) {
      timestamp
      count
    }
  }
`

// TODO: add id ?
export const GET_ANALYTICS_CATEGORIES = gql`
  query getAnalyticsCategories($range: Int) {
    getAnalyticsCategories(range: $range) {
      name
      total
      children {
        name
        count
      }
    }
  }
`

export const GET_NOTIFICATIONS = gql`
  query getNotifications($older: DateTime) {
    getNotifications(older: $older) {
      id
      date
      notificationType
      text
      read
    }
  }
`

export const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  {
    getUnreadNotificationsCount
  }
`

export const GET_EXPORT_CONFIGS = gql`
  query getExportConfigs {
    getExportConfigs {
      id
      userId
      user {
        firstName
        lastName
      }
      name
      email
      minimumCount
      frequency
      count
      lastExported
      filters {
        typeName
        value
        type
      }
      timezone
    }
  }
`

export const GET_EXPORT_CONFIG = gql`
  query exportConfig($id: Int!) {
    exportConfig(id: $id) {
      id
      userId
      name
      email
      minimumCount
      frequency
      count
      lastExported
      emailTime
      filters {
        id
        type
        typeName
        value
        companyFilterId
        setType
      }
      timezone
    }
  }
`

export const GET_EXPORTS = gql`
  query getExports {
    getExports {
      id
      name
      createdAt
      count
      exportConfig {
        userId
        user {
          firstName
          lastName
        }
        name
        adHoc
        email
        minimumCount
        count
        lastExported
        filters {
          type
          typeName
          value
        }
      }
    }
  }
`

export const GET_ALL_PERSONS = gql`
  query allPersons($sourceId: Int) {
    allPersons(sourceId: $sourceId) {
      id
      fullName
      emails {
        address
      }
      phoneNumbers {
        number
      }
      addresses {
        line1
      }
    }
  }
`

export const GET_PAGINATED_PERSONS = gql`
  query paginatedPersons(
    $sourceId: Int
    $page: Int
    $pageSize: Int
    $search: String
    $orderBy: String
    $orderDirection: String
  ) {
    paginatedPersons(
      sourceId: $sourceId
      page: $page
      pageSize: $pageSize
      search: $search
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      data {
        id
        fullName
        emails {
          address
        }
        phoneNumbers {
          number
        }
        addresses {
          line1
        }
      }
      count
    }
  }
`

export const GET_PERSON = gql`
  query person($id: Int!) {
    person(id: $id) {
      id
      firstName
      lastName
      dob
      addresses {
        id
        type
        current
        line1
        line2
        locality
        region
        country
        latitude
        longitude
        location
        postalCode
      }
      emails {
        id
        type
        address
      }
      phoneNumbers {
        id
        type
        number
      }
      languages {
        id
        language
      }
      education {
        id
        schoolName
        level
        degree
        startDate
        endDate
        location
        description
      }
      experience {
        id
        title
        company
        startDate
        endDate
        location
        description
      }
      certificates {
        id
        type
        title
        issuingAuthority
        date
      }
      volunteering {
        id
        role
        location
        dateStart
        dateEnd
        cause
        description
      }
      skills {
        id
        name
        strength
      }
      accomplishments {
        id
        type
        title
        url
        description
      }
      publications {
        id
        name
        publisher
        date
        url
      }
      awards {
        id
        name
        location
        date
        description
      }
      interests {
        id
        type
        name
        url
      }
      possessions {
        id
        type
        name
      }
      accounts {
        account {
          id
          profileUrl
          username
          location
          about
          source {
            id
            name
          }
        }
      }
    }
  }
`

export const GET_LIFE_EVENTS_POSTS = gql`
  query GetLifeEventsPosts(
    $older: DateTime
    $newer: DateTime
    $range: Int
    $globalEvents: Boolean
  ) {
    getLifeEventsPosts(
      older: $older
      newer: $newer
      range: $range
      globalEvents: $globalEvents
    ) {
      data {
        id
        body
        url
        author
        authorProfileUrl
        location
        timestamp
        source
        status
        sourceType
        sourceId
        sourceUrl
        tags
        threadTitle
        review
        personId
        personFullName
      }
      count
    }
  }
`

// TODO: add id ?
export const GET_PERSON_DESCRIPTOR = gql`
  {
    personDescriptor {
      modelName
      fields {
        name
        nullable
        type
        options
      }
    }
  }
`

export const ALL_UNIQUE_SOURCES = gql`
  query AllUniqueSources($exclude: [String]) {
    allUniqueSources(exclude: $exclude) {
      sourceType
      id
    }
  }
`

export const GET_USER_BY_ID = gql`
  query getUserByEmail($email: String!) {
    getUserByEmail(email: $email) {
      email
      id
      fullName
      userAccounts {
        id
        userId
        companyId
      }
      userRoles {
        roleId
        userId
        id
      }
    }
  }
`

export const GET_EVAL_TERMS = gql`
  {
    getEvalTerms {
      id
      text
      include
      exclude
      intent
    }
  }
`

export const GET_PAGINATED_LEADS = gql`
  query getLeads(
    $source: [String]
    $sourceOriginal: [String]
    $combinedSource: [String]
    $page: Int
    $pageSize: Int
    $search: String
    $orderBy: String
    $orderDirection: String
    $voi: [String]
    $campaignId: Int
    $status: String
    $leadStatusTypes: [Int]
  ) {
    getLeads(
      source: $source
      sourceOriginal: $sourceOriginal
      combinedSource: $combinedSource
      page: $page
      pageSize: $pageSize
      search: $search
      orderBy: $orderBy
      orderDirection: $orderDirection
      voi: $voi
      campaignId: $campaignId
      status: $status
      leadStatusTypes: $leadStatusTypes
    ) {
      data {
        id
        fullName
        firstName
        lastName
        companyId
        leadSourceType
        leadSourceOriginalId
        dateOfBirth
        leadCreatedDate
        emailConsent
        textConsent
        textConsentDate
        textConsentStatus
        status
        otherSource
        unreadCount

        leadStatusType {
          id
          type
          status
        }
        emails {
          id
          email
          emailType
        }
        phoneNumbers {
          id
          phone
          phoneType
        }
        addresses {
          id
          addressLine1
          addressLine2
          city
          state
          postalCode
          country
        }
        vehicleOfInterest {
          id
          make
          model
          year
          trim
          isCurrent
          customerInterest
          isPrimary
        }
        messages {
          id
          dateSent
          dateReceived
          messageStatus
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
        activeAppointment {
          id
          startDatetime
        }
        consentExpireDay
        conversationStatus {
          id
          userId
          disableConversation
          createdOn
        }
      }
      count
    }
  }
`
export const GET_LEAD = gql`
  query lead($id: Int!) {
    lead(id: $id) {
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
      disableConversation
      leadStatusType {
        id
        type
        status
      }
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
        customerInterest
        isCurrent
        isPrimary
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
`

export const GET_LEAD_DESCRIPTOR = gql`
  {
    leadDescriptor {
      modelName
      fields {
        name
        nullable
        type
        options
      }
    }
  }
`

export const GET_LEAD_SOURCES = gql`
  {
    leadSources {
      id
      name
      isSource
    }
  }
`
export const GET_ALL_CAMPAIGNS = gql`
  {
    campaigns {
      id
      name
      isDisabled
    }
  }
`
export const GET_CAMPAIGN_PAGINATED_LIST = gql`
  query getCampaigns(
    $page: Int
    $pageSize: Int
    $companyId: Int
    $status: String
  ) {
    getCampaigns(
      page: $page
      pageSize: $pageSize
      companyId: $companyId
      activeInd: $status
    ) {
      data {
        id
        name
        startDate
        endDate
        method
        textMessage
        activeInd
        dateCreated
        isDisabled
        isPrioritize
        campaignSelections {
          id
          type
          value
          campaignId
        }
        campaignTemplates {
          id
          scheduleId
          sourceId
          templateText
          activeInd
          isAfterHour
          afterHourTemplateText
          campaignSchedules {
            id
            type
            numericValue
            temporalValue
            sortOrder
            title
          }
        }
        campaignSchedules {
          id
          type
          numericValue
          temporalValue
          title
          sortOrder
        }
        user {
          id
          fullName
          firstName
          lastName
        }
      }
      count
      leadMessageCount {
        campaignId
        totalSent
        totalDelivered
        totalResponded
        totalUncontacted
      }
    }
  }
`

export const GET_CAMPAIGN_DETAILS = gql`
  query campaign($id: Int!) {
    campaign(id: $id) {
      id
      name
      startDate
      endDate
      method
      textMessage
      isPrioritize
      activeInd
      campaignSelections {
        id
        type
        value
      }
      campaignSchedules {
        id
        type
        numericValue
        temporalValue
        title
        sortOrder
        campaignTemplates {
          id
          scheduleId
          sourceId
          templateText
          activeInd
          isAfterHour
          afterHourTemplateText
        }
      }
      campaignTemplates {
        id
        scheduleId
        sourceId
        templateText
        activeInd
        isAfterHour
        afterHourTemplateText
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
  }
`
export const GET_ALL_CAMPAIGN_TEMPLATES = gql`
  query getCampaignTemplates(
    $page: Int
    $pageSize: Int
    $search: String
    $campaignId: Int!
    $sourceId: Int
    $scheduleId: Int
  ) {
    getCampaignTemplates(
      page: $page
      pageSize: $pageSize
      search: $search
      campaignId: $campaignId
      sourceId: $sourceId
      scheduleId: $scheduleId
    ) {
      data {
        campaignId
        id
        sourceId
        scheduleId
        templateText
        activeInd
        isAfterHour
        afterHourTemplateText
        campaignSchedules {
          id
          type
          numericValue
          temporalValue
          title
          sortOrder
        }
        leadSource {
          id
          name
        }
      }
      count
    }
  }
`
export const GET_CAMPAIGN_SCHEDULES = gql`
  query campaignSchedules($campaignId: Int!) {
    campaignSchedules(campaignId: $campaignId) {
      id
      type
      numericValue
      temporalValue
      title
      sortOrder
      campaignTemplates {
        id
        scheduleId
        sourceId
        templateText
        activeInd
        afterHourTemplateText
        isAfterHour
      }
    }
  }
`
export const GET_MESSAGES = gql`
  query messages($leadId: Int!, $page: Int, $pageSize: Int) {
    messages(leadId: $leadId, page: $page, pageSize: $pageSize) {
      data {
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
          messageId
          toPhone
          fromPhone
        }
      }
      count
      lastId
      isRefresh
    }
  }
`

export const GET_CHANNEL = gql`
  query channel($id: Int!) {
    channel(id: $id) {
      id
      name
      channelType
    }
  }
`

export const GET_MESSAGE_LOG = gql`
  query messageLog($id: Int!) {
    messageLog(id: $id) {
      id
      messageId
      fromPhone
      toPhone
    }
  }
`

export const GET_COMPANY_USER_BY_ID = gql`
  query companyUserById($id: Int!) {
    companyUserById(id: $id) {
      id
      fullName
      firstName
    }
  }
`

export const GET_SYSTEM_USER = gql`
  {
    systemUser {
      phone
    }
  }
`

export const GET_ALL_VEHICLE_OF_INTEREST = gql`
  query getAllVoi(
    $source: [String]
    $sourceOriginal: [String]
    $combinedSource: [String]
    $page: Int
    $pageSize: Int
    $search: String
  ) {
    getAllVoi(
      source: $source
      sourceOriginal: $sourceOriginal
      combinedSource: $combinedSource
      page: $page
      pageSize: $pageSize
      search: $search
    )
  }
`

export const GET_SOURCES_FROM_LEADS = gql`
  {
    getAllSourceOriginal
  }
`

export const GET_LEADS_COUNT_BY_CAMPAIGN = gql`
  query getLeads(
    $source: [String]
    $sourceOriginal: [String]
    $combinedSource: [String]
    $page: Int
    $pageSize: Int
    $search: String
    $orderBy: String
    $orderDirection: String
    $voi: [String]
    $campaignId: Int
    $leadStatusTypes: [Int]
  ) {
    getLeads(
      source: $source
      sourceOriginal: $sourceOriginal
      combinedSource: $combinedSource
      page: $page
      pageSize: $pageSize
      search: $search
      orderBy: $orderBy
      orderDirection: $orderDirection
      voi: $voi
      campaignId: $campaignId
      leadStatusTypes: $leadStatusTypes
    ) {
      count
    }
  }
`

export const GET_CAMPAIGN_LEAD_SUMMARY = gql`
  query getCampaignLeadSummary(
    $campaignId: Int
    $leadId: Int
    $attempt: [String]
    $status: [String]
    $search: String
    $page: Int
    $pageSize: Int
    $orderBy: String
    $orderDirection: String
  ) {
    getCampaignLeadSummary(
      campaignId: $campaignId
      leadId: $leadId
      attempt: $attempt
      status: $status
      search: $search
      page: $page
      pageSize: $pageSize
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      data {
        id
        campaignId
        leadId
        lastMessageSentDate
        lastMessageReceivedDate
        numAttemptsBeforeResponse
        status
        lead {
          id
          fullName
          firstName
          lastName
        }
      }
      count
      leadMessageCount {
        campaignId
        totalSent
        totalDelivered
        totalResponded
        totalUncontacted
        responseRate
        optOutRate
        totalEngaged
        avgAttemptsBeforeResponse
      }
    }
  }
`

export const GET_ENGAGEMENT_ANALYTICS = gql`
  query getEngagementAnalytics($range: Int) {
    getEngagementAnalytics(range: $range) {
      count
      status
      date
      attempts
    }
  }
`

export const GET_ENGAGEMENT_LEADS_ANALYTICS = gql`
  query getEngagementLeadAnalytics($range: Int) {
    getEngagementLeadAnalytics(range: $range) {
      count
      status
      date
      source
    }
  }
`

export const GET_LEADS_ANALYTICS = gql`
  query getLeadAnalytics($range: Int) {
    getLeadAnalytics(range: $range) {
      count
      source
    }
  }
`

export const GET_APPOINTMENT_SOURCE = gql`
  query getAppointmentSource($range: Int) {
    getAppointmentSource(range: $range) {
      count
      source
    }
  }
`

export const GET_APPOINTMENT_SALESPERSON = gql`
  query getAppointmentSalesperson($range: Int) {
    getAppointmentSalesperson(range: $range) {
      count
      userName
    }
  }
`

export const GET_CRM_USERS = gql`
  {
    getCrmUsers {
      id
      userName
    }
  }
`
export const GET_VIN_CRM_USER = gql`
  query getVinCrmUser($crmIntegrationId: Int!, $userId: Int!) {
    getVinCrmUser(crmIntegrationId: $crmIntegrationId, userId: $userId) {
      id
      userId
      vsUserId
      crmIntegrationId
    }
  }
`
export const GET_ENGAGEMENT_MESSAGE_TEMPLATES = gql`
  query engagementMessageTemplates(
    $companyId: Int
    $userId: Int
    $isActive: Boolean
    $templateType: String!
  ) {
    engagementMessageTemplates(
      companyId: $companyId
      userId: $userId
      isActive: $isActive
      templateType: $templateType
    ) {
      id
      title
      message
      userId
      companyId
      isActive
      isCompanyShared
    }
  }
`
export const GET_USER_APPOINTMENTS = gql`
  query getUserAppointment(
    $userId: Int!
    $page: Int
    $pageSize: Int
    $search: String
    $orderBy: String
    $orderDirection: String
    $startDate: Date
    $endDate: Date
    $companyId: Int
    $appointmentStatus: [String]
    $leadId: Int
  ) {
    getUserAppointment(
      userId: $userId
      page: $page
      pageSize: $pageSize
      search: $search
      orderBy: $orderBy
      orderDirection: $orderDirection
      startDate: $startDate
      endDate: $endDate
      companyId: $companyId
      appointmentStatus: $appointmentStatus
      leadId: $leadId
    ) {
      data {
        id
        companyId
        leadId
        startDatetime
        endDatetime
        uid
        description
        location
        sequence
        status
        summary
        leadEmail
        leadPhone
        timezone
        appointmentStatus
        isConfirmed
        discussedVoiId
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
          disableConversation
          leadStatusType {
            id
            type
            status
          }
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
            customerInterest
            isCurrent
            isPrimary
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
      count
    }
  }
`
export const GET_LEAD_APPOINTMENTS = gql`
  query getLeadAppointment(
    $leadId: Int!
    $page: Int
    $pageSize: Int
    $search: String
    $orderBy: String
    $orderDirection: String
    $startDate: Date
    $endDate: Date
  ) {
    getLeadAppointment(
      leadId: $leadId
      page: $page
      pageSize: $pageSize
      search: $search
      orderBy: $orderBy
      orderDirection: $orderDirection
      startDate: $startDate
      endDate: $endDate
    ) {
      data {
        id
        startDatetime
        endDatetime
        uid
        description
        location
        sequence
        status
        summary
        leadEmail
        leadPhone
        timezone
        appointmentStatus
        isConfirmed
        lead {
          id
          fullName
          firstName
          lastName
        }
      }
      count
    }
  }
`
export const GET_APPOINTMENT_ANALYSIS = gql`
  query getAppointmentAnalysis($range: Int) {
    getAppointmentAnalysis(range: $range) {
      title
      count
      prevCount
      growthRate
    }
  }
`
export const GET_APPOINTMENTS_BY_SOURCE = gql`
  query getAppointmentSource($range: Int) {
    getAppointmentSource(range: $range) {
      count
      source
    }
  }
`
export const GET_APPOINTMENTS_BY_SALES_PERSON = gql`
  query getAppointmentSalesperson($range: Int) {
    getAppointmentSalesperson(range: $range) {
      count
      userName
    }
  }
`
export const GET_COMPANY_WORK_HOURS = gql`
  query getCompanyWorkingHours($companyId: Int!) {
    getCompanyWorkingHours(companyId: $companyId) {
      id
      companyId
      weekDay
      isWorkingDay
      startTime
      endTime
    }
  }
`

export const GET_LEAD_COUNT_BY_STATUS = gql`
  {
    leadsByStatus {
      count
      status
    }
  }
`

export const GET_COMPANY_PHONE_BOTS = gql`
  query getTwilioPhoneServices($companyId: Int!) {
    getTwilioPhoneServices(companyId: $companyId) {
      data {
        id
        companyId
        userId
        type
        serviceName
        description
        isActive
        user {
          id
          email
          firstName
          lastName
          phone
        }
      }
      count
      message
      statusCode
    }
  }
`

export const GET_LEAD_STATUS_TYPES = gql`
  {
    leadStatusTypes {
      id
      status
      type
    }
  }
`
export const GET_ALL_VEHICLES = gql`
  {
    vehicleOfInterest {
      id
      year
      model
      make
      isCurrent
      isPrimary
    }
  }
`

export const GET_VEHICLE_MAKES = gql`
  query getVehicleMakes($search: String) {
    getVehicleMakes(search: $search) {
      data {
        MakeId
        MakeName
      }
      count
    }
  }
`
export const GET_VEHICLE_MODELS = gql`
  query getVehicleModels($makeName: String!, $year: Int!, $search: String) {
    getVehicleModels(makeName: $makeName, year: $year, search: $search) {
      data {
        ModelId
        ModelName
        VehicleTypeName
      }
      count
    }
  }
`
export const GET_APPOINTMENTS_FOR_CUSTOMER = gql`
  query getLeadAppointmentDetails($appointmentId: String!) {
    getLeadAppointmentDetails(appointmentId: $appointmentId) {
      appointment {
        id
        startDatetime
        lead {
          id
          fullName
          firstName
          lastName
        }
      }
      workingHours {
        id
        weekDay
        isWorkingDay
        startTime
        endTime
      }
      activeAppointments {
        id
        startDatetime
        endDatetime
        status
        leadId
        appointmentStatus
      }
      company {
        id
        profilePic
        name
      }

      statusCode
      message
    }
  }
`
export const GET_CAMPAIGN_BY_LEAD = gql`
  query getCampaignByLead($leadId: Int!, $page: Int, $pageSize: Int) {
    getCampaignByLead(leadId: $leadId, page: $page, pageSize: $pageSize) {
      data {
        id
        name
        startDate
        endDate
        method
        textMessage
        activeInd
        dateCreated
        isDisabled
        isPrioritize
        campaignSelections {
          id
          type
          value
          campaignId
        }
        campaignTemplates {
          id
          scheduleId
          sourceId
          templateText
          activeInd
          isAfterHour
          afterHourTemplateText
          campaignSchedules {
            id
            type
            numericValue
            temporalValue
            sortOrder
            title
          }
        }
        campaignSchedules {
          id
          type
          numericValue
          temporalValue
          title
          sortOrder
        }
        user {
          id
          fullName
          firstName
          lastName
        }
      }
      count
    }
  }
`
export const GET_CAMPAIGN_NUDGE_EVENT = gql`
  query getCompanyNudgeEvent($companyId: Int!) {
    getCompanyNudgeEvent(companyId: $companyId) {
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
`

export const GET_PAGINATED_REVIEW_MESSAGE_TEMPLATE = gql`
  query GetPaginatedReviewMessageTemplate {
    getPaginatedReviewMessageTemplate(companyId:1, userId:2){
      data {
        fileName
        fileLocation
        fullFilePath
      }
      count
    }
  }
`