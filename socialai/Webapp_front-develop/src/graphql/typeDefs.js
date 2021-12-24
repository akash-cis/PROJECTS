import gql from "graphql-tag"

export default gql`
  extend type Mutation {
    updateProfileData(id: Int!): Boolean
  }
`
