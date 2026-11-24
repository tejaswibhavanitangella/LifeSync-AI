# 📱 LifeSync AI — Native Android App

A pure native Android application for **LifeSync AI**, built with **Kotlin 2.0**, **Jetpack Compose**, and **Material 3**. It connects seamlessly to the Python Flask backend to deliver synchronized productivity, financial budgeting, calendar scheduling, and voice-enabled AI copilot on mobile.

---

## 🚀 Key Features

1. **Dashboard & Pulse Metrics**:
   - Live synchronization with Flask backend (`/api/dashboard`).
   - 4 Pulse cards: Pending tasks count, Total spent, Available budget, and Storage mode status.
   - Monthly budget utilization progress bar with alert thresholds (Safe, Warning, Exceeded).
   - One-click **"Load Demo Data"** to populate realistic sample data.

2. **Tasks & Priority Management**:
   - Filter by `All`, `Pending`, `Completed`, `High Priority`, or `Due Soon`.
   - Real-time search query filtering.
   - Quick completion toggling with checkboxes and status sync.
   - Add task dialog with priority tagging (`High`, `Medium`, `Low`) and deadline picker.

3. **Finance & Smart Budgeting**:
   - Live expense tracking with category tags (🍔 Food, 🚕 Travel, 💻 Tech, 📚 Education, ⚡ Bills, 🛍️ Shopping, 💊 Health).
   - Quick 1-tap expense logging presets ("☕ Coffee ₹80", "🍕 Lunch ₹250", "🚕 Cab ₹180", "💻 Tech ₹500").
   - Category filtering & monthly budget limit editor.

4. **Timeline & Reminders**:
   - Unified chronological timeline showing both task deadlines and scheduled reminders together.
   - Add, schedule, and dismiss reminders.

5. **AI Copilot (Voice & Text)**:
   - Built-in speech-to-text voice input via Android `RecognizerIntent`.
   - Interactive proposal cards with "Confirm & Execute" workflow for intent verification before saving expenses or tasks.
   - Quick prompt chips (*"Add high priority task: Deliver Project Pitch"*, *"Spent 450 for team lunch"*, *"How much budget is remaining?"*).

6. **Settings & Customization**:
   - Smooth Dark & Light theme toggle.
   - Configurable Backend API URL (`10.0.2.2:5000` for Android Emulator, or local Wi-Fi IP for physical devices).
   - Backend health check test button.
   - Workspace reset button.

---

## 🛠️ Tech Stack & Architecture

- **Language**: Kotlin 2.0.21
- **UI Framework**: Jetpack Compose (BOM 2024.10.01) + Material 3
- **Architecture**: MVVM (Model-View-ViewModel) + StateFlow & Coroutines
- **Networking**: Retrofit 2.11 + OkHttp 4.12 + Gson
- **Navigation**: Jetpack Navigation Compose
- **Speech**: Android SpeechRecognizer / RecognizerIntent
- **Target SDK**: Android 15 (API 35), Min SDK: Android 8.0 (API 26)

---

## 🏃 Quick Start (How to Run)

### Prerequisites:
1. **Android Studio** (Ladybug or newer recommended) with Android SDK 35 installed.
2. The LifeSync AI backend running on your machine:
   ```bash
   cd ../backend
   python app.py
   ```
   *(Backend starts on `http://localhost:5000`)*

### 1. Open in Android Studio:
1. Open Android Studio.
2. Select **Open** and choose the `LifeSync-AI/android` directory.
3. Allow Gradle to sync dependencies.

### 2. Run on Emulator or Physical Device:
- **Android Emulator**:
  - The default base URL is pre-configured to `http://10.0.2.2:5000/`, which maps automatically to `localhost:5000` on your host machine.
  - Press the **Run** ▶️ button in Android Studio.
- **Physical Android Phone**:
  - Connect your phone and computer to the same Wi-Fi network.
  - Find your computer's local IP (e.g. `192.168.1.15`).
  - Open **Settings** inside the app and set the API Base URL to `http://192.168.1.15:5000/`.
  - Tap **Test Server Connection** to verify connection.

---

## 📁 Android Directory Structure

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/com/lifesync/ai/
│           ├── LifeSyncApplication.kt
│           ├── MainActivity.kt
│           ├── data/
│           │   ├── model/Models.kt
│           │   ├── api/LifeSyncApiService.kt
│           │   ├── api/NetworkClient.kt
│           │   └── repository/LifeSyncRepository.kt
│           └── ui/
│               ├── theme/ (Color.kt, Theme.kt, Type.kt)
│               ├── components/ (StatCard, PriorityBadge, CategoryTag, LifeSyncBottomNav)
│               ├── navigation/Screen.kt
│               ├── dashboard/ (DashboardViewModel.kt, DashboardScreen.kt)
│               ├── tasks/ (TasksViewModel.kt, TasksScreen.kt)
│               ├── finance/ (FinanceViewModel.kt, FinanceScreen.kt)
│               ├── calendar/ (CalendarViewModel.kt, CalendarScreen.kt)
│               ├── assistant/ (AssistantViewModel.kt, AssistantScreen.kt)
│               └── settings/SettingsScreen.kt
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```
