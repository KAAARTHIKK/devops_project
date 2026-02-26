# Task Management REST API - DevOps Project

A simple Task Management REST API built with Node.js and Express for demonstrating DevOps practices including Git workflow, Docker containerization, and CI/CD pipeline.

## Team Members
- Member 1
- Member 2
- Member 3
- Member 4

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Storage:** In-memory (array)
- **Port:** 3000

## Project Structure
```
devops_project/
├── app.js              # Main application file
├── package.json        # Node.js dependencies
├── .gitignore         # Git ignore rules
├── USER_STORIES.md    # User stories documentation
└── README.md          # Project documentation
```

## API Endpoints

### 1. Create Task
- **Endpoint:** `POST /tasks`
- **Body:** `{ "title": "Task title" }`
- **Response:** `{ "id": 1, "title": "Task title", "completed": false }`

### 2. Get All Tasks
- **Endpoint:** `GET /tasks`
- **Response:** `[{ "id": 1, "title": "Task title", "completed": false }]`

### 3. Update Task
- **Endpoint:** `PUT /tasks/:id`
- **Body:** `{ "title": "Updated title", "completed": true }`
- **Response:** `{ "id": 1, "title": "Updated title", "completed": true }`

### 4. Delete Task
- **Endpoint:** `DELETE /tasks/:id`
- **Response:** `{ "message": "Task deleted successfully" }`

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KAAARTHIKK/devops_project.git
cd devops_project
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Testing the API

### Using cURL

**Create a task:**
```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn DevOps\"}"
```

**Get all tasks:**
```bash
curl http://localhost:3000/tasks
```

**Update a task:**
```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d "{\"completed\":true}"
```

**Delete a task:**
```bash
curl -X DELETE http://localhost:3000/tasks/1
```

### Using Postman

1. Open Postman
2. Create a new request
3. Set the method (GET, POST, PUT, DELETE)
4. Enter URL: `http://localhost:3000/tasks`
5. For POST/PUT, add JSON body in the Body tab (select raw → JSON)
6. Click Send

### Using Browser (GET only)

Open browser and navigate to:
```
http://localhost:3000/tasks
```

## Git Workflow

### Branch Strategy
- **main:** Production-ready code
- **dev:** Development branch
- **feature/*:** Feature branches

### Creating a Feature Branch

1. Switch to dev branch:
```bash
git checkout dev
```

2. Create feature branch:
```bash
git checkout -b feature/task-api
```

3. Make changes and commit:
```bash
git add .
git commit -m "Add Task Management API implementation"
```

4. Push to GitHub:
```bash
git push origin feature/task-api
```

5. Create Pull Request on GitHub:
   - Go to repository on GitHub
   - Click "Compare & pull request"
   - Set base: `dev` ← compare: `feature/task-api`
   - Add description and create PR
   - Request review from team member
   - Merge after approval

## User Stories

See [USER_STORIES.md](USER_STORIES.md) for detailed user stories.

## Future Enhancements
- [ ] Add Docker containerization
- [ ] Implement Jenkins CI/CD pipeline
- [ ] Add unit tests
- [ ] Deploy to AWS EC2
- [ ] Add database integration
- [ ] Implement authentication

## License
ISC
