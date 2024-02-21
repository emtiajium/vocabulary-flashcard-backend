#!/bin/bash

certbotVersion=$(sudo certbot --version)
echo "Init ++++++++++ $(date) $certbotVersion"
certbotExists=true
if [[ $certbotVersion == '' ]]; then
    certbotExists=false
fi

if [[ $certbotExists == false ]]; then
    echo "Not exist ++++++++++ $(date)"
    sudo yum install python3 augeas-libs -y
    sudo python3 -m venv /opt/certbot/
    sudo /opt/certbot/bin/pip install --upgrade pip
    sudo /opt/certbot/bin/pip install certbot certbot-nginx
    # uninstalling urllib3 v2.0 to resolve the below mentioned error and gonna install v1
    # ImportError: urllib3 v2.0 only supports OpenSSL 1.1.1+, currently the 'ssl' module is compiled with 'OpenSSL 1.0.2k-fips  26 Jan 2017'. See: https://github.com/urllib3/urllib3/issues/2168
    sudo /opt/certbot/bin/pip uninstall urllib3 -y
    sudo /opt/certbot/bin/pip install urllib3==1.26.15
    sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
    echo "$(sudo certbot --version)"
fi

certificates=$(sudo certbot certificates)
echo "Certificates ++++++++++ $(date) $certificates"
domain=api.firecrackervocabulary.com
foundCertificatesSubString="Certificate Name: $domain"
certificatesExist=false
if [[ $certificates == *$foundCertificatesSubString* ]]; then
    certificatesExist=true
fi

echo $certificatesExist

if [[ $certificatesExist == false ]]; then
    sudo certbot --nginx -d $domain -m 271emtiaj@gmail.com -y

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
