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

## For maintainers: Setting up the Sponsor button

The `.github/FUNDING.yml` file includes a placeholder Stripe link. To activate the Sponsor button:

1. **Create a Stripe Payment Link** (or Checkout session) at https://stripe.com.
   - One-time donations: use a Payment Link with a variable amount or presets.
   - Recurring sponsorship: configure a Stripe Billing Portal for subscriptions.
   - Copy the full URL: `https://buy.stripe.com/...` or `https://donate.stripe.com/...`

2. **Update `.github/FUNDING.yml`** — replace `REPLACE_ME_WITH_YOUR_STRIPE_PAYMENT_LINK` with your live Stripe URL.

3. **Commit and push.** GitHub will detect the change and render the Sponsor button within minutes.

4. **Test:** Visit the repository homepage and click the "Sponsor" button (next to "Watch" and "Star"). It should redirect to your Stripe page.

**⚠️ Security note:** Never commit secrets (Stripe API keys, webhook endpoints) into version control. The `.github/FUNDING.yml` file contains only the public Payment Link URL, which is safe to commit.

## Stewardship

Sponsorship revenue is a signal of community trust. Use it to improve the research:
- **Transparency:** Document major expenses in Discussions or issues.
- **Re-validation:** Use sponsorship to fund periodic re-runs against new Claude versions and MCP SDK releases.
- **Scope creep:** Stick to the comparison mission. If someone asks for a bespoke demo, politely refer them to their internal engineering teams.
- **Visibility:** Share findings broadly. Don't withhold results or lock analysis behind sponsorship tiers.
