// =============================================================================
// Cart service. Carts belong to either a logged-in user (user_id) or a guest
// session (session_id). On login the guest cart is merged into the user cart.
// =============================================================================
import type pg from 'pg';
import { query, withTransaction } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';

export interface CartOwner {
  userId?: string;
  sessionId?: string;
}

export interface CartLine {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: number; // base_price + variant price_modifier
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
}

export interface CartSummary {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

function ownerClause(owner: CartOwner): { sql: string; params: unknown[] } {
  if (owner.userId) return { sql: 'ci.user_id = $1', params: [owner.userId] };
  if (owner.sessionId) return { sql: 'ci.session_id = $1', params: [owner.sessionId] };
  throw AppError.badRequest('A user or guest session is required for cart operations');
}

/** Read the full cart with product/variant pricing and a computed subtotal. */
export async function getCart(owner: CartOwner): Promise<CartSummary> {
  const { sql, params } = ownerClause(owner);
  const { rows } = await query<{
    id: string;
    product_id: string;
    variant_id: string | null;
    name: string;
    slug: string;
    image_url: string | null;
    unit_price: string;
    quantity: number;
    stock_quantity: number;
  }>(
    `SELECT ci.id, ci.product_id, ci.variant_id,
            p.name, p.slug,
            (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url,
            (p.base_price + COALESCE(v.price_modifier, 0)) AS unit_price,
            ci.quantity,
            COALESCE(v.stock_quantity, p.stock_quantity) AS stock_quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id AND p.deleted_at IS NULL
     LEFT JOIN product_variants v ON v.id = ci.variant_id
     WHERE ${sql}
     ORDER BY ci.created_at ASC`,
    params,
  );

  const items: CartLine[] = rows.map((r) => {
    const unitPrice = Number(r.unit_price);
    return {
      id: r.id,
      productId: r.product_id,
      variantId: r.variant_id,
      name: r.name,
      slug: r.slug,
      imageUrl: r.image_url,
      unitPrice,
      quantity: r.quantity,
      lineTotal: Number((unitPrice * r.quantity).toFixed(2)),
      stockQuantity: r.stock_quantity,
    };
  });

  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, subtotal, itemCount };
}

/** Add an item, or increment quantity if the same product+variant already exists. */
export async function addItem(owner: CartOwner, productId: string, variantId: string | null, quantity: number) {
  const { rows: products } = await query<{ stock_quantity: number }>(
    'SELECT stock_quantity FROM products WHERE id = $1 AND is_active = true AND deleted_at IS NULL',
    [productId],
  );
  if (products.length === 0) throw AppError.notFound('That product is unavailable');

  // Find an existing matching line (NULL-safe on variant_id).
  const { sql, params } = ownerClause(owner);
  const { rows: existing } = await query<{ id: string; quantity: number }>(
    `SELECT id, quantity FROM cart_items ci
     WHERE ${sql} AND product_id = $${params.length + 1} AND variant_id IS NOT DISTINCT FROM $${params.length + 2}`,
    [...params, productId, variantId],
  );

  if (existing.length > 0) {
    const next = existing[0].quantity + quantity;
    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [next, existing[0].id]);
  } else {
    await query(
      `INSERT INTO cart_items (user_id, session_id, product_id, variant_id, quantity)
       VALUES ($1, $2, $3, $4, $5)`,
      [owner.userId ?? null, owner.sessionId ?? null, productId, variantId, quantity],
    );
  }
  return getCart(owner);
}

/** Set the quantity of a line the owner controls. quantity 0 removes it. */
export async function updateItem(owner: CartOwner, itemId: string, quantity: number) {
  const { sql, params } = ownerClause(owner);
  if (quantity <= 0) {
    await query(`DELETE FROM cart_items ci WHERE ci.id = $${params.length + 1} AND ${sql}`, [...params, itemId]);
    return getCart(owner);
  }
  const { rowCount } = await query(
    `UPDATE cart_items ci SET quantity = $${params.length + 1} WHERE ci.id = $${params.length + 2} AND ${sql}`,
    [...params, quantity, itemId],
  );
  if (rowCount === 0) throw AppError.notFound('Cart item not found');
  return getCart(owner);
}

export async function removeItem(owner: CartOwner, itemId: string) {
  const { sql, params } = ownerClause(owner);
  await query(`DELETE FROM cart_items ci WHERE ci.id = $${params.length + 1} AND ${sql}`, [...params, itemId]);
  return getCart(owner);
}

export async function clearCart(owner: CartOwner, client?: pg.PoolClient) {
  const { sql, params } = ownerClause(owner);
  const run = client ? client.query.bind(client) : query;
  await run(`DELETE FROM cart_items ci WHERE ${sql}`, params);
}

/**
 * Merge a guest cart into a user cart on login. Lines for the same
 * product+variant have their quantities summed; the guest rows are then removed.
 * Runs in a transaction so a partial merge can never strand items.
 */
export async function mergeGuestCart(sessionId: string, userId: string) {
  if (!sessionId) return;
  await withTransaction(async (client) => {
    const { rows: guestRows } = await client.query<{
      product_id: string;
      variant_id: string | null;
      quantity: number;
    }>('SELECT product_id, variant_id, quantity FROM cart_items WHERE session_id = $1', [sessionId]);

    for (const g of guestRows) {
      const { rows: matched } = await client.query<{ id: string; quantity: number }>(
        `SELECT id, quantity FROM cart_items
         WHERE user_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
        [userId, g.product_id, g.variant_id],
      );
      if (matched.length > 0) {
        await client.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2', [
          g.quantity,
          matched[0].id,
        ]);
      } else {
        await client.query(
          'INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
          [userId, g.product_id, g.variant_id, g.quantity],
        );
      }
    }
    await client.query('DELETE FROM cart_items WHERE session_id = $1', [sessionId]);
  });
}
