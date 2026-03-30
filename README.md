# Methalo Browser

A premium remote browser isolation platform powered by the Rammerhead engine. This project features a high-performance React/Vite frontend, a multi-worker Node.js backend, and a comprehensive security and notification system.

## 🚀 Key Features

- **Edge-to-Edge Browsing:** Professional dashboard with integrated URL bar and navigation controls.
- **Advanced Identity Management:** Seamless Firebase Authentication with support for Google and Email/Password linking.
- **Real-time Notifications:** Automated support ticket routing via Gmail and Discord Webhooks.
- **Multi-Worker Architecture:** Leverages sticky sessions and clustering for high-concurrency browsing.
- **Premium UI:** Modern, "alive" aesthetic with animated particle backgrounds and high-end component styling.

---

## 🛠 External Dependencies (Manual Install)

These items cannot be installed via `npm` and must be present on your system:

1.  **Node.js (v20+ Recommended):** Required to run the backend server and build the frontend. [Download Node.js](https://nodejs.org/)
2.  **Nginx (Optional but Recommended):** Required for production deployments using a wildcard domain. Use Nginx as a reverse proxy to handle SSL and route traffic to port `8080`.
3.  **Firebase Project:** You must have a Firebase project with **Authentication** and **Firestore** enabled.
4.  **Gmail App Password:** If using the email notification system, you need a Google App Password for your Gmail account.
5.  **Discord Bot & Channel:** A Discord bot token and a dedicated Support Channel ID are required for real-time admin alerts.

---

## ⚙️ Configuration (.env)

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=8080

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase Service Account
FIREBASE_PROJECT_ID=your-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email

# Discord Notifications
DISCORD_BOT_TOKEN="your-token"
DISCORD_SUPPORT_CHANNEL_ID=your-channel-id
```

---

## 📦 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/perrylucas8410/methalo.git
cd methalo
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Build the Frontend
Navigate to the `app` directory and install/build:
```bash
cd app
npm install
npm run build
cd ..
```

---

## 🚦 Starting the Platform

### Production Mode
Build the project and start the multi-worker cluster:
```bash
npm run build
npm start
```

The platform will be accessible at `http://127.0.0.1:8080`.

---

## 🛡 Security & Limitations

- **YouTube:** Currently limited to certain school/organization accounts due to proxy detection.
- **Captchas:** Some highly secure websites may trigger captchas that are difficult to solve via proxy.
- **URL Handling:** Always enter full URLs (including `https://`) for the best browsing experience.

---

## 💬 Support

If you encounter any issues, use the integrated **/support** page or reach out via the Discord admin channel.

© 2026 Methalo
