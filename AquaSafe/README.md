# AquaSafe — Water Quality Index Dashboard
### FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay

---

## What is AquaSafe?

AquaSafe is an interactive GUI application built in Scilab that calculates the **Water Quality Index (WQI)** of a water sample using the **Brown et al. (1972) Weighted Arithmetic method** — the same standard used by researchers, government labs, and the Central Pollution Control Board (CPCB) of India.

A user enters 8 measured water parameters (pH, TDS, Turbidity, BOD, Nitrates, Fluoride, Hardness, Coliform) and AquaSafe instantly computes the WQI, classifies the water as Excellent / Good / Poor / Very Poor / Unsafe, shows a colour-coded radar chart and horizontal bar chart, and can export the full report as a PDF.

**The goal:** Give anyone — a student, a villager, an engineer, an NGO worker — a fast, reliable, zero-cost way to assess drinking water safety against the India IS 10500:2012 standard, without needing an expensive lab report.

---

## Features

| Feature | Details |
|---|---|
| **WQI Calculation** | Brown et al. 1972 Weighted Arithmetic method with health-significance weights |
| **8 Water Parameters** | pH, TDS, Turbidity, BOD, Nitrates, Fluoride, Hardness, Coliform |
| **Live Colour Feedback** | Edit boxes turn **green** (safe) or **red** (exceeds limit) as you type — no need to click Calculate |
| **Sliders for All Parameters** | All 8 parameters have sliders — drag to explore values instantly |
| **Quality Radar Chart** | 8-axis parametric spider chart showing water quality "footprint" |
| **Horizontal Bar Chart** | Colour-coded (green→red) scores for each parameter with the safe limit line |
| **5-Level Classification** | Excellent / Good / Poor / Very Poor / Unsafe with recommendation text |
| **8 Status Boxes** | Green (PASS) or Red (FAIL) for each parameter with individual score |
| **Export to PDF** | Generates a styled HTML report and opens it in the browser (Ctrl+P → Save as PDF) |
| **IS 10500:2012 Standard** | Bureau of Indian Standards drinking water limits used throughout |

---

## How to Run

### Requirements
- **Scilab** (version 6.0 or later, tested on Scilab 2026.1.0)
- No additional toolboxes required — uses only built-in Scilab functions

### Steps

**1. Download / clone the project files**

Make sure all three files are in the same folder:
```
AquaSafe/
├── run_aquasafe.sce       ← launch this file
├── aquasafe_engine.sci    ← WQI engine + callbacks + charts
└── AquaSafe.sci           ← GUI layout builder
```

**2. Open Scilab**

