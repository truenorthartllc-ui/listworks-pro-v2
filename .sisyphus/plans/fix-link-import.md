# Fix Link Import Error

## TL;DR
Add missing `import { Link } from 'react-router-dom'` to Footer.jsx to fix the ReferenceError.

## Context
- Netlify deployment shows "ReferenceError: Link is not defined"
- Footer.jsx uses `<Link>` from react-router-dom but doesn't import it

## Work Objectives
- Add missing Link import to Footer.jsx

## TODOs

- [ ] 1. **Add Link import to Footer.jsx**

  **What to do**:
  - Add `import { Link } from 'react-router-dom'` at the top of `frontend/src/components/Footer.jsx`
  - Verify the import is correct

  **References**:
  - `frontend/src/components/Footer.jsx:31-32` - Shows `<Link to=...>` usage without import

  **Acceptance Criteria**:
  - [ ] Import line added at top of file
  - [ ] File syntax valid (no import errors)