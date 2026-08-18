# Reference: visualizations

Two forms, chosen by where the result lives.

**Mermaid, inside a markdown document.** Cheap, renders where markdown renders, stays a text
diff in git when the document changes. When you are writing a markdown document and a diagram
would carry part of it better than prose, just include it — no need to ask.

**HTML, as a standing report or map.** For a result someone will open and read on its own, or
when the shape needs more than mermaid gives — a page laid out for reading, an SVG drawn to
fit, a count worth seeing. Building one is real work, so ask first unless the user asked for it.

Never put mermaid in an HTML page. It needs a library the page would have to fetch, and these
files must open offline from the repository. HTML diagrams are inline SVG.

## What an HTML page must hold to

Design it for the investigation in front of you — the sections, the layout, and the look follow
from what was found, not from a template.

- **One self-contained file.** Inline the CSS and the SVG. Nothing may reach the network: no
  CDN, no web font, no remote image. It has to open offline from the repository.
- **Light and dark.** Define the colours once and override them under
  `prefers-color-scheme: dark`. Give the page an explicit background rather than inheriting one.
- **Wide things scroll inside themselves.** Tables and diagrams get their own
  `overflow-x: auto`; the page body must never scroll sideways.
- **Say which pull it describes.** A commit or a date, near the top. `src/` is replaced
  wholesale by the next pull, so a page that does not say what state it describes cannot be
  checked later.

## Which diagram

| Question | Diagram | What it shows |
|---|---|---|
| What happens when a record changes? | flow | trigger → conditions → actions → effects, in order |
| What does this depend on, and what depends on it? | dependency | the subject at the centre, edges in and out, direction marked |
| How are these modules related? | relationship map | modules as nodes, lookup fields as labelled edges |
| Where does the org touch systems outside it? | context | the org as one box, external consumers around it, each edge labelled with what crosses |
| How is a count distributed? | bars | rules per module, actions per rule — only when the count is part of the answer |

## Rules the drawing must hold

- **Label every edge with the key that produced it** — `function.api_name`, `lookup`,
  `${!Module.Field}` — so the reader can check the picture against the files.
- **Mark direction.** An unlabelled line between two artifacts is a claim without a subject.
- **Separate traced from searched.** An edge read out of a JSON key is solid; one found by
  text search in Deluge is dashed and says so in the legend. Drawing both the same way is a lie
  the diagram tells silently. In mermaid that is `-->` against `-.->`.
- **Give anything outside the org its own shape**, and put it in the legend.

## Size

Around fifteen nodes is the limit of usefulness. Past that the diagram stops explaining and
starts needing an explanation.

When the honest picture is bigger, do not shrink it by dropping edges without saying so. Split
it — one diagram per question — or draw the part that answers the question and state in a line
what was left out.
