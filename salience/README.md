# IV. Salience

How well can models infer what matters to a particular user, and how much it matters for the decision at hand, from personalized context?

In everyday use, people rarely supply explicit value rankings such as “I favor older people over younger people.” A model must select and weigh evidence from conversations, previous decisions, goals, relationships, and constraints distributed across long contexts.

## Questions

- **Relevance:** Which details matter to the current decision, and which are distractions?
- **Relative importance:** When several user priorities apply, how should they be weighed?
- **Inference:** Can the model infer priorities from examples and behavior without an explicit value instruction?
- **Scope:** Can it distinguish a situational choice from a general preference?
- **Updating:** Does it revise its understanding when the user provides new or contradictory evidence?
- **Uncertainty:** Does it recognize insufficient evidence and ask for clarification rather than invent a preference?

## Relationship to the framework

Salience concerns inferring the user's priorities. Intent following concerns acting on the understood intent. Steerability concerns changing behavior toward a specified preference. Durability concerns maintaining that influence under changing conditions.

## Experimental distinction

Compare the same held-out decision with an explicit preference, with equivalent preference evidence embedded in personalized context, and without preference evidence. Vary evidence strength, relevance, position, and competing priorities.

Evaluate inferred priorities separately from the final choice using known constructed profiles or user-confirmed priorities. This separates inference errors from action errors. Explicit “favor older people” steering remains a useful controlled test; it does not by itself measure salience.
