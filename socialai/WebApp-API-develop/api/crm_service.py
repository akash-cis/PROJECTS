import xml.etree.ElementTree as ET
from xml.etree.ElementTree import Element as XMLElement, SubElement as XMLSubElement, Comment as XMLComment, fromstring as XMLFromString, tostring as XMLToString, QName
from xml.dom import minidom
from api.models import CrmIntegrationType, CrmIntegration, VsExtractedLead, Leads, LeadEmails, LeadPhones, LeadAddresses, LeadVehicleOfInterest
from api import db
from datetime import datetime, timezone
from api.email import send_adf_email
import os
import boto3
from botocore.exceptions import ClientError
import uuid
import requests
import json
from config import SITE, SITE_TITLE, SUPPORT_EMAIL
import urllib3
import time, phonenumbers
from api.utils.db_utils import save_vs_extract_history, save_lead_info, save_vs_extracted_lead, save_sms_preferences,save_crm_vehicle


client = boto3.client('s3')
# Endpoint for DealerSocket Direct Post API
DEALERSOCKET_DIRECT_POST_API_URL = "https://oemwebsecure.dealersocket.com/DSOEMLead/US/DCP/STAR/554/SalesLead/223IIV3839"

def push_to_crm(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_email_type, contact_phone_number, contact_phone_number_type, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments, vehicles):
    # print(f"crm_integration={crm_integration}, aingine_data_id={aingine_data_id}, type_of_lead={type_of_lead}, status={status}, interest={interest}, year={year}, make={make}, model={model}, contact_first_name={contact_first_name}, contact_last_name={contact_last_name}, contact_full_name={contact_full_name}, contact_email={contact_email}, contact_address_line_1={contact_address_line_1}, contact_address_line_2={contact_address_line_2}, city={city}, state={state}, zip={zip}, country={country}, comments={comments}")
    if crm_integration.integration_type == CrmIntegrationType.ADF:
        build_and_send_adf_email(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
        return None
    if crm_integration.integration_type == CrmIntegrationType.VIN:
        crm_lead = build_and_send_vs_lead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_email_type, contact_phone_number, contact_phone_number_type, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments, vehicles)
        return crm_lead
    if crm_integration.integration_type == CrmIntegrationType.DS:
        crm_lead = build_and_send_star_lead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
        return crm_lead
    #if crm_integration.integration_type == CrmIntegrationType.EL:
        #crm_lead = build_and_send_elead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
        #return crm_lead


