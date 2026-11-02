# Alberta Time correction

Alberta adopted permanent UTC−6 effective November 1, 2026. Some browsers still use the old America/Edmonton winter fallback. Sources: https://aesoengage.aeso.ca/alberta-time-change-administrative-amendments and https://www.ualberta.ca/en/information-services-and-technology/news/2026/alberta-time-technology-impacts.html (October 6, 2026).

The shared time-zone helper applies UTC−6 to America/Edmonton (including canonical aliases) from Alberta local midnight on November 1. It preserves historical DST rules and all other geographic timezones. It does not modify the global Intl API or UTC timestamps. Alberta display names use ABT / Alberta Time. Local date conversion, planned times, practice, tours, rise/set calculations and sighting displays all use this rule.

After the change, Alberta weather is explicitly requested in Etc/GMT+6 and checked for an offset of −21600 seconds. Geographic America/Edmonton metadata is retained with a clock-rule marker. Custom locations first resolve their geographic timezone; Alberta responses are then re-requested in the fixed zone. Unmarked older Alberta cache rows are not silently reassigned to new clock hours: online Forecast refreshes them, and weatherAt marks post-change unverified rows unavailable. Existing weather features, values, refresh controls, links and artwork remain; forecast-original.html is untouched.

Regression coverage includes 02:34 UTC → 8:34 p.m. ABT, normal minute advancement, local midnight, winter and next spring, historical transitions, other hemispheres, exact planned sky instants, sightings, forecast updates, fixed weather requests and old-clock data rejection.
