# How to Run

###### Prerequisites

➜ Install Node 14 LTS

➜ Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

###### Clone the repo and install all dependencies

➜ `git clone git@bitbucket.org:sheenab/ielts-gibberish.git`

➜ `cd ielts-gibberish`

➜ `npm install`

###### Create your configuration running the command below and edit the .env

➜ `npm run create:env`

###### Run the backing services

➜ `docker-compose up -d`

###### Run the migration

➜ `npm run typeorm migration:run`

###### Run the tests

➜ `npm run test`

###### Start the development environment

➜ `npm run start:dev`

## Generate the migration

➜ `npm run typeorm migration:create -- -n name-of-the-migration`

## Seed scripts

➜ Create users: `npm run seed-script:insert-test-users`

➜ Create vocabularies: `npm run seed-script:insert-vocabularies`

## Deploy to AWS Elastic Beanstalk

➜ Create an application at AWS Elastic Beanstalk

➜ Create a deployment pipeline at AWS CodePipeline

➜ Create the database at AWS RDS
> Carefully set VPC/Security groups

> Follow [this](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/rds-external-defaultvpc.html) to connect to the Amazon RDS instance in a VPC

➜ Set the environment variables at AWS Elastic Beanstalk

➜ Deploy!

## Change Log

-   `0.4.2`: Modified the cohort related APIs to accept usernames instead of user IDs
-   `0.4.1`: Added API for populating the new user with few vocabularies
-   `0.4.0`: Added authentication using JWT
-   `0.3.2`: Added validation for external links
-   `0.3.1`: Added vocabulary find/removal functionality
-   `0.3.0`: Added vocabulary creation/update functionality
-   `0.2.0`: Added cohort functionality
-   `0.1.0`: Added user functionality
