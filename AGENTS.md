# Context & Rules for Thai Course Editor

## Application Overview
This is a Thai language course editor application. It allows users to create, manage, and validate language lessons containing vocabulary (words) and sentences (phrases). 

## Data Model
- **Course**: The root object containing an array of `Lesson`s.
- **Lesson**: Contains a `title`, `id`, an array of `Word`s, and an array of `Phrase`s.
- **Word / Phrase**: Contains:
  - `id` (e.g., `w_apple`, `p_hello`)
  - `th` (Thai script)
  - `phonetic` (Phonetic transcription)
  - `fr` (French translation)
  - `en` (English translation)
  - `allowIdenticalTranslation` (boolean, to bypass the rule that FR and EN shouldn't be identical)
  - Phrases also have a `components` array which stores Word IDs that make up the phrase.

## Core Mechanics & Rules
1. **Validation Engine**: The app constantly validates the data and reports errors/warnings:
   - Missing phonetic translations.
   - Identical French and English translations (unless explicitly allowed via `allowIdenticalTranslation`).
   - Duplicate English or French translations across the course (handled via a conflict resolution page at `/resolve`).
   - Ghost words in phrase components.
   - Gender marker mismatches.
2. **Local Persistence**: Data is saved to the browser's `localStorage` under the key `th-course-draft`.
3. **iFrame/Environment Restrictions**: 
   - **DO NOT use `window.confirm`, `window.alert`, or `window.prompt`**. They behave poorly inside the preview iframe. 
   - Always use inline UI states (e.g., a `confirmDelete` state variable) with custom buttons for user confirmations.
4. **Auto-matching**: When editing a phrase's Thai text, the app attempts to automatically find and link the words (components) it contains by matching substrings against all known word `th` fields.

## Styling & Tech Stack
- **Framework**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS. Primary color accents are Slate (layout) and Blue (Thai text).
- **Icons**: `lucide-react`.

## Reminders for AI Agent
- Before returning code, always ensure UI elements use standard React state for confirmations rather than native browser popups.
- Keep the design clean, minimal, and focused on data entry efficiency.
- All Gemini / external API logic (if added) must be server-side. Local data management remains client-side.
