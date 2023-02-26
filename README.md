# Saku BBS

Attempt to convert old amiga bbs / forum (saku.bbs.fi) to a more modern framework / db.

## Why?

Currently the forum is running an old and unmaintained bbs software called Discus. It's a file based Perl software. Out of interest of how much work it would be to convert this to something more modern framework and tools.

## Steps

- [x] Create file converter which parses the html files for topics and posts
- [x] Add Topics and Posts to some database (Supabase which uses Postgres under the hood)
- [ ] Add frontend to show topics and posts (I decided to try out [Fresh](https://fresh.deno.dev) for this.)
- [ ] Deploy somewhere ([Deno Deploy](https://deno.com/deploy))
- [ ] User system
- [ ] Admin dashboard