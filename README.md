# Replication Package — MSc Thesis

**"Early Value in AI Automation Builders for Non-Technical Users"**
Jort van Meenen — Utrecht University, Business Informatics, 2026

Supervisors: Fabiano Dalpiaz, Christof van Nimwegen, Sjaak Brinkkemper

---

## Overview

This replication package contains all supporting materials for the empirical research conducted in this thesis. The study follows a Design Science Research (DSR) methodology consisting of a problem investigation and two iterative design cycles.

All participant data has been anonymized prior to inclusion. Participants are identified by single-letter (Problem Investigation, Design Cycle 1) or two-letter (Design Cycle 2) pseudonyms. Identifying details such as employer names, organization names, and other re-identifying context have been removed or generalized.

---

## Contents

### Literature Extraction (`/`)

- **RQ1_Literature_Extraction_Phase_1_All-Papers.xlsx** — Initial extraction of all 60 screened publications (phase 1 screening)
- **RQ1_Literature_Extraction_with_Traditional_Baseline_Added.xlsx** — Final coded extraction of 27 peer-reviewed studies across three system types (traditional software, AI systems, AI automation builders), including thematic coding of early value challenges

### Transcripts (`transcripts/`)

**Problem Investigation** (`transcripts/problem-investigation/`): Anonymized transcripts from 6 semi-structured exploratory interviews with non-technical professionals (participants A, I, L, M, O, W). Interviews explored challenges with AI automation builders in professional contexts.

**Design Cycle 1** (`transcripts/design-cycle-1/`): Anonymized transcripts from 5 think-aloud walkthrough sessions with a low-fidelity Figma prototype (participants B, C, K, N, P). The researcher presented screens one by one; participants did not interact with the prototype directly.

**Design Cycle 2** (`transcripts/design-cycle-2/`): Anonymized transcripts from 8 task-based user study sessions with the high-fidelity web prototype (participants B, C, F, G, H, K, N, P). Participants completed two tasks (setting up and managing an automation) while thinking aloud, followed by a post-task questionnaire.

### Protocols (`protocols/`)

- **PI_Interview_Package.docx** — Problem Investigation interview package, including the informed consent form and semi-structured interview guide
- **DC2_Sessieprotocol.pdf** — Design Cycle 2 session protocol (in Dutch), describing the task scenarios, think-aloud procedure, and post-task questionnaire administration

### Consent Forms (`consent-forms/`)

- **Informed_Consent_DC1_LoFi_Walkthrough.md** — Informed consent form for Design Cycle 1 think-aloud walkthrough participants
- **Informed_Consent_DC2_HiFi_UserStudy.md** — Informed consent form for Design Cycle 2 task-based user study participants

### Questionnaire (`questionnaire/`)

- **Questionnaire_Items_DC2.md** — Full list of post-task questionnaire items used in Design Cycle 2, including the System Usability Scale (SUS, Brooke 1996), Technology Acceptance Model scales (TAM PU + EOU, Davis 1989), Perceived Behavioral Control (Ajzen 1991), and pre/post confidence items

### Lo-Fi Prototype (Figma)

The low-fidelity prototype used in Design Cycle 1 is available as a Figma file:

[Thesis Lo-fi Prototype — AI Automation Builder for Non-technical Users](https://www.figma.com/design/tbCHeioWKGejceaf8jSfCk/Thesis-Lo-fi-Prototype-AI-Automation-Builder-for-Non-technical-Users?node-id=0-1)

The prototype consists of static screens presented one by one by the researcher during think-aloud walkthrough sessions. Participants did not interact with it directly.

### Hi-Fi Prototype (`prototype/hi-fi/`)

Source code for the functional web-based prototype used in Design Cycle 2. Built with Next.js 16 and deployed on Vercel. The prototype accepts natural language automation descriptions, generates a structured workflow plan via the Azure OpenAI API (GPT-5.4-mini), runs a simulated dry run with step-by-step feedback, and presents an activation and success screen.

**To run locally:**
```bash
npm install
# Create a .env.local file with your Azure OpenAI credentials:
# AZURE_OPENAI_ENDPOINT=...
# AZURE_OPENAI_KEY=...
# AZURE_OPENAI_DEPLOYMENT=...
npm run dev
```

Note: Live API credentials are not included. The prototype requires an Azure OpenAI deployment to function. The scenario matching logic in `lib/scenarios.ts` and `lib/matcher.ts` documents the five automation scenarios covered.

---

## Research Design

| Phase | Method | Participants | Output |
|-------|--------|-------------|--------|
| Problem Investigation | Semi-structured interviews | 6 non-technical professionals | Taxonomy of early value challenges (RQ1/RQ2) |
| Design Cycle 1 | Think-aloud lo-fi walkthrough (Figma) | 5 non-technical professionals | Initial design principles DP1–DP6 (RQ3) |
| Design Cycle 2 | Task-based user study (hi-fi prototype) | 8 non-technical professionals | Validated/refined design principles (RQ4) |

---

## Citation

Van Meenen, J. (2026). *Early Value in AI Automation Builders for Non-Technical Users*. Master's thesis, Utrecht University.

## Author

Jort van Meenen — [@Jort2002](https://github.com/Jort2002)
