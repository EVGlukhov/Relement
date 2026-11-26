# Future work

- [ ] **Support same-page anchor navigation across Shadow DOM**
  - Allow ordinary links such as `<a href="#demo">` to find and scroll to an
    element rendered inside a nested, open Relement Shadow DOM.
  - Preserve native browser behavior for document-level targets, external
    links, modified clicks, downloads, and links with a non-default target.
  - Keep the URL fragment and browser back/forward navigation in sync.
  - Respect reduced-motion preferences and define deterministic behavior when
    matching IDs exist in more than one shadow tree.
  - Add tests for nested shadow targets, native-link fallbacks, and history
    navigation. Document that closed, unmanaged Shadow Roots are out of scope.
