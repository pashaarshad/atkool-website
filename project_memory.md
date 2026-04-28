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
- **VPS Internal (UFW):** Port `27017` and `3000` set to `ALLOW`.
- **Hostinger Panel Firewall:** Unified Profile **`Allow-Mongo`** containing:
    - TCP Port `27017` (MongoDB)
    - TCP Port `3000` (Website/Backend)
    - TCP Ports `80/443` (HTTP/HTTPS for future use)

---

## 🔗 4. Connection Strings & API Paths
### **Master Database URI**
```text
mongodb://atkoolAdmin:Atkool_db@187.127.153.92:27017/Atkool?authSource=admin
```

### **Deployment Configuration (`atkool-website`)**
- **Folder Path (VPS):** `/var/www/atkool-website`
- **Deployment Method:** Git (GitHub Repo: `pashaarshad/atkool-website`)
- **PM2 Name:** `atkool-website`
- **Port:** `3000`
- **Live URL:** `https://superadmin.atkool.com`

### **Deployment Configuration (`atkool-com-main`)**
- **Folder Path (VPS):** `/var/www/atkool-com-main`
- **Framework:** Next.js 16.2.4
- **PM2 Name:** `atkool-main`
- **Port:** `3001`
- **Live URL:** `https://atkool.com`

### **Flutter Configuration (`atkool-fultter-app`)**
- **Config File:** `lib/config/api_config.dart`
- **Live API Endpoint:** `https://superadmin.atkool.com/api`
- **Status:** Integrated with production VPS.

---

## 🌍 4.1 Domain & Subdomain Architecture
### **DNS Records (Hostinger Panel → DNS Zone)**
All A records point to VPS IP: `187.127.153.92`

| Type | Name | Points To |
|------|------|----------|
| A | `@` (root) | `187.127.153.92` |
| A | `www` | `187.127.153.92` |
| A | `superadmin` | `187.127.153.92` |
| A | `admin` | `187.127.153.92` |
| A | `teachers` | `187.127.153.92` |
| A | `student` | `187.127.153.92` |

### **Subdomain Routing Map**
| URL | Portal | Folder | Port | File Served |
|-----|--------|--------|------|-------------|
| `atkool.com` | Landing Page | `atkool-com-main` | 3001 | Next.js App |
| `superadmin.atkool.com` | Super Admin | `atkool-website` | 3000 | `public/index.html` |
| `admin.atkool.com` | School Admin | `atkool-website` | 3000 | `public/school-admin/index.html` |
| `teachers.atkool.com` | Teacher Portal | `atkool-website` | 3000 | `public/teacher-login.html` |
| `student.atkool.com` | Parent/Student | `atkool-website` | 3000 | `public/parent-login.html` |

### **PM2 Process Table**
| ID | Name | Port | Folder |
|----|------|------|--------|
| 0 | `atkool-website` | 3000 | `/var/www/atkool-website` |
| 1 | `atkool-main` | 3001 | `/var/www/atkool-com-main` |

### **SSL/HTTPS**
- **Provider:** Let's Encrypt (via Certbot)
- **Auto-Renewal:** Enabled (`certbot renew --dry-run` verified)
- **Covered Domains:** `atkool.com`, `www.atkool.com`, `superadmin.atkool.com`, `admin.atkool.com`, `teachers.atkool.com`, `student.atkool.com`

### **Nginx Configuration**
- **Config File (Landing):** `/etc/nginx/sites-available/atkool-landing`
- **Config File (Dashboards):** `/etc/nginx/sites-available/atkool-dashboards`
- **Key Detail for `admin.atkool.com`:** Uses `return 301 /school-admin/index.html` redirect (NOT proxy) so relative links (`dashboard.html`, `teachers.html`) resolve correctly within `/school-admin/` path.
- **Key Detail for all subdomains:** `proxy_set_header Host $host;` is **REQUIRED** for subdomain detection.

### **Nginx Dashboard Config (Reference)**
```nginx
# SUPER ADMIN
server {
    listen 80;
    server_name superadmin.atkool.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

# SCHOOL ADMIN (redirect root to /school-admin/ for relative links)
server {
    listen 80;
    server_name admin.atkool.com;
    location = / {
        return 301 /school-admin/index.html;
    }
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

# TEACHER
server {
    listen 80;
    server_name teachers.atkool.com;
    location = / {
        proxy_pass http://localhost:3000/teacher-login.html;
        proxy_set_header Host $host;
    }
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

# STUDENT/PARENT
server {
    listen 80;
    server_name student.atkool.com;
    location = / {
        proxy_pass http://localhost:3000/parent-login.html;
        proxy_set_header Host $host;
    }
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

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
- **Issue:** `admin.atkool.com` login loop (School Admin dashboard kept redirecting back to login).
- **Solution:** Changed Nginx from `proxy_pass` to `return 301 /school-admin/index.html` for the root URL. This ensures the browser URL changes to `/school-admin/index.html`, so relative links like `dashboard.html` resolve to `/school-admin/dashboard.html` instead of `/dashboard.html`.
- **Issue:** All subdomains showing Super Admin login page.
- **Solution:** Nginx was missing `proxy_set_header Host $host;`. Without this, Node.js cannot detect which subdomain the request came from. Also, routing was moved entirely to Nginx (separate server blocks per subdomain) instead of relying on Host header detection in `server.js`.
- **Issue:** `DNS_PROBE_FINISHED_NXDOMAIN` on subdomains.
- **Solution:** A records for `admin`, `teachers`, `student`, `superadmin` were missing in Hostinger DNS panel. Added them pointing to VPS IP.

---

## 🔥 6. UI/UX & Brand Guidelines (User Rules)
- **Aesthetic:** "Premium & Futuristic" - Dark mode, vibrant HSL gradients, glassmorphism.
- **Typography:** Modern fonts (Inter/Outfit).
- **Assets:** All images to be generated using `nano banana` tool. NO placeholders.
- **Interactions:** Use micro-animations and smooth transitions.

---

## 📋 7. Next Steps Checklist
1. [x] **Deploy Backend to VPS:** Successfully running via PM2.
2. [x] **Domain Connection:** `atkool.com` connected with 5 subdomains via Nginx reverse proxy.
3. [x] **Nginx Reverse Proxy:** Configured with separate server blocks per subdomain.
4. [x] **SSL/HTTPS:** Let's Encrypt certificates installed for all domains via Certbot.
5. [x] **Landing Page:** `atkool-com-main` (Next.js) deployed on Port 3001.
6. [x] **Subdomain Routing:** Super Admin, School Admin, Teacher, Student portals all functional.
7. [ ] **Premium UI Overhaul:** Update the dashboard HTML/CSS to match the "Futuristic" guidelines.
8. [ ] **Android Testing:** Compile and test real-time attendance logging.
9. [ ] **School Images Feature:** Replace PAN/Aadhar fields with 6-image upload gallery.

---
*Created by Antigravity AI on April 17, 2026. This file is intended to be the persistent context for all future AI agents and developers working on this repository.*

