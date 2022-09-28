#!/bin/bash

echo "*/1 * * * * root curl -X 'GET' \
    'https://api.firecrackervocabulary.com/rest/ielts-service/v1/health' \
    -H 'X-Client-Id: Health-Monitoring-Cron-Job' \
    -H 'accept: application/json'" | sudo tee -a /etc/crontab > /dev/null
