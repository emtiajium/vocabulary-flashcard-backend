# How to Run

###### Prerequisites

➜ Install Node 14 LTS using [nvm](https://github.com/nvm-sh/nvm)

➜ Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

###### Clone the repo and install all dependencies

➜ `git clone git@github.com:emtiajium/ielts-gibberish.git`

➜ `cd ielts-gibberish`

➜ `npm install`

###### Run the backing services

➜ `docker-compose up -d`

###### Create the configuration

➜ `npm run create:env`

###### Synchronize model changes into the database

➜ `npm run typeorm migration:run`

###### Run the tests

➜ `npm run test`

###### Start the development environment

➜ `npm run start:dev`

###### API docs

➜ <https://localhost:9006/rest/ielts-service/swagger>

## DB Keys Naming Convention

###### Primary Key

➜ `PK_<table-name>_<column-name>`

> e.g., `PK_Android_id`

###### Foreign Key

➜ `FK_<table-name>_<column-name>_<reference-table-name>_<reference-column-name>`

> e.g., `FK_Definition_vocabularyId_Vocabulary_id`

###### Unique Key

➜ `UQ_<table-name>_<column-name>_<second-column-name>_<third-column-name>`

> e.g., `UQ_User_username`, `UQ_LeitnerSystems_userId_vocabularyId`

## Deploy to AWS

➜ Create an application at AWS Elastic Beanstalk

> Set `Virtual machine key pair` (under `Security` section)

> Set the environment variables (under `Software` section)

➜ Create the database at AWS RDS

> Carefully set VPC/Security groups

> Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/rds-external-defaultvpc.html) to connect to the
> Amazon RDS instance in a VPC

➜ Create a deployment pipeline at AWS CodePipeline

➜ Deploy!

###### HTTPS

➜ Read about enabling HTTPS with Let's Encrypt from [here](./https-with-lets-encrypt.md)

## Change Logs

-   `0.26.0`: Cron job to ping the health-check endpoint using the EB post-deployment hook
-   `0.25.0`: Standardized the DB (primary, foreign, unique) keys
-   `0.24.0`: Extended the Elastic Beanstalk default nginx configuration
-   `0.23.1`: Added API to check if a vocabulary already exists
-   `0.23.0`: Prevented adding same vocabulary multiple times (within the same cohort)
-   `0.22.0`: Fixed the bug: `cohortId` is now the foreign key in the `Vocabulary` table
-   `0.21.0`: Removed `@Get(/v1/leitner-systems/exists/user/:vocabularyId)` + Wrote missing test cases for 3 APIs
-   `0.20.0`: Introduced foreign keys at the `LeitnerSystems` table
-   `0.19.0`: Refactored + Prevented updating a vocab by an intruder
-   `0.18.0`: Removed pinging to instance using all ENIs
-   `0.17.0`: Removed the environment variable `NPM_USE_PRODUCTION`
-   `0.16.0`: Prevented deleting vocabulary by an intruder
-   `0.15.0`: CORS with specific origins
-   `0.14.0`: CI pipeline with GitHub actions
-   `0.13.0`: Integrated `Terminus` (NestJS provided health checks)
-   `0.12.0`: Interceptor to log the request headers
-   `0.11.1`: Capitalized all linker words
-   `0.11.0`: Advanced searching/filtering
-   `0.10.0`: Swagger
-   `0.9.1`: Refactored the API `/v1/users/all` to apply ordering and send total number of users
-   `0.9.0`: HTTPS for the localhost
-   `0.8.0`: Introduced health check endpoint
-   `0.7.1`: Fixed import issue in the test files
-   `0.7.0`: Added APIs for reporting purpose
-   `0.6.3`: Auto setting of `isDraft` if a vocab has at least one definition
-   `0.6.2`: Dynamic vocab ordering
-   `0.6.1`: Added script to remove a leitner item for a user
-   `0.6.0`: Added functionality to remove definitions
-   `0.5.5`: Fixed the (TypeORM) relationship between Vocabulary and Definition + Ordered definitions by their creation
    time
-   `0.5.4`: Populated leitner box existence info
-   `0.5.3`: Applied ordering for the leitner items
-   `0.5.2`: Attached triggering time with Leitner box item
-   `0.5.1`: Attached Leitner box info within the response payload of the vocab search API
-   `0.5.0`: Leitner systems
-   `0.4.4`: Module for Android stuff
-   `0.4.3`: Ordered cohort members by their firstname (`/v1/cohorts/self`)
-   `0.4.2`: Modified the cohort related APIs to accept usernames instead of user IDs
-   `0.4.1`: Added API for populating the new user with few vocabularies
-   `0.4.0`: Added authentication using JWT
-   `0.3.2`: Added validation for external links
-   `0.3.1`: Added vocabulary find/removal functionality
-   `0.3.0`: Added vocabulary creation/update functionality
-   `0.2.0`: Added cohort functionality
-   `0.1.0`: Added user functionality
