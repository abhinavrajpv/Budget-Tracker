# 🛡️ VaultBudget — 100% Private Offline Budget Tracker

**VaultBudget** is a zero-knowledge, offline-first personal budget and expense tracking Progressive Web App (PWA). It gives you complete financial awareness with dynamic **Net Amount Left** calculation, customizable **Category Spending Limits**, and **Visual Analytics** — while ensuring **zero data is ever transmitted to the internet**.

---

## 🌟 Key Features

1. **Transaction Tracking with Categories & Notes**:
   - Record **Income** and **Expenses** with amount, category, date, and optional descriptions.
   - Built-in categories (Food, Groceries, Housing, Transport, Shopping, Entertainment, Utilities, Health, Salary, Freelance, etc.) plus the ability to create custom categories with custom icons and limits.
2. **Net Amount Left Display**:
   - Real-time display of **Net Balance Left** (`Total Income - Total Expenses`).
   - Instant dynamic updates as you record new transactions.
3. **Category Spending Limits (Budgets)**:
   - Set monthly spending caps for each category (e.g., Food: ₹6,000, Shopping: ₹2,500).
   - Visual progress bars with color-coded safety zones:
     - 🟢 **Safe** (< 75% utilized)
     - 🟡 **Caution** (75% – 99% utilized)
     - 🔴 **Over Budget** (&ge; 100% with alert banner)
   - **Live Pre-Transaction Warning**: As you type an expense amount, VaultBudget warns you immediately if the expense will breach or approach your category limit.
4. **Visual Analytics & Charts**:
   - Pure HTML5 Canvas Donut Chart for category spending distribution.
   - Monthly Inflow vs Outflow comparison bar charts.
   - 100% offline, zero external tracking libraries.
5. **Ledger & Quick Filters**:
   - Search by description or category.
   - Filter by All, Expenses Only, Income Only, This Month, or Last Month.
   - One-click export to **CSV** spreadsheet or full **JSON** backup.
6. **Multi-Currency Support**:
   - Supports ₹ (INR), $ (USD), € (EUR), £ (GBP), AED, C$, A$, ¥, S$, and more.

---

## 🔒 Why VaultBudget is 100% Safe from Internet Hackers

Many budget apps store your transactions on cloud databases (Firebase, Supabase, AWS, etc.), exposing your bank balances and spending habits to data breaches and server hacks.

**VaultBudget uses a Zero-Knowledge Local Architecture:**
- **Zero Cloud Database**: There is **no database server** on the internet.
- **Zero Data Packets**: When you use the app, 100% of your transactions, categories, and limits remain inside your phone's secure local storage (`localStorage`).
- **No Third-Party Trackers or Analytics**: No Google Analytics, no Facebook SDK, no advertising cookies.
- **Works in Airplane Mode**: The app operates completely disconnected from the internet.
- **Optional Master PIN Lock**: Set a 4-digit PIN to lock your screen with SHA-256 hashing.
- **Complete Data Sovereignty**: You can export an encrypted JSON backup file directly to your phone at any time and wipe data with one tap.

---

## 🚀 Step-by-Step: How to Push to GitHub Using Git Commands

You can push this project to GitHub right from your terminal or command prompt:

### 1. Check Git Status
```bash
git status
```

### 2. Stage All Changes
```bash
git add .
```

### 3. Commit with a Message
```bash
git commit -m "Launch VaultBudget: 100% private offline budget tracker"
```

### 4. Push to Your GitHub Repository
```bash
git push origin main
```

*(Note: If you want to push to a brand new repository instead of the existing remote, simply run: `git remote set-url origin https://github.com/<your-username>/<your-repo-name>.git` and then `git push -u origin main`)*

---

## 📱 How to Open on Your Android Phone and Download (Install)

Once your code is pushed to GitHub, GitHub provides free 24/7 HTTPS hosting via **GitHub Pages**. Because GitHub Pages only serves the static files (HTML, CSS, JS), **none of your financial data is ever stored on GitHub**.

### Step 1: Enable GitHub Pages
1. Go to your repository on [GitHub.com](https://github.com).
2. Click **Settings** (gear icon) &rarr; **Pages** (in the left sidebar).
3. Under **Build and deployment** &rarr; **Branch**:
   - Select **`main`**
   - Folder: **`/(root)`**
   - Click **Save**.
4. Within 1–2 minutes, GitHub will generate your live URL:
   `https://<your-username>.github.io/<your-repo-name>/`

### Step 2: Open & "Download" on Your Android Phone
1. Open the GitHub Pages link in **Google Chrome** on your Android phone.
2. An **"Install App"** prompt will appear automatically, or you can:
   - Tap the three vertical dots (**&vellip;**) in the top right of Chrome.
   - Tap **"Install app"** (or **"Add to Home screen"**).
   - Tap **Install**.
3. **VaultBudget is now installed on your Android device!**
   - It will appear in your Android app drawer with its own app icon and splash screen.
   - It launches fullscreen without any browser address bar.
   - It opens and functions **100% offline** even with mobile data or Wi-Fi turned off!

---

## 💻 Optional: Test on Phone via Local Wi-Fi (No GitHub Needed)

If you want to test on your phone immediately before pushing to GitHub:
1. Double-click `start.bat` or `1_OPEN_ON_PHONE_NOW.bat` in this folder.
2. It will display a local IP address (e.g., `http://192.168.1.X:8000`).
3. Connect your Android phone to the same Wi-Fi (or your phone's personal hotspot) and type that address into Chrome.
