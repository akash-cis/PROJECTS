import config
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from api import elasticsearch
from api.models import ExportConfig, Export
from api.schema import ExportConfigModel, ExportModel
from api.email import send_new_response_notification
from api.exports_service import export_file, remove_file_from_s3

from sqlalchemy import func, Enum, or_, and_, extract
from datetime import datetime, timedelta

import pytz

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

Session = sessionmaker(bind=engine)

session = Session()

timezones = [ "US/Eastern", "US/Central","US/Arizona","US/Mountain","US/Pacific","US/Alaska","US/Hawaii"]

# Check prospects count according to export_configs.
# If counts reach export_config minimum: create file, save on s3 bucket and send mail. Save export data and reset count.
def check_for_exports():
    args = {}
    args['range'] = 1
    current_date = datetime.utcnow()
    print(f'current_date {current_date}')
    
    export_configs = []
    for tz in timezones:
        timezone = pytz.timezone(tz)
        now_local = current_date.replace(tzinfo=pytz.UTC)
        now_local = now_local.astimezone(timezone)
        # print(f'timezone {tz}')
        # print(f'now_local {now_local}')
        db_export_configs = session.query(ExportConfig).filter(extract('hour', ExportConfigModel.email_time) == now_local.hour, ExportConfigModel.timezone == tz, ExportConfigModel.ad_hoc == False, ExportConfigModel.deleted == False).all()
        export_configs.extend(db_export_configs)
    # NOTE: Backwards compatibility for exports without timezone (assume UTC)
    db_export_configs = session.query(ExportConfig).filter(extract('hour', ExportConfigModel.email_time) == current_date.hour, ExportConfigModel.timezone == None, ExportConfigModel.ad_hoc == False, ExportConfigModel.deleted == False).all()
    export_configs.extend(db_export_configs)

    for config in export_configs:
        last_run_ = current_date - timedelta(days=1)
        config.last_run = last_run_ if config.last_run == None else config.last_run
        since = current_date - config.last_run
        # print(f'current_date {current_date}')
        # print(f'config.last_exported {config.last_exported}')
        # print(f'config.last_run {config.last_run}')
        # print(f'since.days {since.days}')
        if since.days >= config.frequency:
            # NOTE: deprecated method
            # count = elasticsearch.execute_export_search_count(config.user, args, config.filters)
            data = elasticsearch.execute_export_search(config.user, args, config.filters)
            count = len(data)
            config.count = 0 if config.count == None else config.count
            config.last_exported = datetime.utcnow() if config.last_exported == None else config.last_exported
            # print(f'config.count {config.count}')
            # print(f'config.minimum_count {config.minimum_count}')
            # print(f'count {count}')
            if (config.count + count) >= config.minimum_count:
                export_range = current_date - config.last_exported
                args['range'] = export_range.days
                # print(f'range {export_range.days}')
                # NOTE: deprecated method
                # data = elasticsearch.execute_export_search(config.user, args, config.filters)
                # print(f'exported data count {len(data)}')
                export = ExportModel(export_config_id=config.id, created_at=current_date, count=len(data))
                session.add(export)
                session.commit()
                session.refresh(export)
                export.name = export_file(config, data, export)
                config.count = 0
                config.last_exported = current_date
            else:
                config.count = config.count + count
            config.last_run = current_date
            session.commit()
    return True

# Clear exports older than 7 days
def clear_exports():
    older_than = datetime.now() - timedelta(days=7)
    exports = session.query(ExportModel).filter(func.date(ExportModel.created_at) <= func.date(older_than), ExportModel.deleted == False).all()
    for export in exports:
        remove_file_from_s3(export.name)
        export.deleted = True
        session.commit()
    
    return True

