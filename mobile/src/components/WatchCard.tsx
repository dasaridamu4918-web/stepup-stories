import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { MobileProduct } from "../types/store";
import { formatINR } from "../constants/indianStates";

interface WatchCardProps {
  product: MobileProduct;
  isWishlisted: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
  onQuickAdd: () => void;
  compact?: boolean;
}

export const WatchCard: React.FC<WatchCardProps> = ({
  product,
  isWishlisted,
  onPress,
  onToggleWishlist,
  onQuickAdd,
  compact = false
}) => {
  const primaryImage =
    product.images.find((i) => i.is_primary) || product.images[0];
  const outOfStock =
    product.stock_quantity <= 0 ||
    product.availability_status === "out_of_stock";

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={styles.imageWrapper}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage.url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Discount & Verified Limited Badge */}
        <View style={styles.topBadges}>
          {product.discount_percent > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                {Math.round(product.discount_percent)}% OFF
              </Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={onToggleWishlist}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.wishlistButton,
              isWishlisted && styles.wishlistButtonActive
            ]}
          >
            <Text
              style={[
                styles.wishlistIcon,
                isWishlisted && styles.wishlistIconActive
              ]}
            >
              {isWishlisted ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        </View>

        {product.limited_edition_verified && (
          <View style={styles.limitedBadge}>
            <Text style={styles.limitedBadgeText}>LIMITED EDITION</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.collectionLabel} numberOfLines={1}>
          {product.collection_name.toUpperCase()}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>{formatINR(product.price_amount)}</Text>
          {product.original_price_amount > product.price_amount && (
            <Text style={styles.originalPrice}>
              {formatINR(product.original_price_amount)}
            </Text>
          )}
        </View>

        {product.savings_amount > 0 && (
          <Text style={styles.savingsText}>
            Save {formatINR(product.savings_amount)}
          </Text>
        )}

        <TouchableOpacity
          disabled={outOfStock}
          onPress={onQuickAdd}
          style={[styles.addButton, outOfStock && styles.addButtonDisabled]}
        >
          <Text
            style={[
              styles.addButtonText,
              outOfStock && styles.addButtonTextDisabled
            ]}
          >
            {outOfStock ? "Out of Stock" : "+ Add to Bag"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: "hidden",
    flex: 1
  },
  cardCompact: {
    width: 215,
    flex: 0,
    marginRight: SPACING.md
  },
  imageWrapper: {
    width: "100%",
    height: 195,
    backgroundColor: COLORS.bgCharcoal,
    position: "relative"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.bgElevated
  },
  topBadges: {
    position: "absolute",
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  discountBadge: {
    backgroundColor: COLORS.burgundyAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  discountBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6
  },
  wishlistButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(7, 9, 11, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  wishlistButtonActive: {
    borderColor: COLORS.goldChampagne,
    backgroundColor: "rgba(212, 180, 117, 0.2)"
  },
  wishlistIcon: {
    color: COLORS.textPrimary,
    fontSize: 16
  },
  wishlistIconActive: {
    color: COLORS.goldChampagne
  },
  limitedBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: "rgba(7, 9, 11, 0.85)",
    borderColor: COLORS.goldChampagne,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm
  },
  limitedBadgeText: {
    color: COLORS.goldBright,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1
  },
  body: {
    padding: SPACING.md
  },
  collectionLabel: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    minHeight: 38,
    marginBottom: 8
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  salePrice: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "700"
  },
  originalPrice: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: "line-through"
  },
  savingsText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10
  },
  addButton: {
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.goldSubtleBg,
    alignItems: "center"
  },
  addButtonDisabled: {
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgElevated
  },
  addButtonText: {
    color: COLORS.goldBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  addButtonTextDisabled: {
    color: COLORS.textMuted
  }
});
