# Intro
This is a test task for TapCanada

I used functional approach to solve the task

It could be OOP based solution too, but I decided to follow the KISS principle

# Quick start

After you clone the project run

npm install

then

npm run start

you should see the result in console

# Docker
This step is not required

to run docker containers, run from the root folder: 

docker-compose up -d

After this operation is succeed you should see 2 containers running: nodejs and mysql

# DB
you can skipp this section, since this implementation doesn't write anything to DB

then to seed db structure: npm run enter-mysql

you should be now inside of the mysql container

inside of container: mysql -uapp -p"secret" tap < /tmp/data/yashi_tables.sql

# DB params

from local

host 127.0.0.1

port 33061

if running from container

host tap-mysql

port 3306

the password is exposed here only because it is a test and you can also find it among env variables in the docker-compose file

# How to run

in container

npm run exec-in-docker

from local

npm run start
