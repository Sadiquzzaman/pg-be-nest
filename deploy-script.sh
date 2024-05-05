#!/bin/bash
npm install
docker compose down
docker rmi progresstracker-backend:latest
cp .env.production .env
docker build -t progresstracker-backend:latest .
docker compose up -d
echo "Deployment completed at $(date)" >> deployment.log