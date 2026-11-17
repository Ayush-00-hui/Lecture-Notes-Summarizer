# NoteNest — AI Lecture Notes Summarizer: 3-Minute Demo Walkthrough

Welcome to **NoteNest** — an academic-grade AI lecture summarizer and prompt engineering laboratory. This guide provides a crisp 3-minute walkthrough demonstrating every core feature.

---

## Act 1: Instant Ingestion & Document Preview (0:00 – 0:45)

1. **Launch the Application**:
   - Navigate to `http://localhost:8088`.
   - Notice the clean navigation header, the active provider badge (*Offline NLP Mode* or *Gemini API Active*), and the Dark/Light theme toggle.
2. **One-Click Sample Ingestion**:
   - In the Hero section, click **"Try Sample Lecture (1-Click)"**.
   - NoteNest instantaneously ingests a 4-slide lecture on *Distributed Systems: Consensus Protocols & The Raft Algorithm*.
3. **Inspect the Document Preview Panel**:
   - Notice the document statistics badge: **4 Slides • 412 words • ~2.1 min read**.
   - Click through **Slide 1**, **Slide 2**, **Slide 3**, and **Slide 4**.
   - Note how each slide's extracted body text, bullet points, and speaker notes are displayed.
   - Edit any slide text directly in the preview textarea and click **"Save Edits"** — note how NoteNest dynamically re-indexes the document.

---

## Act 2: Generating the Multi-Modal Study Package (0:45 – 1:30)

1. **Configure Parameters**:
   - In the **Controls Bar**, select **Short (~130w)** mode (or toggle **Detailed (~550w)** or adjust the **Custom Slider**).
   - Set Target Audience to **Intermediate** and Language to **English**.
   - Ensure all four study deliverables are checked: *Summary*, *Key Concepts*, *Revision Points*, and *3D Flashcards*.
2. **Execute Summarization**:
   - Click **"Summarize Notes"** (or press keyboard shortcut `Ctrl + Enter`).
   - In seconds, the structured study package renders with tabbed navigation:
3. **Explore Results Tabs**:
   - **Summary Tab**: Formatted markdown with core theoretical takeaways. Test the quick **"Simplify"** or **"Expand"** buttons.
   - **Key Concepts Tab**: Cards containing the term, one-line definition, importance rating (*High/Medium/Low*), and exact source citations (*[Slide 1]*, *[Slide 2]*).
   - **Revision Checklist Tab**: Checkable exam bullet points grouped by topic (*Foundational Theory*, *Core Mechanisms*). Click **"View Likely Exam Question"** to reveal predictive examiner prompts.
   - **3D Flashcards Tab**: Click the card to flip between Question and Answer with 3D rotation. Click **"Got It! (Mastered)"** to trigger celebratory spaced repetition tracking.
4. **Export Your Notes**:
   - Click the **Export** dropdown and select **Printable PDF**, **Word Document (.docx)**, or **Markdown (.md)**.

---

## Act 3: The Prompt Comparison Lab (1:30 – 2:30)

1. **Enter the Laboratory**:
   - Click **"Comparison Lab"** in the top navigation bar.
   - If not already executed, click **"Run Lab on Sample Lecture"**.
2. **Witness Parallel Side-by-Side Execution**:
   - NoteNest executes **Prompt Design A (Direct Zero-Shot)** and **Prompt Design B (Structured Master Tutor Scaffold)** concurrently under identical model parameters.
   - Inspect the **Automated Comparative Verdict**:
     > *"Prompt B (Structured) wins on Concept Coverage and Slide Citations; Prompt A (Direct) wins on Latency and Brevity."*
3. **Word-Level Diff Highlighting**:
   - Toggle the **"Word Diff Highlighting"** button.
   - Watch the word-level diff segments highlight:
     - <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 4px; border-radius: 4px;">Pink / Red</span>: Concepts captured exclusively by Prompt A.
     - <span style="background-color: #d1fae5; color: #065f46; padding: 2px 4px; border-radius: 4px;">Green</span>: Deeper pedagogical explanations added by Prompt B's step-by-step reasoning.
4. **Multi-Dimensional Radar Chart & Objective NLP Metrics Table**:
   - Examine the interactive **Recharts Radar Chart** comparing *Coverage*, *Readability*, *Conciseness*, *Redundancy*, and *Fact Grounding*.
   - Review the metrics table: Flesch-Kincaid grade level, compression ratio, response latency (ms), and concept coverage percentage.
5. **LLM-as-a-Judge & Human Voting**:
   - Review the 4-dimension model evaluation (*Faithfulness*, *Coverage*, *Clarity*, *Conciseness* rated 1–5).
   - Cast your own votes in the **Human Evaluation & Voting** card (*Better Coverage*, *Better Conciseness*, *Overall Winner*) — votes are immediately committed to SQLite.
6. **In-App Prompt Template Editor**:
   - Click **"Edit Prompts"** to inspect the versioned Jinja2/string templates for Prompt A and B with variables `{{notes}}`, `{{length}}`, and `{{audience}}`.

---

## Act 4: Document Library & Offline Resilience (2:30 – 3:00)

1. **Document Library**:
   - Click **"Library"** in the navigation bar.
   - Notice the searchable sidebar of past runs with word counts, slide counts, and timestamps.
   - Test **Pin to Top**, **Rename**, and **Re-open** to resume studying any past lecture.
2. **Offline Resilience**:
   - NoteNest works completely offline without requiring any external cloud API key. Its built-in extractive graph algorithms (TextRank + YAKE) ensure zero downtime and privacy.
3. **Submission-Ready Benchmark Export**:
   - In the Comparison Lab, click **"Export PDF Report"** to download an academic-grade comparative benchmark report ready for grading or publication.
