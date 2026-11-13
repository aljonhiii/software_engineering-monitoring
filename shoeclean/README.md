# KixCleen — Automated Shoe-Cleaning Vending Machine Kiosk (`version-2`)

Welcome to the **KixCleen Customer Kiosk** repository (`https://github.com/aljonhiii/software_engineering-.git`).

---

## 🌿 Repository Branches (Version 1 vs. Version 2)

This repository maintains two branches so teammates can inspect both versions of the kiosk workflow:

| Branch | Description |
| :--- | :--- |
| **`main`** | **Version 1** — Original 6 shoe categories (`Sneakers`, `Canvas`, `Leather`, `Suede`, `Sports`, `Other`) and 3 general cleaning tiers (`Quick Refresh`, `Standard Clean`, `Deep Restoration`). |
| **`version-2`** | **Version 2 (Current)** — Standardized 2 main shoe categories (**Leather Shoes** and **Other Shoes**), 3 targeted services (**Sanitation**, **Disinfection**, **Deodorize**), and 2 separate optional add-ons (**UV Light Bacterial Removal** and **Dryer**). |

To switch between versions on your laptop/PC:
```bash
# View Version 1
git checkout main

# View Version 2
git checkout version-2
```

---

## 🌐 Do You Need an Internet Connection?

| Feature / Scenario | Internet Needed? | Network Requirement |
| :--- | :--- | :--- |
| **Running the Kiosk UI + Cash / Coin / Bill Payments** | ❌ **No internet required** | Works offline or over a local Wi-Fi router / phone hotspot. |
| **Connecting Kiosk to KixCleen Monitoring Backend & Mobile App** | ❌ **No internet required** (Local Wi-Fi / Hotspot only) | The PC running the backend, the Kiosk device, and the Monitoring phone must be connected to the **same Wi-Fi network or mobile hotspot** so they can communicate via your PC's local IPv4 address (`http://<YOUR_PC_IP>:3000`). |
| **Xendit QR Ph (GCash / Maya) Live Sandbox QR Generation** | ✅ **Yes, internet required** | Needs internet access to reach `https://api.xendit.co` and generate real QR Ph codes. |
| **First-time `npm install` or downloading Expo Go** | ✅ **Yes, internet required** | Needed once when installing dependencies on a new laptop/PC. |

---

## 🔍 Step-by-Step: How to Find Your PC / Laptop IPv4 Address

Whenever you run the **KixCleen Monitoring Backend** on your laptop/PC, other devices (or the Kiosk app) need your computer's **IPv4 Address** to send transactions and machine telemetry to it.

### Option A: Using Windows Command Prompt / PowerShell (Recommended)
1. Press `Win + R`, type `cmd` (or open **PowerShell**), and press **Enter**.
2. Run:
   ```bash
   ipconfig
   ```
3. Look under **Wireless LAN adapter Wi-Fi** (or **Ethernet adapter**) for **IPv4 Address**:
   ```text
   Wireless LAN adapter Wi-Fi:
      IPv4 Address. . . . . . . . . . . : 192.168.1.15
   ```
   *(In this example, your IP address is `192.168.1.15`.)*

### Option B: Using macOS / Linux Terminal
1. Open **Terminal** and run:
   ```bash
   ifconfig | grep inet
   # or on Linux:
   ip addr
   ```
2. Find the local IP starting with `192.168.x.x`, `10.x.x.x`, or `172.x.x.x`.

### Option C: Check the Monitoring Backend Terminal Output
When you start the backend server (`npm run dev` inside `kixcleen_monitoring/backend`), it automatically detects and prints your exact local network URL:
```text
📍 Localhost:     http://localhost:3000
📱 Local Network: http://192.168.1.15:3000
```

---

## ⚙️ Where to Put the IP Address in KixCleen Kiosk

### 1. Create your `.env` file in the project root
In the root folder of this repository (`shoeclean/`), copy `.env.example` to a new file named **`.env`**:

```bash
cp .env.example .env
```
*(Or create a new file named `.env` in VS Code next to `package.json`.)*

### 2. Update `EXPO_PUBLIC_MONITOR_API_URL` in `.env`
Replace `localhost` (or the old IP) with **your laptop/PC's IPv4 address** and port `3000`, followed by `/api`:

```env
# Xendit Sandbox Configuration
EXPO_PUBLIC_XENDIT_SECRET_KEY=xnd_development_sample_shoeclean
EXPO_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_development_sample_shoeclean

# KixCleen Monitoring Integration (Replace 192.168.1.15 with YOUR PC's IPv4 address)
EXPO_PUBLIC_MONITOR_API_URL=http://192.168.1.15:3000/api
EXPO_PUBLIC_KIOSK_ID=KIOSK-01-MAIN
```

> **Note on How the App Reads This URL:**
> `src/constants/config.ts` reads `process.env.EXPO_PUBLIC_MONITOR_API_URL` (`AppConfig.apiBaseUrl`).
> - If you run the Kiosk on the **same PC** in a web browser, `http://localhost:3000/api` also works.
> - If you run the Kiosk on a **physical Android tablet or phone via Expo Go**, you **must** use your PC's IPv4 address (`http://<YOUR_PC_IP>:3000/api`) because `localhost` on a phone refers to the phone itself, not your laptop.
> - Whenever you edit `.env`, restart Expo with `npx expo start -c` so the new environment variables load.

---

## 🚀 Full Setup Guide for Teammates

### Prerequisites
- **Node.js** (v18 or v20 LTS recommended) — [Download Node.js](https://nodejs.org/)
- **Git** — [Download Git](https://git-scm.com/)
- **Expo Go** app installed on your Android device (optional, if testing on a phone/tablet instead of web/emulator).

### 1. Clone the Repository & Switch to `version-2`
```bash
git clone https://github.com/aljonhiii/software_engineering-.git
cd software_engineering-
git checkout version-2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure `.env`
1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_MONITOR_API_URL=http://<YOUR_PC_IPV4>:3000/api` (see instructions above).

### 4. Start the KixCleen Kiosk App
```bash
npx expo start -c
```
- Press **`w`** in the terminal to open in your web browser, **`a`** for Android Emulator, or scan the QR code using **Expo Go** on your Android tablet/phone.

---

## 🧪 Useful Commands

```bash
npx expo start -c     # Start Expo dev server with cleared cache
npm run typecheck     # Run TypeScript compiler check (tsc --noEmit)
npm run lint          # Run ESLint check (expo lint)
```
