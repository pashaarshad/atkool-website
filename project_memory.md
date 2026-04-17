# 🧠 Atkool Project: Full Technical Memory & Documentation

This document is the definitive source of truth for the **Atkool School Attendance System**. It tracks every configuration, credential, and architectural decision made from the start of development through cloud deployment.

---

## 🏗️ 1. Project Overview
- **Product:** SaaS School Attendance Management System.
- **Frontend:** React.js (Web Admin Panel).
- **Backend:** Node.js/Express (REST API).
- **Mobile:** Flutter (Android App for staff/parents).
- **Database:** MongoDB (Cloud-hosted on VPS).

---

## 🌐 2. Infrastructure & VPS Setup
- **Provider:** Hostinger (KVM 2 VPS).
- **OS:** Ubuntu 24.04 LTS (Noble Numbat).
- **Public IP:** `187.127.153.92`
- **Connection Method:** SSH (Root user).

---

## 📂 3. Database Configuration (A to Z)
### **Installation & Version**
- **MongoDB Version:** 7.0 (Installed via Jammy repo for 24.04 compatibility).
- **Service Name:** `mongod`
- **Location:** `/etc/mongod.conf`

### **Security & Access**
- **Admin User:** `atkoolAdmin`
- **Password:** `Atkool_db`
- **Auth Source:** `admin`
- **Internal Security:** `authorization: enabled` (Enforced password check).
- **Remote Access:** `bindIp` set to `0.0.0.0` (Allows global connections).

### **Firewall (Double Locked)**
- **VPS Internal (UFW):** Port `27017` set to `ALLOW`.
- **Hostinger Panel Firewall:** Rule `Allow-Mongo` created for TCP Port `27017` (Source: Anywhere).

---

## 🔗 4. Connection Strings & API Paths
### **Master Database URI**
```text
mongodb://atkoolAdmin:Atkool_db@187.127.153.92:27017/Atkool?authSource=admin
```

### **Backend Configuration (`backend-deploy`)**
- **Primary Env:** Read from both `.env` and `env.txt`.
- **Status:** Verified. Local server successfully connects to the remote VPS DB.
- **Port:** `3000`

### **Flutter Configuration (`school_connect_apk`)**
- **Config File:** `lib/config/api_config.dart`
- **Live API Endpoint:** `http://187.127.153.92:3000/api`
- **Status:** Updated and ready for production testing.

---

## 🛠️ 5. Development History & Fixes
- **Issue:** "Unit mongod.service not found."
- **Solution:** Re-added correct GPG keys and forced repository update for Ubuntu 24.04.
- **Issue:** "Connect ETIMEDOUT."
- **Solution:** Identified blocking at the Hostinger Panel Firewall level; created a rule for port 27017.
- **Issue:** "Connected to localhost" (despite update).
- **Solution:** Found that the app was priority-reading from a custom `env.txt` file instead of `.env`. Updated `env.txt` to fix.

---

## 🔥 6. UI/UX & Brand Guidelines (User Rules)
- **Aesthetic:** "Premium & Futuristic" - Dark mode, vibrant HSL gradients, glassmorphism.
- **Typography:** Modern fonts (Inter/Outfit).
- **Assets:** All images to be generated using `nano banana` tool. NO placeholders.
- **Interactions:** Use micro-animations and smooth transitions.

---

## 📋 7. Next Steps Checklist
1. [ ] **Deploy Backend to VPS:** Transfer `backend-deploy/` and set up PM2.
2. [ ] **Nginx Reverse Proxy:** Secure the API with a domain/SSL.
3. [ ] **React Frontend Build:** Push the React app to the Hostinger VPS for global access.
4. [ ] **Android Testing:** Compile and test real-time attendance logging.

---
*Created by Antigravity AI on April 17, 2026. This file is intended to be the persistent context for all future AI agents and developers working on this repository.*
