# API Testing Guide

## Quick Start

1. **Start the server:**
```bash
npm start
```

You should see: `Task Management API running on http://localhost:3000`

---

## Test Scenarios

### Scenario 1: Create Tasks

**Request:**
```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Complete DevOps Project\"}"
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "Complete DevOps Project",
  "completed": false
}
```

---

### Scenario 2: View All Tasks

**Request:**
```bash
curl http://localhost:3000/tasks
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "title": "Complete DevOps Project",
    "completed": false
  }
]
```

---

### Scenario 3: Update Task

**Request:**
```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d "{\"completed\":true}"
```

**Expected Response:**
```json
{
  "id": 1,
  "title": "Complete DevOps Project",
  "completed": true
}
```

---

### Scenario 4: Delete Task

**Request:**
```bash
curl -X DELETE http://localhost:3000/tasks/1
```

**Expected Response:**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Postman Collection

### Setup
1. Open Postman
2. Create new Collection: "Task Management API"
3. Add requests as shown below

### Request 1: Create Task
- **Method:** POST
- **URL:** `http://localhost:3000/tasks`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "title": "Learn Docker"
}
```

### Request 2: Get All Tasks
- **Method:** GET
- **URL:** `http://localhost:3000/tasks`

### Request 3: Update Task
- **Method:** PUT
- **URL:** `http://localhost:3000/tasks/1`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "title": "Learn Docker and Kubernetes",
  "completed": true
}
```

### Request 4: Delete Task
- **Method:** DELETE
- **URL:** `http://localhost:3000/tasks/1`

---

## Error Testing

### Test 1: Create task without title
```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{}"
```
**Expected:** `400 Bad Request` with error message

### Test 2: Update non-existent task
```bash
curl -X PUT http://localhost:3000/tasks/999 -H "Content-Type: application/json" -d "{\"completed\":true}"
```
**Expected:** `404 Not Found` with error message

### Test 3: Delete non-existent task
```bash
curl -X DELETE http://localhost:3000/tasks/999
```
**Expected:** `404 Not Found` with error message
