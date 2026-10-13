# Troubleshooting

## The command cannot find the project

`No .zoho-studio/settings.json found` — you are outside a project folder. Go into the project, or
create one with `zoho-studio init`.

## Login

| What you see | What to do |
|---|---|
| `invalid_client` | The client id or secret does not match the client in the API console, or the project points at another data center — check [data centers](3-zoho-connection.md#data-centers). |
| `other_dc` | Your account lives in another data center than the settings say — set both addresses for your region. |
| `access_denied` | The access was declined on the approval screen — run `zoho-studio login` again and approve. |
| `The device code expired` | The code was not entered in time — run `zoho-studio login` again. |
| `This project is not authorized yet` | Run `zoho-studio login` in this project. |

After moving or renaming the project folder, log in again: the stored access belongs to the old
path.

## Pulling

| What you see | What to do |
|---|---|
| `OAUTH_SCOPE_MISMATCH` | The project was logged in before this kind of resource was supported. Run `zoho-studio login` again to grant the current permissions. |
| `No modules found … Run "zoho-studio z-crm:modules:pull" first` | Fields are pulled for downloaded modules; pull the modules first. |
| A summary that reports failed items (`… failed: 1`, `Failed: 1`) | One item could not be downloaded; its name and the reason are listed below the line. The rest were saved. |

## Browser

A pull started from the page is refused while another one runs — wait for the first to finish.
`--port` with a port that is already taken fails; leave the option out to get a free one.

## Migrations

| What you see | What to do |
|---|---|
| `Cannot find package '@zoho-studio/zoho-crm'` | The packages are not installed in the project: `bun run link` once in the Zoho Studio repository, then `bun install` in the project. |
| `Conflicts:` with a list | The migration does not match the CRM — each line says what is taken or missing. Change the file and run `--dry-run` again. |
| `was already applied to this organization` | It has run here before. Write a new migration for further changes. |
| `fields were not created` | Some fields were rejected by Zoho; the lines above name them and the reason. Fix them in a new `update` migration. |

## Still stuck

Every command writes to `logs/zoho-studio-cli.log` in the project; the end of the file usually
shows the full error. The browser shows the same log on the overview page.
