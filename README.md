# Task Manager

A full-stack task manager built with Spring Boot, React, MySQL, Docker Compose, and a REST API.

## Features

- Create tasks
- View all tasks
- Update task details
- Delete tasks
- Mark tasks as completed
- Java + Spring Boot backend
- React frontend
- MySQL persistence
- Dockerized database setup

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

### DevOps
- Docker Desktop
- Docker Compose

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

## Backend configuration

The app uses:

```properties
spring.datasource.url=jdbc:mysql://localhost:3307/taskmanager
spring.datasource.username=root
spring.datasource.password=root_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
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
  "title": "Learn Spring Boot",
  "description": "Build Task Manager API",
  "completed": false
}
```

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

## Common issue

If the backend fails with a database connection error, check:

1. Docker Desktop is running
2. `docker ps` shows the MySQL container
3. The MySQL port is `3307`
4. The app is configured to `localhost:3307`

Once those are correct, the project runs normally.