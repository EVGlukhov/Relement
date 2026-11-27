# Future work

- [ ] **Add native-first form actions**
  - Support function actions on `<form>` and a `useActionState`-style hook that
    exposes the action, pending state, and returned form state.
  - Read values from native `FormData`; keep standard form attributes and avoid
    requiring field registration, prop spreading, or manual submit handlers.
  - Make custom schemas optional: native forms and browser constraint validation
    work without one. Support live custom validation, multiple errors per field,
    form-level errors, and async checks on blur or with debounce.
  - Always validate submitted data on the server.
  - Add tests for successful and invalid submissions, async pending state,
    native validation behavior, live validation, and multiple errors per field.

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
