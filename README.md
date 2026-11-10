# Urbanicity Gradient Index (UGI) – Calculator

[![DOI](https://zenodo.org/badge/1335166261.svg)](https://doi.org/10.5281/zenodo.21954272)

Scientific paper DOI:
[![DOI](https://img.shields.io/badge/DOI-10.1007/s44243--026--00089--2-blue)](https://doi.org/10.1007/s44243-026-00089-2)

**Authors**: Juliana Melo Linhares Rangel, Apiano Ferreira Morais, Marcelo Alves Ramos  
**Journal**: Frontiers of Urban and Rural Planning, Volume 4, article 18 (2026)  
**DOI**: [10.1007/s44243-026-00089-2](https://doi.org/10.1007/s44243-026-00089-2)

---

## Online calculator

**https://apianomorais.github.io/urbanicity-gradient-index-UGI/**

A static page (no server, no installation) that runs entirely in the browser,
in Portuguese and English:

- **Calculator** – one locality at a time: enter population, density and
  distance, tick the infrastructure present, and watch the score and its four
  components update at every tick. The result is placed on the UGI versus
  population plot of the 100 calibration localities.
- **Methodology** – the four scoring functions, the 34 PCA-derived weights
  (downloadable as CSV) and the published validation figures.
- **Batch and calibration** – score a whole CSV at once and download the
  results, or upload your own survey and have the page redo the PCA in the
  browser to derive weights for your region.

The page source is in `docs/`. The infrastructure weights it ships with are
regenerated from `data/complete_data.csv` by `tools/make_site_data.py`, so the
site, the Python scripts and the Shiny app always agree.

---

## Overview

This repository contains the complete implementation of the **Urbanicity Gradient Index (UGI)**, a continuous measure (0–100) of urbanicity that overcomes the limitations of binary urban-rural classifications.

The UGI integrates:
- **Population size** (sigmoid function)
- **Population density** (exponential function)
- **Distance to urban centers** (linear decay)
- **Infrastructure development** (34 variables across 7 domains)

Weights for infrastructure variables are derived empirically using **Principal Component Analysis (PCA)** from a calibration dataset of 100 localities (rural to megacities).

---

## Repository Structure
```
/
├── data/
│ └── complete_data.csv # Calibration dataset (100 localities)
├── R/
│ └── UGI_user_EN.R # Shiny app (graphical user interface)
├── python/
│ ├── UGI_user_EN.py # Command‑line version (English)
│ └── UGI_user_PT.py # Command‑line version (Portuguese)
├── docs/ # Online calculator (GitHub Pages)
├── tools/
│ └── make_site_data.py # Regenerates docs/assets/js/dados.js from the dataset
├── README.md # This file
├── LICENSE # MIT License
└── .gitignore # Ignored files (R + Python)
```

---

## How to Use

### 1. R / Shiny App (Graphical Interface)

**Requirements:** R (≥ 4.0) with the following packages installed:

```r
install.packages(c("shiny", "shinydashboard", "DT", "plotly", 
                   "shinycssloaders", "shinyWidgets", "readr", 
                   "dplyr", "ggplot2", "jsonlite", "R6"))
```
Run the app:
```
shiny::runApp("R/UGI_user_EN.R")
```
The app will automatically load data/complete_data.csv for calibration. You can then enter locality data and infrastructure presence interactively.

2. Python CLI (Command Line)
Requirements: Python 3.7+ with the following packages:
```
pip install pandas numpy scikit-learn matplotlib seaborn
```
Run (English version):
```
python python/ugi_calculator.py
```
Run (Portuguese version):
```
python python/ugi_calculator_pt.py
```
The script will prompt you to enter:

Locality name, population size, density, and distance to urban center.
Presence (1/yes) or absence (0/no) of each of the 34 infrastructure items.
It then calculates and displays the UGI score, component breakdown, and classification.

Calibration Dataset (data/complete_data.csv)
The CSV file must contain the following columns:

Column	Type	Description
Localities	character	Name of the locality
Population Size	integer	Total inhabitants
Population Density	numeric	People per km²
Distance to Town	numeric	Distance to nearest urban center (km)
Factory, Supermarket, ..., University	binary (0/1)	34 infrastructure variables (exact names as in the script)
If any infrastructure column is missing, the script fills it with 0 (absent). The column names must match exactly those defined in the infrastructure_variables list inside the scripts.

Reproducing the Paper's Results
To reproduce the validation results (PCA, factor analysis, 5,000 simulations, Table 2, Figures 1–5):

Clone this repository.
Run the R Shiny app – it already includes the full calibration pipeline.
For script‑based reproduction, use the Python CLI or extend the R code.
All robustness tests (section 4.5 of the paper) are implemented in the R environment, including the 1,000 random subsamples per sample size.

Citation
If you use this code or data in your research, please cite the original article:
Rangel, J.M.L., Morais, A.F. & Ramos, M.A. Beyond binary urban-rural classifications: a continuous urbanicity gradient index. Front. Urban Rural Plan. 4, 18 (2026).
https://doi.org/10.1007/s44243-026-00089-2

License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details. You are free to use, modify, and distribute the code, provided that proper attribution is given.

---

Support
For questions, bug reports, or feature requests, please open an [Issue](https://github.com/apianomorais/urbanicity-gradient-index-UGI/issues) on this repository.
