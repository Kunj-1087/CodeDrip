-- =============================================================================
-- CodeDrip — 002_functions.sql
-- Functions and triggers. Depends on tables from 001_schema.sql.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- update_updated_at — generic BEFORE UPDATE trigger that stamps updated_at.
-- Applied to every table that carries an updated_at column.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at     BEFORE UPDATE ON categories     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at       BEFORE UPDATE ON products       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_items_updated_at     BEFORE UPDATE ON cart_items     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at         BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- generate_order_number — 'CD-2026-000042'. The numeric part comes from a
-- sequence so concurrent checkouts never collide on the unique order_number.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- recalculate_product_rating — keeps products.avg_rating / review_count in sync
-- with the reviews table. Only approved reviews count toward the public rating.
-- Fires AFTER INSERT/UPDATE/DELETE; handles the affected product on both OLD/NEW
-- (an UPDATE can in theory move a review between products).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    affected_product UUID;
BEGIN
    affected_product := COALESCE(NEW.product_id, OLD.product_id);

    UPDATE products p
    SET avg_rating = COALESCE((
            SELECT round(avg(r.rating)::numeric, 2)
            FROM reviews r
            WHERE r.product_id = affected_product AND r.is_approved
        ), 0),
        review_count = (
            SELECT count(*)
            FROM reviews r
            WHERE r.product_id = affected_product AND r.is_approved
        )
    WHERE p.id = affected_product;

    -- If an UPDATE changed product_id, refresh the old product too.
    IF TG_OP = 'UPDATE' AND NEW.product_id IS DISTINCT FROM OLD.product_id THEN
        UPDATE products p
        SET avg_rating = COALESCE((
                SELECT round(avg(r.rating)::numeric, 2)
                FROM reviews r
                WHERE r.product_id = OLD.product_id AND r.is_approved
            ), 0),
            review_count = (
                SELECT count(*)
                FROM reviews r
                WHERE r.product_id = OLD.product_id AND r.is_approved
            )
        WHERE p.id = OLD.product_id;
    END IF;

    RETURN NULL;  -- AFTER trigger: return value is ignored
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_recalc_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION recalculate_product_rating();

-- -----------------------------------------------------------------------------
-- decrement_stock_on_paid — when an order transitions INTO 'paid', decrement
-- product stock by the ordered quantities. GREATEST(..,0) prevents a stock
-- check-constraint abort if data is ever inconsistent; real over-sell guarding
-- happens at order-creation time in the API.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_stock_on_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
        UPDATE products p
        SET stock_quantity = GREATEST(p.stock_quantity - oi.quantity, 0)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = p.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_decrement_stock
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_paid();

-- -----------------------------------------------------------------------------
-- validate_coupon — returns the discount amount for a code against a subtotal,
-- or raises a descriptive exception. Called by the API inside the order
-- transaction so coupon math is enforced in one place, server-side.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_subtotal NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    c        coupons%ROWTYPE;
    discount NUMERIC(12,2);
BEGIN
    SELECT * INTO c FROM coupons WHERE code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon % does not exist', p_code USING ERRCODE = 'check_violation';
    END IF;

    IF NOT c.is_active THEN
        RAISE EXCEPTION 'Coupon % is no longer active', p_code USING ERRCODE = 'check_violation';
    END IF;

    IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
        RAISE EXCEPTION 'Coupon % has expired', p_code USING ERRCODE = 'check_violation';
    END IF;

    IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
        RAISE EXCEPTION 'Coupon % has reached its usage limit', p_code USING ERRCODE = 'check_violation';
    END IF;

    IF p_subtotal < c.min_order_value THEN
        RAISE EXCEPTION 'Order subtotal does not meet the minimum of % for coupon %', c.min_order_value, p_code
            USING ERRCODE = 'check_violation';
    END IF;

    IF c.type = 'percent' THEN
        discount := round(p_subtotal * c.value / 100.0, 2);
    ELSE
        discount := LEAST(c.value, p_subtotal);
    END IF;

    RETURN discount;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- first_user_becomes_admin — the first account created on a fresh install is
-- promoted to admin so a cloned store always has an owner. Subsequent signups
-- remain customers.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION first_user_becomes_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users) THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_first_admin
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION first_user_becomes_admin();

COMMIT;
