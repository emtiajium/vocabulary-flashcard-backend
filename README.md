[![CI](https://github.com/emtiajium/vocabulary-flashcard-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/emtiajium/vocabulary-flashcard-backend/actions/workflows/ci.yml)

# What is this repository for?

<https://firecrackervocabulary.com>

<https://play.google.com/store/apps/details?id=com.emtiajium.firecracker.collaborative.vocab.practice>

# How to Run

###### Prerequisites

➜ Install Node 22.11.0 using [nvm](https://github.com/nvm-sh/nvm)

➜ Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

###### Clone the repo and install all dependencies

➜ `git clone git@github.com:emtiajium/vocabulary-flashcard-backend.git`

➜ `cd vocabulary-flashcard-backend`

➜ `npm install`

###### Run the backing services

➜ `docker-compose up -d`

###### Create the configuration

➜ `npm run create:env`

###### Synchronize model changes into the database

➜ `npm run migration:run`

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

➜ `FK_<referencing-table-name>_<referencing-column-name>_<referenced-table-name>_<referenced-column-name>`

> e.g., `FK_Definition_vocabularyId_Vocabulary_id`

###### Unique Key

➜ `UQ_<table-name>_<column-name>_<second-column-name>_<third-column-name>`

> e.g., `UQ_User_username`, `UQ_LeitnerSystems_userId_vocabularyId`

## Generate new migration script after changing the entity class(es)

➜ `npm run migration:generate -n <file-name>`

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

-   `1.54.0`: Full Text searching (v0.1)
-   `1.53.0`: Node@22
-   `1.52.1`: Sent current date's guessing game related date from the table avoiding random generation
-   `1.52.0`: API to get randomly chosen meanings (part of the guessing game)
-   `1.51.0`: Created a separate DB (Docker container) for the automated test with `fsync=off`, `synchronous_commit=off` and `full_page_writes=off`
-   `1.50.0`: Empty array when a vocab does not have a definition using the FILTER clause
-   `1.49.0`: Automated getting certificate to enable HTTPS after a new EC2 instance gets launched
-   `1.48.0`: Node 18 + Upgraded packages
-   `0.47.0`: Added `@Post(/v1/users/active-users)`
-   `0.46.0`: Fake caching user to reduce DB hit during authentication
-   `0.45.0`: Added `@Delete(/v1/users/self)` API
-   `0.44.0`: Set TypeORM `eager` to `false`
-   `0.43.0`: Removed cohort ID from the API response
-   `0.42.0`: Automated the linker words' relationship
-   `0.41.0`: Refactored `@Post(/v1/leitner-systems/items/:box)` to filter return a single item when there are items that are supposed to have appeared in future
-   `0.40.0`: Refactored `@Post(/v1/vocabularies/search)` to filter flashcard
-   `0.39.1`: Refactored `@Post(/v1/cohorts)` to move all users' vocab to the requested cohort
-   `0.39.0`: Refactored `@Put(/v1/cohorts/:name)` to move all users' vocab to the requested cohort
-   `0.38.1`: Refactored `@Post(/v1/vocabularies/search)`: Trimmed the search keyword before starting searching
-   `0.38.0`: Refactored `@Post(/v1/vocabularies/search)` to send only the required props
-   `0.37.0`: Replaced `COUNT()` with `EXISTS()` where applicable
-   `0.36.0`: Added `@Get(/v1/vocabularies/words/:word)`
-   `0.35.0`: Refactored `@Post(/v1/leitner-systems/items/:box)` to send an item that is not ready to appear to the user
-   `0.34.0`: Added validator `@IsEqualToByConfig()`
-   `0.33.0`: Refactored `@Post(/v1/users)` to send minimal data
-   `0.32.0`: Authenticated `@Post(/v1/users)`
-   `0.31.0`: Verified token using the Google provided API
-   `0.30.0`: Allowed executing reporting related APIs only if the provided secret is matched
-   `0.29.0`: Automated the migration scripts generation following the naming strategy
-   `0.28.0`: Added test cases to validate the naming convention of the database keys (cont. `0.25.0`)
-   `0.27.0`: Changed the type of the column `currentBox` from the enum to the smallint
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