def build_and_send_adf_email(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    # Build XML markup
    adf_lead_xml = build_adf_lead_xml(company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
    # Save XML as a temp file in application
    temp_file_name = f"{deal_id}-{aingine_data_id}.xml"
    temp_file = open(temp_file_name, "w")
    # print(f"The temp adf file is created {temp_file.name}")
    temp_file.write(adf_lead_xml)
    temp_file.close()
    # Send email with attachment
    send_adf_email(crm_integration.adf_email, f"ADF export- {company.name}-{aingine_data_id}", temp_file.name)
    # Upload xml file to S3 bucket for future use/needs
    save_adf_file_to_s3(company=company, adf_file_name=temp_file.name, adf_file=temp_file)
    # Delete temp file from application
    if os.path.exists(temp_file.name):
        os.remove(temp_file.name)
    else:
        print("File Delete Error: The temp adf file does not exist")
    # Save export information including url to xml file in table as a DealLeadExport


def build_adf_lead_xml(company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    adfEl = XMLElement('adf')
    prospectEl = XMLSubElement(adfEl, 'prospect')
    idEl = XMLSubElement(prospectEl, 'id', {'source':'FunnelAI'})
    idEl.text = str(aingine_data_id)
    requestdateEl = XMLSubElement(prospectEl, 'requestdate')
    now = datetime.now()
    requestdateEl.text = now.strftime("%Y-%m-%d'T'%H:%M'Z'")
    # Vehicle elements
    vehicleEl = XMLSubElement(prospectEl, 'vehicle')
    yearEl = XMLSubElement(vehicleEl, 'year')
    yearEl.text = yearEl
    makeEl = XMLSubElement(vehicleEl, 'make')
    makeEl.text = make
    modelEl = XMLSubElement(vehicleEl, 'model')
    modelEl.text = model
    # Customer elements
    customerEl = XMLSubElement(prospectEl, 'customer')
    # Customer Contact elements
    custContactEl = XMLSubElement(customerEl, 'contact')
    ccNameEl = XMLSubElement(custContactEl, 'name', {'part':'full'})
    ccNameEl.text = contact_full_name
    ccEmailEl = XMLSubElement(custContactEl, 'email')
    ccEmailEl.text = contact_email
    # Customer Contact Address elements
    ccAddressEl = XMLSubElement(custContactEl, 'address')
    ccStreetLine1El = XMLSubElement(ccAddressEl, 'street', {'line':'1'})
    ccStreetLine1El.text = contact_address_line_1
    ccStreetLine2El = XMLSubElement(ccAddressEl, 'street', {'line':'2'})
    ccStreetLine2El.text = contact_address_line_2
    ccCityEl = XMLSubElement(ccAddressEl, 'city')
    ccCityEl.text = city
    ccRegioncodeEl = XMLSubElement(ccAddressEl, 'regioncode')
    ccRegioncodeEl.text = state
    ccPostalcodeEl = XMLSubElement(ccAddressEl, 'postalcode')
    ccPostalcodeEl.text = zip
    ccCountryEl = XMLSubElement(ccAddressEl, 'country')
    ccCountryEl.text = country
    # Customer Comments elements
    custCommentsEl = XMLSubElement(customerEl, 'comments')
    custCommentsEl.append(XMLComment(' --><![CDATA[' + comments.replace(']]>', ']]]]><![CDATA[>') + ']]><!-- '))
    # Vendor elements
    vendorEl = XMLSubElement(prospectEl, 'vendor')
    vendornameEl = XMLSubElement(vendorEl, 'vendorname')
    vendornameEl.text = company.name
    # Vendor Contact elements
    vContactEl = XMLSubElement(vendorEl, 'contact', {'primarycontact':'1'})
    vcNameEl = XMLSubElement(vContactEl, 'name', {'part':'full'})
    vcNameEl.text = f"{user.first_name} {user.last_name}"
    vcEmailEl = XMLSubElement(vContactEl, 'email')
    vcEmailEl.text = user.email
    vcPhoneEl = XMLSubElement(vContactEl, 'phone')
    vcPhoneEl.text = company.phone
    # Vendor Contact Address elements
    vcAddressEl = XMLSubElement(vContactEl, 'address')
    vcStreetLine1El = XMLSubElement(vcAddressEl, 'street', {'line':'1'})
    vcStreetLine1El.text = company.address
    vcCityEl = XMLSubElement(vcAddressEl, 'city')
    vcCityEl.text = company.city
    vcRegionCodeEl = XMLSubElement(vcAddressEl, 'regioncode')
    vcRegionCodeEl.text = company.state
    vcPostalcodeEl = XMLSubElement(ccAddressEl, 'postalcode')
    vcPostalcodeEl.text = company.postal_code
    vcCountryEl = XMLSubElement(vcAddressEl, 'country')
    vcCountryEl.text = company.country
    # Provider elements
    providerEl = XMLSubElement(prospectEl, 'provider')
    providerNameEl = XMLSubElement(providerEl, 'name', {'part':'full'})
    providerNameEl.text = SITE_TITLE
    providerServiceEl = XMLSubElement(providerEl, 'service')
    providerServiceEl.text = 'Social Media And Internet Prospecting'
    providerUrlEl = XMLSubElement(providerEl, 'url')
    providerUrlEl.text = SITE
    # Provider Contact elements
    providerContactEl = XMLSubElement(providerEl, 'contact', {'primarycontact':'1'})
    pcNameEl = XMLSubElement(providerContactEl, 'name', {'part':'full'})
    pcNameEl.text = 'Greg Cooper'
    pcEmailEl = XMLSubElement(providerContactEl, 'email')
    pcEmailEl.text = SUPPORT_EMAIL
    pcPhoneEl = XMLSubElement(providerContactEl, 'phone')
    pcPhoneEl.text = '415-404-9035'
    # Provider Contact Address elements
    pcAddressEl = XMLSubElement(providerContactEl, 'address')
    pcStreetLine1El = XMLSubElement(pcAddressEl, 'street', {'line':'1'})
    pcStreetLine1El.text = '101 East Houston St'
    pcCityEl = XMLSubElement(pcAddressEl, 'city')
    pcCityEl.text = 'San Antonio'
    pcRegioncodeEl = XMLSubElement(pcAddressEl, 'regioncode')
    pcRegioncodeEl.text = 'TX'
    pcCountryEl = XMLSubElement(pcAddressEl, 'country')
    pcCountryEl.text = 'US'
    # Lead Type elements
    leadtypeEl = XMLSubElement(prospectEl, 'leadtype')
    leadtypeEl.text = 'Sales'
    # Print pretty XML
    # print(prettify(adfEl))
    xml_decl = """<?xml version="1.0" encoding="UTF-8"?><?adf version="1.0"?>"""
    total_xml = f"{xml_decl}{XMLToString(adfEl).decode()}"
    # print(prettify(total_xml))
    return prettify(total_xml)


def build_and_send_vs_lead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_email_type, contact_phone_number, contact_phone_number_type, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments, vehicles):
    # Build JSON
    vs_extracted_lead = db.session.query(VsExtractedLead).filter(VsExtractedLead.lead_id == deal_id).first()
    crm_lead = None
    if vs_extracted_lead:
        vs_lead_json = build_vs_put_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_email_type, contact_phone_number, contact_phone_number_type, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments, vs_extracted_lead.vs_contact_id)
        crm_lead = put_vs_lead(crm_integration.crm_dealer_id, user.get_vs_user_id(), vs_lead_json, vs_extracted_lead.vs_contact_id, vs_extracted_lead.vs_lead_id, year, make, model)
        
    else:
        vs_lead_json = build_vs_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
        # Send lead to VinSolutions
        crm_lead = post_vs_lead(crm_integration.crm_dealer_id, user.get_vs_user_id(), vs_lead_json, deal_id)

    if crm_lead is not None:
        try:
            #post vin solution vehicles of interest
            vin_sales_vehicles = [d for d in vehicles if d['interest'] != 'TRADE']
            if(len(vin_sales_vehicles) > 0):
                post_vs_vehicles(crm_lead, deal_id, vin_sales_vehicles, "")

            #post vin solution vehicles of trade
            vin_trade_vehicles = [d for d in vehicles if d['interest'] == 'TRADE']
            if(len(vin_sales_vehicles) > 0):
                post_vs_vehicles(crm_lead,deal_id, vin_trade_vehicles, "TRADE")
        except Exception as e:
            print("Error==========================>", e)
            pass
    
    #TODO: Using the above Values Update our tables after Pushing to CRM
    lead = db.session.query(Leads).filter(Leads.id == deal_id).first()
    if lead:
        lead.first_name = contact_first_name
        lead.last_name = contact_last_name
        lead.full_name = contact_full_name
        db.session.add(lead)
        lead_email = db.session.query(LeadEmails).filter(LeadEmails.lead_id == lead.id).first()
        if lead_email:
            lead_email.email = contact_email
            db.session.add(lead_email)
        lead_phone = db.session.query(LeadPhones).filter(LeadPhones.lead_id == lead.id).first()
        if lead_phone:
            lead_phone.phone = contact_phone_number
            db.session.add(lead_phone)
        lead_addresses = db.session.query(LeadAddresses).filter(LeadAddresses.lead_id == lead.id).first()
        if lead_addresses:
            lead_addresses.address_line_1 = contact_address_line_1
            lead_addresses.address_line_2 = contact_address_line_2
            lead_addresses.city = city
            lead_addresses.state = state
            lead_addresses.postal_code = zip
            lead_addresses.country = country
            db.session.add(lead_addresses)
        lead_voi = db.session.query(LeadVehicleOfInterest).filter(LeadVehicleOfInterest.lead_id == lead.id).first()
        if lead_voi:
            lead_voi.year = year
            lead_voi.make = make
            lead_voi.model = model
            db.session.add(lead_voi)
        db.session.commit()
    return crm_lead


def build_vs_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    # Adjust comments
    comments_suffix = ""
    if type_of_lead is not None and type_of_lead != "":
        comments_suffix = f"Type Of Lead: {type_of_lead}"
    if status is not None and status != "":
        if len(comments_suffix) > 0:
            comments_suffix = f"{comments_suffix} | "
        comments_suffix = f"{comments_suffix}Condition: {status}"
    if interest is not None and interest != "":
        if len(comments_suffix) > 0:
            comments_suffix = f"{comments_suffix} | "
        comments_suffix = f"{comments_suffix}Interest: {interest}"
    if year is not None and year != "0000":
        if len(comments_suffix) > 0:
            comments_suffix = f"{comments_suffix} | "
        comments_suffix = f"{comments_suffix}Year: {year}"
    if make is not None and make != "":
        if len(comments_suffix) > 0:
            comments_suffix = f"{comments_suffix} | "
        comments_suffix = f"{comments_suffix}Make: {make}"
    if model is not None and model != "":
        if len(comments_suffix) > 0:
            comments_suffix = f"{comments_suffix} | "
        comments_suffix = f"{comments_suffix}Model: {model}"
    if len(comments_suffix) > 0:
        comments_suffix = f"Vehicle Details: {comments_suffix}"
    if comments is not None:
        if len(comments) > 0:
            comments = f"{comments}\n{comments_suffix}"
        else:
            comments = comments_suffix
    
    #print("sales note=====>", comments)
    # Build lead
    vs_lead_obj = {
        "DealerId": crm_integration.crm_dealer_id,
        "UserId": user.get_vs_user_id(),
        "ContactInformation": {
            "DealerId": crm_integration.crm_dealer_id,
            "Title": None,
            "FirstName": contact_first_name,
            "MiddleName": None,
            "LastName": contact_last_name,
            "NickName": None,
            "CompanyName": "",
            "CompanyType": 'Individual',
            "Addresses": [
                {
                    "AddressId": 1,
                    "AddressType": "Primary",
                    "StreetAddress": contact_address_line_1,
                    "StreetAddress2": contact_address_line_2,
                    "City": city,
                    "County": None,
                    "State": state,
                    "PostalCode": zip,
                    "Duration": None
                }
            ],
            "Emails": [],
            "Phones": [],
            "DoNotEmail": None,
            "DoNotCall": True,
            "DoNotMail": False,
            "Suffix": None,
            "PreferredContactMethod": None,
            "PreferredContactTime": None,
            "Note": None
        },
        "LeadInformation": {
            "CurrentSalesRepUserId": user.get_vs_user_id(),
            "SplitSalesRepUserId": 0,
            "LeadSourceId": crm_integration.vs_lead_source_id,
            "LeadTypeId": 1,
            "OnShowRoom": False,
            "SaleNotes": comments
        }
    }
    if contact_email is not None and contact_email != "":
       
        vs_lead_obj["ContactInformation"]["Emails"] = [
            {
                "EmailId": 1,
                "EmailType": "Primary",
                "EmailAddress": contact_email
            }
        ]
    if contact_phone_number is not None and contact_phone_number != "":
        try:
            parsed_number = phonenumbers.parse(contact_phone_number)
            phone = parsed_number.national_number
            extension = f"+{str(parsed_number.country_code)}"
            vs_lead_obj["ContactInformation"]["Phones"] = [
                {
                    "PhoneId": 1,
                    "PhoneType": "Home",
                    "Number": phone,
                    "Extension": extension
                }
            ]
        except Exception as e:
            pass
        
    return json.dumps(vs_lead_obj)

def post_vs_vehicles(crm_lead, lead_id, vehicles, type):
    vin_lead_id = crm_lead["lead_id"]
    vs_vehicle_obj = {
        "lead": f"https://api.vinsolutions.com/leads/id/{str(vin_lead_id)}",
        "vehicles":[]
    }
    for vehicle in vehicles:
        vs_vehicle_obj["vehicles"].append({
            "year":vehicle.year,
            "make":vehicle.make,
            "model":vehicle.model,
        })
        
    handle_vs_ssl_issue()
    vs_api_config = get_vs_api_config()
    api_url = vs_api_config["vehicleurl"]
    if type == "TRADE":
        api_url = f"{api_url}/trade"
    else:
        api_url = f"{api_url}/interest"
    #print("api_url =============", json.dumps(vs_vehicle_obj))
    vs_access_token = get_vs_access_token(vs_api_config)
    headers = {
        "Accept":"application/vnd.coxauto.v1+json",
        "Content-Type": "application/vnd.coxauto.v1+json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"]
    }
    resp = requests.post(url=api_url, data=json.dumps(vs_vehicle_obj), headers=headers, verify=False)
    #print("Push to CRM Vehicle of Interest Response ========>", resp.json())
    response_status_code = resp.status_code
    if response_status_code != 200 and response_status_code != 201:
        response = resp.text
        raise Exception(f"Failed to post VS lead. HTTP status code is {response_status_code}. Message: {response}")
    response = resp.json()
    if "vehicles" not in response:
        raise Exception(f"Failed to post VS lead. HTTP status code is {response_status_code}. Message: {response}")
    vin_vehicles = response["vehicles"]
    
    if len(vin_vehicles) == 0:
        raise Exception(f"Did not find lead's vehicles in response. response is {response}.")
    
    crm_vehicles = []
    index = 0
    for vehicle in vehicles:
        print("=====================================>", vin_vehicles[index])
        if vin_vehicles[index] is not None:
            print("==========================> IN ==========>", vin_vehicles[index].split('/')[-1])
            vid = 0
            print("==========================> IN ==========>", hasattr(vehicle, 'vehicle_id'))
            if hasattr(vehicle, 'vehicle_id'):
                vid = vehicle.vehicle_id
            crm_vehicles.append({
                "id": vid,
                "year":vehicle.year,
                "make":vehicle.make,
                "model":vehicle.model,
                "vs_vehicle_id": vin_vehicles[index].split('/')[-1],
                "interest":vehicle.interest
            })
        index += 1
    print("crm_vehicles =====================================>", crm_vehicles)
    if len(crm_vehicles) > 0:
        save_crm_vehicle(lead_id,crm_vehicles)
    return crm_vehicles

