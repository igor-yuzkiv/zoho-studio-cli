# Installation

The CLI is built from its repository on your machine; there are no prebuilt binaries. It installs on macOS and Linux; Windows is not supported. You need [Bun](https://bun.sh) 1.3 or newer and git.

Українська версія: [ua](../../ua/guides/installation.md)

## Install

```bash
git clone <this repository> zoho-studio-cli
cd zoho-studio-cli
bun run setup
```

`bun run setup` installs the dependencies, builds `dist/zoho-studio` with the web app inside, links it as `~/.local/bin/zoho-studio`, and registers the framework packages on this machine, so the scripts and migrations of a project made by [`zoho-studio init`](../reference/project/init.md) can import them by name. It ends with the installed version:

```text
zoho-studio 1.0.1 is installed.
```

When `~/.local/bin` is not on your `PATH`, setup says so and prints the line to add for your shell (zsh, bash, or fish); it does not edit your shell files itself. On many Linux systems the folder joins `PATH` at the next login once it exists.

| Option | Meaning |
|---|---|
| `--bin-dir <path>` | Put the link in another folder instead of `~/.local/bin`. |
| `--force` | Replace whatever is already at `<bin-dir>/zoho-studio` — a link to another clone, or a file. |

Without `--force`, setup stops when `<bin-dir>/zoho-studio` is anything but a link to this clone and says what is there.

## Check the result

```bash
zoho-studio --version
zoho-studio --help
```

`--version` prints the installed version, `--help` lists the commands. If the shell does not find `zoho-studio`, the folder of the link is not on your `PATH`.

## Update

```bash
git pull
bun run setup
```

Setup never pulls on its own: it builds whatever the clone holds. Running it again is safe — a link that already points at this clone is left as it is.

## Next

[Quick start](quick-start.md) — from nothing to downloaded files in a few minutes.
