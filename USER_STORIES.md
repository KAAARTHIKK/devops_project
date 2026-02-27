# User Stories – Task Management DevOps Project

## Project Context

This project implements a Task Management application with a frontend interface, REST API backend, Docker containerization, CI/CD automation using Jenkins, and deployment on AWS EC2.

The following user stories capture both functional requirements and DevOps implementation requirements.

---

# Functional User Stories

---

## US-1: Create Task

**As a user**,  
I want to create a new task with a title and description,  
so that I can manage and track my work items.

### Acceptance Criteria

- API endpoint: `POST /tasks`
- Request body must include:
  - `title`
  - `description`
- A unique ID is generated automatically
- A timestamp is recorded
- Task is stored in memory
- API returns the created task object
- Proper error returned if required fields are missing

---

## US-2: View All Tasks

**As a user**,  
I want to view all created tasks,  
so that I can see what needs to be completed.

### Acceptance Criteria

- API endpoint: `GET /tasks`
- Returns an array of tasks
- Each task includes:
  - `id`
  - `title`
  - `description`
  - `timestamp`
- Returns empty array if no tasks exist

---

## US-3: Update Task

**As a user**,  
I want to update an existing task,  
so that I can modify its details when necessary.

### Acceptance Criteria

- API endpoint: `PUT /tasks/:id`
- Allows updating:
  - `title`
  - `description`
- Updated task replaces old data in memory
- API returns updated task object
- Returns appropriate error if task ID is invalid

---

## US-4: Delete Task

**As a user**,  
I want to delete a task,  
so that I can remove completed or unnecessary items.

### Acceptance Criteria

- API endpoint: `DELETE /tasks/:id`
- Task is removed from in-memory storage
- Returns success confirmation message
- Returns error if task ID does not exist

---

## US-5: Frontend Interaction

**As a user**,  
I want a simple web interface to interact with the API,  
so that I can manage tasks without using external tools.

### Acceptance Criteria

- Frontend served from `public/` directory
- User can:
  - Create tasks
  - View tasks
  - Delete tasks
- Frontend communicates with backend using REST API
- UI loads correctly on `http://localhost:3000`

---

# DevOps User Stories

---

## US-6: Git Repository and Branching Strategy

**As a developer**,  
I want a properly structured Git repository with branch protection,  
so that the team can collaborate efficiently.

### Acceptance Criteria

- GitHub repository created
- Branches:
  - `main` (production)
  - `dev` (development)
  - `feature/*` (feature branches)
- Pull requests required for merging into `dev` and `main`
- Proper commit history maintained
- `.gitignore` file configured
- `README.md` and documentation added

---

## US-7: Docker Containerization

**As a DevOps engineer**,  
I want the application containerized using Docker,  
so that it runs consistently across environments.

### Acceptance Criteria

- `Dockerfile` created
- Docker image builds successfully
- Application runs using:
  ```
  docker run -p 3000:3000 task-api
  ```
- Application accessible on port 3000
- `.dockerignore` file included

---

## US-8: Continuous Integration Pipeline

**As a DevOps engineer**,  
I want a Jenkins pipeline configured,  
so that code changes are automatically built and packaged.

### Acceptance Criteria

- `Jenkinsfile` present in repository
- Pipeline stages include:
  - Clone repository
  - Install dependencies
  - Build application
  - Build Docker image
  - Push Docker image to DockerHub
- Pipeline triggers on code push
- Build fails if any stage fails
- Pipeline status visible in Jenkins dashboard

---

## US-9: DockerHub Integration

**As a DevOps engineer**,  
I want the Docker image pushed to DockerHub,  
so that it can be deployed from a central registry.

### Acceptance Criteria

- DockerHub account configured
- Image tagged correctly
- Image pushed automatically via Jenkins
- Image publicly accessible

---

## US-10: Cloud Deployment on AWS EC2

**As a DevOps engineer**,  
I want to deploy the containerized application on AWS EC2,  
so that it is accessible over the internet.

### Acceptance Criteria

- EC2 instance provisioned
- Docker installed on EC2
- Image pulled from DockerHub
- Container running on port 3000
- Security group allows inbound traffic on port 3000
- Application accessible via public IP

---

# Collaboration & Quality Stories

---

## US-11: Pull Request and Code Review Workflow

**As a team member**,  
I want all changes to go through pull requests,  
so that code quality and collaboration standards are maintained.

### Acceptance Criteria

- All features developed in `feature/*` branches
- Pull request required before merge
- At least one review before merge
- CI pipeline must pass before merging
- Merge history visible in repository

---

# Summary

This project successfully integrates:

- Functional REST API development
- Frontend integration
- Git-based collaboration
- Docker containerization
- Jenkins CI/CD automation
- DockerHub image management
- AWS EC2 cloud deployment

The user stories above define the complete scope of the project.
