#!/bin/bash

# write permission to the ec2-user
sudo chown ec2-user /etc/crontab

servicePort=$(/opt/elasticbeanstalk/bin/get-config environment -k PORT)
# I don't want to hit the health-check endpoint using the ec2/eb/https
endpoint=http://localhost:$servicePort/rest/ielts-service/v1/health
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

# below command is to resolve the error
# crond[5976]: (root) WRONG FILE OWNER (/etc/crontab)
sudo chown root /etc/crontab

# restart the cron daemon
sudo service crond restart
