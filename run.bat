@echo off
echo Building and starting YapYap services...

docker-compose up --build -d

echo.
echo YapYap services started!
echo ---------------------
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
echo ---------------------
echo To stop the services, run: docker-compose down
echo.

docker-compose logs -f