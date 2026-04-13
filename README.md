# 🩸 Blood Donation Backend API

---

## 📌 Project Overview

- A robust backend API for the Blood Donation Platform  
- Handles user management, donation requests, and role-based access  
- Provides secure and scalable data handling using RESTful APIs  

👉 **Main goal:** Support frontend with reliable data and secure operations  

---

## 🌐 Live API

- 🚀 Base URL: https://blood-donation-server-rho.vercel.app  

---

## 🚀 Key Features

- 👤 User data management (Create, Read, Update)  
- 🔐 Role-based access system (**Admin / Volunteer / User**)  
- 📢 Create and manage blood donation requests  
- 🔍 Fetch donors based on blood group & location  
- 📦 RESTful API structure  
- ⚡ Fast and scalable backend deployment (Vercel)  

---

## 🛠️ Tech Stack

### ⚙️ Backend
- Node.js  
- Express.js  

### 🗄️ Database
- MongoDB  

### 🚀 Deployment
- Vercel  

---

## 📂 API Endpoints (Example)

### 👤 Users
- `GET /users` → Get all users  
- `POST /users` → Create new user  

### 🩸 Donation Requests
- `GET /donations` → Get all requests  
- `POST /donations` → Create donation request  

---

## 🔐 Role-Based Access

- 🛡️ **Admin**
  - Manage all users  
  - Control donation requests  

- 🤝 **Volunteer**
  - Support donation activities  
  - Manage requests  

- 🙋‍♂️ **User**
  - Create donation requests  
  - Search for donors  

---

## 📦 Installation & Setup

```bash
git clone https://github.com/polokrf/Blood-Donation-Application-server.git
cd blood-donation-server
npm install
npm start
