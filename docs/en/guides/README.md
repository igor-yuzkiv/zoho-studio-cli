# Zoho Studio — user guide

Українська версія: [ua](../../ua/guides/README.md)

Zoho Studio turns a Zoho CRM organization into a folder of files on your computer: functions,
modules and their fields, workflow rules, webhooks, client scripts, and more. Once they are files,
you can keep them in git, search them, review changes, and work on them with your usual tools or
an AI agent. It can also go the other way for modules and fields: a migration file describes a new
module or new fields, and Zoho Studio creates them in the CRM.

You work with it from the terminal, through the `zoho-studio` command, and in a local web app that
shows the downloaded files and runs downloads from the browser.

## What you can do

- **Download** a CRM organization's configuration and code into a project — all of it with one
  command, or one kind of resource at a time. → [Pulling](pulling.md)
- **Browse** what was downloaded in a local web app and refresh any part of it. → [Browser](browser.md)
- **Create** modules and add fields from migration files, checked against the CRM before anything
  is sent. → [Migrations](migrations.md)
- **Run and test widgets** without Zoho: Zoho Studio plays the CRM around them, answers their SDK
  calls, and runs automated tests with screenshots. → [Widgets](widgets.md)

Zoho Studio never changes anything in your CRM except through a migration you run and confirm.

## Before you start

Install the CLI as [Installation](installation.md) describes. You need an account
in the Zoho CRM organization with permission to view its setup — for migrations, to customize it.

## Pages

In reading order:

- [Installation](installation.md) — building the CLI, checking it, updating it
- [Quick start](quick-start.md) — from nothing to downloaded files in a few minutes
- [Connecting to Zoho](zoho-connection.md) — the client, the login, data centers
- [The project](project.md) — what is in the folder and what goes into git
- [Pulling](pulling.md) — downloading resources, presets
- [Browser](browser.md) — the local web app
- [Migrations](migrations.md) — creating modules and fields
- [Widgets](widgets.md) — running and testing widgets without Zoho
- [Scripts and packages](scripts-and-packages.md) — your own scripts with the shipped packages
- [Troubleshooting](troubleshooting.md) — common errors and what to do

The words these pages use — artifact, pull, snapshot, source, scaffold, import, deploy — are defined in the [glossary](../glossary.md).

Every page links to the [technical reference](../reference/README.md) for the full list of options.
