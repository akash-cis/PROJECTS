import pytest
import os
import tempfile
from api import app, db
from api.models import User, Company


@pytest.fixture(scope='module')
def client():
    db_fd, test_db = tempfile.mkstemp()
    app.config['TESTING'] = True
    app.config['DEBUG'] = False
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + test_db
    client = app.test_client()
    with app.app_context():
        db.create_all()

    yield client
    db.drop_all()
    os.close(db_fd)


@pytest.fixture(scope='module')
def session():
    session = db.session
    yield session


def test_health_check(client):
    res = client.get('/health')
    assert res.status_code == 200
    assert res.data == b'SocialMiningAi WebApp API is OK'
    print(' API is up and running')


def test_company_model(session):
    company = Company(name='Testing Inc.')
    session.add(company)
    session.commit()
    session.refresh(company)
    assert company.id == 1
    assert company.name == 'Testing Inc.'
    print(' Company created')


def test_user_model(session):
    user = User(email='test@testing.com', first_name='Test', last_name='McTestins', company_id=1)
    session.add(user)
    session.commit()
    session.refresh(user)
    assert user.id == 1
    assert user.email == 'test@testing.com'
    assert user.company_id == 1
    assert user.company.name == 'Testing Inc.'
    print(' User created')