def post_vs_lead(vs_dealer_id, vs_user_id, vs_lead_json, deal_id):
    crm_lead = {
        "lead_id": "",
        "customer_id": "",
        "dealer_id": "",
        "contact_id": "",
        "account_id": ""
    }
    crm_lead["dealer_id"] = vs_dealer_id
    print("vs_lead_obj", vs_lead_json)
    print("Pushing lead to VinSolutions, dealer = ", vs_dealer_id, "user = ", vs_user_id, "lead data")
    handle_vs_ssl_issue()
    vs_api_config = get_vs_api_config()
    vs_access_token = get_vs_access_token(vs_api_config)
    # Post lead
    api_url = vs_api_config["contacturl"]
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"]
    }
    r = requests.post(url=api_url, data=vs_lead_json, headers=headers, verify=False)
    print("Push to CRM Resp========>", r)
    response_status_code = r.status_code
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(f"Failed to post VS lead. HTTP status code is {response_status_code}. Message: {response}")
    response = r.json()
    if "ContactId" not in response:
        raise Exception(f"Failed to post VS lead. HTTP status code is {response_status_code}. Message: {response}")
    crm_lead["contact_id"] = response["ContactId"]
    crm_lead["account_id"] = response["AccountId"]
    print("Contact Id , Account Id", response["ContactId"], response["AccountId"])
    # Get lead info
    #api_url = vs_api_config["leadurl"]
    api_url = "https://api.vinsolutions.com/leads"
    headers["Content-Type"] = "application/vnd.coxauto.v3+json"
    headers["Accept"] = "application/vnd.coxauto.v3+json"
    r = requests.get(
        url=api_url,
        params={"dealerId": vs_dealer_id, "userId": vs_user_id, "contactId": crm_lead["contact_id"]},
        headers=headers, verify=False)
    response_status_code = r.status_code
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(f"Failed to get VS lead. HTTP status code is {response_status_code}. Message: {response}")
    response = r.json()
    if "items" not in response:
        raise Exception(f"Failed to get VS lead. HTTP status code is {response_status_code}. Message: {response}")
    #if "Leads" not in response:
    #raise Exception(f"Failed to get VS lead. HTTP status code is {response_status_code}. Message: {response}")
    #leads = response["Leads"]
    leads = response["items"]
    if len(leads) == 0:
        raise Exception(f"Did not find leads in response. response is {response}.")
    lead = leads[0]
    crm_lead["lead_id"] = lead["leadId"]
    lead_data = {}
    lead_data["lead_id"] = int(lead["leadId"])
    lead_data["dealer_id"] = lead["dealerId"]
    lead_contact_url = lead["contact"]
    contact_id = \
        lead_contact_url \
        .split("/")[-1] \
        .replace(f"?dealerid={vs_dealer_id}&userid={vs_user_id}", "")
    lead_data["contact_id"] = int(contact_id)
    lead_co_buyer_contact_url = lead["coBuyerContact"]
    lead_data["co_buyer_contact_id"] = None
    if lead_co_buyer_contact_url is not None:
        co_buyer_contact_id = \
            lead_co_buyer_contact_url \
            .split("/")[-1] \
            .replace(f"?dealerid={vs_dealer_id}&userid={vs_user_id}", "")
        lead_data["co_buyer_contact_id"] = int(co_buyer_contact_id)
    lead_data["lead_source_id"] = \
        lead["leadSource"] \
        .split("/")[-1] \
        .replace(f"?dealerid={vs_dealer_id}", "")
    lead_data["lead_status"] = lead["leadStatus"]
    lead_data["lead_status_type"] = lead["leadStatusType"]
    lead_data["lead_type"] = lead["leadType"]
    lead_data["lead_group_category"] = lead["leadGroupCategory"]
    lead_data["lead_created_utc"] = lead["createdUtc"]
    lead_data["do_not_email"] = None
    lead_data["do_not_call"] = True
    lead_data["do_not_mail"] = False
    extract_id = save_vs_extract_history(vs_dealer_id, "SUCCESS")
    save_vs_extracted_lead(dealer_id=vs_dealer_id, vs_ext_hist_id=extract_id, lead_data=lead_data, lead_id=deal_id)
    print("Successfully push lead to VinSolutions, crm_lead = ", crm_lead)
    return crm_lead

def build_vs_put_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_email_type, contact_phone_number, contact_phone_number_type, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments, lead_contact_id):
    handle_vs_ssl_issue()
    vs_api_config = get_vs_api_config()
    vs_access_token = get_vs_access_token(vs_api_config)
    params = {"dealerId": crm_integration.crm_dealer_id, "userId": user.get_vs_user_id()}
    api_url = f"{vs_api_config['contacturl']}/{lead_contact_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/x-www-form-urlencoded"
    }
    r = requests.get(url=api_url, params=params, headers=headers, verify=False)

    response_status_code = r.status_code
    if response_status_code == 504:
        # Timed out. Wait and try again.
        time.sleep(2)
        return build_vs_put_lead()
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(
            response_status_code,
            f"Failed to get VS contact details. HTTP status code is "
            f"{response_status_code}. Message: {response}")

    response = r.json()
    if len(response) == 0:
        raise Exception(
            f"Failed to get contact details. HTTP status code is "
            f"{response_status_code}. Message: {response}")
    contact = response[0]
    
    vs_lead_obj = {
        "UserId": user.get_vs_user_id(),
        "DealerId": contact["DealerId"],
        "ContactInformation": {
            "DealerId": contact["DealerId"],
            "Title": contact["ContactInformation"]["Title"],
            "FirstName": contact_first_name,
            "MiddleName": contact["ContactInformation"]["MiddleName"],
            "LastName": contact_last_name,
            "NickName": contact["ContactInformation"]["NickName"],
            "CompanyName": contact["ContactInformation"]["CompanyName"],
            "CompanyType": contact["ContactInformation"]["CompanyType"],
            "Addresses": contact["ContactInformation"]["Addresses"],
            "Emails": contact["ContactInformation"]["Emails"],
            "Phones": contact["ContactInformation"]["Phones"],
            "DoNotEmail": contact["ContactInformation"]["DoNotEmail"],
            "DoNotCall": contact["ContactInformation"]["DoNotCall"],
            "DoNotMail": contact["ContactInformation"]["DoNotMail"],
            "Suffix": contact["ContactInformation"]["Suffix"],
            "PreferredContactMethod": contact["ContactInformation"]["PreferredContactMethod"],
            "PreferredContactTime": contact["ContactInformation"]["PreferredContactTime"],
            "Note": contact["ContactInformation"]["Note"]
        },
        "Subscriptions": contact["CustomerConsent"]["Subscriptions"] if contact["CustomerConsent"] else [],
        "SmsPreferences": contact["SmsPreferences"]
    }
    if isinstance(vs_lead_obj["ContactInformation"]["Addresses"], list) and len(vs_lead_obj["ContactInformation"]["Addresses"]) >= 1:
        vs_lead_obj["ContactInformation"]["Addresses"][0]["StreetAddress"] = contact_address_line_1
        vs_lead_obj["ContactInformation"]["Addresses"][0]["StreetAddress2"] = contact_address_line_2
        vs_lead_obj["ContactInformation"]["Addresses"][0]["City"] = city
        vs_lead_obj["ContactInformation"]["Addresses"][0]["State"] = state
        vs_lead_obj["ContactInformation"]["Addresses"][0]["PostalCode"] = zip
    if isinstance(vs_lead_obj["ContactInformation"]["Emails"], list) and len(vs_lead_obj["ContactInformation"]["Emails"]) >= 1:
        index = 0
        for email in vs_lead_obj["ContactInformation"]["Emails"]:
            if email["EmailType"] == contact_email_type:
                break
            index += 1
        if index == len(vs_lead_obj["ContactInformation"]["Emails"]):
            index = 0
        vs_lead_obj["ContactInformation"]["Emails"][index]["EmailAddress"] = contact_email
    if isinstance(vs_lead_obj["ContactInformation"]["Phones"], list) and len(vs_lead_obj["ContactInformation"]["Phones"]) >= 1:
        index = 0
        parsed_number = phonenumbers.parse(contact_phone_number)
        phone = parsed_number.national_number
        extension = f"+{str(parsed_number.country_code)}"
        
        for email in vs_lead_obj["ContactInformation"]["Phones"]:
            if email["PhoneType"] == contact_phone_number_type:
                break
            index += 1
        if index == len(vs_lead_obj["ContactInformation"]["Phones"]):
            index = 0

        vs_lead_obj["ContactInformation"]["Phones"][index]["Number"] = phone
        vs_lead_obj["ContactInformation"]["Phones"][index]["Extension"] = extension
    vs_lead_obj["ContactInformation"]["Note"] = comments
    return json.dumps(vs_lead_obj)

