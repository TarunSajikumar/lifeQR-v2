# 🎨 Design System & UI/UX Guidelines — LifeQR

**Visual Design System & Frontend Specification**  
**Design Standard:** Swiss Brutalist / High-Contrast Emergency Editorial  
**Reference Benchmark:** `website/landingpage.html`  
**Target Viewports:** 360px Mobile (PWA) to 4K ER Wallboards  

---

## 1. Design Philosophy: Emergency Triage Ergonomics

LifeQR is not a generic SaaS product. It is deployed in life-or-death emergency conditions: inside speeding ambulances, in blinding sunlight during highway accidents, in darkened trauma bays, and on trembling phone screens held by panicked bystanders.

Therefore, our interface adheres to the **Swiss Brutalist Emergency Standard**:
- **Extreme Contrast & Instant Legibility:** High-contrast typography and borders that remain readable across glare and cracked screens.
- **Physicality & Tactile Feedback:** Chunky 2px solid borders and hard offset drop shadows (`4px 4px 0px`) create clear, touch-friendly interactive surfaces.
- **Zero Ambiguity:** Life-critical data (Blood Group, Allergies, ICE Contacts) is never buried in accordion menus or muted low-contrast grays.
- **Banned AI Tropes:** No pastel gradients, no soft blurry purple drop-shadows, no illegible low-opacity text, and no rounded `rounded-3xl` cards that waste precious viewport real estate.

---

## 2. Color Palette & Semantic Tokens

### Light Theme (Default Daylight & Emergency Mode)

| Token Name | Hex Code | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Signal Red** | `#E11D2E` | `bg-[#E11D2E] text-[#E11D2E]` | Brand primary, SOS emergency alerts, severe allergy warnings, critical action triggers. |
| **Pure Onyx** | `#111111` | `bg-[#111111] text-[#111111]` | Primary text, card borders, primary action buttons, telemetry ticker bar. |
| **Pure White** | `#FFFFFF` | `bg-white text-white` | Page background, card surfaces, inverted button text. |
| **Neutral Slate** | `#F8FAFC` | `bg-slate-50` | App background canvasing and muted container fills. |
| **Border Dark** | `#111111` | `border-2 border-[#111111]` | Standard card outlines, button borders, input field borders. |
| **Medical Amber** | `#F59E0B` | `bg-amber-500 text-amber-900` | Cautionary notices, pending doctor approvals, moderate warnings. |
| **Emergency Emerald** | `#10B981` | `bg-emerald-500 text-emerald-900` | Verified provider badges, normal vital signs, active connection status. |

### Dark Theme (Ambulance Night HUD & ER Wallboard Mode)

| Token Name | Hex Code | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Dark Canvas** | `#0B0F19` | `bg-[#0B0F19]` | Deep navy-black background minimizing battery usage and night glare. |
| **Card Surface** | `#131B2E` | `bg-[#131B2E]` | Elevated card containers and dashboard panels. |
| **Surface Border** | `#24324D` | `border-2 border-[#24324D]` | High-contrast borders in dark mode. |
| **Text Primary** | `#FFFFFF` | `text-white` | Main headlines and high-priority telemetry figures. |
| **Text Secondary**| `#94A3B8` | `text-slate-400` | Supporting metadata, field labels, and timestamps. |
| **Emergency Glow**| `#E11D2E` | `border-[#E11D2E] shadow-[0_0_15px_rgba(225,29,46,0.35)]` | Active SOS cards and trauma bay alert borders. |

---

## 3. Typography Scale & Font Pairing

```text
Display & Branding     ----> Archivo Black (800 / 900)   (Aggressive, confident, unmissable)
Body & Form Inputs     ----> Archivo / Inter (400 / 600) (High x-height, rapid scanning)
Telemetry & Identifiers ----> JetBrains Mono (500 / 700) (Tabular precision, unambiguous digits)
```

### Hierarchy Guidelines
1. **Brand & Section Headers (`font-black uppercase`):**
   - H1: `text-3xl md:text-5xl font-black uppercase tracking-tight`
   - H2: `text-xl md:text-2xl font-black uppercase tracking-tight`
   - H3: `text-base font-bold uppercase tracking-wider`
2. **Medical Telemetry & IDs (`font-mono`):**
   - QR Codes, Blood Types, Vitals, Lat/Lng: `font-mono font-bold tracking-widest`
   - Example: `RAH-D3200470`, `O POSITIVE (O+)`, `LAT: 12.9716 N`
