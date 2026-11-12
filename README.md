# 🔎 LOST AND FOUND

### Find It. Report It. Reunite It.

**LOST AND FOUND** is a full-stack web application designed to simplify the process of reporting, searching, and managing lost and found belongings.

The platform provides a centralized digital system where users can report missing items, submit found-item reports, browse existing listings, and connect with people who may have information about their belongings.

The project is evolving from a basic web application into a modern **MERN stack application**, with an improved user interface, scalable backend architecture, and database integration.

---

## 📌 Problem Statement

Losing personal belongings is a common problem in colleges, workplaces, public places, transportation hubs, and other shared environments.

Traditional lost-and-found systems rely on notice boards, security desks, or word-of-mouth communication, making it difficult to locate missing belongings efficiently.

**LOST AND FOUND** aims to solve this problem by providing a centralized digital platform that allows users to:

- Report lost belongings.
- Report items they have found.
- Browse available lost and found reports.
- Search for specific items.
- Filter reports by item status.
- Track recovered items.
- Manage their reports through a user-friendly interface.

---

## 🎯 Objectives

- Develop a centralized Lost and Found Management System.
- Provide an intuitive and responsive user interface.
- Allow users to report lost and found items.
- Implement search and filtering functionality.
- Provide secure user authentication.
- Store and manage item reports efficiently.
- Connect the frontend with a REST API backend.
- Improve scalability through database integration.
- Create a platform that can be extended with intelligent item-matching capabilities.

---

## ✨ Key Features

### 1. Lost Item Reporting
Users can submit reports about belongings they have lost, including:
- Item name
- Description
- Category
- Location
- Date
- Contact information

### 2. Found Item Reporting
Users can report belongings they have discovered, helping the original owners identify and recover them.

### 3. Browse Reports
View available lost and found reports through a centralized interface.

### 4. Search and Filtering
Search for items using relevant keywords and filter reports based on Lost or Found status.

### 5. Item Management
Manage submitted reports, update their status, mark recovered items as resolved, and remove unnecessary reports.

### 6. User Authentication
The Phase 2 development introduces user authentication as part of the platform's expanded architecture.

---

## 🛠️ Technologies Used

### Phase 1 – Basic Web Application

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend functionality |
| Node.js | Backend runtime |
| Express.js | REST API development |
| JSON | Initial data storage |

### Phase 2 – MERN Stack Migration

| Technology | Purpose |
|---|---|
| React.js | Component-based frontend |
| Vite | Frontend development and build tool |
| Node.js | Backend runtime |
| Express.js | Backend API and routing |
| MongoDB Atlas | Cloud database |
| JWT | Authentication architecture |
| bcrypt | Password hashing |

---

## 🏗️ Project Development

### Phase 1 – Basic Web Application

The initial version was developed using HTML, CSS, JavaScript, Node.js, and Express.js.

**Implemented functionality:**
- Lost item reporting
- Found item reporting
- Item listing
- Search functionality
- Lost / Found filtering
- Individual item retrieval
- Mark items as resolved
- Delete item reports
- REST API integration
- JSON-based data storage

### Phase 2 – MERN Stack Migration

The second phase focuses on transforming the initial application into a modern MERN stack platform.

**Development objectives:**
- Migrate the frontend to React.js.
- Introduce Vite for frontend development.
- Integrate MongoDB Atlas for database management.
- Improve backend architecture using Express.js.
- Introduce secure authentication.
- Improve UI design and user experience.
- Build a scalable foundation for additional features.

---

## 📂 Project Structure

The project is organized into separate frontend and backend directories.

```text
LOST_AND_FOUND/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore
```

*Note: This is a high-level structure; individual files may vary as development progresses.*

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Git
- MongoDB Atlas account (for the Phase 2 database configuration)

### 1. Clone the Repository

```bash
git clone https://github.com/prahalladnbsc24-max/LOST_AND_FOUND.git
```

```bash
cd LOST_AND_FOUND
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Configure the required environment variables in the backend `.env` file.

Start the backend:

```bash
npm start
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the application.

---

## 🔮 Future Enhancements

The following features are planned for future development:

- Image upload for lost and found items.
- Automatic item matching using AI.
- Email notifications.
- OTP-based verification.
- Advanced admin dashboard.
- Location-based item discovery.
- Real-time communication between users.
- Analytics and report management.
- Improved security and access control.

---

## 👨‍💻 Development Team

Developed as an academic project.

**Project:** LOST AND FOUND  
**Repository:** [GitHub – LOST_AND_FOUND](https://github.com/prahalladnbsc24-max/LOST_AND_FOUND)

---

### 📌 Project Vision

Our vision is to create a simple, accessible, and reliable digital platform that connects people with their lost belongings.

**Find It. Report It. Reunite It.**
