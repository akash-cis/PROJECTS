import gql from "graphql-tag"
import { GET_PERSON } from "./query"

const resolvers = {
  Mutation: {
    updatePredictionReview: (_root, variables, { cache, getCacheKey }) => {
      const id = getCacheKey({ __typename: "Post", id: variables.id })
      const fragment = gql`
        fragment updateReview on Post {
          review
        }
      `
      const todo = cache.readFragment({ fragment, id })
      const data = { ...todo, review: variables.review }
      cache.writeData({ id, data })
      return null
    },
    updateProfileData: (_, { id }, { cache }) => {
      const queryResult = cache.readQuery({
        query: GET_PERSON,
        variables: { id },
      })

      if (queryResult) {
        const { person } = queryResult
        const data = { person: { ...person, emails: [] } }
        cache.writeQuery({ query: GET_PERSON, variables: { id }, data })
        return true
      }
      return false
    },
  },
}

export default resolvers
