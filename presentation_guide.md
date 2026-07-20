# ZER0 — SMIT Hackathon 2026 Pitch & Q&A Guide

Welcome, Team 6! This is your ultimate weapon to ace the 5-minute presentation tomorrow. Read, memorize, and practice this pitch tonight.

---

## ⏱️ 5-Minute Pitch Script (Chronological)

### **0:00 – 1:00 | The Hook & The Himalayan Problem**
* **What to say:**
  > "Good morning, respected judges. We are Team 6, and we want to start with a question: How many times have you turned off your heater, charger, or projector, and assumed it was drawing zero electricity?
  >
  > In SMIT hostels and across Himalayan regions, winters are harsh and power cuts are frequent. We rely heavily on inverter batteries. But there is a silent thief draining our batteries and our wallets: **Phantom Loads** (also known as Vampire Power). These are devices that are switched 'off' or in standby, but still pull 5W to 50W because their internal transformers, indicators, and controllers remain active. Individually it seems small. Scaled across a hostel of 500 rooms, it is a massive grid drain and ruins inverter backup times when we need them most."

### **1:00 – 2:00 | Introducing ZER0**
* **What to say:**
  > "To solve this, we created **ZER0**—an intelligent smart plug system that identifies phantom loads at the edge and automatically patches them by physically opening its relay to cut power to absolute zero.
  >
  > Since we cannot source physical hardware in 12 hours, we built a high-fidelity dashboard that acts as the control panel for a ZER0 smart plug node. Let's walk you through the live simulation."

### **2:00 – 3:30 | The Live Demo Walkthrough**
* **Action:** Open the dashboard in the browser and show the screen.
* **What to say:**
  > "Here is our ZER0 dashboard, styled in a midnight Himalayan theme. Currently, we have an **Electric Room Heater** selected. It is running, drawing **1500 Watts** on the active telemetry dial. You can see the live telemetry line chart fluctuating realistically.
  >
  > Now, the student leaves the room and turns the device off via software."
* **Action:** Click the **"Turn Device OFF"** button.
* **What to say:**
  > "Observe what happens. Under normal circumstances, you'd think power draw is 0W. But our ZER0 Edge AI classifier instantly detects that the heater is still drawing **45 Watts**! 
  > 
  > The system immediately classifies this as a **PHANTOM LEAK** (shown in red). On the right, our impact tracker shows that if this leak continues, the hostel room's inverter backup will be significantly shortened.
  >
  > But watch what happens when ZER0 engages."
* **Action:** Click the glowing blue **"Patch Leak"** (or **"Cut Power"**) button.
* **What to say:**
  > "By engaging ZER0, the smart plug's physical relay trips open. Power drops to **0.0 Watts** completely. Instantly, our tracker begins accumulating savings. We see the energy saved ticking up, money saved climbing, and most importantly, **Inverter Life Extended** rising! In a real Himalayan winter power cut, this single patch adds over 300 minutes—5 full hours—of backup time to a student's room."

### **3:30 – 4:30 | How it Works (Under the Hood)**
* **What to say:**
  > "How is this possible? Under the hood, ZER0 smart plugs utilize an energy-monitoring IC (like the HLW8012) connected to an ESP32 microcontroller. 
  >
  > Instead of sending raw power data to a laggy cloud, our plug runs a lightweight **Edge AI State Machine**. It compares active power against pre-trained device profiles. If an appliance enters an idle or 'off' state but continues consuming power above the standby threshold, the ESP32 classifies it as a phantom leak and physically cuts the power line. When the user wants to turn it back on, a simple app tap closes the relay."

### **4:30 – 5:00 | Market Impact & Summary**
* **What to say:**
  > "ZER0 is simple, cheap to manufacture (under ₹300 per plug), and solves a real-world energy crisis. It saves money, reduces carbon footprints, and keeps Himalayan hostel lights on longer. 
  >
  > With ZER0, off means zero. Thank you, and we are open for questions."

---

## 🙋 Judge Q&A Prep (Hard Questions)

### **Q1: "How is this AI? It looks like simple rules."**
* **Answer:** 
  > "That is a great point. It is **Edge AI** utilizing a signature-matching state classifier. In a full-scale deployment, different devices (a GaN charger vs. a mechanical fan vs. an LED projector) have distinct electrical signatures (power factor, reactive power, noise harmonics). 
  > ZER0 uses a lightweight classification tree running locally on the ESP32 microcontroller. We do not use heavy neural networks because we need it to run on a ₹150 chip without internet latency. It is AI at the edge."

### **Q2: "Why not just unplug the devices manually?"**
* **Answer:**
  > "Human behavior is notoriously unreliable. Students rushing to a 9:00 AM lecture at SMIT are not going to crawl under their desks to unplug five different chargers and heaters. ZER0 automates this behavior, protecting the hostel grid silently in the background."

### **Q3: "How does it scale? What is the architecture?"**
* **Answer:**
  > "The smart plugs communicate via local Wi-Fi using the MQTT protocol. In a hostel or university campus, all plugs report to a central gateway (like a Raspberry Pi running a local broker). Hostel wardens can see a building-wide dashboard showing total kilowatts saved, while individual students control their own plugs via our mobile web wrapper dashboard."

### **Q4: "How did you calculate the Inverter Life Gained?"**
* **Answer:**
  > "We modeled a standard 12V 100Ah battery (1200 Wh capacity) common in hostels. 
  > * A basic room draw (router + bulb) is **80W** (gives **15 hours** backup).
  > * If you add a heater leak (**45W**), total draw is **125W** (backup drops to **9.6 hours**).
  > * By patching the leak, we drop the load back to 80W, reclaiming **5.4 hours (324 minutes)** of backup time. The math is real, immediate, and high-impact."
