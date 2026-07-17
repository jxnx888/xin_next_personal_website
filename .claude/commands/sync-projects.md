# Sync Projects Data

Use this when adding or editing a project entry to make sure all related files stay in sync.

## All files that must match

When a project entry is added or changed, update ALL of the following:

| File | What to update |
|---|---|
| `public/mock/projects.json` | English project entry |
| `public/mock/projectsCN.json` | Chinese project entry (same structure, translated text) |
| `lib/types/projects.ts` | Only if adding a new field to the `Project` interface |

## Project entry fields

```json
{
  "title": "Project Title",
  "img": "/image/projects/filename.jpg",
  "desc": "One-paragraph description.",
  "tags": "Tech1, Tech2, Tech3",
  "url": "https://...",           // optional — shows Visit Site button
  "routeLink": "/projects/slug",  // optional — shows Try It → button
  "storeUrlQr": {                 // optional — app store QR codes
    "ios": "/image/qr/xxx.png",
    "android": ""
  }
}
```

**Do NOT add** `code` or `codeUrl` — View Code button was removed. These fields no longer exist on the `Project` type.

## Reminder

- `messages/en.json` and `messages/zh.json` are for **UI strings only**, not project content.
- Images go in `public/image/projects/`.
