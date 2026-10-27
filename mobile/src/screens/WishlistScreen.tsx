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

interface WishlistScreenProps {
  onSelectProduct: (product: MobileProduct) => void;
  onExploreCatalog: () => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({
  onSelectProduct,
  onExploreCatalog
}) => {
  const { wishlistProducts, toggleWishlist, addToCart } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SAVED TIMEPIECES</Text>
        <Text style={styles.title}>
          Your Wishlist ({wishlistProducts.length})
        </Text>
      </View>

      {wishlistProducts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptyBody}>
            Tap the heart icon on any watch to save it here for quick comparison
            and checkout.
          </Text>
          <TouchableOpacity
            onPress={onExploreCatalog}
            style={styles.exploreBtn}
          >
            <Text style={styles.exploreBtnText}>Browse Collections</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {wishlistProducts.map((product) => {
            const img = product.images[0]?.url;
            return (
              <View key={product.id} style={styles.itemCard}>
                <TouchableOpacity
                  onPress={() => onSelectProduct(product)}
                  style={styles.itemMain}
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

                  <View style={styles.itemInfo}>
                    <Text style={styles.collectionLabel}>
                      {product.collection_name.toUpperCase()}
                    </Text>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.salePrice}>
                        {formatINR(product.price_amount)}
                      </Text>
                      {product.original_price_amount > product.price_amount && (
                        <Text style={styles.originalPrice}>
                          {formatINR(product.original_price_amount)}
                        </Text>
                      )}
                    </View>

                    {product.savings_amount > 0 && (
                      <Text style={styles.savingsText}>
                        Save {formatINR(product.savings_amount)} (
                        {product.discount_percent}% OFF)
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => toggleWishlist(product.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      addToCart(product, 1);
                      toggleWishlist(product.id);
                    }}
                    style={styles.moveToBagBtn}
                  >
                    <Text style={styles.moveToBagBtnText}>Move to Bag</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    color: COLORS.goldChampagne,
    fontSize: 36,
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md
  },
  itemCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  itemMain: {
    flexDirection: "row",
    gap: SPACING.md
  },
  itemImage: {
    width: 88,
    height: 104,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCharcoal
  },
  itemImagePlaceholder: {
    width: 88,
    height: 104,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center"
  },
  collectionLabel: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 3
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 6
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  salePrice: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "800"
  },
  originalPrice: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    textDecorationLine: "line-through"
  },
  savingsText: {
    color: COLORS.success,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 3
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  removeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  removeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: "600"
  },
  moveToBagBtn: {
    flex: 1.5,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldChampagne,
    alignItems: "center"
  },
  moveToBagBtnText: {
    color: COLORS.bgObsidian,
    fontSize: 12.5,
    fontWeight: "800"
  }
});
