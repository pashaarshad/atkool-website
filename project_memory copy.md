# 🧠 Atkool Project: Full Technical Memory & Documentation

This document is the definitive source of truth for the **Atkool School Attendance System**. It tracks every configuration, credential, and architectural decision made from the start of development through cloud deployment.

---

## 🏗️ 1. Project Overview
- **Product:** SaaS School Attendance Management System.
- **Frontend Dashboard:** Express/Handlebars (hosted in `atkool-website`).
- **Backend API:** Node.js/Express (REST API).
- **Mobile:** Flutter (Android App for staff/parents).
- **Database:** MongoDB (Cloud-hosted on VPS).

---

## 🌐 2. Infrastructure & VPS Setup
- **Provider:** Hostinger (KVM 2 VPS).
- **OS:** Ubuntu 24.04 LTS (Noble Numbat).
- **Public IP:** `187.127.153.92`
- **Connection Method:** SSH (Root user).
- **Process Manager:** PM2 (Ensures 24/7 uptime).
- **CI/CD:** GitHub Actions (Auto-deploy on `git push`).

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

### **Firewall (Triple Locked)**
- **VPS Internal (UFW):** Ports `27017`, `3000`, and `22` set to `ALLOW`.
- **Hostinger Panel Firewall:** Unified Profile **`Allow-Mongo`** containing:
    - TCP Port `27017` (MongoDB)
    - TCP Port `3000` (Website/Backend)
    - TCP Port `22` (Required for SSH/GitHub Actions)
    - TCP Ports `80/443` (HTTP/HTTPS for future use)

---

## 🔗 4. Connection Strings & API Paths
### **Master Database URI**
```text
mongodb://atkoolAdmin:Atkool_db@187.127.153.92:27017/Atkool?authSource=admin
```

### **Deployment Configuration (`atkool-website`)**
- **Folder Path (VPS):** `/var/www/atkool-website`
- **Deployment Method:** CI/CD via GitHub Actions.
- **Workflow Path:** `.github/workflows/deploy.yml`
- **SSH Secret Name:** `VPS_SSH_KEY` (Stored in GitHub Secrets).
- **PM2 Name:** `atkool-website`
- **Live URL:** `http://187.127.153.92:3000`

### **Flutter Configuration (`atkool-fultter-app`)**
- **Config File:** `lib/config/api_config.dart`
- **Live API Endpoint:** `http://187.127.153.92:3000/api`
- **Status:** Integrated with production VPS.

---

## 🛠️ 5. Development History & Fixes
- **Issue:** "Unit mongod.service not found." 
- **Solution:** Re-added correct GPG keys and forced repository update for Ubuntu 24.04.
- **Issue:** "Connect ETIMEDOUT."
- **Solution:** Identified blocking at the Hostinger Panel Firewall level; created a rule for port 27017.
- **Issue:** "Connected to localhost" (despite update).
- **Solution:** Found that the app was priority-reading from a custom `env.txt` file instead of `.env`. Updated `env.txt` to fix.
- **Issue:** Firewall profile conflict (One off, one on).
- **Solution:** Consolidated all rules into a single Hostinger firewall profile to ensure both DB and Web work simultaneously.
- **Issue:** GitHub Actions "i/o timeout" on Port 22.
- **Solution:** Opened Port 22 in Hostinger Panel to allow GitHub to SSH and deploy code.

---

## 🔥 6. UI/UX & Brand Guidelines (User Rules)
- **Aesthetic:** "Premium & Futuristic" - Dark mode, vibrant HSL gradients, glassmorphism.
- **Typography:** Modern fonts (Inter/Outfit).
- **Assets:** All images to be generated using `nano banana` tool. NO placeholders.
- **Interactions:** Use micro-animations and smooth transitions.

---

## 📋 7. Next Steps Checklist
1. [x] **Deploy Backend to VPS:** Successfully running via PM2.
2. [x] **Auto-Deploy Automation:** CI/CD via GitHub Actions is ACTIVE.
3. [ ] **Domain Connection:** Purchase domain and set up Nginx reverse proxy.
4. [ ] **Nginx Reverse Proxy:** Secure the API with a domain/SSL.
5. [ ] **Premium UI Overhaul:** Update the dashboard HTML/CSS to match the "Futuristic" guidelines.
6. [ ] **Android Testing:** Compile and test real-time attendance logging.

---
*Created by Antigravity AI on April 17, 2026. This file is intended to be the persistent context for all future AI agents and developers working on this repository.*

