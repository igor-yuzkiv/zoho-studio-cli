---
name: setup
description: Sets up or updates everything zoho-studio needs on this machine, by the plugin's dependency list — the CLI, the plugin itself, and what they rely on — installing what is missing with the person's agreement. Only when the person runs it themselves, after installing the plugin and after each update.
disable-model-invocation: true
---

# Setup

For the first install of the plugin and after every update. Find out how things stand, show what you will change, and change only what the person agreed to. It sets up the machine, not a project: a project is made with `zoho-studio init`.

Every dependency — how to check it, install or update it, and what to tell the person — is in `${CLAUDE_PLUGIN_ROOT}/references/dependencies.md`. Read it first; it is the single source.

## Goal

The machine is ready: every dependency in the list is present and current, or the person knows exactly what is left and why.

## Workflow

1. **Read the dependency list.** Done when you know every dependency and its check.
2. **Check the state** of each dependency in the order of the list, without changing anything. A check that needs another dependency that is missing is marked "after <that dependency> is installed". Done when every dependency is "current", "missing", "outdated", or "cannot tell" with the reason.
3. **Show the plan** as one list: for each dependency its state and the action you propose, with the exact command. Nothing to do — say that everything is current and stop.
4. **Ask for agreement** on each action, in the order of the list. The person may agree to some and decline others; a declined action stays undone and is reported.
5. **Do the agreed actions** in order, each with its command from the list, and check the result with the same check as in step 2. A failed action stops the ones that depend on it, but not the independent ones. Done when every agreed action is either verified or reported as failed with its output.
6. **After the plugin itself was updated**, stop there: tell the person to restart the session (or run `/reload-plugins`) and to run `/zoho-studio:setup` again — the skills just changed under this session.

## Rules

- Change nothing before the person agreed to that action: setup installs software and changes their machine.
- Run each command as the list gives it, and show the person a command that asks for their password (`sudo`) or opens a system dialog before running it, so they know what to expect.
- Leave a folder or a repository alone when it is not in the state the list expects — say what you found instead; those are the person's files.
- Do not edit shell profiles or Claude Code settings: pass on the line or the command for the person.

## Output

- Each dependency with its final state: current, installed, updated, declined, or failed (with the reason).
- What the person has to do: open a new terminal, add a line to their shell profile, restart the session.
- Whether `/zoho-studio:setup` has to run again.
