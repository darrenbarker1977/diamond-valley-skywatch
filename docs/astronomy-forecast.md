# Seeing and transparency

Forecast now has a collapsible specialist panel, separate from Open-Meteo cloud, humidity, wind, Moon and weather verdicts. It shows 7Timer ASTRO/GFS seeing bands in arcseconds and transparency extinction in magnitudes per airmass. Lower bands are better. Excellent/Good/Fair/Poor summarize categories 1–2/3–4/5–6/7–8; these are model forecasts, not telescope measurements. Undefined categories stay unknown.

The official JSON endpoint does not permit browser cross-origin reads. `scripts/update-astro.py` therefore fetches and validates a public reference point at 50.68, -114.25. The scheduled `astro-forecast.yml` workflow checks hourly and commits only a changed model to `data/astro-diamond-valley.json`. No private user coordinates or API keys are stored. Failure leaves the last validated file unchanged and the Actions run reports the failure.

The browser first reads the public raw GitHub copy, then the shipped same-origin copy, with a validated localStorage fallback. This avoids depending on Pages rebuilding after a GITHUB_TOKEN commit (GitHub does not trigger that build). Model issue time and valid-point time are shown. Runs older than 12 hours are flagged and older than 24 hours are rejected. Manual weather refresh retries the specialist feed too.

Numeric forecasts apply only within 10 km of the reference point. At other sites the panel requests the official 7Timer PNG chart for the selected coordinates and provides specialist source links; Diamond Valley values are never substituted. The external chart loads only when expanded and reports image failures with Retry and source links. Its timezone and model initialization are printed on the provider image.

The selected evening uses the nearest actual three-hour model point to 9 PM in the observing timezone, within 90 minutes. The panel also lists the returned points for that local date. The live service currently returns 24 points (72 hours), even when requesting 80; later dates clearly state that they are outside coverage. No extrapolated five-day seeing values are created. Alberta permanent UTC-6 handling remains shared with the weather app.

Sources: https://github.com/Yeqzids/7timer-issues/wiki/Wiki and https://www.7timer.info/doc.php?lang=en . 7Timer permits embedding its forecast images and data. Provider model availability and GitHub scheduled-workflow timing are external dependencies; the panel exposes timestamps and fallbacks rather than promising uninterrupted updates.

Validation: pure Node tests cover physical ranges, missing values, dates, stale/future runs, malformed series, location scope and model horizon. Desktop/Pixel-sized browser tests cover selected-night changes, source chart coordinates/failures, saved valid fallback, rejected expired values and continued weather refresh.
