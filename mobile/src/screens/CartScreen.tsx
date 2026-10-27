import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { useStore } from "../context/StoreContext";
import { MobileProduct } from "../types/store";
import { formatINR } from "../constants/indianStates";

interface CartScreenProps {
  onSelectProduct: (product: MobileProduct) => void;
  onProceedToCheckout: () => void;
  onExploreCatalog: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onSelectProduct,
  onProceedToCheckout,
  onExploreCatalog
}) => {
  const {
    cart,
    cartCount,
    cartTotals,
    updateCartQuantity,
    removeFromCart
  } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SHOPPING BAG</Text>
        <Text style={styles.title}>
          Your Selection ({cartCount} {cartCount === 1 ? "Item" : "Items"})
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛍</Text>
          <Text style={styles.emptyTitle}>Your Shopping Bag is Empty</Text>
          <Text style={styles.emptyBody}>
            Add timepieces from our curated collections to proceed to Indian
            Rupee (₹) checkout.
          </Text>
          <TouchableOpacity
            onPress={onExploreCatalog}
            style={styles.exploreBtn}
          >
            <Text style={styles.exploreBtnText}>Explore Watches</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {cart.map(({ product, quantity }) => {
              const img = product.images[0]?.url;
              const lineSale = product.price_amount * quantity;
              const lineOrig = product.original_price_amount * quantity;
              const lineSave = Math.max(0, lineOrig - lineSale);

              return (
                <View key={product.id} style={styles.cartItem}>
                  <TouchableOpacity
                    onPress={() => onSelectProduct(product)}
                    style={styles.itemRow}
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder} />
                    )}

                    <View style={styles.itemDetails}>
                      <Text style={styles.collectionText}>
                        {product.collection_name.toUpperCase()}
                      </Text>
                      <Text style={styles.itemTitle} numberOfLines={2}>
                        {product.name}
                      </Text>

                      <View style={styles.priceLine}>
                        <Text style={styles.salePrice}>
                          {formatINR(lineSale)}
                        </Text>
                        {lineOrig > lineSale && (
                          <Text style={styles.origPrice}>
                            {formatINR(lineOrig)}
                          </Text>
                        )}
                      </View>

                      {lineSave > 0 && (
                        <Text style={styles.saveLine}>
                          You save {formatINR(lineSave)}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.controlsRow}>
                    <TouchableOpacity
                      onPress={() => removeFromCart(product.id)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>

                    <View style={styles.stepper}>
                      <TouchableOpacity
                        onPress={() =>
                          updateCartQuantity(product.id, quantity - 1)
                        }
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{quantity}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          updateCartQuantity(product.id, quantity + 1)
                        }
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* INR Order Bill Breakdown */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>PRICE DETAILS (INR ₹)</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Total MRP ({cartCount} {cartCount === 1 ? "item" : "items"})
                </Text>
                <Text style={styles.summaryValue}>
                  {formatINR(cartTotals.totalMrp)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount on MRP</Text>
                <Text style={styles.summaryDiscount}>
                  − {formatINR(cartTotals.totalSavings)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Pan-India Insured Shipping
                </Text>
                <Text style={styles.summaryFree}>FREE</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryTotalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>
                  {formatINR(cartTotals.totalPayable)}
                </Text>
              </View>

              {cartTotals.totalSavings > 0 && (
                <View style={styles.totalSavingsBanner}>
                  <Text style={styles.totalSavingsText}>
                    ✓ You are saving {formatINR(cartTotals.totalSavings)} on
                    this order
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.bottomTotalLabel}>TOTAL PAYABLE</Text>
              <Text style={styles.bottomTotalAmount}>
                {formatINR(cartTotals.totalPayable)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onProceedToCheckout}
              style={styles.checkoutBtn}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md
  },
  eyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800"
  },
  emptyCard: {
    margin: SPACING.lg,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: SPACING.sm
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: SPACING.lg
  },
  exploreBtn: {
    backgroundColor: COLORS.goldChampagne,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 11,
    borderRadius: RADIUS.md
  },
  exploreBtnText: {
    color: COLORS.bgObsidian,
    fontWeight: "800",
    fontSize: 13
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120
  },
  cartItem: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  itemRow: {
    flexDirection: "row",
    gap: SPACING.md
  },
  itemImage: {
    width: 84,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCharcoal
  },
  itemImagePlaceholder: {
    width: 84,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center"
  },
  collectionText: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 6
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  salePrice: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "800"
  },
  origPrice: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    textDecorationLine: "line-through"
  },
  saveLine: {
    color: COLORS.success,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 2
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCharcoal
  },
  removeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnText: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "700"
  },
  qtyText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center"
  },
  summaryCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginTop: SPACING.xs
  },
  summaryTitle: {
    color: COLORS.goldChampagne,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: SPACING.md
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  summaryDiscount: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "700"
  },
  summaryFree: {
    color: COLORS.goldBright,
    fontSize: 13,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.sm
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4
  },
  totalLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800"
  },
  totalValue: {
    color: COLORS.goldBright,
    fontSize: 20,
    fontWeight: "800"
  },
  totalSavingsBanner: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.successBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm
  },
  totalSavingsText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700"
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  bottomTotalLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1
  },
  bottomTotalAmount: {
    color: COLORS.goldBright,
    fontSize: 20,
    fontWeight: "800"
  },
  checkoutBtn: {
    backgroundColor: COLORS.goldChampagne,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.md
  },
  checkoutBtnText: {
    color: COLORS.bgObsidian,
    fontSize: 14,
    fontWeight: "800"
  }
});
