# Installation

The CLI is built from its repository on your machine; there are no prebuilt binaries. You need [Bun](https://bun.sh) 1.3 or newer and git.

Українська версія: [ua](../../ua/guides/installation.md)

## Install

```bash
git clone <this repository> zoho-studio-cli
cd zoho-studio-cli
bun install
bun run compile                              # → dist/zoho-studio, with the web app inside
ln -s "$PWD/dist/zoho-studio" ~/.local/bin/zoho-studio   # or any folder on your PATH
bun run link                                 # once, so projects can import the packages
```

`bun run link` registers the framework packages on this machine, so the scripts and migrations of a project made by [`zoho-studio init`](../reference/project/init.md) can import them by name.

## Check the result

```bash
zoho-studio --version
zoho-studio --help
```

`--version` prints the installed version, `--help` lists the commands. If the shell does not find `zoho-studio`, the folder of the link is not on your `PATH`.

## Update

Pull the repository and build again:

```bash
git pull
bun install
bun run compile
```

The link in `~/.local/bin` points at `dist/zoho-studio`, so it picks up the new build. The registration from `bun run link` follows the sources and needs no update.

## Next

[Quick start](quick-start.md) — from nothing to downloaded files in a few minutes.
