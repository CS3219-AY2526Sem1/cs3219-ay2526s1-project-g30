@echo off
echo =====================================
echo Starting Question Service (Docker)...
echo =====================================

REM Stop old container if it's running
docker stop question-service >nul 2>&1
docker rm question-service >nul 2>&1

REM Build the Docker image
echo Building Docker image...
docker build -t question-service .

REM Run the container
echo Running Question Service on port 4000...
docker run -d --name question-service -p 4000:4000 --env-file .env question-service

echo.
echo ✅ Question Service is now running!
echo 🌐 Access it at: http://localhost:4000/api/questions
echo =====================================
pause