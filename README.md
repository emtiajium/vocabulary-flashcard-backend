# How to Run

###### Prerequisites

➜ Install Node 14 LTS

➜ Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

###### Clone the repo and install all dependencies

➜ `git clone git@bitbucket.org:sheenab/ielts-gibberish.git`

➜ `cd ielts-gibberish`

➜ `npm install`

###### Create your configuration running the command below and editing the .env environment

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

## Deploy to Heroku

➜ [Install Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

➜ Set the environment variables by navigating to the Heroku dashboard's settings' tab

➜ Modify the environment `NPM_CONFIG_PRODUCTION` using the command: `heroku config:set NPM_CONFIG_PRODUCTION=false`

➜ Follow the [steps](https://devcenter.heroku.com/articles/deploying-nodejs)

## Change Log

-   `0.3.1`: Added vocabulary search/removal functionality
-   `0.3.0`: Added vocabulary creation/update functionality
-   `0.2.0`: Added cohort functionality
-   `0.1.0`: Added user functionality
