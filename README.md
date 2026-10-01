# TaskFlow

TaskFlow is a full-stack personal productivity task manager built with Spring Boot, React, MySQL, and Docker Compose. It supports authenticated, user-owned tasks with priority, status, due dates, filtering, sorting, and dashboard statistics.

## Features

- JWT registration, login, session restore, and logout
- Create, edit, complete, and delete tasks
- Priority levels: `LOW`, `MEDIUM`, `HIGH`
- Status values: `TODO`, `IN_PROGRESS`, `COMPLETED`
- Optional due dates with overdue, today, upcoming, and no-date states
- Search by task title or description
- Filter by status, priority, or due-date state
- Sort by due date, priority, or title
- Dashboard counts for total, completed, in-progress, and overdue tasks
- User ownership enforced from the authenticated principal
- Friendly validation errors for invalid task data

## Tech Stack

### Backend
- Java 25
- Spring Boot 4.0.7
- Spring Web
- Spring Data JPA
- Validation
- Maven

### Frontend
- React
- Vite
- JavaScript
- CSS

### Database
- MySQL 8.4
- H2 in-memory database for backend tests

### DevOps
- Docker Desktop
- Docker Compose

## Task model

Each task has a title, optional description, priority, status, and optional due date. The `status` field is the source of truth for completion. The legacy `completed` field is still accepted for compatibility with older clients, but new clients should use `status`.

The backend never accepts a user ID from the frontend to determine ownership. The authenticated JWT principal controls which tasks can be listed, edited, or deleted.

## Project Structure

```text
D:\GitHub_Projects\taskmanager
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
├── taskmanager/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── ...
└── .gitignore
```

## Required setup

### 1) Install Docker Desktop
Install Docker Desktop on Windows and make sure it is running.

### 2) Start the MySQL container
From the project root:

```powershell
cd D:\GitHub_Projects\taskmanager
docker compose up -d
```

This starts MySQL on:

```text
localhost:3307 -> 3306
```

The database is configured as:

- Database: `taskmanager`
- Username: `root`
- Password: `root_password`

Docker Compose also creates a `taskmanager` user with password `taskmanager_password`, but the checked-in `application.properties` currently connects as `root`.

## Backend configuration

The app uses:

```properties
spring.datasource.url=jdbc:mysql://localhost:3307/taskmanager
spring.datasource.username=root
spring.datasource.password=root_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

### JWT configuration

The backend requires `JWT_SECRET` at startup. It must be a Base64-encoded random key containing at least 32 bytes. Generate a development-only key in PowerShell with:

```powershell
$bytes = New-Object byte[] 32
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$rng.GetBytes($bytes)
$rng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($bytes)
```

Keep the secret outside source control. Production deployments should provide it through a secret manager or environment configuration.

Because existing task rows were development-only data and have no owner, clear them before the first authenticated backend startup:

```powershell
docker exec taskmanager-mysql mysql -uroot -proot_password -D taskmanager -e "DELETE FROM tasks;"
```

## Run the backend

From the backend folder:

```powershell
cd D:\GitHub_Projects\taskmanager\taskmanager
./mvnw spring-boot:run
```

The Spring Boot app runs on:

```text
http://localhost:8080
```

## API endpoints

Authentication endpoints:

```http
POST http://localhost:8080/api/auth/register
POST http://localhost:8080/api/auth/login
GET  http://localhost:8080/api/auth/me
```

Task endpoints require an `Authorization: Bearer <token>` header and return only the authenticated user's tasks.

### Get all tasks
```http
GET http://localhost:8080/api/tasks
```

### Create task
```http
POST http://localhost:8080/api/tasks
```

Example body:

```json
{
  "title": "Prepare project demo",
  "description": "Show the dashboard and task filters",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "dueDate": "2026-10-15"
}
```

`dueDate` is optional and uses `YYYY-MM-DD`. `priority` defaults to `MEDIUM` and `status` defaults to `TODO` when omitted.

### Update task
```http
PUT http://localhost:8080/api/tasks/{id}
```

### Delete task
```http
DELETE http://localhost:8080/api/tasks/{id}
```

## Run the frontend

From the frontend folder:

```powershell
cd D:\GitHub_Projects\taskmanager\frontend
npm install
npm run dev
```

The frontend typically runs on:

```text
http://localhost:5173
```

## Validate and package

Run the frontend checks:

```powershell
cd D:\GitHub_Projects\taskmanager\frontend
npm run lint
npm run build
```

Run backend tests and create the production JAR:

```powershell
cd D:\GitHub_Projects\taskmanager\taskmanager
.\mvnw.cmd test
.\mvnw.cmd package -DskipTests
```

The packaged backend is written to `taskmanager/target/taskmanager-0.0.1-SNAPSHOT.jar`.

## Verify the app

### Check Docker
```powershell
docker ps
```

You should see the MySQL container running on port `3307`.

### Check backend health
Open:

```text
http://localhost:8080/api/tasks
```

### Check MySQL table
```powershell
docker exec taskmanager-mysql mysql -uroot -proot_password -D taskmanager -e "SHOW TABLES;"
```

## Notes

- Do not change the port mapping from `3307:3306` unless the port is free and you also update the app config.
- The project is already set up to work with the existing package layout under `com.dimasha.taskmanager`.
- The backend expects Docker Desktop and the MySQL container to be running before the Spring Boot app starts.
- Do not commit database passwords or JWT secrets.

## Common issue

If the backend fails with a database connection error, check:

1. Docker Desktop is running
2. `docker ps` shows the MySQL container
3. The MySQL port is `3307`
4. The app is configured to `localhost:3307`
5. `JWT_SECRET` is set in the same terminal used to start Spring Boot

Once those are correct, the project runs normally.