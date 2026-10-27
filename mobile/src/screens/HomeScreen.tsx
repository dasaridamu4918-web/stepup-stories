import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { useStore } from "../context/StoreContext";
import { WatchCard } from "../components/WatchCard";
import { MobileProduct } from "../types/store";

interface HomeScreenProps {
  onSelectProduct: (product: MobileProduct) => void;
  onSelectCollection: (collectionId: string) => void;
  onNavigateCatalog: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectProduct,
  onSelectCollection,
  onNavigateCatalog
}) => {
  const {
    collections,
    products,
    isLoadingCatalog,
    refreshCatalog,
    isInWishlist,
    toggleWishlist,
    addToCart
  } = useStore();

  const featuredProducts = products.filter((p) => p.featured).slice(0, 8);
  const everydayIcons = products
    .filter((p) => p.collection_slug === "everyday-icons")
    .slice(0, 6);
  const modernMinimal = products
    .filter((p) => p.collection_slug === "modern-minimal")
    .slice(0, 6);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoadingCatalog}
          onRefresh={refreshCatalog}
          tintColor={COLORS.goldChampagne}
        />
      }
    >
      {/* Editorial Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroEyebrowRow}>
          <View style={styles.heroDot} />
          <Text style={styles.heroEyebrow}>CURATED HOROLOGICAL STORE</Text>
        </View>
        <Text style={styles.heroHeadline}>
          Timepieces Crafted for Defining Moments
        </Text>
        <Text style={styles.heroBody}>
          Explore the official STEPUP STORIES collections. Architectural
          precision, warm champagne-gold accents, and complimentary insured
          delivery across India.
        </Text>

        <View style={styles.heroCtaRow}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onNavigateCatalog}
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>Explore All Watches</Text>
          </TouchableOpacity>

          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>₹ INR • COD & Razorpay</Text>
          </View>
        </View>
      </View>

      {/* Curated Collections Horizontal Strip */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>THE PILLARS</Text>
          <Text style={styles.sectionTitle}>Shop by Collection</Text>
        </View>
        <TouchableOpacity onPress={onNavigateCatalog}>
          <Text style={styles.seeAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {collections.map((col) => {
          const count = products.filter((p) => p.collection_id === col.id).length;
          return (
            <TouchableOpacity
              key={col.id}
              activeOpacity={0.86}
              onPress={() => onSelectCollection(col.id)}
              style={styles.collectionCard}
            >
              <View style={styles.collectionTopRow}>
                <Text style={styles.collectionCount}>{count} WATCHES</Text>
                <Text style={styles.collectionArrow}>↗</Text>
              </View>
              <Text style={styles.collectionName}>{col.name}</Text>
              <Text style={styles.collectionSubtitle} numberOfLines={1}>
                {col.subtitle}
              </Text>
              <Text style={styles.collectionDesc} numberOfLines={2}>
                {col.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured Timepieces Carousel */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>CURATED SELECTION</Text>
          <Text style={styles.sectionTitle}>Featured Watches</Text>
        </View>
        <TouchableOpacity onPress={onNavigateCatalog}>
          <Text style={styles.seeAllText}>Browse {products.length} →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {featuredProducts.map((product) => (
          <WatchCard
            key={product.id}
            product={product}
            compact
            isWishlisted={isInWishlist(product.id)}
            onPress={() => onSelectProduct(product)}
            onToggleWishlist={() => toggleWishlist(product.id)}
            onQuickAdd={() => addToCart(product, 1)}
          />
        ))}
      </ScrollView>

      {/* Modern Minimal Spotlight */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>PURE ARCHITECTURAL FORM</Text>
          <Text style={styles.sectionTitle}>Modern Minimal</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            onSelectCollection("11111111-1111-4111-8111-111111111103")
          }
        >
          <Text style={styles.seeAllText}>See Collection →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {modernMinimal.map((product) => (
          <WatchCard
            key={product.id}
            product={product}
            compact
            isWishlisted={isInWishlist(product.id)}
            onPress={() => onSelectProduct(product)}
            onToggleWishlist={() => toggleWishlist(product.id)}
            onQuickAdd={() => addToCart(product, 1)}
          />
        ))}
      </ScrollView>

      {/* Everyday Icons Spotlight */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>VERSATILE SOPHISTICATION</Text>
          <Text style={styles.sectionTitle}>Everyday Icons</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            onSelectCollection("11111111-1111-4111-8111-111111111105")
          }
        >
          <Text style={styles.seeAllText}>See Collection →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {everydayIcons.map((product) => (
          <WatchCard
            key={product.id}
            product={product}
            compact
            isWishlisted={isInWishlist(product.id)}
            onPress={() => onSelectProduct(product)}
            onToggleWishlist={() => toggleWishlist(product.id)}
            onQuickAdd={() => addToCart(product, 1)}
          />
        ))}
      </ScrollView>

      {/* Store Promise Banner */}
      <View style={styles.promiseCard}>
        <Text style={styles.promiseEyebrow}>THE STEPUP STORIES PROMISE</Text>
        <Text style={styles.promiseTitle}>
          Transparent Pricing & Verified Visual Details
        </Text>
        <Text style={styles.promiseBody}>
          Every listing displays actual studio photographs of the timepiece,
          clear Indian Rupee (₹) pricing, and verified specifications—with
          Cash on Delivery and secure online checkout across all Indian PIN codes.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian
  },
  content: {
    paddingBottom: SPACING.xxxl
  },
  heroCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.goldBorder
  },
  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.burgundyHighlight
  },
  heroEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6
  },
  heroHeadline: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31,
    marginBottom: SPACING.sm
  },
  heroBody: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: SPACING.lg
  },
  heroCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
  },
  primaryCta: {
    backgroundColor: COLORS.goldChampagne,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 11,
    borderRadius: RADIUS.md
  },
  primaryCtaText: {
    color: COLORS.bgObsidian,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  trustPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCharcoal
  },
  trustPillText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: "600"
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md
  },
  sectionEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: "700"
  },
  seeAllText: {
    color: COLORS.goldBright,
    fontSize: 12.5,
    fontWeight: "600"
  },
  horizontalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs
  },
  collectionCard: {
    width: 220,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    marginRight: SPACING.md
  },
  collectionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm
  },
  collectionCount: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  collectionArrow: {
    color: COLORS.goldBright,
    fontSize: 14,
    fontWeight: "700"
  },
  collectionName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2
  },
  collectionSubtitle: {
    color: COLORS.goldBright,
    fontSize: 11.5,
    fontWeight: "500",
    marginBottom: 6
  },
  collectionDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  promiseCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  promiseEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4
  },
  promiseTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6
  },
  promiseBody: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 19
  }
});