def put_vs_lead(vs_dealer_id, vs_user_id, vs_lead_json, lead_contact_id, vs_lead_id, year, make, model):
    crm_lead = {
        "lead_id": "",
        "customer_id": "",
        "dealer_id": "",
        "contact_id": "",
        "account_id": ""
    }
    crm_lead["lead_id"] = vs_lead_id
    crm_lead["dealer_id"] = vs_dealer_id
    crm_lead["contact_id"] = lead_contact_id
    #print("vs_lead_obj", vs_lead_json)
    print("Pushing lead to VinSolutions, dealer = ", vs_dealer_id, "user = ", vs_user_id, "lead data")
    handle_vs_ssl_issue()
    vs_api_config = get_vs_api_config()
    vs_access_token = get_vs_access_token(vs_api_config)
    # Post lead
    api_url = f'{vs_api_config["contacturl"]}/{lead_contact_id}'
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"]
    }
    r = requests.put(url=api_url, data=vs_lead_json, headers=headers, verify=False)
    print("Push to CRM Resp========>", r)
    response_status_code = r.status_code
    if response_status_code != 204:
        response = r.text
        raise Exception(f"Failed to put VS lead. HTTP status code is {response_status_code}. Message: {response}")
    # Get lead info
    api_url = f"https://api.vinsolutions.com/vehicles/interest/id/{vs_lead_id}-0"
    headers["Content-Type"] = "application/vnd.coxauto.v1+json"
    headers["Accept"] = "application/vnd.coxauto.v1+json"
    r = requests.get(url=api_url, headers=headers, verify=False)
    response_status_code = r.status_code
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(f"Failed to get VOI. HTTP status code is {response_status_code}. Message: {response}")
    response = r.json()
    if "lead" not in response:
        raise Exception(f"Failed to get VOI. HTTP status code is {response_status_code}. Message: {response}")
    voi_data = {
        "vin": response["vin"] if "vin" in response else None,
        "year": year,
        "make": make,
        "model": model,
        "trim": response["trim"] if "trim" in response else None,
        "bodyStyle": response["bodyStyle"] if "bodyStyle" in response else None,
        "mileage": response["mileage"] if "mileage" in response else None,
        "exteriorColor": response["exteriorColor"] if "exteriorColor" in response else None,
        "interiorColor": response["interiorColor"] if "interiorColor" in response else None,
        "doors": response["doors"] if "doors" in response else None,
        "driveTrain": response["driveTrain"] if "driveTrain" in response else None,
        "engineName": response["engineName"] if "engineName" in response else None,
        "stockNumber": response["stockNumber"] if "stockNumber" in response else None,
        "inventoryType": response["inventoryType"] if "inventoryType" in response else None,
        "sellingPrice": response["sellingPrice"] if "sellingPrice" in response else None,
        "msrp": response["msrp"] if "msrp" in response else None,
        "cost": response["cost"] if "cost" in response else None,
        "cityMilesPerGallon": response["cityMilesPerGallon"] if "cityMilesPerGallon" in response else None,
        "highwayMilesPerGallon": response["highwayMilesPerGallon"] if "highwayMilesPerGallon" in response else None,
        "description": response["description"] if "description" in response else None,
        "invoice": response["invoice"] if "invoice" in response else None
    }
    
    r = requests.put(url=api_url, data=json.dumps(voi_data), headers=headers, verify=False)
    response_status_code = r.status_code
    if response_status_code != 204 or response_status_code == 422:
        response = r.text
        raise Exception(f"Failed to update VOI for lead. HTTP status code is {response_status_code}. Message: {response}")
    print("Successfully push lead to VinSolutions, crm_lead = ", crm_lead)
    return crm_lead

def get_vs_api_config():
    # Get environment
    stage = os.getenv("STAGE", "dev")
    param_prefix = "dev" if stage != "prod" else "prod"
    # Get parameters from Systems Manager
    ssm = boto3.client("ssm")
    param_response = ssm.get_parameters(
        Names=[
            f"/{param_prefix}/vinsolutions/authtokenurl",
            f"/{param_prefix}/vinsolutions/clientid",
            f"/{param_prefix}/vinsolutions/secret",
            f"/{param_prefix}/vinsolutions/contacturl",
            f"/{param_prefix}/vinsolutions/apikey",
            f"/{param_prefix}/vinsolutions/leadurl",
            f"/{param_prefix}/vinsolutions/vehicleurl"
        ],
        WithDecryption=True)
    vs_api_config = ({
        p["Name"].split("/")[-1]: p["Value"]
        for p in param_response["Parameters"]
    })
    return vs_api_config


def get_vs_access_token(vs_api_config):
    api_url = vs_api_config["authtokenurl"]
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "client_credentials",
        "client_id": vs_api_config['clientid'],
        "client_secret": vs_api_config['secret'],
        "scope": "PublicAPI"
    }
    r = requests.post(url=api_url, data=data, headers=headers, verify=False)
    response_status_code = r.status_code
    if response_status_code != 200:
        response = r.text
        raise Exception(f"Failed to get the VS auth token. HTTP status code is {response_status_code}. Message: {response}")
    response = r.json()
    if "access_token" not in response:
        raise Exception(f"Failed to get the VS auth token. HTTP status code is {response_status_code}. Message: {response}")
    return response["access_token"]


def handle_vs_ssl_issue():
    # This block is to work-around the failure of the API calls with the following error:
    # HTTPSConnectionPool(host='*.vinsolutions.com', port=443): Max retries exceeded with url: /connect/token (Caused by SSLError(SSLError(1, '[SSL: DH_KEY_TOO_SMALL] dh key too small (_ssl.c:1108)')))
    requests.packages.urllib3.disable_warnings()
    requests.packages.urllib3.util.ssl_.DEFAULT_CIPHERS += ':HIGH:!DH:!aNULL'
    try:
        requests.packages.urllib3.contrib.pyopenssl.util.ssl_.DEFAULT_CIPHERS += ':HIGH:!DH:!aNULL'
    except AttributeError:
        # no pyopenssl support used / needed / available
        pass


