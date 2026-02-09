# Security Production Baseline

## 1) Secrets Policy
- Never commit real secrets to git.
- Keep production secrets only in deployment secret managers.
- Rotate AI and ETA credentials immediately if they were ever exposed.

## 2) Required Runtime Secrets
- `JWT_SECRET`
- `AUDIT_HMAC_SECRET`
- `DATABASE_URL`

## 3) CORS Policy
- Use explicit origins in production via `CORS_ORIGINS`.
- Do not rely on local/private-network fallback behavior in production.

## 4) CI Security Controls
- Run type, test, and build gates on every PR.
- Run secret scanning on every PR and push.

## 5) Incident Actions (If Secret Leaks)
1. Revoke leaked key immediately.
2. Rotate with new credential.
3. Redeploy service with new secret.
4. Audit access logs for abuse window.
5. Document incident with timeline and corrective actions.
