#!/bin/bash

# Build and start the Docker containers
docker-compose up --build -d

# Show which containers are running
echo "YapYap services started!"
echo "---------------------"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "---------------------"
echo "To stop the services, run: docker-compose down"

# Follow the logs
docker-compose logs -f