import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

interface BrandHeaderProps {
  wishlistCount: number;
  cartCount: number;
  onPressSearch: () => void;
  onPressWishlist: () => void;
  onPressCart: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  wishlistCount,
  cartCount,
  onPressSearch,
  onPressWishlist,
  onPressCart
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.emblemOctagon}>
          <Text style={styles.emblemLetter}>S</Text>
          <View style={styles.emblemCrimsonDot} />
        </View>
        <View>
          <Text style={styles.brandTitle}>STEPUP STORIES</Text>
          <Text style={styles.brandTagline}>EVERY SECOND MARKS AN ASCENT</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onPressSearch}
          style={styles.iconBtn}
          accessibilityLabel="Search watches"
        >
          <Text style={styles.iconText}>⌕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressWishlist}
          style={styles.iconBtn}
          accessibilityLabel="Open wishlist"
        >
          <Text style={styles.iconText}>♡</Text>
          {wishlistCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlistCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressCart}
          style={styles.iconBtn}
          accessibilityLabel="Open shopping bag"
        >
          <Text style={styles.iconText}>🛍</Text>
          {cartCount > 0 && (
            <View style={[styles.badge, styles.badgeGold]}>
              <Text style={styles.badgeTextDark}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgObsidian,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  emblemOctagon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.goldChampagne,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  emblemLetter: {
    color: COLORS.goldBright,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1
  },
  emblemCrimsonDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.burgundyHighlight
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2.2
  },
  brandTagline: {
    color: COLORS.goldChampagne,
    fontSize: 8.5,
    fontWeight: "600",
    letterSpacing: 1.4,
    marginTop: 1
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  iconText: {
    color: COLORS.textPrimary,
    fontSize: 16
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.burgundyHighlight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeGold: {
    backgroundColor: COLORS.goldChampagne
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: "800"
  },
  badgeTextDark: {
    color: COLORS.bgObsidian,
    fontSize: 10,
    fontWeight: "800"
  }
});
