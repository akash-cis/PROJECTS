
from api import db
from datetime import datetime
from api.models import Leads, LeadPhones, LeadAddresses, LeadEmails, LeadVehicleOfInterest, LeadSourceType, CrmIntegration, VsExtractedLead, VsExtractHistory, VinSolutionsUser, VsSmsPreferences, LeadSource, VsLeadSource, CompanyLeadSource, VinSolutionsVehicles
from api.sms import look_up_phone_type
#import phonenumbers

#def get_standardized_phonenumber(phone_number, country_code):
    #try:
        #parsed_phone_number = phonenumbers.parse(phone_number, country_code)
        #if phonenumbers.is_possible_number(parsed_phone_number) and \
           #phonenumbers.is_valid_number(parsed_phone_number):
            #return phonenumbers.format_number(
                #parsed_phone_number,
                #phonenumbers.PhoneNumberFormat.E164)
    #except phonenumbers.NumberParseException as e:
        #print(f"Could not parse the phone number {phone_number}")
    #If there was an exception, or the phone number could not be formatted to
    #E164, just return the original
    #return phone_number

def save_vs_extract_history(dealer_id, status):
    vseh = VsExtractHistory()
    vseh.dealer_id = dealer_id
    vseh.status = status
    db.session().add(vseh)
    db.session().flush()
    print(f"VinSolutions extract history inserted, id is {vseh.id}")
    return vseh.id

def save_vs_extracted_lead(dealer_id, vs_ext_hist_id, lead_data, lead_id):
    print(
        f"in save_vs_extracted_lead()"
        f"and dealer_id = {dealer_id} and vs_ext_hist_id = {vs_ext_hist_id}"
    )
    vsel = VsExtractedLead()
    vsel.vs_extract_history_id = vs_ext_hist_id
    vsel.dealer_id = dealer_id
    vsel.vs_lead_id = lead_data["lead_id"]
    vsel.lead_id = lead_id
    vsel.vs_contact_id = lead_data["contact_id"]
    vsel.vs_co_buyer_contact_id = lead_data["co_buyer_contact_id"]
    vsel.vs_lead_source_id = lead_data["lead_source_id"]
    vsel.vs_lead_status = lead_data["lead_status"]
    vsel.vs_lead_status_type = lead_data["lead_status_type"]
    vsel.vs_lead_type = lead_data["lead_type"]
    vsel.vs_lead_category = lead_data["lead_group_category"]
    vsel.vs_create_date = datetime.strptime(
        lead_data["lead_created_utc"],
        "%Y-%m-%dT%H:%M:%S%z")
    vsel.do_not_email = lead_data["do_not_email"]
    vsel.do_not_call = lead_data["do_not_call"]
    vsel.do_not_mail = lead_data["do_not_mail"]
    db.session.add(vsel)
    db.session.commit()
    print(f"VinSolutions extracted lead inserted, id is {vsel.id}")

def save_lead_info(company_id, contact_data, voi_data, source_data, vs_dealer_id, vs_lead_id):
    original_source_id = save_source(source_data, company_id, vs_dealer_id)
    # Lead
    lead = save_lead(company_id, contact_data, original_source_id, vs_lead_id)
    lead_id = lead.id

    # Save the remaining details
    save_addresses(lead_id, contact_data)
    save_emails(lead_id, contact_data)
    save_phones(lead_id, contact_data)
    save_voi(lead_id, voi_data)
    # Commit the transaction
    db.session.commit()
    print(
        f"Saved lead {lead_id}")
    return lead_id

def save_lead(company_id, contact_data, original_source_id, vs_lead_id):
    # Get lead name
    first_name = (
        contact_data["first_name"]
        if contact_data["first_name"] is not None else "")
    last_name = (
        contact_data["last_name"]
        if contact_data["last_name"] is not None else "")
    middle_name = (
        contact_data["middle_name"]
        if contact_data["middle_name"] is not None else "")
    full_name = ""
    if first_name is not None and first_name != "":
        full_name = first_name
    if middle_name is not None and middle_name != "":
        if full_name != "":
            full_name = f"{full_name} {middle_name}"
        else:
            full_name = middle_name
    if last_name is not None and last_name != "":
        if full_name != "":
            full_name = f"{full_name} {last_name}"
        else:
            full_name = last_name
    # Build lead
    vs_lead = db.session.query(VsExtractedLead).filter(VsExtractedLead.vs_lead_id == vs_lead_id).first()
    if vs_lead:
        lead = db.session.query(Leads).filter(Leads.id == vs_lead.lead_id).first()
        lead.full_name = full_name
        lead.first_name = first_name
        lead.last_name = last_name
        lead.lead_source_original_id = original_source_id
        lead.company_id = company_id
    else:
        lead = Leads(full_name=full_name, first_name=first_name, last_name=last_name,
                                date_of_birth=None, lead_source_type='CRM',
                                lead_source_original_id=original_source_id, company_id=company_id,
                                status=None, email_consent=None,
                                email_consent_date=None, text_consent=None,
                                text_consent_date=None)
    db.session.add(lead)
    db.session.flush()

    return lead

