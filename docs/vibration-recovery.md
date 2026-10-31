# Vibration recovery

The setup checkbox previously only saved its on choice; it did not enable the
running controller. It now updates the controller immediately and shares the
same state/preference with both the detailed and live-window toggles. Explicit
off choices still persist. No new pulse scheduler or competing owner was added.

The previous 15–25 ms signals were very short. Guidance now requests 60–90 ms
pulses with unchanged distance bands and progressively faster intervals. There
is no Web Vibration API amplitude control; phone settings determine actual
strength. All existing alignment, freshness, motion, darkness, Sun, altitude and
location guards remain. A real safe pose is still required for guidance pulses.

The visible Test pulse button is a separate, labelled hardware diagnostic. It
requests two longer pulses from a user tap, even before alignment, without
pretending to measure a position or changing the off preference. Sensor updates
cannot truncate it. Hidden/navigation/off transitions cancel it immediately;
normal safe guidance resumes after its 460 ms hold if enabled. API refusal
pauses requests without a retry storm and offers a user-tapped retry; an API
success never claims the motor actually vibrated. Browsers cannot detect whether
the user felt a pulse. Phone checks explain Android vibration and DND settings
and unsupported browsers.

Reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
(read from mdn/content). Sticky user activation is required, and Silent/DND can
suppress vibration despite API success.

Unit fixtures cover immediate re-enable, mirrored preferences, blocked retries,
unsupported API, explicit test isolation/cancellation and rate/safety guards.
Browser coverage uses test-only vibration/orientation fixtures through the actual
pointing pipeline. These tests verify requests and application states, not a
physical motor. A Pixel hardware check with Test pulse remains necessary.

## Pulse feel slider

A folded Pulse feel control in the live window saves one of five levels (Light,
Gentle, Standard, Firm, Strong) under dvsky:vibration:level:v1. Standard preserves
the existing durations. It scales vibration segments by 0.5, 0.75, 1, 1.5 or 2;
pauses and distance-based repeat intervals stay unchanged. This changes perceived
feel through pulse length, not the motor amplitude controlled by Android.

The same level applies to guidance and Test pulse. Test completion waits for the
scaled pattern plus 40 ms, so a stronger test is not truncated. Changes do not
turn an off preference on, trigger an unaligned guidance pulse or modify alignment.
Invalid stored values fall back to Standard. Unsupported browsers disable it.
