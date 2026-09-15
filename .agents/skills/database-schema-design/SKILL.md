---
name: database-schema-design
description: Design database schemas (MongoDB document models or Postgres/relational schemas via Prisma/Drizzle) with correct normalization, indexing, and relationship modeling. Use whenever the user is modeling data, designing a schema, choosing between embedding vs referencing in MongoDB, adding indexes, or asking "how should I structure this data".
---

# Database Schema Design Skill

## Choose the right data model for the engine — don't force one paradigm onto the other
**MongoDB (document)**: model around access patterns, not normalization. Ask "what do I read together most often?" before "what is technically non-redundant?"
- **Embed** when data is always read/written together, has a bounded size, and doesn't need independent querying (e.g. `order.shippingAddress`, `post.comments` if comment volume is small and bounded).
- **Reference** (separate collection + ObjectId) when data is large/unbounded (thousands of comments), shared across many parents, or needs independent access/updates (e.g. `user`, `product`).
- Avoid unbounded array growth inside a single document (MongoDB's 16MB doc limit) — if a collection can grow indefinitely (e.g. all-time order history on a user doc), reference it instead.

**Postgres/relational (Prisma/Drizzle)**: normalize by default (3NF), denormalize deliberately only for measured read-performance needs (e.g. a materialized view or a cached count column), and document why when you do.

## Indexing rules
- Index every foreign key / reference field used in `WHERE`/`$match` queries.
- Compound indexes: order fields by (equality filters first, then range/sort fields) — e.g. `{ orgId: 1, createdAt: -1 }` for "latest items in this org."
- Don't over-index — every index costs write performance and storage; add indexes based on actual query patterns, not speculatively.
- Use `explain()`/`EXPLAIN ANALYZE` to verify a slow query is actually hitting the index you expect before declaring it optimized.

## Example: Prisma relational schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  @@index([orgId])
}
```

## Example: Mongoose schema with embedding vs referencing
```ts
const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shippingAddress: { line1: String, city: String, zip: String }, // embedded: always read with the order
  items: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product' }, qty: Number, price: Number }], // referenced product, embedded line-item snapshot
  createdAt: { type: Date, default: Date.now, index: true },
});
```
Note: `price` is captured on the order at time of purchase (a snapshot), not just referenced from `Product` — product prices change, but historical orders shouldn't.

## Migration & versioning discipline
- Every schema change ships as a tracked migration (Prisma Migrate, or a versioned migration script for Mongoose) — never hand-edit production schema.
- For MongoDB schema evolution, add a `schemaVersion` field on documents that need staged migration, and write a backfill script rather than assuming all documents match the latest shape.

## Anti-patterns to flag
- Unbounded arrays embedded in a MongoDB document (comments, logs, order history)
- Missing index on a field used in every list-page query, causing full collection scans
- Referencing `Product.price` live in historical orders instead of snapshotting it
- Denormalizing in Postgres without a documented reason and a plan to keep it in sync

## Example prompt this skill should trigger on
> "Design the database schema for a multi-tenant SaaS with users, organizations, and projects."
