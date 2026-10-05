# Product-wide

Rules that apply to more than one feature.

## Requirements

- P1 Every user — riders included — signs in via SSO through Thunder. \[org default\] Applies to: all.
- P2 A bus's GPS device authenticates with a pre-registered ID and secret/token issued by a fleet admin, not through Thunder sign-in. Applies to: F1, F2.
- P3 A bus's position on the live map reflects its latest reported location, updated at least every few seconds. Applies to: F2, F3. *assumed*

## Decisions

- Only the latest known position per bus is kept; the product keeps no historical trip data (trip history &amp; playback is out of scope).