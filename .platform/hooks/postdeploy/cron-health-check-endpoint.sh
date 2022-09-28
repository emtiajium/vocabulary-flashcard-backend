#!/bin/bash

endpoint=https://api.firecrackervocabulary.com/rest/ielts-service/v1/health
clientId=Health-Monitoring-Cron-Job

isExist=false

while read -r currentLine
    do
        if [[ $currentLine == *$clientId* ]]; then
            isExist=true
        fi
done < "/etc/crontab"

if [[ $isExist == false ]]; then
    echo "*/1 * * * * root curl -X 'GET' '$endpoint' -H 'X-Client-Id: $clientId' -H 'accept: application/json'" | sudo tee -a /etc/crontab > /dev/null
fi
