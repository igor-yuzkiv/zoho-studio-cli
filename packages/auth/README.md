# @zoho-studio/auth

OAuth for zoho-studio projects: the login flow and the access token. A script rarely imports it: the request clients of the product packages (`crmClient` in `@zoho-studio/zoho-crm`) authorize every request on their own and refresh an expired token.

## Entry points

- `tokenService.getAccessToken()` — the project's access token, refreshed when it has expired. Use it only to call a Zoho API that no product package covers yet.
- `AuthError` — the project is not logged in, or Zoho refused the refresh token; the fix is `zoho-studio login`.

The full list is `src/index.ts`.
