<!-- Deployment trigger: 2026-01-31 -->
# Aetheron (legacy prototype repo)

**This repository is not the production AETH deployment.**

Canonical production truth lives in [`MastaTrill/Aetheron_platform`](https://github.com/MastaTrill/Aetheron_platform).
Canonical security work lives in [`MastaTrill/Aetheron-Sentinel-L3`](https://github.com/MastaTrill/Aetheron-Sentinel-L3).

As of 2026-09-19 the Base V1 presale missed soft cap and public purchases are closed. Do not use pages in this repo to collect funds.

## Overview

Historical modular prototype (admin dashboard, demo modules). GitHub Pages here is a demo, not a live sale.

## Setup

Local demo only. Do not put production keys in this tree.

### Example Cypress test

Use environment variables. Never commit real passwords.

```js
it('logs in as admin', () => {
  cy.visit('http://localhost:3000/admin-dashboard.html');
  cy.get('input[name=user]').type(Cypress.env('ADMIN_USER'));
  cy.get('input[name=pass]').type(Cypress.env('ADMIN_PASS'));
  cy.get('button[type=submit]').click();
  cy.contains('Aetheron Admin Dashboard');
});
```

## License

MIT
