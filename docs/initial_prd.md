# PRD — Flow Prompt (V1)

## 1. Problem statement

Prompt engineering today is:

* Ephemeral (history is lost)
* Single-model focused
* Hard to iterate intentionally
* Missing an AI partner that helps improve the prompt itself

You want a tool where:

* Prompts are **objects**, not just text fields
* Iteration is **intentional** (save runs, compare outcomes)
* Multiple models can be tested **side-by-side**
* An AI assistant helps you **refine the prompt** using the prompt + outputs as context

This is a **prompt flow editor**, not a chat app.

---

## 2. Product vision

A fast, persistent prompt playground that:

* Stores projects and prompts
* Runs prompts against multiple providers/models
* Preserves outputs per run
* Lets a “Prompt Assistant” coach the prompt to better outcomes

V1 is **single-page workspace**. A node/canvas system is a clear V2.

---

## 3. Target users

* Engineers / builders iterating on prompts for tools, agents, workflows
* Creators (like you) refining character/prompt “recipes” over time
* Teams who need repeatable, comparable prompt experiments (V2+)

---

## 4. MVP scope (V1)

### In scope

* Projects → Prompts
* Markdown prompt editor (light WYSIWYG)
* Multi-model run (OpenAI + Anthropic + Gemini)
* Output viewer (Markdown render)
* Prompt Assistant panel with context awareness
* Persisted run history

### Out of scope (explicitly deferred)

* Node graph / infinite canvas
* Full version control / diffs / branching
* Sharing / collaboration
* Prompt chaining / pipelines
* Plugins / extensions

---

## 5. Core user workflow (happy path)

1. Create/select **Project**
2. Create/select **Prompt**
3. Write prompt (Markdown)
4. Select one or more models
5. Run
6. View outputs (per model)
7. Use Prompt Assistant to diagnose + improve
8. Apply suggestion → edit prompt
9. Re-run

The loop must feel excellent.

---

## 6. Primary UI (single prompt workspace)

### Layout (V1)

* Header: Project name / Prompt name
* **Prompt Editor** (Markdown)
* **Model Select + Controls** (normalized params)
* Run controls (Run all / Run selected)
* **Outputs grid** (one panel per model run)
* **Prompt Assistant** (side panel or bottom drawer)

### UX requirements

* Fast keyboard flow (Cmd+Enter runs)
* Outputs are copyable and nicely rendered
* Runs are timestamped
* Easy to re-run with same settings

---

## 7. Prompt Assistant (critical feature)

### Assistant context includes

* Current prompt text
* Selected model(s)
* Latest outputs (and optionally prior runs)
* User’s instruction about what’s wrong / what they want

### Assistant responsibilities

* Explain mismatches (why output isn’t meeting intent)
* Suggest concrete prompt edits
* Offer multiple options (tight, creative, structured)
* Provide **Apply suggestion** (replace prompt or insert patch)

### Assistant UX

* Chat-style conversation, but scoped to “improve this prompt”
* Suggestions presented as:

  * Proposed rewritten prompt (primary)
  * Rationale (short)
  * Optional tweaks / knobs

---

## 8. Multi-model support

### Supported providers (V1)

* OpenAI: GPT-5.2 (and later variants)
* Anthropic: Sonnet 4.5, Opus 4.5
* Google: Gemini 3

### Capability abstraction

Define a normalized capability schema to drive UI:

* `supportsThinking`
* `supportsTemperature`
* `supportsSystemPrompt`
* `maxTokens`
* `notes` / constraints

UI behavior:

* If a model doesn’t support a control, hide/disable it
* Unsupported params are omitted from requests (not treated as errors)

---

## 9. Data model (minimal but real)

### Project

* `id`
* `name`
* `createdAt`

### Prompt

* `id`
* `projectId`
* `name`
* `contentMarkdown`
* `createdAt`
* `updatedAt`

### PromptRun

* `id`
* `promptId`
* `provider` (openai/anthropic/google)
* `model`
* `parametersJson`
* `outputMarkdown`
* `createdAt`

Notes:

* V1 has no keystroke history.
* Prompt edits update the prompt.
* Runs are immutable and preserve the experiment trail.

---

## 10. Versioning approach (V1)

### V1 philosophy

* No auto-version per edit
* No diffs
* No branching

Instead:

* Runs create durable history
* Users can optionally add a “checkpoint” later (V2)

Potential V2 additions:

* Save version
* Duplicate prompt
* Compare versions
* Branch runs

---

## 11. Technical approach (suggested)

### Frontend

* Next.js (App Router)
* React
* Markdown editor: TipTap / Milkdown / similar (keep it simple)
* Tailwind (or equivalent)

### Backend

* Next.js route handlers (initial)
* Provider adapters:

  * `openaiAdapter`
  * `anthropicAdapter`
  * `geminiAdapter`

### Storage

* SQLite (fast start) or Postgres (if you want hosted)
* Simple relational schema

---

## 12. Security + keys (V1)

* API keys stored server-side (env or secrets)
* Never expose provider keys to the browser
* Rate limiting / basic abuse controls

---

## 13. Success criteria

Within 5 minutes, you can:

* Paste a prompt
* Run against 2–3 models
* See outputs side-by-side
* Ask “why didn’t this work?”
* Apply a better prompt
* Re-run

If that loop is delightful, the product is working.

---

## 14. Clear V2 roadmap (natural expansions)

* Infinite canvas / graph view
* Prompt duplication + branching
* Saved versions + diffs
* Prompt libraries + tagging
* Shareable links
* Team workspaces
* Prompt chaining / pipelines

---

## 15. Non-goals (to protect focus)

* Becoming a general chat client
* Trying to model every provider parameter perfectly
* Building a full workflow engine before the core loop is proven
