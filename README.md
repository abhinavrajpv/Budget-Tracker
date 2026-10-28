# ⚡ Zenith Tasks — Clean To-Do & Task Management

A clean, safe, and modern To-Do application built from scratch with zero pre-loaded tasks, separate sections for active & completed tasks, and native Progressive Web App (PWA) support for Android.

---

## 🌟 What's New & Included

1. **Starts 100% Clean**:
   - Zero pre-existing dummy tasks. You start with an empty canvas ready for your own goals.
2. **Dedicated Separate Sections**:
   - **Active Tasks**: Clearly displays all your pending tasks with counts and priority tags.
   - **Completed Tasks**: Displays your finished tasks with strikethrough, completion timestamps, and a "Clear Completed" button.
   - Filter tabs allow viewing **All**, **Active Only**, or **Completed Only**.
3. **Effortless Task Management**:
   - Type your task and press <kbd>Enter</kbd> to add.
   - Click the checkmark to mark as completed (with optional celebration chime & confetti).
   - Click the trash icon on any card to delete it immediately.
   - Pin important tasks to stay at the top.
4. **100% Safe & Private**:
   - No external database, no accounts, and no tracking. All data lives strictly in your phone or browser's private local storage. It cannot be hacked or leaked over the internet.

---

## 📱 How to Use on Your Android Phone

Because this application uses standard modern web technologies (HTML, CSS, JS with `manifest.json`), you can deploy it for free in seconds and install it on your Android phone as a native-like app:

### 🚀 Recommended: Free Instant Deployment (Takes 30 Seconds)

#### Method 1: Netlify Drop (No terminal, no coding needed)
1. Open your browser and go to: **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag and drop this folder (`New folder`) directly onto the page.
3. Netlify will instantly generate a free, encrypted `https://your-app-name.netlify.app` link.
4. Open that link on your Android phone!

#### Method 2: GitHub Pages (Free forever)
1. Push this folder to a GitHub repository on your GitHub account.
2. In your repository, go to **Settings** > **Pages**.
3. Under **Branch**, select `main` (or `master`) and click **Save**.
4. GitHub will give you an official `https://<your-username>.github.io/<repo-name>` link.

---

### 📲 How to Install as an App on Android

1. Open your deployed `https://...` link in **Google Chrome** on your Android phone.
2. Tap the **three dots menu (`⋮`)** at the top right of Chrome.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The Zenith icon will appear directly on your phone's home screen.
5. Tap the icon anytime — it opens in full-screen mode just like a native Android app!

---

## 💻 Running on your Computer

- **Direct Launch**: Simply double-click **`start.bat`** or **`index.html`**.
- **Local Server (Optional)**:
  ```powershell
  python -m http.server 8000
  ```
  Then visit `http://localhost:8000`.

---

## 🔒 Security & Privacy Guarantee

- **No Remote Server Vulnerabilities**: The app does not transmit your personal to-dos to any third-party server or cloud database.
- **Sandboxed Storage**: All tasks are stored inside your device's isolated browser storage.
- **HTTPS Encrypted**: When deployed on Netlify or GitHub Pages, all traffic is protected by end-to-end SSL/TLS encryption.