3. **Emergency Disclaimers & Field Labels:**
   - Labels: `text-[11px] font-bold uppercase tracking-wider text-slate-500`

---

## 4. Component Design System

### 1. Cards & Containers (The 2px Offset Standard)
Every card, triage box, and modal must use sharp solid borders and hard offset drop shadows:

```html
<!-- Light Mode Standard Card -->
<div class="bg-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] p-6">
  <h3 class="font-black uppercase text-lg text-[#111111]">Patient Vitals</h3>
  ...
</div>

<!-- Critical Emergency Highlight Card -->
<div class="bg-white border-2 border-[#E11D2E] shadow-[6px_6px_0px_#E11D2E] p-6">
  <span class="inline-block bg-[#E11D2E] text-white text-xs font-mono font-black px-2 py-1 uppercase">
    Fatal Allergy Alert
  </span>
  <p class="font-black text-2xl text-[#E11D2E] mt-2">PENICILLIN (ANAPHYLAXIS)</p>
</div>
```

### 2. Buttons & Interactive Controls
```html
<!-- Primary Action Button -->
<button class="btn-primary bg-[#111111] text-white font-black text-sm uppercase px-6 py-3 border-2 border-[#111111] shadow-[3px_3px_0px_#E11D2E] hover:bg-[#E11D2E] hover:text-white transition-all">
  Save Record
</button>

<!-- Secondary / Outlined Button -->
<button class="btn-secondary bg-white text-[#111111] font-black text-sm uppercase px-6 py-3 border-2 border-[#111111] shadow-[3px_3px_0px_#111111] hover:bg-slate-100 transition-all">
  Download PDF
</button>

<!-- SOS Panic Button (Patient View) -->
<button class="btn-sos bg-[#E11D2E] text-white font-black text-lg uppercase px-8 py-5 border-4 border-[#111111] shadow-[6px_6px_0px_#111111] active:translate-x-1 active:translate-y-1 animate-pulse">
  🚨 Broadcast SOS Now
</button>
```

### 3. Live Telemetry Ticker Header
Placed at the top of responder and patient screens to convey real-time system liveness:
```html
<header class="bg-[#111111] text-white py-2.5 px-6 border-b-2 border-[#111111] flex items-center justify-between font-mono text-[11px]">
  <div class="flex items-center gap-3">
    <span class="relative flex h-2.5 w-2.5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D2E] opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E11D2E]"></span>
    </span>
    <span class="font-bold uppercase tracking-wider">LIVE TELEMETRY SERVER ACTIVE</span>
  </div>
  <div id="liveClock" class="font-bold tracking-widest text-slate-300">10:42:15 UTC</div>
</header>
```

### 4. Interactive Leaflet Radar Map
- Integrated in `CrewAmbulance_dashboard.html` for incident geolocation.
- Utilizes CartoDB Positron (light mode) or CartoDB Dark Matter (dark mode) tiles for minimal cognitive distraction.
- Victim location rendered with a pulsing red ring marker.
- Includes a direct button: `Navigate via Google Maps` opening `https://maps.google.com/?q={lat},{lng}`.

---

## 5. Universal Device Appearance & Theme Synchronization

To ensure smooth switching between day shifts and nighttime emergency operations without visual jarring or flash of unstyled content (FOUC):

### 1. Head Bootstrapper (Inline Script in Every `<head>`)
```html
<script>
  (function() {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

### 2. Runtime Dynamic Listener (`js/theme.js`)
```javascript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.toggle('dark', e.matches);
  }
});
```

---

## 6. QR Code Badge Specifications

Physical and printable QR badges (generated via `patient_dashboard.html` or `generateQR.js`) must strictly adhere to these criteria:

- **Dimensions:** 3.375" x 2.125" (Standard ISO/IEC 7810 ID-1 Credit Card Size).
- **Error Correction Level:** Minimum **Level M (15%)** or **Level Q (25%)** to ensure scannability even when badges are scuffed, scratched, or partially covered in field conditions.
- **Visual Contrast:** Pure black QR modules (`#000000`) on a crisp white background (`#FFFFFF`) with a 4-module quiet zone.
- **Header Elements:** LifeQR logo, Emergency Medical Star of Life, Patient Full Name, Blood Group in 24pt bold, and two primary ICE phone numbers printed in plain text beneath the QR matrix for manual dialing if the scanner is unpowered.
