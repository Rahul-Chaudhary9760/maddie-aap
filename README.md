# 🧪 Maddie — Medical Test Booking Mobile App (MVP)

A modern, production-grade mobile application for discovering, browsing, and booking medical lab tests built with **React Native**, **Expo SDK 57**, and **Expo Router**.

---

## 📱 Features

- 🔐 **Authentication & Session Management**
  - User Registration with form validation (Name, Email, Password, Phone).
  - User Login with JWT access & refresh token handling.
  - Automatic silent token refresh on 401 Unauthorized responses.
  - Persistent auth state using `expo-secure-store` (with web `localStorage` fallback).
  - Auth Navigation Guards protecting private routes.

- 🧪 **Lab Tests Discovery**
  - Interactive test catalog with categorized emoji badges.
  - Live search filtering by test name and category.
  - Category filters: *Blood Test, Urine Test, Radiology, Cardiology, Pathology, Microbiology, Other*.
  - Pull-to-refresh and network error recovery.

- 📄 **Test Detail View**
  - Detailed pricing and report delivery turnaround time.
  - Special preparation instructions (e.g., fasting requirements).
  - Availability status indicators.
  - Direct 1-tap "Book Now" action.

- 📅 **3-Step Booking Wizard**
  - **Step 1: Patient Information** (Name, Age, Gender selection, Special notes).
  - **Step 2: Schedule Selection** (Interactive date picker for next 14 days + time slot selector).
  - **Step 3: Review & Confirm** (Summary of patient, appointment date/time, total price).
  - Instant confirmation screen with booking ID.

- 📋 **My Bookings Management**
  - List of all upcoming and past test bookings.
  - Status badges: *Pending ⏳, Confirmed ✅, Completed 🎉, Cancelled ❌*.
  - Cancellation workflow for pending bookings.
  - Pull-to-refresh to sync status.

- 👤 **User Profile & Theme Support**
  - Profile information overview and account stats.
  - Full Light and Dark mode theme support tailored for healthcare apps.
  - Secure logout flow.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Expo SDK 57](https://expo.dev) + [React Native 0.86](https://reactnative.dev)
- **Routing**: [Expo Router v57](https://docs.expo.dev/router/introduction/) (file-based navigation with Typed Routes)
- **Language**: TypeScript 6 (Strict Type Checking)
- **State & Context**: React Context API (`AuthContext`)
- **Secure Storage**: `expo-secure-store`
- **Linting & Code Quality**: `eslint` with `eslint-config-expo` (Zero warnings/errors)

---

## 📁 Project Structure

```text
maddie-app/
├── src/
│   ├── app/                    # Expo Router screens & layouts
│   │   ├── (auth)/             # Auth group
│   │   │   ├── _layout.tsx     # Auth stack navigator
│   │   │   ├── login.tsx       # Sign In screen
│   │   │   └── register.tsx    # Sign Up screen
│   │   ├── (tabs)/             # Main app tab navigator
│   │   │   ├── _layout.tsx     # Bottom tab bar configuration
│   │   │   ├── index.tsx       # Home dashboard
│   │   │   ├── tests.tsx       # Tests catalog & search
│   │   │   ├── bookings.tsx    # User bookings list & cancellation
│   │   │   └── profile.tsx     # User profile & logout
│   │   ├── book/
│   │   │   ├── _layout.tsx     # Booking flow stack
│   │   │   └── [id].tsx        # 3-step booking wizard screen
│   │   ├── test/
│   │   │   ├── _layout.tsx     # Test detail stack
│   │   │   └── [id].tsx        # Test detail screen
│   │   └── _layout.tsx         # Root layout + Auth Navigation Guard + ThemeProvider
│   ├── components/             # Reusable UI components
│   ├── constants/
│   │   └── theme.ts            # Healthcare design tokens (Colors, Spacing, Radius, Shadow)
│   ├── context/
│   │   └── AuthContext.tsx     # Global authentication provider & hook
│   ├── hooks/
│   │   ├── useTheme.ts         # Hook for theme colors & dark mode detection
│   │   └── use-color-scheme.ts # Platform color scheme detection
│   ├── lib/
│   │   └── api.ts              # Fetch client, auth interceptor & automatic token refresh
│   ├── services/
│   │   └── index.ts            # API services (testsService, bookingsService)
│   └── types/
│       └── index.ts            # Data models & API contracts
├── .env.example                # Environment variables template
├── app.json                    # Expo configuration
└── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or copy `.env.example`):

```bash
# Backend API Base URL
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

> **Note for Android Emulator**: Use `http://10.0.2.2:8000/api/v1` to point to `localhost` on your host machine.

---

## 🚀 Running the App

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npx expo start
```

Press:
- `a` to open in **Android Emulator / Device**
- `i` to open in **iOS Simulator**
- `w` to open in **Web Browser**

### 3. Verification & Quality Checks

Run TypeScript type check:
```bash
npx tsc --noEmit
```

Run Expo lint check:
```bash
npx expo lint
```

