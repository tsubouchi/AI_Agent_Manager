## Statement of Work (SOW)

## Objective
- Replace hard‑coded content in the right “Output” panel with dynamic data from the workflow context.
- Fix workflow errors, especially manifest-generation schema mismatches, and ensure stable end‑to‑end execution.

## Scope
- UI: `components/output-panels.tsx`, `components/pain-analysis-panel.tsx`, `components/solution-design-panel.tsx`, `components/agent-manifest-editor.tsx`.
- Logic/API: `lib/workflow-engine.ts`, `app/api/workflow/manifest-generation/route.ts`.
- Reference artifact: `sample_manifest.yaml` (canonical manifest example for prompts/tests).

## Current Issues
- Output tabs contain placeholders; actual context data is mixed with hard-coded examples.
- Manifest generation fails Zod validation due to model returning Deployment-shaped objects and malformed JSON (e.g., broken arrays), not matching the simplified spec.

## Approach
1) Dynamic Output Tabs
- Remove placeholders/fallback renders. Show only context-driven data.
- Add explicit empty states (e.g., “No pain analysis yet”).

2) Manifest Generation Hardening
- Use `sample_manifest.yaml` as the canonical example in the system prompt.
- Make prompt strict: “JSON only”, adhere to simplified schema (image/ports/env/resources), forbid K8s Deployment fields, provide one concise example derived from `sample_manifest.yaml`.
- Add a repair layer: if a Deployment-like object is returned, map its first container → simplified schema (image, ports, env, resources). Normalize minor JSON glitches and re-validate via Zod.
- Fallback: if `generateObject` fails, request plain JSON and validate with Zod manually.

3) Error Visibility
- Propagate stage errors via `lib/workflow-engine.ts` and render user-friendly messages in the corresponding tabs.

## Deliverables
- Refactored panels with dynamic/empty-state rendering.
- Updated manifest-generation route with strict prompt, repair mapping, and fallback validation.
- Documentation update referencing `sample_manifest.yaml` as the canonical sample.

## Acceptance Criteria
- No hard-coded items in Output tabs; all content reflects `context`.
- POST `/api/workflow/manifest-generation` returns 200 under normal inputs and conforms to the Zod schema.
- If the model returns Deployment-style output, the API repairs it and still returns valid simplified spec.
- UI surfaces clear error messages instead of indefinite spinners.

## Timeline & Risks
- Implementation + tests: ~1.0–1.5 days.
- Risks: model variability; mitigated by strict prompts, example grounding (sample_manifest.yaml), and post-processing repair.

## Notes
- Canonical sample manifest: `sample_manifest.yaml` at repo root. This file guides prompts/tests and should remain the reference example.
