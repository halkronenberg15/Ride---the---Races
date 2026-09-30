# Mission France Coach Adaptation Layer

Mission France uses an AI coach to interpret rider evidence, but the AI is not allowed to rewrite training arbitrarily.

## Coaching rule

**Observe → interpret → make the smallest useful change → watch the response.**

A single good session may justify a local next-session adaptation. It does not justify rewriting a training block. Repeated successful evidence is required before progression changes the block itself.

## Architecture

1. **Evidence collection**
   - completed RtR rides
   - rider post-ride feedback
   - recovery / sleep
   - strength completion and reason for omissions
   - fueling and nutrition
   - body composition
   - schedule constraints

2. **AI proposal**
   - the model proposes a target session, action, rationale and cited evidence IDs
   - the model may recommend keep, shorten, extend, replace or rest

3. **Guardrail validation**
   - deterministic rules validate the proposal before it can change training
   - red-flag pain / illness / recovery signals block workload increases
   - one local progression may not add more than 50% duration
   - local progression cannot increase both duration and intensity
   - one positive day cannot silently alter a full training block
   - logistical omissions are not interpreted as fatigue

4. **Coaching receipt**
   Every approved adaptation records:
   - original session
   - changed session
   - evidence used
   - why the change was made
   - scope of the change
   - what remains unchanged

## Example

Original: Controlled Climbing Tempo · 45 min

Adaptation: Climbing Endurance · 75 min

Evidence:
- prior endurance ride completed successfully
- rider reports good legs
- skipped core work was due to garage availability, not fatigue

Scope: next session only

The rest of the 24-week plan remains unchanged until repeated evidence supports a broader progression.

## AI implementation direction

The language model should reason over structured evidence and return a typed `CoachProposal`. The deterministic adaptation layer remains the final authority for whether and how that proposal can alter the plan. This lets Mission France behave like a coach without allowing model output to become an unbounded calendar rewrite.
