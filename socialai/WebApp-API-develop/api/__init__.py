from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_graphql import GraphQLView
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
import os

expose_graphiql = os.getenv('FLASK_ENV') == 'development'
origin = os.getenv('CORS_ORIGIN', 'http://localhost:8000')

app = Flask(__name__)
app.config.from_pyfile('../config.py')

socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")

cors = CORS(
    app,
    resources={
        r"/graphql": {"origins": origin},
        r"/life-event/import": {"origins": origin},
        r"/review-template/upload": {"origins": origin},
        r"/receive-sms":  {"origins": origin},
        r"/lead_graphql/*": {"origins": "*"},
        r"/review_graphql/*": {"origins": "*"}
    }
)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Imports that depend of app and db context
from api import models
from api import auth
from api.schema import schema, lead_schema, review_schema
from api.auth import authentication_middleware, graphical_development_auth_middleware
from api.command import add_test_user, add_test_user_filters
from api.utils import util
from sms_to_activity_center import receive_message

if os.getenv('FLASK_ENV') == 'development':
    app.cli.add_command(add_test_user)
    app.cli.add_command(add_test_user_filters)


@app.route('/health')
def health_check():
    receive_message()
    return f"{app.config.get('SITE_TITLE')} WebApp API is OK"


@app.route('/version')
def version():
    return app.config.get("VERSION")


def authorization_middleware(next, root, info, **args):
    """Function to perform authorization.

    This is passed as a middleware to the GraphQL (Python Graphene) configuration. This must be preceded by the
    authentication middleware.

    Args:
        next: Represents the execution chain. Call next to continue evaluation.
        root: The root value object passed throughout the query.
        info: The resolver info.
        **args: The dict of arguments passed to the field.

    Returns:
        Result of the evaluation of the next item in the execution chain.
    """
    # check if it's Event Edge
    if root is not None and hasattr(root, '_meta') and getattr(root._meta, 'name') == 'EventConnection':
        current_user = info.context.user
        owner = None
        tmp_edges = []
        for edge in root.edges:
            if owner is None or owner.id != edge.node.subject_id:  # only update owner if necessary
                owner = db.session.query(models.User).get(edge.node.subject_id)
            current_user_is_owner = current_user.id == owner.id
            if current_user_is_owner or current_user.is_company_admin or current_user.is_admin:
                tmp_edges.append(edge)
        root.edges = tmp_edges
        return next(root, info, **args)
    else:
        return next(root, info, **args)


app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=False,
        middleware=[authentication_middleware, authorization_middleware]
        #  middleware=[authentication_middleware]
    ))

# Exposes graphiql endpoint for use of exploration tool without authorization.
# Will only be exposed in development environment
if expose_graphiql:
    app.add_url_rule('/graphiql',
                     view_func=GraphQLView.as_view(
                         'graphiql',
                         schema=schema,
                         graphiql=True,
                         middleware=[graphical_development_auth_middleware]))

app.add_url_rule('/review_graphql',
                    view_func=GraphQLView.as_view(
                        'review_graphql',
                        schema=review_schema,
                        graphiql=True,
                    )
                )

lead_view = True
if lead_view:
    app.add_url_rule('/lead_graphql',
                     view_func=GraphQLView.as_view(
                         'lead_graphql',
                         schema=lead_schema,
                         graphiql=True,
                         middleware=[authorization_middleware]))


from api.exports_service import upload_lead_import
import csv
import io
from datetime import datetime
from api.models import CompanyLeadFiles, LeadStatusType, Leads, LeadEmails, LeadPhones, LeadAddresses, LeadVehicleOfInterest, LeadSource, ReviewMessageTemplate

stage = os.getenv("STAGE", "stage")
lead_import_folder = os.getenv('S3_LEAD_FOLDER')


