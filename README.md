# zerO — Energy Reimagined ⚡🌱

A minimalist, human-centered smart home energy dashboard designed to eliminate standby power waste and classify device state loads. Developed for **SMIT Hackathon 2026** (Team 6: ZER0).

---

## 🔗 Live Application Link
🚀 **[Explore zerO Live Webapp](https://zero-smit-hackathon-2026.surge.sh)** — Hosted on Surge.sh, no login required!

---

## ✨ Features

### 1. Modern Serif Landing View
* Elegant serif typography, dynamic organic shape backgrounds, and minimalist interactive buttons.
* Featuring a **"Start with zerO"** transition entering the interactive telemetry dashboard.

### 2. Live Smart Plug Simulator & Charting
* Interactive power controller displaying states: **Active**, **Standby**, **Phantom Leak**, and **Patched**.
* Live real-time power telemetry timeline plotting load values dynamically using Chart.js.
* Custom responsive dial gauges indicating instant wattage consumption.

### 3. Dedicated Zen Plant Growth Screen
* Transitions into a quiet, minimal Zen space featuring an interactive growing SVG plant pot.
* **Absorbs Reclaimed Energy**: Sprout grows (+0.5% increments up to 100%) and blooms into a terracotta/gold sunflower *only* when the relay is actively **PATCHED** (standby load cut off).
* **Floating Energy Particles**: Glowing particles float into the soil when active.

### 4. Interactive Visual Story Walkthrough
* A gorgeous 3-step slide walkthrough modal explaining leak classifications, relay triggers, and cumulative inverter time gains.

### 5. Unified Dark Mode & UX Optimizations
* Global light cream vs midnight charcoal theme switching.
* Body scroll locking preventing layout scroll chaining when side drawers or modals are active.

---

## 🛠️ Tech Stack
* **Frontend**: HTML5 Canvas, Vanilla CSS3, Javascript, Lucide Icons, Chart.js.
* **Backend**: Flask (Python simulator server).

---

## 🚀 Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sourishnandy4-cell/zer0.git
   cd zer0
   ```

2. **Install dependencies**:
   ```bash
   pip install flask
   ```

3. **Run the server**:
   ```bash
   python app.py
   ```
   Open **http://127.0.0.1:5000/** in your browser!
