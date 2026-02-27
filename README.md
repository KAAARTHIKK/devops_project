Task Management Application – DevOps Project
Overview

This project is a full-stack Task Management Application built using Node.js and Express. It demonstrates complete DevOps implementation including structured Git workflow, Docker containerization, CI/CD automation using Jenkins, Docker image publishing, and deployment on AWS EC2.

The application allows users to create, view, update, and delete tasks through a REST API and a simple frontend interface.

Technology Stack

Runtime: Node.js

Framework: Express.js

Frontend: HTML, CSS, JavaScript (served from public/)

Storage: In-memory array

Containerization: Docker

CI/CD: Jenkins

Container Registry: DockerHub

Cloud Deployment: AWS EC2

Version Control: Git & GitHub

Default Port: 3000

Project Structure
devops_project/
│
├── app.js
├── package.json
├── package-lock.json
├── Dockerfile
├── Jenkinsfile
├── public/
├── USER_STORIES.md
├── TESTING.md
├── README.md
└── .gitignore
Application Architecture

Frontend → Express Backend → In-memory Storage
Jenkins → Docker Build → DockerHub → AWS EC2 Deployment

The frontend is served using Express static middleware.
The backend exposes REST API endpoints under /tasks.
The Docker image is built automatically through Jenkins and deployed to AWS EC2.

API Endpoints
Create Task

POST /tasks

Request Body:

{
  "title": "Task title"
}

Response:

{
  "id": 1,
  "title": "Task title",
  "completed": false
}
Get All Tasks

GET /tasks

Update Task

PUT /tasks/:id

Delete Task

DELETE /tasks/:id

Running the Application Locally
Prerequisites

Node.js (v14 or higher)

npm

Git

Installation
git clone https://github.com/<your-username>/devops_project.git
cd devops_project
npm install
npm start

Application URLs:

Frontend:

http://localhost:3000/

API:

http://localhost:3000/tasks
Docker Implementation
Build Docker Image
docker build -t task-api .
Run Docker Container
docker run -d -p 3000:3000 task-api
DockerHub Integration

The Docker image is automatically built and pushed to DockerHub via Jenkins pipeline.

Manual push (if required):

docker tag task-api <dockerhub-username>/task-api
docker push <dockerhub-username>/task-api
Jenkins CI/CD Pipeline

The Jenkins pipeline consists of the following stages:

Clone Repository

Install Dependencies

Build Application

Build Docker Image

Push Docker Image to DockerHub

Deploy to AWS EC2 (via SSH)

Pipeline is defined in Jenkinsfile.

The pipeline ensures that every push to the repository triggers automatic build and deployment.

AWS EC2 Deployment

Deployment is performed on an AWS EC2 instance.

Steps:

Launch EC2 instance (Amazon Linux / Ubuntu)

Install Docker

Pull Docker image from DockerHub

Run container on port 3000

Application is accessible via:

http://<EC2-Public-IP>:3000
Git Workflow
Branch Strategy

main: Production-ready code

dev: Development branch

feature/*: Feature branches

All code promotion to main is done through Pull Requests.

DevOps Implementation Summary

User stories defined

Structured Git workflow implemented

Pull request-based promotion enforced

Docker containerization completed

Jenkins CI pipeline implemented

DockerHub image publishing completed

AWS EC2 deployment completed

Future Improvements

Add persistent database (MongoDB / PostgreSQL)

Implement authentication and authorization

Add automated unit and integration tests

Implement monitoring and logging (Prometheus / Grafana)

License

ISC
