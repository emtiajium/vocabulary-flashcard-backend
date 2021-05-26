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

## Change Log

-   `0.1.0`: Very first version
