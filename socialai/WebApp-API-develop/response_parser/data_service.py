import config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.sql.expression import desc
from api.models import ResponseConfig, EntryType, ConversationEntry, Deal
from sentry_sdk import capture_exception
from api.email import send_new_response_notification

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

session = Session()


def check_for_config(message):
    try:
        if message['author'] and 'id' in message['author'] and 'username' in message['author']:
            resp_config = session.query(ResponseConfig) \
                .filter(ResponseConfig.source_id == message['thread']['source']['id'], ResponseConfig.thread_id == message['thread']['id'], ResponseConfig.active.is_(True)) \
                .filter((ResponseConfig.aingine_user_id == message['author']['id']) | (ResponseConfig.screen_name == message['author']['username'])) \
                .first()
        else:
            resp_config = None
            print('No author in the message from: ' + str(message['thread']['source']['name']))
        if resp_config:
            if resp_config.aingine_user_id == message['author']['id']:
                print('From our prospect')
                deal = session.query(Deal).filter(Deal.id == resp_config.deal_id).first()
                send_new_response_notification(deal, message['body'])
                return True, resp_config, EntryType.RECEIVED
            elif resp_config.screen_name == message['author']['username']:
                print('From our USER!!')
                existing_message = session.query(ConversationEntry).filter(ConversationEntry.deal_id == resp_config.deal_id, ConversationEntry.type == EntryType.SENT, ConversationEntry.is_temp.is_(True)).first()
                if existing_message:
                    session.delete(existing_message)
                    session.commit()
                return True, resp_config, EntryType.SENT
            else:
                print('right house wrong person')
                return False, False, False
        else:
            return False, False, False
    except Exception as e:
        print(e)
        capture_exception(e)
        session.rollback()


def save_response(resp_config: ResponseConfig, response_type: EntryType, message):
    try:
        conversation_entry = ConversationEntry(deal_id=resp_config.deal_id, type=response_type, message=message['body'], post_time=message['timestamp'], aingine_user_id=message['author']['id'], aingine_data_id=message['id'])
        session.add(conversation_entry)
        session.commit()
        session.refresh(conversation_entry)
        print(conversation_entry.id)
        return True if conversation_entry.id > 0 else False
    except Exception as e:
        print(e)
        capture_exception(e)
        session.rollback()
        return False


def get_response_configs():
    try:
        resp_configs = session.query(ResponseConfig) \
                .join(ConversationEntry, ResponseConfig.deal_id == ConversationEntry.deal_id) \
                .filter(ConversationEntry.type == 'SENT') \
                .filter(ResponseConfig.active.is_(True)) \
                .order_by(ResponseConfig.id.desc()) \
                .limit(1) \
                .all()
        return resp_configs
    except Exception as e:
        print(e)
        capture_exception(e)
        session.rollback()
        return False