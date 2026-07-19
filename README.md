# Task Management REST API – DevOps Project

## Overview

This project is a full-stack Task Management application built using Node.js and Express. It demonstrates complete DevOps implementation including structured Git workflow, Docker containerization, Jenkins CI/CD automation, DockerHub image publishing, and deployment on AWS EC2.

The application allows users to create, retrieve, update, and delete tasks through a REST API and a simple frontend interface.

---

## Team Members

- Darun Kumar M M – Backend Development  
- Akshata Ramgopal – Docker Containerization  
- Karthik Saravanan – Jenkins CI/CD Pipeline  
- Lokesh Kumar G R – AWS EC2 Deployment  

---

## Technology Stack

- Runtime: Node.js  
- Framework: Express.js  
- Frontend: HTML, CSS, JavaScript (served from `public/`)  
- Storage: In-memory array  
- Containerization: Docker  
- CI/CD: Jenkins  
- Container Registry: DockerHub  
- Cloud Platform: AWS EC2  
- Default Port: 3000  

---

## Project Structure

```
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
```

---

## Application Architecture

Frontend → Express Backend → In-Memory Storage  
Jenkins → Docker Build → DockerHub → AWS EC2 Deployment  

The frontend is served using Express static middleware.  
The backend exposes REST API endpoints under `/tasks`.

---

## API Endpoints

### Create Task
Endpoint: POST /tasks  

Request Body:
```json
{
  "title": "Task title"
}
```

Response:
```json
{
  "id": 1,
  "title": "Task title",
  "completed": false
}
```

---

### Get All Tasks
Endpoint: GET /tasks  

---

### Update Task
Endpoint: PUT /tasks/:id  

---

### Delete Task
Endpoint: DELETE /tasks/:id  

---

## Running the Application Locally

### Prerequisites

- Node.js (v14 or higher)  
- npm  
- Git  

### Installation

```bash
git clone https://github.com/<your-username>/devops_project.git
cd devops_project
npm install
npm start
```

Application URLs:

Frontend:
http://localhost:3000/

API:
http://localhost:3000/tasks

---

## Docker Implementation

### Build Docker Image

```bash
docker build -t task-api .
```

### Run Docker Container

```bash
docker run -d -p 3000:3000 task-api
```

Access:
http://localhost:3000

Stop container:

```bash
docker ps
docker stop <container-id>
```

---

## DockerHub Integration

Manual push (if required):

```bash
docker tag task-api <dockerhub-username>/task-api
docker push <dockerhub-username>/task-api
```

---

## Jenkins CI/CD Pipeline

Pipeline Stages:

1. Clone Repository  
2. Install Dependencies  
3. Build Application  
4. Build Docker Image  
5. Push Docker Image to DockerHub  
6. Deploy to AWS EC2  

Pipeline configuration is defined in `Jenkinsfile`.

---

## AWS EC2 Deployment

Deployment Steps:

1. Launch EC2 instance  
2. Install Docker  
3. Pull image from DockerHub  
4. Run container  

Application URL:

http://<EC2-Public-IP>:3000

---

## Git Workflow

### Branch Strategy

- main – Production-ready  
- dev – Development branch  
- feature/* – Feature branches  

### Feature Development

```bash
git checkout dev
git checkout -b feature/<feature-name>
git add .
git commit -m "Descriptive commit message"
git push origin feature/<feature-name>
```

Pull Request Flow:

feature/<feature-name> → dev → main

---

## DevOps Implementation Summary

- User stories defined  
- Git workflow implemented  
- Docker containerization completed  
- Jenkins CI pipeline implemented  
- Docker image pushed to DockerHub  
- Application deployed to AWS EC2  

---

## License

ISC
