# Problem Statement
## AquaSafe — Water Quality Index Dashboard
### FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay

---

## 1. The Problem

### India's Drinking Water Crisis

Access to safe drinking water is one of the most critical public health challenges in India today.

- **70%** of India's surface water is contaminated (CPCB, 2022)
- **21 major cities** will run out of groundwater by 2030 (NITI Aayog, 2018)
- **2 lakh people** die every year in India due to water-borne diseases (WHO India, 2023)
- **600 million** Indians face high-to-extreme water stress (WRI, 2023)
- Fluoride contamination affects **19 states**; arsenic affects **10 states** (CGWB, 2021)

Despite these facts, the vast majority of households, schools, anganwadis, and rural communities in India have **no practical way to assess water quality** without sending samples to a certified laboratory — a process that costs hundreds of rupees, takes days, and requires technical expertise.

### The Gap: Knowledge Without Tools

The Bureau of Indian Standards (BIS) published **IS 10500:2012**, the definitive standard for drinking water quality in India, which defines permissible limits for pH, TDS, turbidity, BOD, nitrates, fluoride, hardness, and coliform bacteria.

The scientific community has a validated method for computing a **single composite score** from all these parameters — the **Water Quality Index (WQI)** based on Brown et al. (1972). This method is used by the CPCB, state pollution control boards, and academic researchers.

However, this knowledge exists only in research papers, Excel sheets, and command-line scripts. There is **no interactive, accessible, open-source tool** that:
- Takes raw measured values as input
- Applies the IS 10500:2012 limits correctly
- Computes the WQI using the published formula
- Gives an instant visual result with actionable recommendations
- Can generate a printable report for documentation

---

## 2. Who Needs This?

| User | Scenario |
|---|---|
| **Students & researchers** | Analyse water quality data for science projects, dissertations, field studies |
| **NGOs & community workers** | Quickly assess borewell / handpump / river water quality in villages |
| **School & college labs** | Demonstrate water quality science interactively |
| **Municipal officers** | Cross-check lab results against IS 10500 limits instantly |
| **Journalists & activists** | Document and compare water quality data across locations |
| **Educators** | Teach environmental science using a real, standards-based tool |

---

## 3. The Solution: AquaSafe

**AquaSafe** is a Scilab-based GUI application that puts the full power of the IS 10500:2012 standard and the Brown et al. WQI formula into an interactive desktop tool — for free, with no internet connection, and no installation beyond Scilab itself.

### How AquaSafe Solves the Problem

| Problem | AquaSafe Solution |
|---|---|
| WQI formula is complex and error-prone to calculate by hand | Automated computation — zero chance of arithmetic errors |
| IS 10500:2012 limits need to be looked up from a document | All 8 limits are built in and shown next to every input field |
| Raw numbers are hard to interpret without context | Real-time green/red colour coding shows safe vs. unsafe instantly |
| Multiple parameters make it hard to see patterns | Radar chart gives a visual "water quality footprint" at a glance |
| No printable report for documentation | One-click export to a styled HTML/PDF report |
| Requires technical knowledge to use | Sliders and visual feedback make it usable by anyone |

---

## 4. Scientific Methodology

### Water Quality Index Formula
AquaSafe implements the **Brown et al. (1972) Weighted Arithmetic WQI method:**

```
WQI = Σ(Wi × Qi) / Σ(Wi)
```

**Quality Score (Qi):**
- pH: deviation from ideal 7.0 with penalty outside 6.5–8.5
- Coliform: binary scoring (0 = absent, penalty if present)
- All others: Qi = (Measured value / IS 10500 permissible limit) × 100

**Weight Assignment (Wi) — based on health significance:**
- Coliform (0.264) — highest, direct bacterial risk
- Turbidity, BOD (0.150 each) — contamination indicators
- Fluoride (0.100) — fluorosis risk
- pH (0.117) — chemical balance
- TDS, Nitrates, Hardness (0.073 each) — lower individual risk

### Classification Scale
| WQI | Category |
|---|---|
| 0–25 | Excellent |
| 25–50 | Good |
| 50–75 | Poor |
| 75–100 | Very Poor |
| >100 | Unsafe |

---

## 5. Innovation and Originality

AquaSafe goes significantly beyond the introductory GUI examples in the Spoken Tutorials:

1. **Real scientific standard** — IS 10500:2012 (Bureau of Indian Standards), not hypothetical data
2. **Published research formula** — Brown et al. (1972), cited in 1000+ peer-reviewed papers
3. **Parametric radar chart** — 8-axis spider chart using `r*cos(θ), r*sin(θ)` parametric math
4. **Live bidirectional sliders** — all 8 parameters, with decimal-aware rounding
5. **Real-time colour feedback** — green/red edit boxes update without clicking Calculate
6. **Styled HTML report** — generates a complete formatted report with CSS, progress bars, and a parameter table, opened via system browser
7. **Health-weighted scoring** — not a simple average, but a weighted formula reflecting real-world epidemiological importance

---

## 6. Social Impact

AquaSafe addresses **UN Sustainable Development Goal 6: Clean Water and Sanitation**.

In a country where millions of people drink water without any quality assurance, a free, accessible, interactive tool that applies IS 10500:2012 standards can:

- Enable **community monitoring** of local water sources
- Help **teachers** demonstrate environmental science concepts concretely
- Allow **field workers** to document and compare water quality across locations
- Support **student research projects** at the school and college level
- Generate **printable PDF reports** that can be shared with authorities

---

## 7. References

1. Brown, R.M., McClelland, N.I., Deininger, R.A., Tozer, R.G. (1972). *A water quality index — do we dare?* Water and Sewage Works, 119(10), 339–343.
2. Bureau of Indian Standards. (2012). *IS 10500:2012 — Drinking Water Specifications (Second Revision)*. BIS, New Delhi.
3. CPCB. (2022). *Annual Report: Water Quality Status of River Basins*. Central Pollution Control Board, Ministry of Environment, Forest and Climate Change, GoI.
4. NITI Aayog. (2018). *Composite Water Management Index*. Government of India.
5. World Resources Institute. (2023). *Aqueduct Water Risk Atlas — India*. WRI, Washington DC.
6. WHO India. (2023). *Water, Sanitation and Hygiene (WASH) — India Profile*. World Health Organization.
7. CGWB. (2021). *Report on Groundwater Quality in Shallow Aquifers of India*. Central Ground Water Board, Ministry of Jal Shakti, GoI.

---

## Author

**Krishna**
FOSSEE Scilab GUIVerse Hackathon 2026
IIT Bombay | FOSSEE | NMEICT, Ministry of Education, Govt. of India