def save_addresses(lead_id, contact_data):
    for address in contact_data["addresses"]:
        save_address(
                lead_id=lead_id,
                address=address)


def save_address(lead_id, address):
	if address["location"] is None or address["location"] == "":
		return False
	address = LeadAddresses(lead_id=lead_id, location_text=address["location"], 
                                        address_line_1=address["line1"], address_line_2=address["line2"],
                                        city=address["locality"], state=address["region"], postal_code=address["postal_code"],
                                        country=address["country"])
	db.session.add(address)


def save_emails(lead_id, contact_data):
    for email in contact_data["emails"]:
        save_email(lead_id, email["address"], email["type"])


def save_email(lead_id,email,email_type):
	email = LeadEmails(lead_id=lead_id, email=email, email_type=email_type)
	db.session.add(email)


def save_phones(person_id, contact_data):
    for phone in contact_data["phones"]:
        save_phone_number(person_id,phone['number'],"US", phone["type"])

def save_phone_number(lead_id, phone_number, country_code, phone_type):
	#std_phone_number = get_standardized_phonenumber(phone_number, country_code)
	#phone = LeadPhones(lead_id=lead_id, phone=std_phone_number)
	phone = LeadPhones(lead_id=lead_id, phone=phone_number, phone_type=phone_type, lookup_type=look_up_phone_type(phone_number))
	db.session.add(phone)

def save_voi(lead_id, voi_data):
    for voi_obj in voi_data:
        lead_voi = LeadVehicleOfInterest(lead_id=lead_id, year=voi_obj["year"], make=voi_obj["make"], model=voi_obj["model"], trim=voi_obj["trim"])
        db.session.add(lead_voi)

def save_sms_preferences(contact_data):
    for pref in contact_data["sms_preferences"]:
        vs_sms_pref = VsSmsPreferences(vs_contact_id=contact_data["contact_id"], phone_number=pref["PhoneNumber"], phone_type=pref["PhoneType"], subscriber_status=pref["SubscriberStatus"])
        db.session.add(vs_sms_pref)
        db.session.commit()

def save_source(source_data, company_id, vs_dealer_id):
    source = db.session.query(LeadSource).filter(LeadSource.name == source_data["lead_source_name"]).first()
    if source:
        company_source = db.session.query(CompanyLeadSource).filter(CompanyLeadSource.company_id == company_id).first()
        if company_source:
            return source.id
        else:
            vs_lead_source = VsLeadSource(dealer_id=vs_dealer_id, lead_source_id=source.id, vs_lead_source_id=source_data["lead_source_id"], vs_lead_source_name=source_data["lead_source_name"])
            db.session.add(vs_lead_source)

            company_lead_source = CompanyLeadSource(company_id=company_id ,lead_source_original_id=source.id)
            db.session.add(company_lead_source)
            db.session.commit()
            return source.id
    else:
        lead_source = LeadSource(name=source_data["lead_source_name"])
        db.session.add(lead_source)
        db.session.commit()
        vs_lead_source = VsLeadSource(dealer_id=vs_dealer_id, lead_source_id=lead_source.id, vs_lead_source_id=source_data["lead_source_id"], vs_lead_source_name=source_data["lead_source_name"])
        db.session.add(vs_lead_source)

        company_lead_source = CompanyLeadSource(company_id=company_id ,lead_source_original_id=lead_source.id)
        db.session.add(company_lead_source)
        db.session.commit()
        return lead_source.id

def save_crm_vehicle(lead_id, voi_data):
    for voi in voi_data:
        try:
            lead_voi = db.session.query(LeadVehicleOfInterest).filter(LeadVehicleOfInterest.id == voi["id"]).first()
            if lead_voi:
                lead_voi.year = voi["year"]
                lead_voi.make = voi["make"]
                lead_voi.model = voi["model"]
                lead_voi.customer_interest = voi["interest"]
                db.session.commit()
            else:
                lead_voi = LeadVehicleOfInterest(lead_id=lead_id, year=voi["year"], make=voi["make"], model=voi["model"], trim="",customer_interest = voi["interest"], is_current=True)
                db.session.add(lead_voi)
                db.session.commit()
            #save mapping
            vin_solution_vehicle = db.session.query(VinSolutionsVehicles).filter(VinSolutionsVehicles.vs_vehicle_id == voi["vs_vehicle_id"]).first()
            if vin_solution_vehicle is None:
                vin_solution_vehicle = VinSolutionsVehicles(vs_vehicle_id=voi["vs_vehicle_id"], lead_vehicle_of_interest_id=lead_voi.id)
                db.session.add(vin_solution_vehicle)
                db.session.commit()
        except Exception as e:
            print("Exception at save_crm_vehicle =================================>", e)
