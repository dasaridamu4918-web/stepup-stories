import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { useStore } from "../context/StoreContext";
import {
  MobileProduct,
  PriceFilterKey,
  SortOptionKey
} from "../types/store";
import { WatchCard } from "../components/WatchCard";

interface CatalogScreenProps {
  initialCollectionId?: string | null;
  onSelectProduct: (product: MobileProduct) => void;
}

const PRICE_FILTERS: { key: PriceFilterKey; label: string }[] = [
  { key: "all", label: "All Prices" },
  { key: "under_1500", label: "Under ₹1,500" },
  { key: "1500_to_2500", label: "₹1,500 – ₹2,500" },
  { key: "2500_to_3500", label: "₹2,500 – ₹3,500" },
  { key: "above_3500", label: "Above ₹3,500" }
];

const SORT_OPTIONS: { key: SortOptionKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price_asc", label: "Price: Low → High" },
  { key: "price_desc", label: "Price: High → Low" },
  { key: "savings_desc", label: "Biggest Savings" }
];

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  initialCollectionId = null,
  onSelectProduct
}) => {
  const {
    collections,
    products,
    isInWishlist,
    toggleWishlist,
    addToCart
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    initialCollectionId || "all"
  );
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>("all");
  const [sortBy, setSortBy] = useState<SortOptionKey>("featured");

  // Keep collection filter synced if parent passes a new collection
  React.useEffect(() => {
    if (initialCollectionId) {
      setSelectedCollectionId(initialCollectionId);
    }
  }, [initialCollectionId]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matches = products.filter((p) => {
      if (!p.published) return false;
      if (
        selectedCollectionId !== "all" &&
        p.collection_id !== selectedCollectionId
      ) {
        return false;
      }

      if (priceFilter === "under_1500" && p.price_amount >= 1500) return false;
      if (
        priceFilter === "1500_to_2500" &&
        (p.price_amount < 1500 || p.price_amount > 2500)
      ) {
        return false;
      }
      if (
        priceFilter === "2500_to_3500" &&
        (p.price_amount <= 2500 || p.price_amount > 3500)
      ) {
        return false;
      }
      if (priceFilter === "above_3500" && p.price_amount <= 3500) return false;

      if (!q) return true;
      const specText = p.specs.map((s) => `${s.key} ${s.value}`).join(" ");
      const searchable = `${p.name} ${p.generic_name} ${p.collection_name} ${p.short_description} ${p.description} ${specText}`.toLowerCase();
      return searchable.includes(q);
    });

    const sorted = [...matches];
    if (sortBy === "price_asc") {
      sorted.sort((a, b) => a.price_amount - b.price_amount);
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => b.price_amount - a.price_amount);
    } else if (sortBy === "savings_desc") {
      sorted.sort((a, b) => b.savings_amount - a.savings_amount);
    } else {
      sorted.sort((a, b) => a.sort_order - b.sort_order);
    }

    return sorted;
  }, [products, searchQuery, selectedCollectionId, priceFilter, sortBy]);

  // Group into pairs for 2-column native grid
  const productRows = useMemo(() => {
    const rows: MobileProduct[][] = [];
    for (let i = 0; i < filteredProducts.length; i += 2) {
      rows.push(filteredProducts.slice(i, i + 2));
    }
    return rows;
  }, [filteredProducts]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by dial, strap, bezel, or collection..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Collection Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            onPress={() => setSelectedCollectionId("all")}
            style={[
              styles.chip,
              selectedCollectionId === "all" && styles.chipActive
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedCollectionId === "all" && styles.chipTextActive
              ]}
            >
              All Collections ({products.length})
            </Text>
          </TouchableOpacity>

          {collections.map((c) => {
            const active = selectedCollectionId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedCollectionId(c.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Price Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {PRICE_FILTERS.map((pf) => {
            const active = priceFilter === pf.key;
            return (
              <TouchableOpacity
                key={pf.key}
                onPress={() => setPriceFilter(pf.key)}
                style={[styles.subChip, active && styles.subChipActive]}
              >
                <Text
                  style={[
                    styles.subChipText,
                    active && styles.subChipTextActive
                  ]}
                >
                  {pf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort & Result Count Bar */}
        <View style={styles.sortBar}>
          <Text style={styles.resultCount}>
            Showing {filteredProducts.length} timepiece
            {filteredProducts.length === 1 ? "" : "s"}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortBy(opt.key)}
                  style={[styles.sortPill, active && styles.sortPillActive]}
                >
                  <Text
                    style={[
                      styles.sortPillText,
                      active && styles.sortPillTextActive
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2-Column Product Grid */}
        {productRows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Matching Watches Found</Text>
            <Text style={styles.emptyDesc}>
              Try clearing your search or selecting a broader price range.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSelectedCollectionId("all");
                setPriceFilter("all");
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {productRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.gridRow}>
                {row.map((product) => (
                  <View key={product.id} style={styles.gridCell}>
                    <WatchCard
                      product={product}
                      isWishlisted={isInWishlist(product.id)}
                      onPress={() => onSelectProduct(product)}
                      onToggleWishlist={() => toggleWishlist(product.id)}
                      onQuickAdd={() => addToCart(product, 1)}
                    />
                  </View>
                ))}
                {row.length === 1 && <View style={styles.gridCell} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.bgObsidian
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: SPACING.md,
    height: 44
  },
  searchIcon: {
    color: COLORS.goldChampagne,
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13.5
  },
  clearText: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 6
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl
  },
  chipsRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: COLORS.goldChampagne,
    borderColor: COLORS.goldChampagne
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: "600"
  },
  chipTextActive: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8
  },
  subChipActive: {
    borderColor: COLORS.goldChampagne,
    backgroundColor: COLORS.goldSubtleBg
  },
  subChipText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: "600"
  },
  subChipTextActive: {
    color: COLORS.goldBright
  },
  sortBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8
  },
  sortRow: {
    gap: 8
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8
  },
  sortPillActive: {
    borderColor: COLORS.goldChampagne
  },
  sortPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600"
  },
  sortPillTextActive: {
    color: COLORS.goldChampagne
  },
  grid: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs
  },
  gridRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  gridCell: {
    flex: 1
  },
  emptyBox: {
    margin: SPACING.xl,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: SPACING.lg
  },
  resetBtn: {
    backgroundColor: COLORS.goldChampagne,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md
  },
  resetBtnText: {
    color: COLORS.bgObsidian,
    fontWeight: "800",
    fontSize: 12.5
  }
});
