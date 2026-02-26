# User Stories

## Functional User Stories

### US-1: Create Task
**As a** user,  
**I should** be able to create a new task with a title and description,  
**so that** I can keep track of things I need to do.

**Acceptance Criteria:**
- API endpoint: `POST /tasks`
- Request body includes `title` and `description`
- Returns created task with unique ID and timestamp

---

### US-2: View All Tasks
**As a** user,  
**I should** be able to view all my tasks,  
**so that** I can see what needs to be done.

**Acceptance Criteria:**
- API endpoint: `GET /tasks`
- Returns array of all tasks
- Each task includes ID, title, description, and timestamp

---

### US-3: Update Task
**As a** user,  
**I should** be able to update an existing task,  
**so that** I can modify task details as requirements change.

**Acceptance Criteria:**
- API endpoint: `PUT /tasks/:id`
- Request body includes updated `title` and/or `description`
- Returns updated task details

---

### US-4: Delete Task
**As a** user,  
**I should** be able to delete a task,  
**so that** I can remove completed or unnecessary tasks.

**Acceptance Criteria:**
- API endpoint: `DELETE /tasks/:id`
- Removes task from the system
- Returns success confirmation

---

## DevOps User Stories

### US-5: Version Control Setup
**As a** developer,  
**I should** have a GitHub repository with proper branching strategy,  
**so that** the team can collaborate effectively without code conflicts.

**Acceptance Criteria:**
- Repository created with main branch
- Branch protection rules configured
- All team members have access
- README.md with project documentation

---

### US-6: Dockerization
**As a** DevOps engineer,  
**I should** containerize the application using Docker,  
**so that** it runs consistently across different environments.

**Acceptance Criteria:**
- Dockerfile created for Node.js application
- Docker image builds successfully
- Container runs application on specified port
- docker-compose.yml for easy deployment

---

### US-7: CI/CD Pipeline
**As a** DevOps engineer,  
**I should** set up a Jenkins CI/CD pipeline,  
**so that** code changes are automatically tested and deployed.

**Acceptance Criteria:**
- Jenkinsfile configured in repository
- Pipeline triggers on code push
- Automated build and Docker image creation
- Pipeline status visible in Jenkins dashboard

---

### US-8: Automated Testing
**As a** developer,  
**I should** have automated tests in the CI pipeline,  
**so that** bugs are caught before deployment.

**Acceptance Criteria:**
- Unit tests for API endpoints
- Tests run automatically in Jenkins pipeline
- Build fails if tests don't pass
- Test coverage report generated

---

### US-9: Cloud Deployment (Optional)
**As a** DevOps engineer,  
**I should** deploy the application to AWS EC2,  
**so that** it is accessible over the internet.

**Acceptance Criteria:**
- EC2 instance provisioned
- Application deployed and running
- Security groups configured properly
- Public URL accessible

---

## Team Collaboration Stories

### US-10: Code Review Process
**As a** team member,  
**I should** follow a pull request workflow,  
**so that** code quality is maintained through peer review.

**Acceptance Criteria:**
- Feature branches created for new work
- Pull requests required for merging to main
- At least one team member reviews before merge
- CI checks pass before merge allowed
