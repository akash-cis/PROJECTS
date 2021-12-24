import os
import json
import requests
# import config

host = os.getenv('LABELLINGAPI_HOST')

# client = GraphQLClient(host)
# def execute_prediction_update:
#     query = """
#         mutation UpdatePredictionReview(
#         $postId: String!,
#         $review: Boolean) {
#             updatePredictionReview(
#             postId: $postId, 
#             review: $review) {
#                 ok
#             }
#         }
#     """
#     variables = {'postId': post_id, 'review': review}
#     client.execute(query, variables)


def make_query(query, variables):
    headers = None
    """
    Make query response
    """
    response = requests.post(host, json={'query': query, 'variables': variables}, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception("Query failed to run by returning code of {}. {}".format(response.status_code, query))


def execute_prediction_update(post_id, review, webapp_reviewer_id):

    query = """
        mutation UpdatePredictionReview(
        $postId: String!,
        $review: Boolean,
        $webappReviewerId: Int
        ) {
            updatePredictionReview(
            postId: $postId, 
            review: $review,
            webappReviewerId: $webappReviewerId
            ) {
                ok
            }
        }
    """
    variables = {'postId': post_id, 'review': review, 'webappReviewerId': webapp_reviewer_id}
    res = make_query(query, variables)
    return res.get('data').get('updatePredictionReview').get('ok')


def create_company_source(company_name, company_id):
    query = """
        mutation CreateCompanySource($name: String!, $companyId: Int!) {
            createCompanySource(name: $name, companyId: $companyId) {
                ok
                sourceId
            }
        }
    """

    variables = {'name': company_name, 'companyId': company_id}
    res = make_query(query, variables)
    return res.get('data').get('createCompanySource').get('sourceId') if res.get('data').get('createCompanySource').get('ok') else None
