# KixCleen Monitoring System — Backend API & Owner/Admin Mobile App (`version-2`)

Welcome to the **KixCleen Monitoring System** repository (`https://github.com/aljonhiii/software_engineering-monitoring.git`).

This repository contains two folders:
1. **`backend/`** — Node.js + Express.js REST API + Socket.IO Real-Time Server + MariaDB/MySQL (with automatic in-memory fallback).
2. **`mobile/`** — React Native (Expo SDK 58) Android Monitoring Application for **Owner** and **Administrator** roles.

---

## 🌿 Repository Branches (Version 1 vs. Version 2)

| Branch | Description |
| :--- | :--- |
| **`main`** | **Version 1** — Initial Monitoring Backend & Mobile App aligned with the original 6 shoe types and 3 cleaning tiers. |
| **`version-2`** | **Version 2 (Current)** — Synchronized with the Version 2 Kiosk workflow: standardized **Leather Shoes** and **Other Shoes** categories, **Sanitation**, **Disinfection**, and **Deodorize** services, and separate **UV Light Bacterial Removal** and **Dryer** add-ons. |

To switch between versions on your laptop/PC:
```bash
# View Version 1
git checkout main

# View Version 2
git checkout version-2
```

---

## 🌐 Do You Need an Internet Connection?

| Component / Action | Internet Needed? | Network Requirement |
| :--- | :--- | :--- |
| **Local Monitoring (Backend + Mobile App + Kiosk Sync)** | ❌ **No internet required** | All devices (your laptop/PC running `backend/`, the Kiosk tablet/phone, and the Owner/Admin phone running `mobile/`) only need to be connected to the **same Wi-Fi router or mobile phone hotspot**. |
| **Database Storage (MariaDB / XAMPP or Memory Fallback)** | ❌ **No internet required** | Runs 100% locally on your laptop/PC. |
| **First-time `npm install` or Expo Push Notifications** | ✅ **Yes, internet required** | Needed when installing packages for the first time or sending cloud push notifications via Expo's push service. |

---

## 🔍 Step-by-Step: How to Get Your PC / Laptop IPv4 Address

Because the **KixCleen Monitor Mobile App** and the **KixCleen Kiosk App** connect to the `backend/` server running on your computer, you need your computer's local **IPv4 Address**.

### 1. Find Your IPv4 Address
- **On Windows**:
  1. Open **Command Prompt (`cmd`)** or **PowerShell**.
  2. Type `ipconfig` and press **Enter**.
  3. Find **Wireless LAN adapter Wi-Fi** → **IPv4 Address** (for example: `192.168.1.15`).
- **On macOS / Linux**:
  1. Open **Terminal** and run `ifconfig | grep inet` (or `ip addr`).
- **Automatic Tip**:
  When you run `npm start` or `npm run dev` inside `backend/`, the server automatically prints your PC's IPv4 address in the console:
  ```text
  ========================================================
  🚀 KixCleen Monitor Backend API running on port 3000
  --------------------------------------------------------
  📍 Localhost:     http://localhost:3000
  📱 Local Network: http://192.168.1.15:3000
  ========================================================
  ```

---

## ⚙️ Where to Put the IP Address

You will put your PC's IPv4 address (e.g., `192.168.1.15`) in **two places** if you are running both the Monitoring Mobile App and the Customer Kiosk App:

### Location 1: Monitoring Mobile App (`mobile/.env`)
1. Go to the `mobile/` folder (`kixcleen_monitoring/mobile`).
2. Copy `.env.example` to a new file named **`.env`**:
   ```bash
   cp .env.example .env
   ```
