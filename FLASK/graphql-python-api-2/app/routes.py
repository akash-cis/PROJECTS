from flask import Blueprint, request, jsonify
from ariadne.constants import PLAYGROUND_HTML
from ariadne import load_schema_from_path, make_executable_schema, snake_case_fallback_resolvers, ObjectType, graphql_sync
from .queries import createpost_resolver, getpost_resolver, listposts_resolver, updatepost_resolver, deletepost_resolver

query = ObjectType("Query")
mutation = ObjectType("Mutation")
query.set_field('getPost', getpost_resolver)
query.set_field('listPosts', listposts_resolver)
mutation.set_field('createPost', createpost_resolver)
mutation.set_field('updatePost', updatepost_resolver)
mutation.set_field('deletePost', deletepost_resolver)

type_defs = load_schema_from_path('schema.graphql')
schema = make_executable_schema(type_defs, query, mutation, snake_case_fallback_resolvers )


main = Blueprint('main', __name__)

@main.route('/')
def index():
    return 'hello'


@main.route('/graphql', methods=['GET'])
def graphql_playground():
    return PLAYGROUND_HTML, 200


@main.route('/graphql', methods=['POST'])
def graphql_server():
    data = request.get_json()
    success, result = graphql_sync(
        schema=schema,
        data=data,
        context_value=request,
        debug=True,
    )
    status_code = 200 if success else 400
    return jsonify(result), status_code