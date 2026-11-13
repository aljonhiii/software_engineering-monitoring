# 👟 KixCleen Monitoring & Kiosk Ecosystem (`version-2`)

Welcome to the all-in-one **KixCleen Ecosystem** repository ([software_engineering-monitoring](https://github.com/aljonhiii/software_engineering-monitoring.git)).

This monorepo contains the complete software suite for the KixCleen automated shoe-cleaning franchise:
1. **`backend/`** — Central Node.js & Express REST API + Socket.IO Real-Time Telemetry Server + Database with zero-config auto-fallback.
2. **`mobile/`** — **Owner & Admin Mobile Application** (React Native / Expo SDK 58): Complete owner experience with account creation, guided 4-step location onboarding, live kiosk monitoring, sales analytics, and telemetry controls.
3. **`shoeclean/`** — **Customer Kiosk Touchscreen Application** (React Native / Expo SDK 58): Customer-facing interactive UI for shoe type selection, services, add-ons, Xendit digital payment, and wash progress.

---

## 📁 Repository Structure

```text
kixcleen_monitoring/
├── backend/                  # Central API & Real-Time Socket Server
│   ├── src/                  # Controllers, routes, models, sockets
│   ├── database/             # MySQL/MariaDB schemas and seeds
│   ├── data/                 # JSON file/memory fallback storage
│   ├── .env.example          # Sample environment configuration
│   └── package.json
│
├── mobile/                   # Owner & Admin Mobile Application
│   ├── src/
│   │   ├── app/              # Expo Router screens (tabs, onboarding, auth)
│   │   │   ├── (auth)/       # Login, Register, Forgot Password
│   │   │   ├── (onboarding)/ # 4-Step Kiosk Location Setup Flow
│   │   │   └── (tabs)/       # Dashboard, Transactions, Analytics, Settings
│   │   ├── components/       # Custom UI, interactive maps, barangay dropdown
│   │   └── constants/        # Theme, 98 Zamboanga barangays catalog
│   ├── .env.example
│   └── package.json
│
├── shoeclean/                # Customer Kiosk Touchscreen Application
│   ├── src/
│   │   ├── app/              # Customer flow: Shoe Type -> Services -> Payment -> Progress
│   │   ├── components/       # Touchscreen cards, progress rings, illustrations
│   │   ├── services/         # Kiosk telemetry, machine service, Xendit payment
│   │   └── constants/        # Tiers, pricing, shoe categories
│   ├── .env.example
│   └── package.json
│
└── README.md                 # Complete Multi-PC Setup & Run Guide
```

---

## 🌿 Git Branches

| Branch | Description |
| :--- | :--- |
| **`version-2`** *(Recommended / Default)* | **Version 2 Production Suite** — Standardized Categories (*Leather Shoes* & *Other Shoes*), 3 Core Services (*Sanitation*, *Disinfection*, *Deodorize*), Add-ons (*UV Light Bacterial Removal*, *Dryer*), 98 Zamboanga City barangays map onboarding, and live real-time sync. |
| **`main`** | **Version 1** — Legacy prototype build. |

Always verify you are on `version-2`:
```bash
git checkout version-2
```

---

## 🌐 Network Requirements: Do You Need Internet?

| Action | Internet Required? | Notes |
| :--- | :--- | :--- |
| **Running the System Locally** | ❌ **No Internet Needed** | All devices (laptop/PC running `backend/`, owner mobile running `mobile/`, and kiosk screen running `shoeclean/`) only need to be connected to the **same local Wi-Fi or phone hotspot**. |
| **First-Time Setup (`npm install`)** | ✅ **Yes** | Required once to download npm packages. |
| **Map Tiles & Geocoding** | ✅ **Optional** | OpenStreetMap / Nominatim live search uses internet; falls back gracefully to our offline 98 Zamboanga City barangay coordinate catalog. |

---

## 🖥️ Complete Setup Guide for Another PC / Laptop

Follow these step-by-step instructions to set up the entire project on a new computer.

### Step 0: Prerequisites on the New PC
Ensure you have the following installed:
1. **Node.js** (v18 or v20 LTS recommended): Download from [nodejs.org](https://nodejs.org/).
2. **Git**: Download from [git-scm.com](https://git-scm.com/).
3. **Expo Go app** on your Android phone/tablet (from Google Play Store), or use Android Emulator / Web browser.
4. **Phone & PC on the same Wi-Fi network** (or connect your PC and phone to the same mobile hotspot).

---

### Step 1: Clone the Repository & Checkout `version-2`
Open **PowerShell** or **Terminal**:
```bash
git clone https://github.com/aljonhiii/software_engineering-monitoring.git
cd software_engineering-monitoring
git checkout version-2
```

---

### Step 2: Find Your PC's Local IPv4 Address
Because the mobile apps on your phone connect to the backend server running on your PC, you need your computer's local IP address:

#### On Windows:
1. Open PowerShell or Command Prompt.
2. Run:
   ```powershell
   ipconfig
   ```
3. Look for **Wireless LAN adapter Wi-Fi** (or Ethernet) → **IPv4 Address**:
   ```text
   IPv4 Address. . . . . . . . . . . : 192.168.1.15
   ```
   *(Note down this IP address, e.g., `192.168.1.15`)*

#### On macOS / Linux:
```bash
ifconfig | grep inet
# Or
ip addr
```

---

### Step 3: Set Up & Start the Central Backend Server (`backend/`)

Open a terminal window:
```bash
cd backend
npm install
```

#### Configure Environment:
Copy the example `.env` file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

#### Database (Zero-Config Default!):
- **Automatic Fallback**: If you do not have MariaDB or MySQL running, the backend **automatically runs using the built-in local store (`data/store.json`)** with pre-seeded test kiosks, owners, and transactions. You don't need to configure any database to start developing immediately!
- *(Optional)* If using MySQL/MariaDB with XAMPP: create database `kixcleen_db` and import `database/schema.sql` then `database/seed.sql`.

#### Start the Server:
```bash
npm run dev
```
You will see:
```text
========================================================
🚀 KixCleen Monitor Backend API running on port 3000
--------------------------------------------------------
📍 Localhost:     http://localhost:3000
📱 Local Network: http://192.168.1.15:3000
========================================================
```
> **Keep this terminal window running!**

---

### Step 4: Set Up & Start the Owner Mobile App (`mobile/`)

Open a **new (second)** terminal window:
```bash
cd mobile
npm install
```

#### Configure `mobile/.env`:
Create `.env` and insert your PC's IP address found in Step 2:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

Edit `mobile/.env` and replace with your computer's IP (port `3000`):
```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.15:3000
```
*(Replace `192.168.1.15` with your actual IPv4 address!)*

#### Start the Owner Mobile App:
```bash
npx expo start -c
```
- **Android Phone**: Open **Expo Go** and scan the QR code displayed in the terminal.
- **Android Emulator**: Press **`a`** in the terminal.
- **Web Browser**: Press **`w`** in the terminal.

---

### Step 5: Set Up & Start the Customer Kiosk Screen (`shoeclean/`)

Open a **new (third)** terminal window:
```bash
cd shoeclean
npm install
```

#### Configure `shoeclean/.env`:
Create `.env` and point to your PC's IP:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

Edit `shoeclean/.env`:
```env
EXPO_PUBLIC_MONITOR_API_URL=http://192.168.1.15:3000/api
EXPO_PUBLIC_KIOSK_ID=KIOSK-01-MAIN
```
*(Replace `192.168.1.15` with your actual IPv4 address!)*

#### Start the Kiosk Screen App:
```bash
npx expo start -c
```
- Open on a tablet, second phone, or press **`w`** to preview the kiosk touchscreen in your browser.

---

## 🔐 Default Login Credentials for the Mobile App

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner` | `admin1234` | Fully configured owner account with existing kiosk data. |
| **Administrator** | `admin` | `admin1234` | Franchise administrator account with multi-kiosk view. |
| **Fresh Owner** *(Test Onboarding)* | `freshowner` | `kixcleen2026` | Has not completed setup; triggers the full 4-step Location Onboarding flow! |

> **Pro Tip**: You can also tap **"Register"** on the login screen to create a brand new owner account and experience the 4-step onboarding flow from start to finish!

---

## 📍 The Owner Onboarding Experience (Step-by-Step)

When a newly registered owner logs in for the first time, they are automatically guided through the 4-step location registration:

1. **Step 1: Welcome Screen (`welcome.tsx`)**
   - Branded KixCleen logo hero.
   - Core value highlights: Real-time monitoring, Location management, Revenue tracking.
   - Primary pill action: `"Get Started"`.
2. **Step 2: Location Method Selection (`location-method.tsx`)**
   - **Option 1 ("I'm at the location")**: Uses device GPS coordinates with real-time permissions.
   - **Option 2 ("I'll choose on the map")**: Select city and barangay manually.
   - Dynamic dark-white card selection without aggressive lighting.
3. **Step 3: Interactive Map & Exact Location (`map-select.tsx`)**
   - Guided instruction panel.
   - Searchable **98 Zamboanga City Barangays Dropdown Picker** with district filters (Ayala, Tetuan, Santa Maria, etc.).
   - Interactive Leaflet map with draggable crosshair pin.
   - Real-time address input card.
4. **Step 4: Location Verification (`confirm.tsx`)**
   - Embedded preview map of the selected kiosk spot.
   - Detail cards showing Method (*GPS* vs *Manual*), Coordinates, and Full Street Address.
   - Clean verification note card.
   - `"Confirm Location"` button saves coordinates to backend API and transitions owner directly to their live monitoring dashboard!

---

## 🔄 Real-Time End-to-End Testing Workflow

To see the complete ecosystem synchronized in action:

1. **Start all 3 services** (`backend`, `mobile`, `shoeclean`).
2. Log into the **Owner App** (`mobile/`) using `owner` / `admin1234`.
3. Open the **Kiosk App** (`shoeclean/`).
4. Select a shoe category (*e.g., Leather Shoes*), select services (*Sanitation + UV Light*), and tap through to payment.
5. Notice that the **Owner Mobile Dashboard** instantly updates in real time via WebSockets:
   - Live telemetry status changes from `Idle` to `Active Wash Cycle`.
   - Water and soap levels decrement in real-time.
   - Revenue and transaction charts update dynamically!

---

## 🛠️ Troubleshooting & FAQs

### 1. Phone cannot connect to PC (`ERR_CONNECTION_TIMED_OUT` or `Network Error`)
- **Same Network Check**: Ensure your PC and phone are on the **exact same Wi-Fi network**.
- **Public/Guest Wi-Fi Isolation**: Many school or coffee shop Wi-Fi networks enable "Client Isolation" (devices cannot talk to each other). If this happens, **turn on Mobile Hotspot on your phone**, connect your laptop to your phone's hotspot, and re-run `ipconfig`.
- **Windows Firewall**:
  1. Open Windows Search → **Windows Defender Firewall with Advanced Security**.
  2. Click **Inbound Rules** → **New Rule**.
  3. Select **Port** → **TCP** → Enter `3000`.
  4. Allow the connection on both Private and Public networks.
  - Quick Test: Open your phone's browser and navigate to `http://<YOUR_PC_IP>:3000/health`. If you see `{"status":"ok",...}`, your phone can communicate with your computer!

### 2. Expo shows stale IP or doesn't update after editing `.env`
Expo caches environment variables. Always restart Expo with the clear-cache flag:
```bash
npx expo start -c
```

### 3. Port 3000 is already in use
If another process is using port 3000 on your PC:
- On Windows: Run `netstat -ano | findstr :3000` to find the process PID, then `taskkill /PID <PID> /F`.
- Or set `PORT=3001` in `backend/.env` and update port numbers in `mobile/.env` and `shoeclean/.env`.

---

## 👥 Contributors & Version Details
- **Repository**: [software_engineering-monitoring](https://github.com/aljonhiii/software_engineering-monitoring.git)
- **Branch**: `version-2`
- **Franchise Platform**: KixCleen Automated Smart Shoe-Cleaning Systems
