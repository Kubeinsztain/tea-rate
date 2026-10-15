# Tea Journal

> The personal tea-tasting journal and shared tea catalog — the seed of a future
> tea-rating community.

## Overview

tea-rate is a personal tea journal built around a shared catalog of teas. A
journal keeper catalogs teas once, then records tasting notes against them over
time. The catalog is *shared* in the sense that the same `Tea` can be referenced
by many `TastingNote`s; there is no concept of an owning user yet (see
[Future directions](#future-directions)).

The domain language is defined in the [glossary](../context/terminology.md); the
architecture that realizes it is described in
[`../architecture/overview.md`](../architecture/overview.md).

## Concepts

### Tea

A named tea in the shared catalog.

| Field   | Type     | Meaning                                        |
| ------- | -------- | ---------------------------------------------- |
| `id`    | id       | Stable identifier                              |
| `name`  | text     | Display name (required, non-empty)             |
| `type`  | `TeaType`| Classification (see below)                     |
| `vendor`| text \| null | Who sells/produces it, if known            |
| `region`| text \| null | Origin region, if known                    |

`vendor` and `region` are optional — a tea can be cataloged with just a name and
type.

### TeaType

The coarse classification of a tea. One of:

`green`, `black`, `oolong`, `white`, `puerh`, `herbal`.

### TastingNote

A record of one tasting session for a tea in the catalog. Every `TastingNote`
references exactly one `Tea` via `teaId`.

| Field        | Type           | Meaning                                        |
| ------------ | -------------- | ---------------------------------------------- |
| `id`         | id             | Stable identifier                              |
| `teaId`      | `Tea.id`       | The tea being tasted (required)                |
| `rating`     | integer 1–5    | Overall rating (see below)                     |
| `notes`      | text \| null   | Free-form impressions                          |
| `brewedAt`   | timestamp      | When the tea was brewed/tasted                 |
| `brewMethod` | `BrewMethod` \| null | How it was brewed, if recorded           |

### Rating rule

A `TastingNote`'s `rating` is a whole number from **1 to 5**, inclusive. Values
outside `1–5` are invalid and rejected when recording a note. (The domain
currently uses a simple integer scale; there is no fractional or half-star
granularity.)

### BrewMethod

How a tasting was brewed, when the journal keeper chooses to record it. One of:

`gongfu`, `western`, `grandpa`, `cold`.

## Relationships

```
Tea 1 ──── * TastingNote
```

- A `TastingNote` **references** a `Tea` (via `teaId`) and cannot exist without it.
- A `Tea` can have any number of `TastingNote`s — zero or many.
- The catalog (`Tea`) is the stable, shared axis; tasting notes are the personal
  history layered on top of it.

## Future directions (NOT implemented)

These directions are part of the product vision but are **not** part of the
current domain or codebase:

- **Inventory tracking** — tracking how much of a tea you own / have left.
- **Community ratings, reviews, and social features** — turning the personal
  journal into a shared tea-rating community (aggregate ratings, reviews,
  following, comments).
- **Users / accounts** — ownership and identity. Currently there is no user
  concept; the journal is implicitly single-user.

Do not model these in the code today; they are anticipated, not built.