def build_and_send_star_lead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    # Build XML markup
    star_lead_xml = build_star_lead_xml(crm_integration.crm_dealer_id, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
    # Send lead to DealerSocket
    crm_lead = post_star_lead(star_lead_xml)
    return crm_lead


# xsi:schemaLocation="http://www.starstandard.org/STAR/5" releaseID="5.5.4">
def build_star_lead_xml(crm_dealer_id, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    ET.register_namespace('xfUOMcl', 'http://www.xfront.com/UnitsOfMeasure')
    ET.register_namespace('sqdt', 'http://www.starstandard.org/STAR/5/qualifieddatatypes/1.0')
    ET.register_namespace('scl', 'http://www.starstandard.org/STAR/5/codelists')
    ET.register_namespace('udt', 'http://www.openapplications.org/oagis/9/unqualifieddatatypes/1.1')
    ET.register_namespace('clm66411', 'http://www.openapplications.org/oagis/9/unitcode/66411:2001')
    ET.register_namespace('qdt', 'http://www.openapplications.org/oagis/9/qualifieddatatypes/1.1')
    ET.register_namespace('clm5639', 'http://www.openapplications.org/oagis/9/languagecode/5639:1988')
    ET.register_namespace('clm54217', 'http://www.openapplications.org/oagis/9/currencycode/54217:2001')
    ET.register_namespace('oacl', 'http://www.openapplications.org/oagis/9/codelists')
    ET.register_namespace('clmIANAMIMEMediaTypes', 'http://www.openapplications.org/oagis/9/IANAMIMEMediaTypes:2003')
    ET.register_namespace('oagis', 'http://www.openapplications.org/oagis/9')
    ET.register_namespace('nmmacl', 'http://www.nmma.org/CodeLists')
    ET.register_namespace('', 'http://www.starstandard.org/STAR/5')
    xml_decl = """<?xml version="1.0" encoding="UTF-8"?>"""
    process_sales_lead_prefix = """<ProcessSalesLead xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xfUOMcl="http://www.xfront.com/UnitsOfMeasure"
        xmlns:sqdt="http://www.starstandard.org/STAR/5/qualifieddatatypes/1.0"
        xmlns:scl="http://www.starstandard.org/STAR/5/codelists"
        xmlns:udt="http://www.openapplications.org/oagis/9/unqualifieddatatypes/1.1"
        xmlns:clm66411="http://www.openapplications.org/oagis/9/unitcode/66411:2001"
        xmlns:qdt="http://www.openapplications.org/oagis/9/qualifieddatatypes/1.1"
        xmlns:clm5639="http://www.openapplications.org/oagis/9/languagecode/5639:1988"
        xmlns:clm54217="http://www.openapplications.org/oagis/9/currencycode/54217:2001"
        xmlns:oacl="http://www.openapplications.org/oagis/9/codelists"
        xmlns:clmIANAMIMEMediaTypes="http://www.openapplications.org/oagis/9/IANAMIMEMediaTypes:2003"
        xmlns:oagis="http://www.openapplications.org/oagis/9"
        xmlns:nmmacl="http://www.nmma.org/CodeLists"
        xmlns="http://www.starstandard.org/STAR/5"
        xsi:schemaLocation="http://www.starstandard.org/STAR/5" releaseID="5.5.4">"""
    process_sales_lead_suffix = """</ProcessSalesLead>"""
    # ApplicationArea
    application_area_el = XMLElement('ApplicationArea')
    # Sender
    sender_el = XMLSubElement(application_area_el, 'Sender')
    creator_name_code_el = XMLSubElement(sender_el, 'CreatorNameCode')
    creator_name_code_el.text = SITE_TITLE
    sender_name_code_el = XMLSubElement(sender_el, 'SenderNameCode')
    sender_name_code_el.text = SITE_TITLE
    service_id_code_el = XMLSubElement(sender_el, 'ServiceID')
    service_id_code_el.text = f'Lead sent from {SITE_TITLE} {SITE}'
    # CreationDateTime
    creation_datetime_el = XMLSubElement(application_area_el, 'CreationDateTime')
    now = datetime.now(timezone.utc)
    creation_datetime_el.text = now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    # BODID
    bodid_el = XMLSubElement(application_area_el, 'BODID')
    bodid_el.text = str(uuid.uuid4())
    # Destination
    destination_el = XMLSubElement(application_area_el, 'Destination')
    dealer_number_id_el = XMLSubElement(destination_el, 'DealerNumberID')
    dealer_number_id_el.text = crm_dealer_id

    # ProcessSalesLeadDataArea
    process_sales_lead_data_area_el = XMLElement('ProcessSalesLeadDataArea')
    # ProcessSalesLeadDataArea - Process
    process_el = XMLSubElement(process_sales_lead_data_area_el, 'Process', {'acknowledgeCode':'Always'})
    # ProcessSalesLeadDataArea - SalesLead
    sales_lead_el = XMLSubElement(process_sales_lead_data_area_el, 'SalesLead')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader
    sales_lead_header_el = XMLSubElement(sales_lead_el, 'SalesLeadHeader')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - LeadInterestCode
    lead_interest_code_el = XMLSubElement(sales_lead_header_el, 'LeadInterestCode')
    lead_interest_code_el.text = interest[:1].upper()
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect
    customer_prospect_el = XMLSubElement(sales_lead_header_el, 'CustomerProspect')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty
    prospect_party_el = XMLSubElement(customer_prospect_el, 'ProspectParty')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - RelationshipTypeCode
    relationship_type_code_el = XMLSubElement(prospect_party_el, 'RelationshipTypeCode')
    relationship_type_code_el.text = 'Individual'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson
    specified_person_el = XMLSubElement(prospect_party_el, 'SpecifiedPerson')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - GivenName
    given_name_el = XMLSubElement(specified_person_el, 'GivenName')
    given_name_el.text = contact_first_name
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - FamilyName
    family_name_el = XMLSubElement(specified_person_el, 'FamilyName')
    family_name_el.text = contact_last_name
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress
    residence_address_el = XMLSubElement(specified_person_el, 'ResidenceAddress')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - AddressType
    address_type_el = XMLSubElement(residence_address_el, 'AddressType')
    address_type_el.text = 'home'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - LineOne
    line_one_el = XMLSubElement(residence_address_el, 'LineOne')
    line_one_el.text = contact_address_line_1
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - CityName
    city_name_el = XMLSubElement(residence_address_el, 'CityName')
    city_name_el.text = city
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - CountryID
    country_id_el = XMLSubElement(residence_address_el, 'CountryID')
    country_id_el.text = country
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - Postcode
    postcode_el = XMLSubElement(residence_address_el, 'Postcode')
    postcode_el.text = zip
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ResidenceAddress - StateOrProvinceCountrySub-DivisionID
    state_el = XMLSubElement(residence_address_el, 'StateOrProvinceCountrySub-DivisionID')
    state_el.text = state
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - TelephoneCommunication
    telephone_communication_el = XMLSubElement(specified_person_el, 'TelephoneCommunication')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - TelephoneCommunication - ChannelCode
    tel_channel_code_el = XMLSubElement(telephone_communication_el, 'ChannelCode')
    tel_channel_code_el.text = 'No Preference'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - TelephoneCommunication - LocalNumber
    local_number_el = XMLSubElement(telephone_communication_el, 'LocalNumber')
    local_number_el.text = '0'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - URICommunication
    uri_communication_el = XMLSubElement(specified_person_el, 'URICommunication')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - URICommunication - URIID
    uri_id_el = XMLSubElement(uri_communication_el, 'URIID')
    uri_id_el.text = contact_email
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - URICommunication - ChannelCode
    uri_channel_code_el = XMLSubElement(uri_communication_el, 'ChannelCode')
    uri_channel_code_el.text = 'email'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - CustomerProspect - ProspectParty - SpecifiedPerson - ContactMethodTypeCode
    contact_method_type_code_el = XMLSubElement(specified_person_el, 'ContactMethodTypeCode')
    contact_method_type_code_el.text = 'email'
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadHeader - LeadCreationDateTime
    lead_creation_date_time_el = XMLSubElement(sales_lead_header_el, 'LeadCreationDateTime')
    lead_creation_date_time_el.text = now.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail
    sales_lead_detail_el = XMLSubElement(sales_lead_el, 'SalesLeadDetail')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem
    sales_lead_line_item_el = XMLSubElement(sales_lead_detail_el, 'SalesLeadLineItem')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem
    sales_lead_vehicle_line_item_el = XMLSubElement(sales_lead_line_item_el, 'SalesLeadVehicleLineItem')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem - SalesLeadVehicle
    sales_lead_vehicle_el = XMLSubElement(sales_lead_vehicle_line_item_el, 'SalesLeadVehicle')
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem - SalesLeadVehicle - Model
    model_el = XMLSubElement(sales_lead_vehicle_el, 'Model')
    model_el.text = model
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem - SalesLeadVehicle - ModelYear
    model_year_el = XMLSubElement(sales_lead_vehicle_el, 'ModelYear')
    model_year_el.text = year
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem - SalesLeadVehicle - MakeString
    make_string_el = XMLSubElement(sales_lead_vehicle_el, 'MakeString')
    make_string_el.text = make
    # ProcessSalesLeadDataArea - SalesLead - SalesLeadDetail - SalesLeadLineItem - SalesLeadVehicleLineItem - SalesLeadVehicle - SaleClassCode
    sale_class_code_el = XMLSubElement(sales_lead_vehicle_el, 'SaleClassCode')
    sale_class_code_el.text = f'{status[:1].upper()}{status[1:]}'

    total_xml = f"{xml_decl}{process_sales_lead_prefix}{XMLToString(application_area_el).decode()}{XMLToString(process_sales_lead_data_area_el).decode()}{process_sales_lead_suffix}"
    # Print pretty XML
    final_xml = prettify(total_xml).replace('!!![', '<![').replace(']]!!', ']]>')
    print(final_xml)
    return final_xml


def post_star_lead(star_lead_xml):
    crm_lead = {
        "lead_id": "",
        "customer_id": "",
        "dealer_id": "",
        "contact_id": "",
        "account_id": ""
    }
    api_url = os.getenv('DEALERSOCKET_DIRECT_POST_API_URL')
    api_username = os.getenv('DEALERSOCKET_DIRECT_POST_API_USERNAME')
    api_password = os.getenv('DEALERSOCKET_DIRECT_POST_API_PASSWORD')

    headers = {
        'Authorization': f'{api_username}:{api_password}',
        'Content-Type': 'application/xml'
    }

    # r = requests.post(url=api_url, data=star_lead_xml, headers=headers)
    # response = r.text
    # response_status_code = r.status_code
    # print("post_star_lead - status code", r.status_code, "response", response)
    # if response_status_code != 200:
    #     raise Exception(f"Failed to post lead. HTTP status code is {response_status_code}. Message: {response}")

    # Test duplicate lead
    #response = '<LeadResponse xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><DSExistingLeadId>2255085</DSExistingLeadId><DSLeadId>0</DSLeadId><ErrorCode>DUPLICATE_LEAD</ErrorCode><ErrorMessage>Duplicate Lead submitted earlier</ErrorMessage><StackTrace i:nil="true" /><Success>false</Success></LeadResponse>'
    # Test 
    response = '<LeadResponse xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><DSExistingLeadId>0</DSExistingLeadId><DSLeadId>0</DSLeadId><ErrorCode>ACCOUNT_DEACTIVATED</ErrorCode><ErrorMessage>Dealer Account previously setup turned off at CRM level</ErrorMessage><StackTrace i:nil="true" /><Success>false</Success></LeadResponse>'
    response_xml_root = ET.fromstring(response)
    crm_success = False
    crm_error_code = None
    crm_error_message = None
    crm_existing_lead_id = None
    for child in response_xml_root:
        print(child.tag, child.text)
        if child.tag == 'Success':
            if child.text == 'true':
                crm_success = True
        if child.tag == 'ErrorCode':
            crm_error_code = child.text
        if child.tag == 'ErrorMessage':
            crm_error_message = child.text
        if child.tag == 'DSExistingLeadId':
            crm_existing_lead_id = child.text
        if child.tag == 'DSLeadId':
            crm_lead["lead_id"] = child.text
        if child.tag == 'DSCustomerId':
            crm_lead["customer_id"] = child.text
        if child.tag == 'DSDealerId':
            crm_lead["dealer_id"] = child.text
    
    print("crm_lead = ", crm_lead, f"crm_success: {crm_success}, crm_existing_lead_id: {crm_existing_lead_id}, "
                                   f"crm_error_code: {crm_error_code}, crm_error_message: {crm_error_message}")
    if crm_success == False:
        if crm_error_code == 'DUPLICATE_LEAD':
            crm_lead["lead_id"] = crm_existing_lead_id
            print(f"Duplicate lead. Lead ID from {SITE_TITLE} already exists in CRM. ErrorCode: {crm_error_code}. "
                  f"Error Message: {crm_error_message}")
        else:
            print(f"Failed to post lead. ErrorCode: {crm_error_code}. Error Message: {crm_error_message}")
            raise Exception(f"Failed to post lead. ErrorCode: {crm_error_code}. Error Message: {crm_error_message}")
    
    return crm_lead


def prettify(rough_string):
    # rough_string = XMLToString(xmlEl, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")


def save_adf_file_to_s3(company, adf_file_name, adf_file):
    s3_bucket = os.getenv('S3_BUCKET_ADF_ATTACHMENTS')
    folder_name = os.getenv('S3_BUCKET_ADF_ATTACHMENTS_FOLDER')
    file_name = f"{folder_name}/{company.name}/{adf_file_name}"
    file_content = open(adf_file_name, 'rb').read()
    try:
        response = client.put_object(Bucket=s3_bucket,Body=file_content,Key=file_name)
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("ADF file saved! VersionId:"),
        print(response['VersionId'])

#def build_and_send_elead(company, user, crm_integration, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    #el_lead_json = build_el_create_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments)
    #el_extracted_lead = db.session.query(ELeadExtractedLead).filter(ELeadExtractedLead.lead_id == deal_id).first()
    #if el_extracted_lead:
        #crm_lead = update_el_lead(crm_integration.crm_dealer_id, el_extracted_lead.el_lead_id, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country)
    #else:
        #crm_lead = create_el_lead(crm_integration.crm_dealer_id, el_lead_json, deal_id)
    #return crm_lead

#def build_el_create_lead(crm_integration, company, user, deal_id, aingine_data_id, type_of_lead, status, interest, year, make, model, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country, comments):
    #el_lead_json = {
        #"isBusiness": false,
        #"title": "Mrs.",
        #"firstName": contact_first_name,
        #"middleName": None,
        #"lastName": contact_last_name,
        #"nickname": None,
        #"birthday": None,
        #"emails": [
            #{
                #"address": contact_email,
                #"emailType": "Personal",
                #"doNotEmail": false,
                #"isPreferred": true
            #}
        #],
        #"phones": [
            #{
                #"number": contact_phone_number,
                #"phoneType": "Cellular",
                #"preferredTimeToContact": "Evening",
                #"doNotCall": false,
                #"doNotText": false,
                #"preferCall": false,
                #"prefetText": true
            #}
        #],
        #"address": {
            #"addressLine1": contact_address_line_1,
            #"addressLine2": contact_address_line_2,
            #"city": city,
            #"state": state,
            #"zip": zip,
            #"country": country,
            #"county": None,
            #"doNotMail": false,
            #"isPreferred": true
        #}
    #}
    #return json.dumps(el_lead_json)

#def update_el_lead(dealer_id, el_lead_id, contact_first_name, contact_last_name, contact_full_name, contact_email, contact_phone_number, contact_address_line_1, contact_address_line_2, city, state, zip, country):
    #crm_lead = {
        #"lead_id": "",
        #"customer_id": "",
        #"dealer_id": "",
        #"contact_id": "",
        #"account_id": ""
    #}
    #crm_lead["lead_id"] = el_lead_id
    #crm_lead["dealer_id"] = dealer_id
    #api_url = "https://api.fortellis.io/sales/v1/elead/customers/{el_lead_id}"
    #headers = {"Request-Id": uuid.uuid4(), "Subscription-Id": "Subscription-Id from dealer", "Authorization": "Basic token"}
    #r = requests.get(url=api_url, headers=headers, verify=False)
    #response_status_code = r.status_code
    #if response_status_code != 200:
        #response = r.text
        #raise Exception(f"Failed to post ELead lead. HTTP status code is {response_status_code}. Message: {response}")
    #response = r.json()
    #if "id" not in response:
        #raise Exception(f"Failed to post Elead lead. HTTP status code is {response_status_code}. Message: {response}")
    #el_lead_json = {
        #"isBusiness": response["isBusiness"],
        #"title": response["title"],
        #"firstName": contact_first_name,
        #"middleName": response["middleName"],
        #"lastName": contact_last_name,
        #"nickname": response["nickname"],
        #"birthday": response["birthday"],
        #"emails": response["email"],
        #"phones": response["phones"],
        #"address": reponse["address"]
    #}
    #if isinstance(el_lead_json["emails"], list) and len(el_lead_json["emails"]) >= 1:
        #el_lead_json["emails"][0]["address"] = contact_email
    #if isinstance(el_lead_json["phones"], list) and len(el_lead_json["phones"]) >= 1:
        #el_lead_json["phones"][0]["number"] = contact_phone_number
    #if isinstance(el_lead_json["address"], list) and len(el_lead_json["address"]) >= 1:
        #el_lead_json["address"][0]["addressLine1"] = contact_address_line_1
        #el_lead_json["address"][0]["addressLine2"] = contact_address_line_2
        #el_lead_json["address"][0]["city"] = city
        #el_lead_json["address"][0]["state"] = state
        #el_lead_json["address"][0]["zip"] = zip
        #el_lead_json["address"][0]["country"] = country
    #headers["Request-Id"] = uuid.uuid4()
    #r = requests.get(url=api_url, headers=headers, verify=False)
    #response_status_code = r.status_code
    #if response_status_code != 200:
        #response = r.text
        #raise Exception(f"Failed to post ELead lead. HTTP status code is {response_status_code}. Message: {response}")
    #response = r.json()

    #pass

#def create_el_lead(dealer_id, el_lead_json, deal_id):
    #crm_lead = {
        #"lead_id": "",
        #"customer_id": "",
        #"dealer_id": "",
        #"contact_id": "",
        #"account_id": ""
    #}
    #api_url = "https://api.fortellis.io/sales/v1/elead/customers/"
    #headers = {"Request-Id": uuid.uuid4(), "Subscription-Id": "Subscription-Id from dealer", "Authorization": "Basic token"}
    #r = requests.post(url=api_url, data=el_lead_json, headers=headers, verify=False)
    #print("Push to CRM Resp========>", r)
    #response_status_code = r.status_code
    #if response_status_code != 200:
        #response = r.text
        #raise Exception(f"Failed to post ELead lead. HTTP status code is {response_status_code}. Message: {response}")
    #response = r.json()
    #if "id" not in response:
        #raise Exception(f"Failed to post Elead lead. HTTP status code is {response_status_code}. Message: {response}")
    #extract_id = save_el_extract_history(dealer_id, "SUCCESS")
    #save_el_extracted_lead(dealer_id=dealer_id, el_ext_hist_id=extract_id, lead_data=lead_data, lead_id=deal_id)

def pull_from_vinsoultions(company_id):
    crm_int = db.session.query(CrmIntegration).filter(CrmIntegration.company_id == company_id).first()
    fetch_and_save_leads(crm_int.crm_dealer_id, crm_int.vs_lead_source_id, company_id)

def fetch_and_save_leads(vs_dealer_id, source_id, company_id):
    print(
        f"in fetch_and_save_leads()"
        f"and vs_dealer_id = {vs_dealer_id} and source_id = {source_id}")

    # Connect to VinSolutions
    handle_vs_ssl_issue()
    vs_api_config = get_vs_api_config()
    vs_access_token = get_vs_access_token(vs_api_config)
    # logging.debug(f"vs_access_token = {vs_access_token}")
    # Extract and process the leads
    user_id =  get_dealer_user(vs_dealer_id, vs_api_config, vs_access_token)
    if user_id is None:
        raise Exception(
            f"Error reteriving Users from Dealer with id {vs_dealer_id}")
    process_vinsolution_leads(vs_dealer_id, vs_api_config, vs_access_token, company_id, user_id)

def process_vinsolution_leads(vs_dealer_id, vs_api_config, vs_access_token, company_id, user_id, page_url=None):
    api_url = None
    page_number=1
    # The iteration will not have any page_url
    if page_url is None:
        params = {"dealerId": vs_dealer_id, "limit": 100, "sortby": "date", "pagenumber": 109}
        api_url = f"https://api.vinsolutions.com/leads"
    else:
        # When paginating, the page_url will contain the parameters
        # No need to build the params again
        params = {}
        api_url = page_url
        page_number = get_pagenumber(page_url)
        if page_number is None:
            return
    headers = {
        "Accept": "application/vnd.coxauto.v3+json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/vnd.coxauto.v3+json"
    }
    req = requests.get(url=api_url, params=params, headers=headers, verify=False)

    response_status_code = req.status_code
    if response_status_code == 401:
        vs_api_config = get_vs_api_config()
        vs_access_token = get_vs_access_token(vs_api_config)
        # logging.debug(f"vs_access_token = {vs_access_token}")
        # Extract and process the leads
        print("New authorizaton retrieved, retrying the scraper")
        return process_vinsolution_leads(vs_dealer_id, vs_api_config, vs_access_token, company_id, user_id, page_url)
    if response_status_code != 200 and response_status_code != 201:
        response = req.text
        err_msg = (
            f"Failed to get VS lead. HTTP status code is "
            f"{response_status_code}. Message: {response}"
            f"Failed at pagenumber = {page_number}"
        )
        save_vs_extract_history(vs_dealer_id, "FAIL")
        raise Exception(err_msg)

    # Save a record of this extract attempt
    vs_ext_hist_id = save_vs_extract_history(vs_dealer_id, "SUCCESS")
    response = req.json()
    if "count" not in response:
        raise Exception(
            f"Failed to get leads. HTTP status code is "
            f"{response_status_code}. Message: {response}"
            f"Failed at pagenumber = {page_number}"
        )
    lead_count = response["count"]
    if lead_count == 0:
        raise Exception(
            f"No leads available to fetch. response is {response}.")
    current_page_url = response["href"]
    first_page_url = response["first"]
    next_page_url = response["next"]
    previous_page_url = response["previous"]
    limit = response["limit"]
    items = response["items"]
    print(
        f"lead_count={lead_count}|current_page_url={current_page_url}|"
        f"first_page_url={first_page_url}|next_page_url={next_page_url}|"
        f"previous_page_url={previous_page_url}|limit={limit}")
    for item in items:
        lead_data = {}
        lead_data["lead_url"] = item["href"]
        lead_data["lead_id"] = int(item["leadId"])
        lead_data["dealer_id"] = item["dealerId"]
        lead_contact_url = item["contact"]
        contact_id = \
            lead_contact_url \
            .split("/")[-1] \
            .replace(f"?dealerid={vs_dealer_id}", "")
        lead_data["contact_id"] = int(contact_id)
        lead_co_buyer_contact_url = item["coBuyerContact"]
        lead_data["co_buyer_contact_id"] = None
        if lead_co_buyer_contact_url is not None:
            co_buyer_contact_id = \
                lead_co_buyer_contact_url \
                .split("/")[-1] \
                .replace(f"?dealerid={vs_dealer_id}", "")
            lead_data["co_buyer_contact_id"] = int(co_buyer_contact_id)
        lead_data["lead_source_id"] = \
            item["leadSource"] \
            .split("/")[-1] \
            .replace(f"?dealerid={vs_dealer_id}", "")
        lead_data["lead_status"] = item["leadStatus"]
        lead_data["lead_status_type"] = item["leadStatusType"]
        lead_data["lead_type"] = item["leadType"]
        lead_data["lead_group_category"] = item["leadGroupCategory"]
        lead_data["lead_created_utc"] = item["createdUtc"]
        print(
            f"{lead_data['lead_id']}|{lead_data['contact_id']}|"
            f"{lead_data['co_buyer_contact_id']}|{lead_data['lead_source_id']}"
            f"{lead_data['lead_status']}|{lead_data['lead_status_type']}|"
            f"{lead_data['lead_type']}|{lead_data['lead_group_category']}")
        print(f"pagenumber = {page_number}")
        try:
            contact_data = get_contact_details(
                vs_dealer_id,
                lead_data["contact_id"],
                vs_api_config,
                vs_access_token,
                user_id)
        except Exception as ce:
            if len(ce.args) > 0:
                if ce.args[0] == 401:
                    err_msg = ce.args[1]
                    print(err_msg)
                    print("Getting new authorizaton")
                    vs_api_config = get_vs_api_config()
                    vs_access_token = get_vs_access_token(vs_api_config)
                    contact_data = get_contact_details(
                        vs_dealer_id,
                        lead_data["contact_id"],
                        vs_api_config,
                        vs_access_token,
                        user_id)
                else:
                    raise ce
            else:
                raise ce
        try:
            if item["vehiclesOfInterest"] is not None and isinstance(item["vehiclesOfInterest"], list) and len(item["vehiclesOfInterest"]) >= 1:
                voi_data = get_VOI(vs_api_config, vs_access_token, item["vehiclesOfInterest"])
        except Exception as ce:
            if len(ce.args) > 0:
                if ce.args[0] == 401:
                    err_msg = ce.args[1]
                    print(err_msg)
                    print("Getting new authorizaton")
                    vs_api_config = get_vs_api_config()
                    vs_access_token = get_vs_access_token(vs_api_config)
                    voi_data = get_VOI(vs_api_config, vs_access_token, item["vehiclesOfInterest"])
                else:
                    raise ce
            else:
                raise ce
        try:
            source_data = get_source(vs_api_config, vs_access_token, item["leadSource"])
        except Exception as ce:
            if len(ce.args) > 0:
                if ce.args[0] == 401:
                    err_msg = ce.args[1]
                    print(err_msg)
                    print("Getting new authorizaton")
                    vs_api_config = get_vs_api_config()
                    vs_access_token = get_vs_access_token(vs_api_config)
                    source_data = get_source(vs_api_config, vs_access_token, item["leadSource"])
                else:
                    raise ce
            else:
                raise ce
        #contact_data["lead_id"] = lead_data["lead_id"]
        #contact_data["contact_url"] = lead_contact_url
        #contact_data["contact_id"] = lead_data["contact_id"]
        #contact_data["dealer_id"] = vs_dealer_id
        print("contact_data", contact_data)
        lead_id = save_lead_info(company_id, contact_data, voi_data, source_data, vs_dealer_id, lead_data['lead_id'])
        lead_data["do_not_email"] = contact_data["do_not_email"]
        lead_data["do_not_call"] = contact_data["do_not_call"]
        lead_data["do_not_mail"] = contact_data["do_not_mail"]
        save_vs_extracted_lead(vs_dealer_id, vs_ext_hist_id, lead_data, lead_id)
        save_sms_preferences(contact_data)

    # Process the next page
    if next_page_url is not None:
        return process_vinsolution_leads(vs_integration_id, vs_dealer_id, vs_api_config, vs_access_token, company_id, user_id, page_url=next_page_url)
    else:
        return

#def fetch_and_save_lead_sources(vs_dealer_id):
    #print(
        #f"in fetch_and_save_lead_sources()"
        #f"for vs_dealer_id = {vs_dealer_id}")

    #Connect to VinSolutions
    #handle_vs_ssl_issue()
    #vs_api_config = get_vs_api_config()
    #vs_access_token = get_vs_access_token(vs_api_config)
    #logging.debug(f"vs_access_token = {vs_access_token}")
    #Extract and process the leads

def get_pagenumber(url):
    param_strs = url.split("?")
    param_str = param_strs[-1] if len(param_strs) > 0 else []
    param_parts = param_str.split("&")
    pagenumber = None
    for param_part in param_parts:
        param_part_kv = param_part.split("=")
        if param_part_kv[0] == "pagenumber":
            pagenumber = int(param_part_kv[1])
            break
    return pagenumber

def get_contact_details(vs_dealer_id, lead_contact_id, vs_api_config, vs_access_token, user_id):
    params = {"dealerId": vs_dealer_id, "userId": user_id}
    api_url = f"https://api.vinsolutions.com/gateway/v1/contact/{lead_contact_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/x-www-form-urlencoded"
    }
    r = requests.get(url=api_url, params=params, headers=headers, verify=False)

    response_status_code = r.status_code
    if response_status_code == 504:
        # Timed out. Wait and try again.
        time.sleep(2)
        return get_contact_details(
            vs_dealer_id,
            lead_contact_id,
            vs_api_config,
            vs_access_token)
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(
            response_status_code,
            f"Failed to get VS contact details. HTTP status code is "
            f"{response_status_code}. Message: {response}")

    response = r.json()
    if len(response) == 0:
        raise Exception(
            f"Failed to get contact details. HTTP status code is "
            f"{response_status_code}. Message: {response}")
    contact = response[0]

    contact_data = {
        "contact_id": None,
        "first_name": "",
        "last_name": "",
        "middle_name": "",
        "addresses": [],
        "emails": [],
        "phones": [],
        "profile_location": None,
        "sms_preferences": []
    }
    if "ContactId" in contact:
        contact_data["contact_id"] = contact["ContactId"]
    if "ContactInformation" in contact:
        contact_information = contact["ContactInformation"]
        contact_data["first_name"] = contact_information["FirstName"] if "FirstName" in contact_information else ""
        contact_data["last_name"] = contact_information["LastName"] if "LastName" in contact_information else ""
        contact_data["middle_name"] = contact_information["MiddleName"] if "MiddleName" in contact_information else ""
        addresses = contact_information["Addresses"] if "Addresses" in contact_information else []
        contact_addresses = []
        for address in addresses:
            contact_address = {
                "line1": None,
                "line2": None,
                "locality": None,
                "region": None,
                "postal_code": None,
                "country": "US",
                "location": "",
                "current": False
            }
            if ("StreetAddress" in address and
                    address["StreetAddress"] != "Not Available" and
                    address["StreetAddress"] is not None):
                contact_address["line1"] = address["StreetAddress"]
            if ("StreetAddress2" in address and
                    address["StreetAddress2"] != "Not Available" and
                    address["StreetAddress2"] is not None):
                contact_address["line2"] = address['StreetAddress2']
            if ("City" in address and
                    address["City"] != "Not Available" and
                    address["City"] is not None):
                contact_address["city"] = address['City']
            if ("State" in address and
                    address["State"] != "Not Available" and
                    address["State"] is not None):
                contact_address["state"] = address["State"]
            if ("PostalCode" in address and
                    address["PostalCode"] != "Not Available" and
                    address["PostalCode"] is not None):
                contact_address["postal_code"] = address["PostalCode"]
            contact_address["country"] = "US"
            #if ("AddressType" in address and
                    #address["AddressType"] == "Primary"):
                #contact_address["current"] = True
            contact_address["location"] = get_location(contact_address)
            #if contact_address["current"] is True and \
                    #contact_data["profile_location"] is None:
                #contact_data["profile_location"] = contact_address["location"]
            contact_addresses.append(contact_address)
        contact_data["addresses"] = contact_addresses
        #if len(contact_addresses) > 0 and \
                #contact_data["profile_location"] is None:
            #contact_data["profile_location"] = contact_addresses[0]["location"]
        # Emails
        emails = (contact_information["Emails"]
                  if "Emails" in contact_information
                  else [])
        contact_emails = []
        for email in emails:
            contact_email = {}
            if ("EmailAddress" in email and
                    email["EmailAddress"] != "Not Available" and
                    email["EmailAddress"] is not None):
                contact_email["address"] = email["EmailAddress"]
                contact_email["type"] = email["EmailType"]
            contact_emails.append(contact_email)
        contact_data["emails"] = contact_emails
        # Phones
        phones = (contact_information["Phones"]
                  if "Phones" in contact_information
                  else [])
        contact_phones = []
        for phone in phones:
            contact_phone = {}
            if ("Number" in phone and
                    phone["Number"] != "Not Available" and
                    phone["Number"] is not None):
                contact_phone["number"] = phone["Number"]
            if ("PhoneType" in phone and
                    phone["PhoneType"] != "Not Available" and
                    phone["PhoneType"] is not None):
                contact_phone["type"] = phone["PhoneType"]
            else:
                contact_phone["type"] = ""
            contact_phones.append(contact_phone)
        contact_data["phones"] = contact_phones
        contact_data["do_not_email"] = contact_information["DoNotEmail"]
        contact_data["do_not_call"] = contact_information["DoNotCall"]
        contact_data["do_not_mail"] = contact_information["DoNotMail"]
    if "SmsPreferences" in contact and isinstance(contact["SmsPreferences"], list):
        contact_data["sms_preferences"] = contact["SmsPreferences"]
    return contact_data

def get_VOI(vs_api_config, vs_access_token, voi=None):
    voi_data = []
    for x in voi:
        api_url = x
        headers = {
            "Accept": "application/vnd.coxauto.v1+json",
            "Authorization": f"Bearer {vs_access_token}",
            "api_key": vs_api_config["apikey"],
            "Content-Type": "application/vnd.coxauto.v1+json"
        }
        r = requests.get(url=api_url, headers=headers, verify=False)

        response_status_code = r.status_code
        if response_status_code == 504:
            # Timed out. Wait and try again.
            time.sleep(2)
            return get_VOI(
                vs_dealer_id,
                lead_contact_id,
                vs_api_config,
                vs_access_token)
        if response_status_code != 200 and response_status_code != 201:
            response = r.text
            raise Exception(
                response_status_code,
                f"Failed to get VOI. HTTP status code is "
                f"{response_status_code}. Message: {response}")

        response = r.json()
        if len(response) == 0:
            raise Exception(
                f"Failed to VOI. HTTP status code is "
                f"{response_status_code}. Message: {response}")
        voi_obj = {
            "year": None,
            "make": "",
            "model": "",
            "trim": ""
        }
        if "year" in response:
            voi_obj["year"] = response["year"]
        if "make" in response:
            voi_obj["make"] = response["make"]
        if "model" in response:
            voi_obj["model"] = response["model"]
        if "trim" in response:
            voi_obj["trim"] = response["trim"]
        voi_data.append(voi_obj)
    return voi_data

def get_source(vs_api_config, vs_access_token, source_url):
    api_url = source_url
    headers = {
        "Accept": "application/vnd.coxauto.v1+json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/vnd.coxauto.v1+json"
    }
    r = requests.get(url=api_url, headers=headers, verify=False)

    response_status_code = r.status_code
    if response_status_code == 504:
        # Timed out. Wait and try again.
        time.sleep(2)
        return get_source(vs_api_config, vs_access_token, source_url)
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(
            response_status_code,
            f"Failed to get Source. HTTP status code is "
            f"{response_status_code}. Message: {response}")

    response = r.json()
    if len(response) == 0:
        raise Exception(
            f"Failed to get source. HTTP status code is "
            f"{response_status_code}. Message: {response}")
    source_data = {
        "lead_source_id": None,
        "lead_source_name": None
    }
    source_data["lead_source_id"] = response["leadSourceId"]
    source_data["lead_source_name"] = response["leadSourceName"]
    return source_data

def get_location(address):
    location = ""
    if address["line1"] is not None and address["line1"] != "":
        location = address["line1"]
    if address["line2"] is not None and address["line2"] != "":
        location = (
            f"{location}, {address['line2']}"
            if len(location) > 0 else address["line2"]
        )
    if address["locality"] is not None and address["locality"] != "":
        location = (
            f"{location}, {address['locality']}"
            if len(location) > 0 else address["locality"]
        )
    if address["region"] is not None and address["region"] != "":
        location = (
            f"{location}, {address['region']}"
            if len(location) > 0 else address["region"]
        )
    if address["postal_code"] is not None and address["postal_code"] != "":
        location = (
            f"{location} {address['postal_code']}"
            if len(location) > 0 else address["postal_code"]
        )
    if address["country"] is not None and address["country"] != "":
        location = (
            f"{location}, {address['country']}"
            if len(location) > 0 else address["country"]
        )
    return location

def get_dealer_user(vs_dealer_id, vs_api_config, vs_access_token):
    api_url = f"https://api.vinsolutions.com/gateway/v1/tenant/user"
    params = {"dealerId": vs_dealer_id}
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/x-www-form-urlencoded"
    }
    r = requests.get(url=api_url, params=params, headers=headers, verify=False)

    response_status_code = r.status_code
    if response_status_code == 504:
        # Timed out. Wait and try again.
        time.sleep(2)
        return get_dealer_user(
            vs_dealer_id,
            vs_api_config,
            vs_access_token)
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(
            response_status_code,
            f"Failed to get VS Delear Users. HTTP status code is "
            f"{response_status_code}. Message: {response}")

    response = r.json()
    if len(response) == 0:
        raise Exception(
            f"Failed to get users. HTTP status code is "
            f"{response_status_code}. Message: {response}")
    user_id = []
    for user in response:
        user_id.append({"UserId": user["UserId"], "IlmAccess": user["IlmAccess"]})
    if len(user_id) >= 1:
        return user_id[0]["UserId"]
    else:
        return None