3. Edit `mobile/.env` and replace `192.168.1.15` with your laptop/PC's IPv4 address:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api
   EXPO_PUBLIC_SOCKET_URL=http://192.168.1.15:3000
   ```
   *(Note: `mobile/src/constants/config.ts` reads `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL`. Always restart Expo with `npx expo start -c` after editing `.env`.)*

### Location 2: Customer Kiosk App (`shoeclean/.env`)
In the KixCleen Customer Kiosk repository (`shoeclean/.env`), set `EXPO_PUBLIC_MONITOR_API_URL` to the same IPv4 address:
```env
EXPO_PUBLIC_MONITOR_API_URL=http://192.168.1.15:3000/api
EXPO_PUBLIC_KIOSK_ID=KIOSK-01-MAIN
```

---

## 🚀 Full Setup Guide for Teammates

### Part 1: Set Up & Run the Backend Server (`backend/`)

1. **Clone the repository and checkout `version-2`**:
   ```bash
   git clone https://github.com/aljonhiii/software_engineering-monitoring.git
   cd software_engineering-monitoring
   git checkout version-2
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure `backend/.env` (Optional)**:
   ```bash
   cp .env.example .env
   ```
   Default values in `backend/.env`:
   ```env
   PORT=3000
   JWT_SECRET=kixcleen_super_secret_jwt_key_2026
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=kixcleen_db
   ```

4. **Database Setup (MariaDB / XAMPP — Optional!)**:
   - **Zero-Config Fallback**: If you do **not** have MariaDB/XAMPP installed or running, the backend **automatically falls back to an in-memory store** pre-loaded with sample Version 2 transactions (`Leather Shoes` & `Other Shoes`, `Sanitation`, `Disinfection`, `Deodorize`, and `UV Light Bacterial Removal` / `Dryer` add-ons) and user accounts.
   - **If Using MariaDB / XAMPP**:
     1. Start MySQL/MariaDB in XAMPP Control Panel.
     2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or the MySQL CLI.
     3. Create a database named `kixcleen_db`.
     4. Import `backend/database/schema.sql` first, then `backend/database/seed.sql`.

5. **Start the backend server**:
   ```bash
   npm run dev
   ```
   Leave this terminal open while testing!

---

### Part 2: Set Up & Run the Monitoring Mobile App (`mobile/`)

1. **Open a second terminal and navigate to `mobile/`**:
   ```bash
   cd mobile
   npm install
   ```

2. **Create `mobile/.env` and set your PC's IPv4 address**:
   ```bash
   cp .env.example .env
   ```
   Update `mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_PC_IPV4>:3000/api
   EXPO_PUBLIC_SOCKET_URL=http://<YOUR_PC_IPV4>:3000
   ```

3. **Start the Expo development server**:
   ```bash
   npx expo start -c
   ```
   - Press **`w`** to open in the web browser, **`a`** for Android Emulator, or scan the QR code with **Expo Go** on your Android phone.

---

## 🔐 Default Login Credentials

Use these accounts on the KixCleen Monitor login screen:

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner` *(or `owner@kixcleen.com`)* | `admin1234` | Full access to Dashboard, Transactions, Payments, Sales & Analytics, Machine Status, and Account Settings. |
| **Administrator** | `admin` *(or `admin@kixcleen.com`)* | `admin1234` | Operational monitoring access to Dashboard, Transactions, Payments, Sales Reports, and Machine Status. |

---

## 🛠️ Troubleshooting Common Network Issues

1. **Phone cannot connect to `http://<YOUR_PC_IP>:3000` ("Connection timed out")**:
   - Make sure your laptop/PC and your phone are connected to the **same Wi-Fi network** (not a guest network with client isolation).
   - Check if **Windows Defender Firewall** is blocking Node.js on port `3000` — allow Node.js on Private/Public networks when prompted, or test with `http://<YOUR_PC_IP>:3000/health` in your phone's browser. If it shows `{"status":"ok",...}`, your phone can reach your PC!
2. **Changed Wi-Fi network or hotspot**:
   - Run `ipconfig` again to check if your PC's IPv4 address changed, update `.env`, and restart Expo with `npx expo start -c`.
