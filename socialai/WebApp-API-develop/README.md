# WebApp API  

This repository is the backend API to provide resources needed for the client side web app.  
It is written in Python using the Flask framework and uses a Postgres database.  
  
## Running API  

### Running w/ Docker  

The `docker.compose.yml` has been configured to run the API along with a database container for ease of development.
  
#### Requirements

1. Make sure you have Docker installed  
  
2. Copy the contents of the .env-sample file into a .env file 
	- This env file is configured to run the developmental docker instance. If you are setting up the application to run any other way please replace the variables with the appropriate values.

3. For the cloudsearch query to work during local development you MUST be connected to the funnelai vpn.
#### Run the API
NOTE: If you want to expose the Graphiql interface to explore the GraphQL schemas, queries, and migrations you must have `FLASK_ENV` set to `development` in your .env file.

- The GraphiQL interface will be accessible at http://localhost:5000/graphiql

To run the API simply run:
```shellscript
docker-compose up
```

#### Migrate Database

If this is your first time running the application or any tables have been added or modified, then you will need to open a separate terminal after running the api and enter the following command.
```shellscript
docker-compose run --rm api flask db upgrade
```

### Add Sample Data

1. If you would like to add a test user you can run the following command
```shell script
docker-compose run --rm api flask add-test-user
```

2. If you would like to add sample filter data for this test user run the following command
WARNING: Do not run this if you already have filter data you still need in your DB. It will `TRUNCATE` the filter tables and restart the id sequence to work.
```shell script
docker-compose run --rm api flask add-test-user-filters
```

### Rebuild Image

If you have made changes to the code and want to reforce the image to be rebuilt to include the changes before starting run the following:
```shellscript
docker-compose up --build
```



## Development - Running on local machine
When working on the API it is better suited to run directly on your local machine to take advantage of Flask debug mode which includes hot reloading.
### 
#### Requirements
1. Make sure you have Postgres installed on your machine and set up a database to use for this application
2. Copy the contents of the .env-sample file into a .env file and reconfigure it to use the values from the Postgres DB you set up on step one.
3. For the cloudsearch query to work during local development you MUST be connected to the funnelai vpn.

#### Run the API
NOTE: If you want to expose the Graphiql interface to explore the GraphQL schemas, queries, and migrations you must have `FLASK_ENV` set to `development` in your .env file.

- The GraphiQL interface will be accessible at http://localhost:5000/graphiql

To run the API simply run:
```shellscript
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask run
```

#### Initialize Database
If this is your first time running the application or any tables have been added or modified, then you will need to open a separate terminal after running the api and enter the following command.
```shellscript
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask db upgrade
```

### Add Sample Data

1. If you would like to add a test user you can run the following command
```shell script
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask add-test-user
```

2. If you would like to add sample filter data for this test user run the following command
WARNING: Do not run this if you already have filter data you still need in your DB. It will `TRUNCATE` the filter tables and restart the id sequence to work.
```shell script
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask add-test-user-filters
```

#### Database Migrations
If changes are made to models and you would like to update your database run the following command to commit the changes to Alembic
```shell script
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask db migrate -m '<MESSAGE>'
```
You can replace <MESSAGE> with a short message to identify the changes made

Then to apply these new changes to your local database simply run:
```shellscript
PYTHONPATH=. FLASK_ENV=development FLASK_APP=api flask db upgrade
```

# Builds & Deploy

Builds and deploys are currently handled by our internal
[Deployinator](https://github.com/FunnelAI/deployinator) tool. For
details on setup and usage see the readme of the Deployinator project.

## Building

The steps to perform a build is:

```
bumpversion [major|minor|patch]     # This will update current version
deployinator build                  # This builds and pushes the image
```

## Deploy

The Deployinator can be used to update what is running in ECS:

```
deployinator deploy 0.0.2 stage
```
