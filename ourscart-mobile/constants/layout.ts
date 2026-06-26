// =============================================================================
// Fixed-dimension layout constants used for FlatList getItemLayout optimization.
//
// Supplying exact heights via getItemLayout allows FlatList to skip measuring
// each item, which dramatically improves scroll performance — especially on
// budget Android devices (2GB RAM) where the layout measurement pass can drop
// frames.
//
// These values MUST match the actual rendered height of each card type.
// If card layouts change, update these constants accordingly. The wrong height
// produces visible scroll gaps (worse than no getItemLayout at all).
// =============================================================================

export const PRODUCT_CARD_HEIGHT = 320; // Vertical product card in shop grid
export const PRODUCT_CARD_HORIZONTAL_HEIGHT = 120; // Horizontal card in lists/carousels
export const ORDER_ROW_HEIGHT = 72; // Order history list row
export const SEARCH_RESULT_ROW_HEIGHT = 64; // Search result row
export const CART_ITEM_HEIGHT = 96; // Cart item row
export const CATEGORY_STRIP_HEIGHT = 100; // Category strip on home screen
export const REVIEW_ROW_HEIGHT = 80; // Review list row
export const ADDRESS_ROW_HEIGHT = 72; // Address list row
