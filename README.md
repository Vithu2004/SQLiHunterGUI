# 🛡️ SQLiHunter: Advanced Vulnerability Audit Tool

**SQLiHunter** is a professional-grade security auditing tool built with **Electron** and **React**. It automates the discovery and analysis of SQL injection vulnerabilities using a multi-layered detection engine, ranging from simple fuzzing to advanced blind injection techniques.

---

## 🚀 Key Features

* **Automated Deep Crawling**: Recursively maps the target domain to discover forms, API endpoints, and URL parameters (`GET` & `POST`).
* **Multi-Phase Injection Engine**:
    * **Error-Based**: Detects database footprints through 50+ specific error patterns.
    * **Boolean-Based**: Uses differential content analysis (size-based comparison) to detect invisible vulnerabilities.
    * **Time-Based (Blind)**: High-precision timing analysis with adaptive baseline compensation.
* **WAF Detection & Bypass**: Identifies Web Application Firewalls (403/400 codes) and adjusts payload aggressiveness.
* **Smart Scoring System**: Every finding is ranked from **0 to 100 (Critical)** based on confirmation confidence.
* **Cookie-Aware Scanning**: Full support for authenticated sessions using `tough-cookie` and `axios-cookiejar-support`.

---

## 🛠️ The Technical Core (How it Works)

The backend logic follows a strict 4-step security pipeline:

### 1. Mapping (`Crawler.js`)
The engine discovers the **Attack Surface** by parsing HTML attributes (`href`, `action`) and identifying interactable parameters. It handles recursion limits to ensure scan stability.

### 2. Fuzzing & Profiling
Initial tests inject special characters (`'`, `"`, `()`) to trigger anomalous server responses (HTTP 500/400) and identify the underlying database engine.

### 3. Blind Analysis (`Injecter.js`)
* **Size Differential**: For Boolean tests, the scanner confirms a flaw by comparing response sizes between `TRUE` and `FALSE` conditions. It uses a **2% threshold** or a **50-byte minimum** to eliminate dynamic content noise.
* **Time Precision**: For Time-based tests, it uses a 90% confidence interval formula to account for network jitter:
    $T_{observed} \geq (T_{delay} + T_{baseline}) \times 0.9$

### 4. Verification & Scoring
Confirmed vulnerabilities are cross-validated with secondary payloads to eliminate false positives. The final results are sorted by severity to prioritize remediation.

---

## 📂 Project Structure

```text
src/
├── main/
│   └── core/
│       ├── Crawler.js        # Recursive URL discovery
│       ├── AttackSurface.js  # Parameter mapping & Normalization
│       ├── Injecter.js       # Payload execution & Differential analysis
│       ├── Scanner.js        # Main orchestration engine
│       └── utils.js          # URL validation & HTTP helpers
└── renderer/                 # React Frontend (Electron UI)
