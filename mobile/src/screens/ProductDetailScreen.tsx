import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { MobileProduct } from "../types/store";
import { useStore } from "../context/StoreContext";
import { calculateSavings, formatINR } from "../constants/indianStates";

interface ProductDetailScreenProps {
  product: MobileProduct;
  onBack: () => void;
  onGoToCart: () => void;
  onBuyNow: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onGoToCart,
  onBuyNow
}) => {
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const wishlisted = isInWishlist(product.id);
  const outOfStock =
    product.stock_quantity <= 0 ||
    product.availability_status === "out_of_stock";

  const { savingsAmount, discountPercent } = calculateSavings(
    product.price_amount,
    product.original_price_amount
  );

  const activeImage =
    product.images[selectedImageIdx] || product.images[0] || null;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    onBuyNow();
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.topBarCollection} numberOfLines={1}>
          {product.collection_name.toUpperCase()}
        </Text>

        <TouchableOpacity
          onPress={() => toggleWishlist(product.id)}
          style={[styles.wishBtn, wishlisted && styles.wishBtnActive]}
        >
          <Text
            style={[styles.wishBtnText, wishlisted && styles.wishBtnTextActive]}
          >
            {wishlisted ? "♥ Saved" : "♡ Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Watch Studio Photo */}
        <View style={styles.mainPhotoContainer}>
          {activeImage ? (
            <Image
              source={{ uri: activeImage.url }}
              style={styles.mainPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mainPhotoPlaceholder} />
          )}

          <View style={styles.photoCounterPill}>
            <Text style={styles.photoCounterText}>
              {selectedImageIdx + 1} / {product.images.length}
            </Text>
          </View>
        </View>

        {/* Interactive Thumbnail Strip */}
        {product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {product.images.map((img, idx) => {
              const selected = idx === selectedImageIdx;
              return (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => setSelectedImageIdx(idx)}
                  style={[
                    styles.thumbItem,
                    selected && styles.thumbItemSelected
                  ]}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Product Details Section */}
        <View style={styles.detailsBody}>
          <View style={styles.badgesRow}>
            <View style={styles.collectionPill}>
              <Text style={styles.collectionPillText}>
                {product.collection_name}
              </Text>
            </View>

            <View
              style={[
                styles.stockPill,
                outOfStock ? styles.stockPillOut : styles.stockPillIn
              ]}
            >
              <Text
                style={[
                  styles.stockPillText,
                  outOfStock ? styles.stockTextOut : styles.stockTextIn
                ]}
              >
                {outOfStock
                  ? "Out of Stock"
                  : `In Stock (${product.stock_quantity} available)`}
              </Text>
            </View>
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>

          {/* INR Pricing Card with Calculated Savings */}
          <View style={styles.pricingCard}>
            <View style={styles.priceMainRow}>
              <Text style={styles.salePrice}>
                {formatINR(product.price_amount)}
              </Text>
              {product.original_price_amount > product.price_amount && (
                <Text style={styles.originalPrice}>
                  MRP {formatINR(product.original_price_amount)}
                </Text>
              )}
              {discountPercent > 0 && (
                <View style={styles.discountPill}>
                  <Text style={styles.discountPillText}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              )}
            </View>

            {savingsAmount > 0 && (
              <Text style={styles.savingsHighlight}>
                You save {formatINR(savingsAmount)} on this timepiece • Inclusive
                of all taxes
              </Text>
            )}
          </View>

          {/* Quantity Controls */}
          {!outOfStock && (
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setQuantity((q) =>
                      Math.min(product.stock_quantity, q + 1)
                    )
                  }
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description (Visible Details Only) */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Verified Visible Specifications */}
          {product.specs.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>VISIBLE DETAILS & SPECS</Text>
              <View style={styles.specsTable}>
                {product.specs.map((spec, i) => (
                  <View
                    key={`${spec.key}-${i}`}
                    style={[
                      styles.specRow,
                      i === product.specs.length - 1 && styles.specRowLast
                    ]}
                  >
                    <Text style={styles.specKey}>{spec.key}</Text>
                    <Text style={styles.specVal}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Delivery & Payment Assurance */}
          <View style={styles.assuranceBox}>
            <Text style={styles.assuranceItem}>
              ✓ Pan-India Delivery across all Indian States & PIN codes
            </Text>
            <Text style={styles.assuranceItem}>
              ✓ Cash on Delivery (COD) & Razorpay Online Payments supported
            </Text>
            <Text style={styles.assuranceItem}>
              ✓ Actual studio gallery photos of the exact watch style shown
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          disabled={outOfStock}
          onPress={addedFeedback ? onGoToCart : handleAddToCart}
          style={[
            styles.secondaryAction,
            outOfStock && styles.actionDisabled
          ]}
        >
          <Text style={styles.secondaryActionText}>
            {addedFeedback ? "✓ Added • View Bag" : "Add to Bag"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={outOfStock}
          onPress={handleBuyNow}
          style={[styles.primaryAction, outOfStock && styles.actionDisabled]}
        >
          <Text style={styles.primaryActionText}>
            {outOfStock
              ? "Out of Stock"
              : `Buy Now • ${formatINR(product.price_amount * quantity)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgObsidian
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  topBarCollection: {
    color: COLORS.goldChampagne,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5
  },
  wishBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  wishBtnActive: {
    borderColor: COLORS.goldChampagne,
    backgroundColor: COLORS.goldSubtleBg
  },
  wishBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  wishBtnTextActive: {
    color: COLORS.goldBright
  },
  scrollContent: {
    paddingBottom: 110
  },
  mainPhotoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.05,
    backgroundColor: COLORS.bgCharcoal,
    position: "relative"
  },
  mainPhoto: {
    width: "100%",
    height: "100%"
  },
  mainPhotoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.bgSurface
  },
  photoCounterPill: {
    position: "absolute",
    bottom: 12,
    right: 14,
    backgroundColor: "rgba(7, 9, 11, 0.78)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  photoCounterText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "600"
  },
  thumbStrip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 10
  },
  thumbItem: {
    width: 66,
    height: 76,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
    marginRight: 10
  },
  thumbItemSelected: {
    borderColor: COLORS.goldChampagne
  },
  thumbImage: {
    width: "100%",
    height: "100%"
  },
  detailsBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm
  },
  collectionPill: {
    backgroundColor: COLORS.goldSubtleBg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm
  },
  collectionPillText: {
    color: COLORS.goldBright,
    fontSize: 11,
    fontWeight: "700"
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm
  },
  stockPillIn: {
    backgroundColor: COLORS.successBg
  },
  stockPillOut: {
    backgroundColor: COLORS.dangerBg
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: "700"
  },
  stockTextIn: {
    color: COLORS.success
  },
  stockTextOut: {
    color: COLORS.danger
  },
  productTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 29,
    marginBottom: SPACING.md
  },
  pricingCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg
  },
  priceMainRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
  },
  salePrice: {
    color: COLORS.goldBright,
    fontSize: 26,
    fontWeight: "800"
  },
  originalPrice: {
    color: COLORS.textMuted,
    fontSize: 15,
    textDecorationLine: "line-through"
  },
  discountPill: {
    backgroundColor: COLORS.burgundyAccent,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.sm
  },
  discountPillText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "800"
  },
  savingsHighlight: {
    color: COLORS.success,
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 6
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg
  },
  quantityLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnText: {
    color: COLORS.goldBright,
    fontSize: 18,
    fontWeight: "700"
  },
  quantityValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center"
  },
  sectionBlock: {
    marginBottom: SPACING.xl
  },
  sectionHeading: {
    color: COLORS.goldChampagne,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22
  },
  specsTable: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: "hidden"
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: 12
  },
  specRowLast: {
    borderBottomWidth: 0
  },
  specKey: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1
  },
  specVal: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: "600",
    flex: 1.6,
    textAlign: "right"
  },
  assuranceBox: {
    backgroundColor: COLORS.bgCharcoal,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    gap: 6
  },
  assuranceItem: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldChampagne,
    backgroundColor: COLORS.goldSubtleBg,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryActionText: {
    color: COLORS.goldBright,
    fontSize: 13.5,
    fontWeight: "800"
  },
  primaryAction: {
    flex: 1.35,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.goldChampagne,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryActionText: {
    color: COLORS.bgObsidian,
    fontSize: 13.5,
    fontWeight: "800"
  },
  actionDisabled: {
    opacity: 0.45
  }
});
