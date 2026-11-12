# mas-research
independent work in viral communications


## Research framework

We study four dimensions of personalized model alignment, moving from observable behavioral control toward the inference underlying personalized decisions:

| Dimension | Definition | Research question |
| --- | --- | --- |
| Steerability | Tell the model how to act. | Can an explicit instruction change its behavior? |
| Durability | Stickiness across context, competing pressures, and compaction. | How robust is that behavioral change as the interaction evolves? |
| Intent following | Taking action aligned with user intent. | Does the model translate user intent into aligned decisions and actions? |
| Salience | The model understands what is important. | How does it identify and weigh the user's priorities within personalized context, including when they are not explicitly stated? |

This sequence reflects increasing depth of the research question, rather than a claim about the model's internal architecture. Durability also cuts across steerability, intent following, and salience.

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
