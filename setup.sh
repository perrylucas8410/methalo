#!/bin/bash

sudo apt update
sudo apt install -y nginx nodejs npm

cd backend/ultraviolet
npm install

sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

sudo cp ../../nginx/methalo.conf /etc/nginx/sites-available/methalo.conf
sudo ln -s /etc/nginx/sites-available/methalo.conf /etc/nginx/sites-enabled/
sudo systemctl restart nginx
