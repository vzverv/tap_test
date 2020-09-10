https://pm2.keymetrics.io/

Docker
run pm2
run few processes

use Winston

# Initialization
to run docker continers, from the root folder: docker-compose up -d
then to seed db structure: npm run enter-mysql
inside of container: mysql -uapp -p"secret" tap < /tmp/data/yashi_tables.sql

the password is exposed here only because it is a test and you can also find it among env vriables in the docker-compose file

# How to run

npm run execute

# DB params

from local
host 127.0.0.1
port 33061

if running from container
host tap-mysql
port 3306