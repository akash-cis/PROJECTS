# Hack for sibling import for importing api for local testing
import sys, os
sys.path.insert(0, os.path.abspath('..'))
import config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
from api.models import Leads, Message, TextConsentStatus

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

def expired_consents():
    session = Session()
    # Get all leads which one accepted the text consent 
    leads = session.query(Leads).filter(
            Leads.text_consent_status == TextConsentStatus.ACCEPTED,
            Leads.text_consent_date != None
    ).all()
    
    exclude_text = ['START', 'YES', 'UNSTOP', 'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    for lead in leads:
        last_conversation = lead.text_consent_date
        last_received = session.query(Message).filter(
                                            Message.lead_id == lead.id, 
                                            Message.date_received.__gt__(last_conversation),
                                            Message.content.notin_(exclude_text)) \
                                            .order_by(Message.id.desc()).first()
        
        if last_received:
            last_conversation = last_received.date_received
            
        if last_conversation:
            td = datetime.utcnow() - last_conversation
            if td.days > 180:
                lead.text_consent_status = None
                lead.text_consent_date = datetime.utcnow()
                print(f'Expired the text consent for the {lead.full_name} at {datetime.utcnow()}')
                session.add(lead)
                session.commit()

    session.close()

def scheduler():
    while(True):
        expired_consents()

        # time.sleep(10)


if __name__ == "__main__":
    scheduler()
