# FXCV — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Zero Self-Privilege Escalation**: No non-admin user may create or update a `/users/{userId}` document with `role == 'admin'`, nor create/modify/delete `/admins/{userId}`.
2. **Verified Identity & Ownership**: Every write by a standard user requires `request.auth != null && request.auth.token.email_verified == true`. All ownership fields (`uid`, `sellerId`, `buyerId`, `purchaserId`, `userId`, `actorId`) must equal `request.auth.uid` on creation and remain immutable on update.
3. **PII Isolation**: `/users/{userId}`, `/orders/{orderId}`, `/supportTickets/{ticketId}`, and `/newsletterSubscribers/{subscriberId}` contain PII (`email`, `phone`, `shippingAddress`) and are strictly readable only by the document owner or verified admin.
4. **Master Gate & Relational Integrity**:
   - Cart items (`/users/{userId}/cart/{itemId}`) and Saved items (`/users/{userId}/saved/{productId}`) are strictly owner-scoped and require the target `/products/{productId}` to exist on creation.
   - Order line items (`/orders/{orderId}/items/{itemId}`) require the parent `/orders/{orderId}` to exist (or be created atomically in the same batch via `getAfter`) and belong to `request.auth.uid`.
5. **Terminal State Locking**: Once an order reaches `delivered`, `cancelled`, or `refunded`, or a support ticket reaches `closed`, or a gift card reaches `redeemed` or `void`, only a verified admin can transition it.
6. **Temporal Integrity & Strict Keys**: `createdAt` / `updatedAt` must equal `request.time`, and every create/update validates strict key allowlists (`hasAll` / `hasOnly` / `affectedKeys().hasOnly()`) and string `.size()` bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Privilege Escalation (User Create)**: Non-admin creates `/users/{uid}` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection (User Update)**: User updates `/users/{uid}` adding `{ isVerifiedSeller: true }` -> `PERMISSION_DENIED`.
3. **Direct Admin Grant**: Non-admin creates `/admins/{uid}` -> `PERMISSION_DENIED`.
4. **Unverified Email Spoof**: User with `email: "lupinstarnley009@gmail.com"` and `email_verified: false` attempts admin read -> `PERMISSION_DENIED`.
5. **PII Cross-User Read**: Signed-in User B calls `get` on `/users/{userA}` -> `PERMISSION_DENIED`.
6. **Query Scraping (Orders)**: Signed-in User B lists `/orders` without `buyerId == userB` filter -> `PERMISSION_DENIED`.
7. **Seller Spoofing (Product Create)**: User A creates `/products/{id}` with `sellerId: "userB"` -> `PERMISSION_DENIED`.
8. **Resource Exhaustion (1MB String)**: User creates `/products/{id}` with `title` length > 140 or `id` length > 128 -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: User creates `/products/{id}` with backdated `createdAt` (`!= request.time`) -> `PERMISSION_DENIED`.
10. **Orphaned Order Line Item**: User creates `/orders/fakeOrder/items/item1` without parent `/orders/fakeOrder` -> `PERMISSION_DENIED`.
11. **Terminal Order Tampering**: Buyer updates `/orders/{id}` from `delivered` back to `pending` or changes `totalAmount` -> `PERMISSION_DENIED`.
12. **Audit Log Tampering**: Even an admin attempts `update` or `delete` on `/auditLogs/{logId}` -> `PERMISSION_DENIED`.
