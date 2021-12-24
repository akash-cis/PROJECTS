from xml.etree.ElementTree import Element as XMLElement, SubElement as XMLSubElement, Comment as XMLComment, fromstring as XMLFromString, tostring as XMLToString
from xml.dom import minidom
from api.schema import ExportModel
from datetime import datetime
from api.email import send_export_email
import os
import boto3
from botocore.exceptions import ClientError
from api import db
from api import elasticsearch
from api.models import User
from config import S3_LEAD_BUCKET_UPLOAD, S3_LEAD_FOLDER

client = boto3.client('s3')

stage = os.getenv("STAGE", "stage")
ad_export_s3_bucket = os.getenv('S3_BUCKET_ADS_EXPORTS')
ad_export_folder_name = os.getenv('S3_BUCKET_ADS_EXPORTS_FOLDER')
s3_webapp_upload_bucket = os.getenv('S3_BUCKET_UPLOAD')
clm_import_folder = os.getenv('S3_CLM_FOLDER')

def export_file(config, data, export):
    return build_and_send_export_email(config, data, export)

def build_and_send_export_email(config, data, export):
    # Build CSV
    content = build_personalized_export_file(data)
    # Save CSV as a temp file in application
    date = export.created_at.strftime("%Y-%m-%d %H:%M")
    temp_file_name = f"{config.name if config.name else 'Adhoc'}-{date}.csv"
    temp_file = open(temp_file_name, "w")
    # print(f"The temp file is created {temp_file.name}")
    temp_file.write(content)
    temp_file.close()
    # Send email if not ad_hoc run
    if config.ad_hoc == False:
        send_export_email(config, email=config.email, subject=f"ADS export-{config.name if config.name else 'Adhoc'}-{date}")
    # Upload CSV file to S3 bucket for future use/needs
    file_name = f"{ad_export_folder_name}/{temp_file.name}"
    save_file_to_s3(ad_export_s3_bucket, file_name, temp_file.name)
    # Delete temp file from application
    if os.path.exists(temp_file.name):
        os.remove(temp_file.name)
    else:
        print("File Delete Error: The temp adf file does not exist")
    # Save export information including url to file in table as a Export
    return file_name

def get_file_size_in_bytes(file_path):
   """ Get size of file at given path in bytes"""
   size = os.path.getsize(file_path)
   return size

def build_personalized_export_file_deprecated(data):
    # content = 'Username, Full Name, Location, Post ID, Post Source, New Car, Used Car, Make, Model, Features, Credit rating, Credit score, Email, Phone, Date\n'
    content = 'Username, Full Name, Location, Post ID, Post Source, New Car, Used Car, Make, Model, Date\n'
    for d in data:
        new = 'YES' if 'New' in d.tags else 'NO'
        used = 'YES' if 'Used' in d.tags else 'NO'
        makes = ','.join(d.makes)
        models = ','.join(d.models)
        full_name = d.person_full_name if d.person_full_name else ''
        location = d.location if d.location else ''
        content = content + f'{d.author},{full_name},\"{location}\",{d.id},{d.source},{new},{used},\"{makes}\",\"{models}\",{d.timestamp}\n'
    return content

def build_personalized_export_file(data):
    content = 'Username, Location, Source, Subforum\n'
    for d in data:
        content = content + f'{d["username"]},\"{d["location"]}\",{d["source"]},\"{d["subforums"]}\"\n'
    return content


def save_file_to_s3(s3_bucket, file_name, export_file_name):
    file_content = open(export_file_name, 'rb').read()
    try:
        response = client.put_object(Bucket=s3_bucket, Body=file_content, Key=file_name)
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("ADF file saved! VersionId:"),
        print(response['VersionId'])

def remove_file_from_s3(export_file_name):
    s3_bucket = os.getenv('S3_BUCKET_ADS_EXPORTS')
    file_name = f"{export_file_name}"
    try:
        response = client.delete_object(Bucket=s3_bucket, Key=file_name)
    except ClientError as e:
        print(e.response['Error']['Message'])
    else:
        print("ADF file removed! VersionId:"),
        print(response['VersionId'])

# NOTE: Download is accesible for 10 minutes
def get_file_from_s3(export_file_name):
    s3_bucket = os.getenv('S3_BUCKET_ADS_EXPORTS')
    file_name = f"{export_file_name}"
    try:
        response = client.generate_presigned_url('get_object',
                                                    Params={'Bucket': s3_bucket,
                                                            'Key': file_name},
                                                    ExpiresIn=600)
        return response
    except ClientError as e:
        print(e.response['Error']['Message'])


def adhoc_export_deprecated(config):
    args = {}
    current_date = datetime.utcnow()
    args['start_date'] = config.start_date
    args['end_date'] = config.end_date

    try:
        count = elasticsearch.execute_export_search_count_deprecated(config.user, args, config.filters)
        config.count = 0 if config.count == None else config.count
        config.last_exported = datetime.utcnow() if config.last_exported == None else config.last_exported
        if count > 0:
            data = elasticsearch.execute_export_search_deprecated(config.user, args, config.filters)
            export = ExportModel(export_config_id=config.id, created_at=current_date, count=len(data))
            db.session.add(export)
            db.session.commit()
            db.session.refresh(export)
            export.name = export_file(config, data, export)
            config.count = 0
            config.last_exported = current_date
        else:
            return False
        db.session.commit()
    except Exception as e:
        print(e)
        raise
    
    return True

def adhoc_export(config):
    args = {}
    current_date = datetime.utcnow()
    args['start_date'] = config.start_date
    args['end_date'] = config.end_date

    try:
        data = elasticsearch.execute_export_search(config.user, args, config.filters)
        count = len(data)
        config.count = 0 if config.count == None else config.count
        config.last_exported = datetime.utcnow() if config.last_exported == None else config.last_exported
        if count > 0:
            export = ExportModel(export_config_id=config.id, created_at=current_date, count=len(data))
            db.session.add(export)
            db.session.commit()
            db.session.refresh(export)
            export.name = export_file(config, data, export)
            config.count = 0
            config.last_exported = current_date
        else:
            return False
        db.session.commit()
    except Exception as e:
        print(e)
        raise
    
    return True


def upload_clm_import(file, user: User):
   
    try:
        file_name = f'source-{user.company_id}-{datetime.utcnow().isoformat()}.csv'
        file_path = f'{stage}/{clm_import_folder}/{file_name}'
        print(file_path)
        response = client.put_object(Bucket=s3_webapp_upload_bucket, Body=file, Key=file_path)
        return True if response['ETag'] else False
    except Exception as e:
        print(e)
        return False


def upload_lead_import(_file, user: User):

    try:
        file_name = f'source-{user.company.name}-{datetime.utcnow().isoformat()}.csv'
        file_path = f'{stage}/{S3_LEAD_FOLDER}/{file_name}'
        response = client.put_object(Bucket=S3_LEAD_BUCKET_UPLOAD, Body=_file, Key=file_path)
        return True if response['ETag'] else False
    except Exception as e:
        print(e)
        return False
