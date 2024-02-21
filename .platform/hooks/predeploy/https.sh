#!/bin/bash

certbotVersion=$(sudo certbot --version)
certbotExists=true
if [[ $certbotVersion == '' ]]; then
    certbotExists=false
fi

if [[ $certbotExists == false ]]; then
    sudo yum install python3 augeas-libs -y
    sudo python3 -m venv /opt/certbot/
    sudo /opt/certbot/bin/pip install --upgrade pip
    sudo /opt/certbot/bin/pip install certbot certbot-nginx
    sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
    sudo certbot --nginx -d api.firecrackervocabulary.com

    renewalCommand='sudo certbot renew -q'
    renewalCommandExists=false

    while read -r currentLine
        do
            if [[ $currentLine == *$renewalCommand* ]]; then
                renewalCommandExists=true
            fi
    done < "/etc/crontab"

    if [[ $renewalCommandExists == false ]]; then
        # write permission to the ec2-user
        sudo chown ec2-user /etc/crontab

        echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew -q" | sudo tee -a /etc/crontab > /dev/null

        # below command is to resolve the error
        # crond[5976]: (root) WRONG FILE OWNER (/etc/crontab)
        sudo chown root /etc/crontab

        # restart the cron daemon
        sudo service crond restart
    fi
fi