**3. Run the launch script** — in the Scilab console:
```scilab
exec('C:\path\to\AquaSafe\run_aquasafe.sce')
```
Replace `C:\path\to\AquaSafe\` with the actual folder path on your machine.

**4. The AquaSafe dashboard opens automatically.**

---

## How to Use

| Step | Action |
|---|---|
| 1 | Enter your measured water parameter values in the edit boxes — or drag the sliders |
| 2 | Watch the edit boxes turn **green** (within IS 10500 limit) or **red** (exceeds limit) in real time |
| 3 | Click **CALCULATE WQI** to see the full WQI score, classification, radar chart and bar chart |
| 4 | Check the 8 parameter status boxes at the bottom (green = PASS, red = FAIL) |
| 5 | Click **EXPORT REPORT (PDF)** — a styled HTML report opens in your browser |
| 6 | In the browser, press **Ctrl+P → Save as PDF** to download the report |
| 7 | Click **RESET** to clear all values and start a new assessment |

---

## Water Quality Index — The Science

### Formula
AquaSafe uses the **Brown et al. (1972) Weighted Arithmetic WQI method:**

```
WQI = Σ(Wi × Qi) / Σ(Wi)
```

Where:
- **Wi** = weight of parameter i (based on health significance)
- **Qi** = quality score of parameter i (0 = ideal, 100 = at safe limit, >100 = exceeds limit)

### Quality Score (Qi) Calculation
- **pH** — deviation from ideal value 7.0, with penalty for going outside 6.5–8.5
- **Coliform** — binary: 0 if absent (safe), escalating penalty if present
- **All others** — linear ratio: `Qi = (Measured / Safe Limit) × 100`

### Parameter Weights
| Parameter | Weight | Reason |
|---|---|---|
| pH | 0.117 | Affects chemical balance and corrosivity |
| TDS | 0.073 | Dissolved solids indicator |
| **Turbidity** | **0.150** | Contamination and pathogen carrier indicator |
| **BOD** | **0.150** | Organic pollution indicator |
| Nitrates | 0.073 | Risk of methemoglobinemia (blue baby syndrome) |
| Fluoride | 0.100 | Dental/skeletal fluorosis risk |
| Hardness | 0.073 | Cardiovascular effects at high levels |
| **Coliform** | **0.264** | Highest — direct bacterial contamination risk |

### WQI Classification
| WQI Score | Category | Recommendation |
|---|---|---|
| 0 – 25 | 🟢 Excellent | Safe to drink. Test every 6 months. |
| 25 – 50 | 🟢 Good | Safe to drink. Test every 3 months. |
| 50 – 75 | 🟡 Poor | Boiling / basic filtration required. |
| 75 – 100 | 🟠 Very Poor | RO / UV treatment required. Not safe for vulnerable groups. |
| > 100 | 🔴 Unsafe | Do NOT drink. Report to local authorities. |

---

## Safe Limits (IS 10500:2012)
| Parameter | Safe Limit | Unit |
|---|---|---|
| pH | 6.5 – 8.5 | — |
| TDS | 500 | mg/L |
| Turbidity | 5 | NTU |
| BOD | 5 | mg/L |
| Nitrates | 45 | mg/L |
| Fluoride | 1.5 | mg/L |
| Hardness | 300 | mg/L |
| Coliform | 0 (Absent) | MPN/100 mL |

---

## File Structure

```
AquaSafe/
├── run_aquasafe.sce
│     Entry point. Loads engine and GUI, then calls AquaSafe().
│
├── aquasafe_engine.sci
│     Core WQI formula (compute_wqi), classification (classify_wqi),
│     all GUI callbacks (calculate_wqi, reset_form, slider_update,
│     live_check, update_limits), chart drawing (draw_radar_chart,
│     draw_bar_chart), and report export (export_report).
│
└── AquaSafe.sci
      Builds the entire GUI window using uicontrol() calls.
      Creates all panels, labels, edit boxes, sliders, buttons,
      checkbox, and chart axes.
```

---

## Scilab GUI Concepts Demonstrated

This project covers all 9 spoken tutorial topics on "GUI in Scilab":

| Concept | Where Used in AquaSafe |
|---|---|
| `figure()` + `uicontrol()` basics | Main window creation in `AquaSafe.sci` |
| Pushbutton with callback | CALCULATE, EXPORT, RESET buttons |
| Edit box with `get/set` | All 8 parameter input fields |
| Text styling (`backgroundcolor`, `fontsize`) | Live colour feedback, result boxes |
| String↔Number conversion (`strtod`, `string`) | Input validation and display |
| Embedded axes + `plot2d`, `xpoly`, `xtitle` | Radar chart and bar chart |
| Checkbox with `.value` reading | "Show safe-limit ring" toggle |
| Radiobutton (evolved to fixed label) | Standard selector |
| Slider with live update | All 8 parameter sliders |
| Parametric math for radar chart | `r*cos(θ), r*sin(θ)` for 8-axis radar |

---

## Screenshots

*(See the `/screenshots` folder or the sample outputs in the submission)*

---

## References

1. Brown, R.M., McClelland, N.I., Deininger, R.A., Tozer, R.G. (1972). *A water quality index — do we dare?* Water and Sewage Works, 119(10), 339–343.
2. Bureau of Indian Standards. (2012). *IS 10500:2012 — Drinking Water Specifications (Second Revision)*. BIS, New Delhi.
3. CPCB (2022). *Annual Report on Water Quality of Rivers in India*. Central Pollution Control Board, Ministry of Environment, GoI.

---

## Author

**Krishna**
FOSSEE Scilab GUIVerse Hackathon 2026
IIT Bombay | FOSSEE | NMEICT, Ministry of Education, Govt. of India

---

*AquaSafe is submitted as an open-source project under the Creative Commons Attribution-ShareAlike 4.0 International License.*
