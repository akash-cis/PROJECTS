import click
from flask.cli import with_appcontext

from api import db
import os
from config import SITE_TITLE
# from api.models import User, Company, UserFilter, CompanyFilter, FilterType, SelectionOption


@click.command()
@with_appcontext
def add_test_user():
    """
    Adds sample user test@funnelai.co to database in company SocialMiningAi Test Dev Co.
    :return: Void
    """

    db.engine.execute("INSERT INTO company (name) VALUES ('SocialMiningAi Test Dev Co.')")
    db.engine.execute("INSERT INTO \"user\" (email, first_name, last_name, cognito_id, company_id) SELECT 'test@funnelai.co', 'Test', 'SocialMiningAi', '35fe6fc6-00a2-4710-97e0-85e174d114d4', c.id from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    print(f'User test@funnelai.co added with company {SITE_TITLE} Test Dev Co.')


@click.command()
@with_appcontext
def add_test_user_filters():
    """
    Addes sample filter data for test user
    :return:
    """
    db.engine.execute("TRUNCATE TABLE filter_type CASCADE")
    db.engine.execute("TRUNCATE TABLE selection_option CASCADE")
    db.engine.execute("TRUNCATE TABLE company_filter CASCADE")
    db.engine.execute("TRUNCATE TABLE user_filter CASCADE")

    db.engine.execute("ALTER SEQUENCE filter_type_id_seq RESTART WITH 1")
    db.engine.execute("ALTER SEQUENCE selection_option_id_seq RESTART WITH 1")
    db.engine.execute("ALTER SEQUENCE company_filter_id_seq RESTART WITH 1")
    db.engine.execute("ALTER SEQUENCE user_filter_id_seq RESTART WITH 1")

    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('MULTISELECT', 'Industry', 'TAGS');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('SELECT', 'Parts/Service', 'TAGS');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('SELECT', 'New/Used', 'TAGS');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('MULTISELECT', 'Makes', 'TAGS');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('TEXT', 'Keyword (Any)', 'BODY');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('TEXT', 'Location (Any)', 'LOCATION');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('TEXT', 'Keyword (All)', 'BODY');")
    db.engine.execute("INSERT INTO filter_type (type, name, filter_field) VALUES ('TEXT', 'Location (All)', 'LOCATION');")

    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Auto', 1);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Parts', 2);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Service', 2);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('New', 3);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Used', 3);")

    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Audi', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Acura', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('BMW', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Cadillac', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Chevrolet', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Dodge', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Ford', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('GMC', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Honda', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Infiniti', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Jaguar', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Jeep', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Lexus', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('MINI', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Mazda', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Mercedes', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Nissan', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Porsche', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Subaru', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Tesla', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Toyota', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Volkswagon', 4);")
    db.engine.execute("INSERT INTO selection_option (value, filter_type_id) VALUES ('Volvo', 4);")


    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 1, false from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 4, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 5, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 6, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 7, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 8, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 17, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")
    db.engine.execute(
        "INSERT INTO company_filter (company_id, selection_option_id, user_can_change) SELECT c.id, 20, true from \"company\" as c WHERE c.name = 'SocialMiningAi Test Dev Co.'")



    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, company_filter_id) SELECT u.id, 4, 4 from \"user\" as u WHERE u.email = 'test@funnelai.co'")
    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, company_filter_id) SELECT u.id, 4, 6 from \"user\" as u WHERE u.email = 'test@funnelai.co'")
    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, company_filter_id) SELECT u.id, 4, 7 from \"user\" as u WHERE u.email = 'test@funnelai.co'")
    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, company_filter_id) SELECT u.id, 4, 8 from \"user\" as u WHERE u.email = 'test@funnelai.co'")
    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, value) SELECT u.id, 5, 'Leather' from \"user\" as u WHERE u.email = 'test@funnelai.co'")
    db.engine.execute("INSERT INTO user_filter (user_id, filter_type_id, value) SELECT u.id, 5, 'Rims' from \"user\" as u WHERE u.email = 'test@funnelai.co'")

    print('Test user test@funnelai.co sample filter data has been added')
