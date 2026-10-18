# Quick start

This walk-through takes you from an installed CLI to a project with the whole CRM configuration
downloaded and open in the browser. Allow about ten minutes, most of it for the one-time client
setup in Zoho.

## 1. Create a project

```bash
zoho-studio init my-crm
cd my-crm
```

A project is an ordinary folder; `init` adds the settings file and a few others to it. See
[The project](4-project.md) for what each one is.

**If your Zoho account is not in the US data center** (for example it opens at `zoho.eu`), set the
region now in `.zoho-studio/settings.json` — see [Connecting to Zoho](3-zoho-connection.md#data-centers).

## 2. Register a client in Zoho — once

1. Open [api-console.zoho.com](https://api-console.zoho.com) with your CRM account, in your data
   center.
2. Add a client of type **Non-browser Mobile Applications**.
3. Keep the page open: you need its `Client ID` and `Client Secret` in the next step.

One client serves all your projects.

## 3. Log in

```bash
zoho-studio login
```

Choose **Create a new profile**, give it a name, and paste the client id and secret. The CLI then
shows a link and a short code: open the link, enter the code, and approve the access. The terminal
confirms the login and shows which organization you are connected to.

## 4. Download everything

```bash
zoho-studio preset pull-crm
```

This runs every download one after another. The files appear under `data/zoho-crm/`.

## 5. Look at it

```bash
zoho-studio browser
```

The web app opens in your browser with everything you downloaded. Stop it with Ctrl+C.

## Next

- Put the project into git: `git init && git add . && git commit -m "CRM snapshot"`. The settings
  and the secrets are kept out of it already — see [The project](4-project.md#what-goes-into-git).
- Run `zoho-studio preset pull-crm` again whenever you want a fresh snapshot; `git diff` shows what
  changed in the CRM.
