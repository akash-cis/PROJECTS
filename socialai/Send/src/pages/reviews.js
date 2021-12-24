import React from "react"
import UserRoleProtected from "./../components/userRoleProtected"
import NoPermissionAlert from "./no-permission"
import { ReviewsLayout } from "../components/reviews/reviewsLayout"
import { Router } from "@reach/router"

const ReviewsPage = ({ location, authData }) => {
    return (
        <UserRoleProtected
          component={Router}
          userRole={"canViewEngagements"}
          basepath="/reviews"
          defaultComponent={NoPermissionAlert}
        >
          <ReviewsLayout location={location} path="/" />
        </UserRoleProtected>
      )
    }
    
export default ReviewsPage
   