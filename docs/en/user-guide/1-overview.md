# Zoho Studio — user guide

Українська версія: [ua](../../ua/user-guide/1-overview.md)

Zoho Studio turns a Zoho CRM organization into a folder of files on your computer: functions,
modules and their fields, workflow rules, webhooks, client scripts, and more. Once they are files,
you can keep them in git, search them, review changes, and work on them with your usual tools or
an AI agent. It can also go the other way for modules and fields: a migration file describes a new
module or new fields, and Zoho Studio creates them in the CRM.

You work with it from the terminal, through the `zoho-studio` command, and in a local web app that
shows the downloaded files and runs downloads from the browser.

## What you can do

- **Download** a CRM organization's configuration and code into a project — all of it with one
  command, or one kind of resource at a time. → [Pulling](5-pulling.md)
- **Browse** what was downloaded in a local web app and refresh any part of it. → [Browser](6-browser.md)
- **Create** modules and add fields from migration files, checked against the CRM before anything
  is sent. → [Migrations](7-migrations.md)

Zoho Studio never changes anything in your CRM except through a migration you run and confirm.

## Before you start

Install the CLI as the [README](../../../README.md#getting-the-cli) describes. You need an account
in the Zoho CRM organization with permission to view its setup — for migrations, to customize it.

## Pages

1. [Overview](1-overview.md) — this page
2. [Quick start](2-quick-start.md) — from nothing to downloaded files in a few minutes
3. [Connecting to Zoho](3-zoho-connection.md) — the client, the login, data centers
4. [The project](4-project.md) — what is in the folder and what goes into git
5. [Pulling](5-pulling.md) — downloading resources, presets
6. [Browser](6-browser.md) — the local web app
7. [Migrations](7-migrations.md) — creating modules and fields
8. [Troubleshooting](8-troubleshooting.md) — common errors and what to do
9. [Scripts and packages](9-scripts-and-packages.md) — your own scripts with the shipped packages

The words these pages use — artifact, pull, snapshot — are defined in the [glossary](../glossary.md).

Every page links to the [technical reference](../technical/1-overview.md) for the full list of options.
