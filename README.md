# 🤖 PrepAI — AI Interview Preparation Platform

A full-stack AI-powered mock interview simulator built with Spring Boot, React, and Claude AI.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java (JDK) | 17+ | Already installed ✅ |
| MySQL | 8+ | Already installed ✅ |
| Node.js + npm | 18+ | `brew install node` |
| Maven | 3.9+ | `brew install maven` |

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Configure the database & API key

Open `backend/src/main/resources/application.properties` and update:

```properties
spring.datasource.password=YOUR_MYSQL_PASSWORD
anthropic.api.key=YOUR_CLAUDE_API_KEY
```

> Get your Claude API key at: https://console.anthropic.com/

### Step 2 — Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts at **http://localhost:8080**

MySQL database `interview_platform` is auto-created on first run.

### Step 3 — Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The app opens at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
interview-platform/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/interviewprep/
│   │   ├── controller/               # REST controllers
│   │   │   ├── AuthController.java
│   │   │   ├── ResumeController.java
│   │   │   └── InterviewController.java
│   │   ├── service/                  # Business logic
│   │   │   ├── GeminiService.java    # All Claude AI calls
│   │   │   ├── AuthService.java
│   │   │   ├── ResumeService.java
│   │   │   └── InterviewService.java
│   │   ├── model/                    # JPA entities
│   │   ├── repository/               # Spring Data repos
│   │   ├── security/                 # JWT auth
│   │   ├── dto/                      # Request/Response DTOs
│   │   └── config/                   # Security config
│   └── src/main/resources/
│       └── application.properties    # ← Edit this first!
│
└── frontend/                         # React app
    └── src/
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js      # Score trends + history
        │   ├── UploadPage.js         # Resume upload + role selection
        │   ├── InterviewPage.js      # Live interview + AI feedback
        │   └── ResultsPage.js        # Full session breakdown + radar chart
        ├── services/api.js           # All API calls
        ├── context/AuthContext.js    # JWT auth state
        └── components/Layout.js     # Sidebar navigation
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register |
| POST | /api/auth/login | None | Login → JWT |
| POST | /api/resume/upload | JWT | Upload PDF |
| GET | /api/resume/{id}/skills | JWT | Extracted skills |
| POST | /api/sessions/start | JWT | Start interview |
| POST | /api/sessions/{id}/answers/{qId} | JWT | Submit + evaluate answer |
| GET | /api/sessions/{id}/results | JWT | Session results |
| GET | /api/dashboard/summary | JWT | User dashboard data |

---

## 🤖 How Groq AI is Used
<img width="1440" height="818" alt="Screenshot 2026-03-10 at 8 53 22 PM" src="https://github.com/user-attachments/assets/ca82f5d6-b0ea-4ae3-a519-8a850976c28c" />
1. **Resume Parsing** — Extracts skills, experience level, and recommended roles from PDF text
<img width="1440" height="821" alt="Screenshot 2026-03-10 at 8 53 44 PM" src="https://github.com/user-attachments/assets/7d64f21f-77da-407b-9617-883877435404" />
2. **Question Generation** — Creates tailored questions (technical/conceptual/behavioral) based on skills + role  
<img width="1440" height="821" alt="Screenshot 2026-03-10 at 8 54 01 PM" src="https://github.com/user-attachments/assets/b8514204-4d44-48e0-9106-ef96176ec291" />

3. **Answer Evaluation** — Scores answers 0–100 with strengths, improvements, and study topics

All prompts are in `ClaudeService.java` and designed to return structured JSON.

---

## 🛠️ Troubleshooting

**MySQL connection error:**
```bash
mysql -u root -p
CREATE DATABASE interview_platform;
```

**Port 8080 already in use:**
```bash
lsof -i :8080 | grep LISTEN
kill -9 <PID>
```

**Node.js not found:**
```bash
brew install node
```

**Maven not found:**
```bash
brew install maven
```

---

## 🧱 Tech Stack

- **Backend:** Spring Boot 3, Spring Security, JPA/Hibernate, MySQL, JWT
- **Frontend:** React 18, React Router 6, Recharts, Axios, Lucide icons
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **PDF:** Apache PDFBox

👩‍💻 Developers
Name                   GitHub
Vishakha Chaudhari---- @vishakhachaudhari
Vivek Behera------     @vivekbehera240
