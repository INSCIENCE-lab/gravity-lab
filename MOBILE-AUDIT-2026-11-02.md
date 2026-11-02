# Mobile review — 2026-11-02

All eight experiments were loaded in Ukrainian, English, Italian and Spanish at a 320px outer-frame width (305 content CSS pixels). All 32 cases had scene → physical settings → results → theory order and no document-level horizontal overflow. The independent projectile module was checked separately. All 20 view combinations across surface, binary, jump, PN, Schwarzschild and lensing were opened. Cubic geodesics and recording their selected mode were verified. The notebook fits the narrow viewport. A 192px ray-traced disk calculation progressed to completion.

Found a hidden clipping defect: min-height and aspect-ratio widened mobile canvas containers even when document overflow was absent. All mobile canvas containers now have a definite capped width, and their bitmaps are positioned inside the container. At 320px the scene measured 271px inside a 273px card; at 390px it measured 341px inside a 343px card.

Detailed geometry-learning notes move below results on mobile, preserving the same DOM node, listeners and hidden state; they return to their original viewport-card position on desktop. Diagram controls remain beside the scene. Added 16px mobile form editing/select text and an internally scrollable notebook chart. Physical equations and integrators unchanged.

Checks used Chrome frames, not physical iPhone/Android devices. Ray-tracing completion is a functional UI check, not an independent astrophysical validation.
