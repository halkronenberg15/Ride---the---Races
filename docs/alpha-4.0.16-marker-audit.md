# Alpha 4.0.16 official course marker audit

Alpha 4.0.14 correctly eliminated unsupported workout-derived KOM geography, but its safety behavior suppressed all La Vuelta race markers instead of evaluating each marker independently. Alpha 4.0.16 uses per-marker verification and restores supported race intelligence without fabricating unsupported positions.

All 21 Tour de France 2026 stages and all 21 La Vuelta 2026 stages were audited against the authoritative material already represented in the repository. Every stage resolves verified KM ZERO and exact-distance FINISH markers. The repository contains one individually supported non-endpoint marker: the La Vuelta Stage 1 Monaco TT check at 5.6 km. No explicit, organizer-supported Tour KOM/sprint kilometre or additional La Vuelta KOM/sprint kilometre is present in the repository data, so none is claimed or rendered.

La Vuelta Stage 4 (Andorra la Vella to Andorra la Vella) therefore retains KM ZERO and FINISH only. Its elevation geometry shows summits, but the repository materials do not establish exact organizer classification or sprint kilometres. Those uncertain markers are deliberately omitted; workout blocks and visible elevation peaks are not evidence.

Marker totals after resolution are: Tour — 21 KM ZERO, 21 FINISH, 0 KOM, 0 sprint, 0 TT check; La Vuelta — 21 KM ZERO, 21 FINISH, 0 KOM, 0 sprint, 1 TT check. These totals describe the current audited repository evidence, not expected future race programs.