@app.route('/life-event/import', methods=['POST'])
def import_csv():
    token = auth.get_token_from_header(request.headers)
    user = auth.get_auth_user(token)
    if user:
        _file = request.files['file']
        if _file:
            stream = io.StringIO(_file.stream.read().decode("UTF8"), newline=None)
            reader = csv.DictReader(stream, delimiter=",")

            file_name = f'source-{user.company.name}-{datetime.utcnow().isoformat()}.csv'
            file_path = f'{stage}/{lead_import_folder}/{file_name}'

            lead_file = CompanyLeadFiles(company_id=user.company_id, user_id=user.id, file_name=file_name,
                                         file_location=file_path,status="ACCEPTED")

            db.session.add(lead_file)
            db.session.commit()

            other_lead_source = db.session.query(LeadSource).filter(LeadSource.name == 'Other').first()
            lead_status_type = db.session.query(LeadStatusType).filter(LeadStatusType.type == 'ACTIVE', 
                                                                    LeadStatusType.status == 'NEW_SMAI_LEAD').first()

            for row in reader:
                full_name = [row.get("First name", ""), row.get("Middle name", ""), row.get("Last name", "")]
                full_name = " ".join(list(filter(lambda x: x, full_name)))

                if row.get("Original Source"):
                    lead_source = db.session.query(LeadSource).\
                        filter(LeadSource.name == row.get("Original Source")).\
                        first()
                    if not lead_source:
                        lead_source = LeadSource(name=row.get("Original Source"))
                        db.session.add(lead_source)
                        db.session.commit()
                    lead_source_original_id = lead_source.id
                else:
                    lead_source_original_id = other_lead_source.id

                lead = Leads(full_name=full_name, first_name=row.get("First name"), last_name=row.get("Last name"),
                             date_of_birth=row.get("DOB"), lead_source_type="FILE",
                             lead_source_original_id=lead_source_original_id, lead_file_id=lead_file.id,
                             company_id=user.company_id)
                db.session.add(lead)
                db.session.commit()
                db.session.refresh(lead)

                util.update_lead_status(lead, user_id=user.id, 
                                    new_status_type_id=lead_status_type.id if lead_status_type else None,
									new_status_type=f'ACTIVE-NEW_SMAI_LEAD')

                if "Email" in row and row["Email"]:
                    lead_email = LeadEmails(lead_id=lead.id, email=row["Email"])
                    db.session.add(lead_email)
                if "Phone" in row and row["Phone"]:
                    lead_phone = LeadPhones(lead_id=lead.id, phone=row["Phone"])
                    db.session.add(lead_phone)
                lead_address = LeadAddresses(lead_id=lead.id, address_line_1=row.get("Address"), city=row.get("City"),
                                             state=row.get("State"), country=row.get("Country"))
                db.session.add(lead_address)
                lead_voi = LeadVehicleOfInterest(lead_id=lead.id, year=row.get("Year"), make=row.get("Make"),
                                                 model=row.get("Model"))
                db.session.add(lead_voi)
                db.session.commit()

            _file.stream.seek(0)
            success = upload_lead_import(_file, user)
            return {'ok': success, 'file_id': lead_file.id}, 200
        else:
            return {'ok': False}, 200
    else:
        return 'Unauthorized', 401

@app.route('/review-template/upload', methods=['POST'])
def upload_template():
    token = auth.get_token_from_header(request.headers)
    user = auth.get_auth_user(token)

    if user:
        _file = request.files['file']
        if _file:
            print('file:----------',_file)
            # stream = io.StringIO(_file.stream.read().decode("UTF8"), newline=None)

            file_name = secure_filename(f'source-{user.company.name}-{datetime.utcnow().isoformat()}.jpg')
            print(file_name)
            # file_path = f'{stage}/{lead_import_folder}/{file_name}'
            file_path = os.path.join(app.root_path, 'uploads\\')

            review_template = ReviewMessageTemplate(company_id=user.company_id, user_id=user.id, file_name=file_name, file_location=file_path)
            print(review_template)
            try:
                success = _file.save(os.path.join(app.root_path, 'uploads', file_name))
                print(success)
                db.session.add(review_template)
                db.session.commit()
                print('success')
                return {'ok': True}, 200
            except Exception as e:
                print(e)
                return {'ok': False}, 200
        else:
            return {'ok': False}, 200
    else:
        return 'Unauthorized', 401

from api.sms import receive_sms, save_status


@app.route('/webhooks/receive-sms', methods=['POST'])
def handle_receive_sms():
    """Handles the messages received from Twilio.

    This processes the messages received from Twilio for the phone numbers that have this webhook configured for their
    messaging service.

    Returns:
        Tuple: With two values, suggesting a successful or unsuccessful processing of the message received.

        - A string representing the status of processing (typically 'OK' for successful processing)
        - An integer representing the HTTP Status Code
    """
    from_number = request.values.get('From', '')
    to_number = request.values.get('To', '')
    message_body = request.values.get('Body', '')
    message_sid = request.values.get('MessageSid', '')
    receive_sms(from_number, to_number, message_body, message_sid)
    return 'OK', 204


@app.route("/webhooks/message-status", methods=['POST'])
def handle_message_status():
    """Handles the status of the messages sent through Twilio.

    This webhook processes the status of the messages sent through Twilio. For each message sent through Twilio, it will
    send an update to this webhook every time the status changes, with the ID of the message in the `MessageSid` value
    and the status information in the `MessageStatus` value. (`SmsStatus` is provided for backwards compatibility.)
    Examples of `MessageStatus` values include `accepted`, `sending`, `sent`, `failed`, and `delivered`.

    Returns:
        Tuple: With two values, suggesting a successful or unsuccessful processing of the message received.

        - A string representing the status of processing (typically 'OK' for successful processing)
        - An integer representing the HTTP Status Code
    """
    message_sid = request.values.get('MessageSid', None)
    message_status = request.values.get('MessageStatus', None)
    save_status(message_sid, message_status)
    return 'OK', 204

