# Browser

`zoho-studio browser` opens the project in a web app on your computer: you see everything that was
downloaded, grouped by kind, and can refresh any group with a click.

```bash
zoho-studio browser               # opens your default browser
zoho-studio browser --no-open     # only prints the address
```

The app runs until you press Ctrl+C in the terminal. It is reachable only from your own computer.

## What you can do in it

- **Browse** the downloaded files by group — modules, functions, workflows, and the rest — and open
  any of them.
- **Pull again** any group; the page shows the progress and the same summary the command prints.
  One pull runs at a time.
- **Read the log** of every command, newest first, at the bottom of the overview.
- **Log in** from the status bar when the project is not logged in yet, the same way as
  `zoho-studio login`.

More: [browser reference](../technical/25-browser-command.md).