def get_vinsolution_users(crm_dealer_id):
    vs_api_config = get_vs_api_config()
    vs_access_token = get_vs_access_token(vs_api_config)
    api_url = f"https://api.vinsolutions.com/gateway/v1/tenant/user"
    params = {"dealerId": crm_dealer_id}
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {vs_access_token}",
        "api_key": vs_api_config["apikey"],
        "Content-Type": "application/x-www-form-urlencoded"
    }
    r = requests.get(url=api_url, params=params, headers=headers, verify=False)

    response_status_code = r.status_code
    if response_status_code == 504:
        # Timed out. Wait and try again.
        time.sleep(2)
        return get_vinsolution_users(
            crm_dealer_id,
            vs_api_config,
            vs_access_token)
    if response_status_code != 200 and response_status_code != 201:
        response = r.text
        raise Exception(
            response_status_code,
            f"Failed to get VS Delear Users. HTTP status code is "
            f"{response_status_code}. Message: {response}")

    response = r.json()
    if len(response) == 0:
        raise Exception(
            f"Failed to get users. HTTP status code is "
            f"{response_status_code}. Message: {response}")
    users = []
    for user in response:
        users.append({"UserId": user["UserId"], "IlmAccess": user["IlmAccess"], "FirstName": user["FirstName"], "LastName": user["LastName"], "EmailAddress": user["EmailAddress"]})
    return users
    

def pull_crm_users(company_id):
    crm_integration = db.session.query(CrmIntegration).filter(CrmIntegration.company_id == company_id, CrmIntegration.active == True).first()
    users = []
    if crm_integration.integration_type == CrmIntegrationType.ADF:
        pass
    if crm_integration.integration_type == CrmIntegrationType.VIN:
        users = get_vinsolution_users(crm_integration.crm_dealer_id)
    if crm_integration.integration_type == CrmIntegrationType.DS:
        pass
    return users   
     
# TODO: use for dealer scoket
#import hmac
#import hashlib
#import base64

#private_key = 'blahblahblah.encode()'
#msg = "k".encode()

#digest = hmac.new(private_key, msg=msg, digestmod=hashlib.sha256).digest()
#signature = base64.b64encode(digest).decode()
