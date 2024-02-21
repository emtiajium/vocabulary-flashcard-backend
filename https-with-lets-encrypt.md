This readme is applicable if you do not use AWS Elastic Load Balancer because if you want to get a free certificate from
the AWS Certificate Manager, you must use ELB.

Read about [Let's Encrypt](https://letsencrypt.org/getting-started/).

Connect with your EC2 instance using SSH and perform the instructions mentioned
in [Certbot](https://certbot.eff.org/instructions?ws=nginx&os=pip). Certbot will update the `/etc/nginx.conf` file for
you if you execute the command `sudo certbot --nginx -d <your-domain>`.

To make sure the cron job is created (to renew the expired certificate), please check the `/etc/crontab` file.

To check the status of the cron daemon, execute the command `sudo service crond status`.

If the status is not `active (running)`, execute the command `sudo service crond start`.

Apart from the status, it might return a few logs. If you see any errors, resolve those by googling. For
example, `crond[5976]: (root) WRONG FILE OWNER (/etc/crontab)` will be resolved if we give the root user the correct
ownership by executing the command `sudo chown root /etc/crontab`.

All cron jobs' logs are available in `/var/log/cron`. This file should have one or multiple entries depending on the
execution schedule. For example, if the execution schedule is `0 0,12 * * *`, it is supposed to run the job every day
at `00:00:00` and `12:00:00` and create two entries in the file.

After each deployment, AWS Elastic Beanstalk (AEB) will replace the `/etc/nginx.conf`, which will disable HTTPS. To avoid this, you need to [extend the Linux platform](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-linux-extend.html). Please check [.platform/nginx/conf.d/lets-encrypt-nginx.conf](./.platform/nginx/conf.d/lets-encrypt-nginx.conf) how I did.

The whole process of installing certbot, getting the certificate and auto-renewal can be automated by [extending the Linux platform](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-linux-extend.html). Please check [.platform/hooks/predeploy/https.sh](.platform/hooks/prebuild/https.sh) how I did.
