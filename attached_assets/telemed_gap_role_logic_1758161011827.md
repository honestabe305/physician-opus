# Telemed Advisors — Licensing Platform Build Plan & Role Logic

## Part 1 — Gap Build Plan (Tailored to Current Stack)

### High‑Impact Improvements
1. **Automated Notifications**
   - Email alerts at 90/60/30 days pre‑expiration.
   - Dashboard alerts for urgent renewals.
   - Customizable schedules per provider/role.

2. **Analytics & Reporting**
   - Compliance rates per department/specialty.
   - Renewal trend analysis.
   - Visual charts (Recharts) with export options.

3. **Document Management**
   - Upload/attach license files.
   - Version control (e.g., CSR renewals over time).
   - Audit trails for regulator inspections.

4. **Renewal Workflow**
   - Track application in progress → filed → approved.
   - Renewal history with timestamps.
   - Automated task list tied to license type + role.

5. **Mobile Optimization**
   - Mobile‑first UI (Tailwind + shadcn/ui).
   - Quick lookup and renewal upload.

### Advanced Enhancements
6. **Multi‑Location & Cross‑State Management**
   - Track multi‑state licenses per provider.
   - Compact eligibility (IMLC, PA Compact, APRN Compact).

7. **Integrations (Phase 2)**
   - State board verification APIs.
   - External credentialing system sync.
   - Jotform/Stripe flows for new license applications.

8. **Bulk Operations**
   - Import spreadsheets → Drizzle ORM mapping.
   - Mass status updates.

9. **Predictive Analytics (Phase 3)**
   - Renewal success probability models.
   - Risk scoring for upcoming expirations.

---

## Part 2 — Role Logic: Physicians vs PAs vs NPs

### Core Entities
- `provider.role`: `physician | pa | np`
- `license.license_type_code`: `MD/DO`, `PA`, `APRN`
- `dea_registrations`: DEA per state (3‑year cycle).
- `csr_licenses`: Controlled Substance Registration (state‑specific).

### Physician (MD/DO)
- **Board:** State Medical Board.
- **Compacts:** IMLC (yields full licenses in other states).
- **CME:** Track per‑state hours + special topics.
- **Supervision:** N/A (may supervise PAs/NPs).
- **Artifacts:** License, IMLC LoQ, CME certs.

### Physician Assistant (PA)
- **Board:** State PA/Medical Board.
- **Compacts:** PA Licensure Compact (live ~2026).
- **CE:** Track CE hours, topics.
- **Supervision:** Requires supervising physician agreement.
- **Artifacts:** License, supervising MD agreement, prescriptive authority letters.

### Nurse Practitioner (NP/APRN)
- **Board:** Nursing Board.
- **Compacts:** RN Compact ≠ APRN; APRN Compact not yet live.
- **CE:** Track CE + opioid/controlled courses.
- **Collaboration:** Some states full authority; others require collaboration agreement.
- **Artifacts:** License, collaboration agreement, furnishing number.

---

## Part 3 — DEA & CSR Logic

### DEA Registration (Federal)
- **Cycle:** 3 years, regardless of state.
- **State Specific:** One registration per state of practice.
- **Grace:** Renewal grace period (~1 month) before new application.
- **MATE Act:** 8‑hour opioid training attestation.

### State CSR (Controlled Substance Registration)
- Independent license per state.
- Cycles vary (annual, biennial).
- Should be tracked separately from DEA.

---

## Part 4 — Validation Rules (Pseudocode)
```ts
function validateNewLicense(input, provider) {
  if (provider.role === 'pa') requireArtifact('supervision_agreement');
  if (provider.role === 'np' && stateRequiresNPAgreement(input.state)) requireArtifact('collaboration_agreement');
}

function computeDEARenewal(dea) {
  const expire = addYears(dea.issueDate, 3);
  return { expire, reminders: [90,60,30,7,1].map(d => minusDays(expire,d)) };
}
```

---

## Part 5 — DB Schema Extensions
- `dea_registrations (provider_id, state, number, issue_date, expire_date, mate_attested)`
- `csr_licenses (provider_id, state, number, issue_date, expire_date)`
- `role_policies (role, state, requires_supervision, requires_collab)`

---

## Part 6 — UX Flow
- Add License → Validate role → Require artifacts.
- Renewal Timeline View → Three lanes: License / CSR / DEA.
- Alerts → Color badges + notifications.

---

## Next Steps
1. Implement DB migrations in Drizzle ORM.
2. Add role‑based validation hooks in Express routes.
3. Extend React forms to enforce artifacts (supervision/collab uploads).
4. Build DEA/CSR dashboards with renewal timelines.
5. Integrate email notifications.

