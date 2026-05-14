# Sponsoring `vehicle-genui-poc`

`vehicle-genui-poc` is a self-funded research project. It exists to give
developers an honest, evidence-based comparison of two Generative UI
approaches — MCP Apps (SEP-1865) and CopilotKit Static AG-UI — over a
real, non-trivial dataset (UK DVLA VEH0120 vehicle registrations,
~19.6 M facts).

The repository is permissively licensed and will stay that way. **Nothing
in it is gated behind sponsorship.**

## What sponsorship pays for

- **Re-validation runs.** Both demos are pinned to specific versions of
  Claude Desktop, the MCP SDK, CopilotKit, Anthropic models, etc. Every
  six months the comparison has to be re-run and `docs/COMPARISON.md`
  has to be updated. That takes time.
- **Anthropic API spend** for end-to-end testing of Demo B against new
  model releases.
- **Additional demos** when a new GenUI surface emerges and is worth
  comparing on the same axes (assistant-ui, Vercel AI SDK Generative UI,
  LangGraph + custom UI, …).
- **Talks, blog posts and write-ups** that bring more eyes onto the
  trade-offs.

## What it does *not* pay for

- Bespoke consulting, custom integrations, or "build me a demo for my
  dataset" requests. Those don't fit the research mission.
- Private support channels. All help happens in public on the
  [Discussions board](https://github.com/dotnetspark/vehicle-genui-poc/discussions)
  so the next person searching for the same problem finds the answer.

## How sponsorship works here

Sponsorship is processed via **Stripe** (link in the repo's "Sponsor"
button at the top of the repository page, configured in
[`.github/FUNDING.yml`](./FUNDING.yml)). One-off and recurring options
are available on the Stripe page.

You will not receive anything in return that other users do not also
receive — no priority support, no private Discord, no closed-source
extras. Sponsorship is a thank-you and a contribution to the
re-validation budget, nothing more.

## If you can't sponsor

That's completely fine. The single most useful thing you can do instead
is open an Issue or a Discussion when you spot something wrong, missing,
or out of date. Contributions are weighted by signal, not dollars.
