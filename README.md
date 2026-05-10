# FavCRM Storefront Template

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffavcrm%2Ffav-storefront&project-name=favcrm-storefront&repository-name=favcrm-storefront&env=VITE_FAVCRM_API_URL,VITE_FAVCRM_COMPANY_ID,VITE_SITE_URL&envDescription=FavCRM%20storefront%20configuration%20from%20app.favcrm.io&envLink=https%3A%2F%2Fgithub.com%2Ffavcrm%2Ffav-storefront%23deployment-on-vercel)

A SvelteKit storefront template for using FavCRM as a headless customer service.
It is based on the production shape of the StayInTouch storefront, generalized
for new merchants and configured for Vercel by default.

## Stack

- SvelteKit 2 and Svelte 5
- Vercel adapter
- `@favcrm/sdk` for the customer portal API
- FavCRM API base path: `/v6/customer-portal`

## Create a Storefront

1. Create or sign in to a FavCRM workspace at
   [app.favcrm.io](https://app.favcrm.io).
2. In FavCRM, open **Settings -> Customer Portal** and configure the modules
   this storefront should expose, such as shop, bookings, events, payments, and
   member card.
3. Click **Use this template** in GitHub.
4. Install dependencies:

   ```sh
   pnpm install
   ```

5. Configure environment variables:

   ```sh
   cp .env.example .env
   ```

   Required values:

   | Variable                 | Value                                                                                                |
   | ------------------------ | ---------------------------------------------------------------------------------------------------- |
   | `VITE_FAVCRM_API_URL`    | `https://api.favcrm.io` for hosted FavCRM, or your API gateway URL for self-hosted/dev.              |
   | `VITE_FAVCRM_COMPANY_ID` | The workspace/company UUID from FavCRM. This scopes every storefront request through `X-Company-Id`. |
   | `VITE_SITE_URL`          | The public storefront URL, for example your Vercel production or preview URL.                        |

6. Run locally:

   ```sh
   pnpm dev
   ```

## Where Values Come From

| Surface                  | Purpose                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://app.favcrm.io`  | Merchant admin app. Use it to register, configure customer portal settings, enable modules, manage products/services/events, and create MCP keys. |
| `https://api.favcrm.io`  | Hosted FavCRM API and MCP host. The storefront SDK calls `/v6/customer-portal/*`; agents connect to `/mcp`.                                       |
| `VITE_FAVCRM_COMPANY_ID` | Tenant identifier for the merchant workspace. The value is public enough to be used by the browser, but it is not an auth secret.                 |
| `FAVCRM_API_KEY`         | Agent/MCP secret such as `fav_mcp_*`. Never expose this as a `VITE_*` variable or commit it to the repo.                                          |

If you are unsure where to copy the company ID from, check the active workspace
or customer portal settings in `app.favcrm.io`. Existing FavCRM merchants can
also create agent keys at **Settings -> MCP Keys**.

## Agentic Setup with MCP

Use MCP when an AI coding agent or operator should help configure FavCRM data,
create products, set up services, draft content, or inspect the CRM while
building the storefront. Use `@favcrm/sdk` for the storefront app itself.

### Existing Merchant

1. Open [app.favcrm.io](https://app.favcrm.io).
2. Go to **Settings -> MCP Keys**.
3. Create a key and copy the `fav_mcp_*` value.
4. Store it in your shell or agent environment as `FAVCRM_API_KEY`.

### New Merchant via Agent

Connect your agent to the FavCRM MCP server first, then ask it to register a
workspace. The agentic registration flow requests an OTP by email, verifies the
code you paste back into chat, and returns a fresh `fav_mcp_*` key.

Example prompt:

```text
Sign me up for FavCRM. The business is a yoga studio called Stretch + Breathe in Hong Kong.
```

### Cursor and Compatible MCP Clients

Add this to `~/.cursor/mcp.json` or project-local `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "favcrm": {
      "url": "https://api.favcrm.io/mcp",
      "headers": {
        "Authorization": "Bearer ${env:FAVCRM_API_KEY}"
      }
    }
  }
}
```

Then export the key somewhere your editor process can read:

```sh
export FAVCRM_API_KEY=fav_mcp_...
```

Restart the MCP client and confirm the `favcrm` server connects. Public MCP
setup examples live at [github.com/favcrm/mcp](https://github.com/favcrm/mcp).

## SDK vs MCP vs CLI

| Tooling       | Use it for                                                                                           | Use it in this template?                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@favcrm/sdk` | Storefront runtime reads/writes: shop, bookings, events, member auth, contact, CMS, payments.        | Yes. This is the app integration boundary.                                                         |
| FavCRM MCP    | Agentic setup and operations from Cursor, Smithery, Claude-compatible clients, or other MCP clients. | Optional, recommended for AI-assisted setup.                                                       |
| `favcrm` CLI  | FavCRM-managed merchant agent runtimes where credentials are injected automatically.                 | No. Template users should not run `favcrm login` or depend on the CLI for normal storefront setup. |

## API Integration Best Practice

Use `@favcrm/sdk` as the public integration boundary. App code should call SDK
clients such as `sdk.shop`, `sdk.auth`, `sdk.bookings`, `sdk.events`,
`sdk.members`, `sdk.blog`, and `sdk.contact` instead of hard-coding endpoint
paths across components.

The only local bootstrap fetch in this template is tenant/module config from
`/v6/customer-portal/company/modules`, because the current SDK does not expose
that helper yet.

## Deployment on Vercel

Use the **Deploy with Vercel** button above, or import
`github.com/favcrm/fav-storefront` from the Vercel dashboard.

The deploy flow should prompt for:

| Variable                 | Value                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `VITE_FAVCRM_API_URL`    | Use `https://api.favcrm.io` for hosted FavCRM.                                                      |
| `VITE_FAVCRM_COMPANY_ID` | Copy this from the workspace or customer portal settings in [app.favcrm.io](https://app.favcrm.io). |
| `VITE_SITE_URL`          | Use the production storefront URL. Update this after Vercel assigns or connects the final domain.   |

Set the variables for Production and Preview environments. After changing
environment variables in Vercel, redeploy so the new values are included in the
build.

The template uses `@sveltejs/adapter-vercel`; no Cloudflare Worker or Wrangler
configuration is required.

## Quality Gates

Run these before publishing changes:

```sh
pnpm check
pnpm test
pnpm build
```

## Template Hygiene

Keep this repository generic:

- no merchant-specific copy or assets
- no private migration scripts or crawl output
- no direct payment secrets in Vite environment variables
- no duplicated FavCRM endpoint wrappers when SDK methods exist
