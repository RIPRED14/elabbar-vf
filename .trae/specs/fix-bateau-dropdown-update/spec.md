# Bateau Dropdown Update Spec

## Why
The user reported that when selecting a client in the "Réception" (Stockage) form, the "Fournisseur" field auto-fills correctly, but the "Bateau" dropdown list does not update. This is likely caused by aggressive browser caching of `index.html` and `app.js`, preventing the newly injected client data and updated logic from executing. We need to implement robust cache-busting and improve visual feedback when a client has no boats.

## What Changes
- Add cache-control meta tags to `index.html` to prevent aggressive local caching during development.
- Increment script version query parameters in `index.html` to `v=6`.
- Update the data force-sync key in `app.js` to `gestprod_v8_ntsamak_clients_v4_force` to guarantee `localStorage` data replacement.
- Enhance `Stockage.onClientChange()` to provide visual feedback (Toast) if a selected client has no boats in the database, helping diagnose data vs. logic issues.

## Impact
- Affected specs: Data loading, Stockage UI.
- Affected code: `index.html`, `app.js`, `modules/stockage.js`.

## MODIFIED Requirements
### Requirement: Client Selection in Reception
**Scenario: Success case with multiple boats**
- **WHEN** user selects a client with multiple boats
- **THEN** the Bateau dropdown populates with the client's boats, auto-selects the first one, and shows a success toast.

**Scenario: Client has no boats**
- **WHEN** user selects a client with no registered boats
- **THEN** the Bateau dropdown empties and a warning toast notifies the user that no boats were found for this client.
