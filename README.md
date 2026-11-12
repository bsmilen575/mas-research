# mas-research
independent work in viral communications


## Research framework

We study four dimensions of personalized model alignment, in this conceptual order:

| Dimension | Definition |
| --- | --- |
| Steerability | Tell the model how to act: can explicit user instructions steer its behavior? |
| Salience | The model understands what is important: can it identify and weigh the user's priorities within personalized context? |
| Intent following | Taking action aligned with user intent: do its decisions and actions honor the user's understood priorities and goals? |
| Durability | Stickiness across context, competing pressures, and compaction: does alignment hold as the interaction evolves? |

Salience includes inferring priorities when they are not explicitly stated. Intent following concerns acting on that understanding. Durability cuts across all three dimensions. The numbered research sections below retain the experimental sequence.

## I. Steerability

Understanding revealed preference and steerability in AI agents.

[Steerability overview](steerability/README.md) · [Research website](https://brookesmilen.com/mas-research/)

The static research webpage lives at the repository root. It shows recorded model responses, instruction-dependent preference summaries, and a placeholder for a future anonymous quiz. It makes no model API calls and collects no visitor responses.

### Publishing

In Settings → Pages, select **Deploy from a branch**, then **main** and **/(root)**. GitHub publishes updates pushed to that branch.

Expected project URL after deployment: https://bsmilen575.github.io/mas-research/

### Data

Recorded V2 responses from GPT-6 Astra, Claude Opus 5.5, and Jev 1.13. Playback includes 400 ordered human-attribute scenarios (200 pairs), excluding species and headcount comparisons. The score table summarizes the full 230 original dilemma pairs. Human reference markers are dimension-level aggregates, not responses to the particular displayed scenario. New quiz scope and collection methods remain to be defined.

## II. Durability

Understanding whether steered model behavior survives context load, transfer, competing pressures, adversarial instructions, and memory changes.

[Read the durability research plan](durability/README.md).

## III. Intent following

Understanding whether models translate user intent into decisions and actions, including gaps between stated intentions and behavior.

## IV. Salience

Understanding how models identify what matters to a user within personalized context, including preferences implied by prior decisions, conversations, and situational constraints.

[Read the salience research scope](salience/README.md).
