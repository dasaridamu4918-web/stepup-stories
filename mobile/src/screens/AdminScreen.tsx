import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { useStore } from "../context/StoreContext";
import { calculateSavings, formatINR } from "../constants/indianStates";
import { MobileProduct, OrderStatus } from "../types/store";

interface AdminScreenProps {
  onBack: () => void;
}

const ORDER_STATUS_LIST: OrderStatus[] = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const {
    isAdmin,
    collections,
    products,
    orders,
    adminUpsertProduct,
    adminUpdateStock,
    adminUpdateOrderStatus
  } = useStore();

  const [activeTab, setActiveTab] = useState<"products" | "stock" | "orders">(
    "products"
  );

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [genericName, setGenericName] = useState("");
  const [brandCandidate, setBrandCandidate] = useState("");
  const [brandedTitle, setBrandedTitle] = useState("");
  const [brandVerified, setBrandVerified] = useState(false);
  const [collectionId, setCollectionId] = useState(
    collections[0]?.id || "11111111-1111-4111-8111-111111111105"
  );
  const [priceAmount, setPriceAmount] = useState("1499");
  const [originalPriceAmount, setOriginalPriceAmount] = useState("1699");
  const [stockQuantity, setStockQuantity] = useState("10");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedTitle}>Restricted Store Admin Area</Text>
        <Text style={styles.deniedText}>
          Role-Based Access Control (RBAC): Only authenticated users with the
          Store Administrator role (`role === "admin"`) can access product,
          stock, and order management.
        </Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Return to Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startEditProduct = (p: MobileProduct) => {
    setEditingProductId(p.id);
    setGenericName(p.generic_name);
    setBrandCandidate(p.brand_candidate || "");
    setBrandedTitle(p.name);
    setBrandVerified(p.brand_verified);
    setCollectionId(p.collection_id);
    setPriceAmount(String(p.price_amount));
    setOriginalPriceAmount(String(p.original_price_amount));
    setStockQuantity(String(p.stock_quantity));
    setShortDesc(p.short_description);
    setDescription(p.description);
    setImageUrlsText(p.images.map((i) => i.url).join("\n"));
    setFeedback(null);
  };

  const resetForm = () => {
    setEditingProductId(null);
    setGenericName("");
    setBrandCandidate("");
    setBrandedTitle("");
    setBrandVerified(false);
    setPriceAmount("1499");
    setOriginalPriceAmount("1699");
    setStockQuantity("10");
    setShortDesc("");
    setDescription("");
    setImageUrlsText("");
  };

  const handleSaveProduct = async () => {
    if (!genericName.trim()) {
      setFeedback("Error: Generic descriptive product name is required.");
      return;
    }
    const sale = Number(priceAmount);
    const orig = Number(originalPriceAmount);
    if (!Number.isFinite(sale) || sale <= 0) {
      setFeedback("Error: Selling price in ₹ must be a positive number.");
      return;
    }

    const col =
      collections.find((c) => c.id === collectionId) || collections[0]!;
    const urls = imageUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setFeedback(
        "Error: Please provide at least one verified product photo URL."
      );
      return;
    }

    const id = editingProductId || `prod_${Date.now()}`;
    const slug = genericName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    const res = await adminUpsertProduct({
      id,
      slug,
      generic_name: genericName.trim(),
      branded_title: brandedTitle.trim() || genericName.trim(),
      brand_candidate: brandCandidate.trim() || null,
      brand_verified: brandVerified,
      limited_edition_verified: false,
      collection_id: col.id,
      collection_slug: col.slug,
      collection_name: col.name,
      short_description: shortDesc.trim() || description.trim(),
      description: description.trim() || shortDesc.trim(),
      price_amount: sale,
      original_price_amount: Math.max(sale, orig),
      stock_quantity: Math.max(0, Number(stockQuantity) || 0),
      availability_status:
        Number(stockQuantity) > 0 ? "available" : "out_of_stock",
      featured: true,
      published: true,
      sort_order: 1,
      specs: [{ key: "Collection", value: col.name }],
      images: urls.map((url, idx) => ({
        id: `${id}_img_${idx}`,
        url,
        alt_text: `${genericName.trim()} photo ${idx + 1}`,
        is_primary: idx === 0,
        sort_order: idx
      })),
      created_at: new Date().toISOString()
    });

    if (res.ok) {
      setFeedback(
        `✓ Saved "${
          brandVerified && brandedTitle.trim()
            ? brandedTitle.trim()
            : genericName.trim()
        }"`
      );
      resetForm();
    } else {
      setFeedback(res.error || "Failed to save product.");
    }
  };

  const liveCalc = calculateSavings(
    Number(priceAmount) || 0,
    Number(originalPriceAmount) || 0
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>PROTECTED STORE ADMIN</Text>
        <View style={styles.rbacBadge}>
          <Text style={styles.rbacBadgeText}>ADMIN RBAC</Text>
        </View>
      </View>

      {/* Admin Sub-Navigation Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab("products")}
          style={[
            styles.tabBtn,
            activeTab === "products" && styles.tabBtnActive
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "products" && styles.tabTextActive
            ]}
          >
            Add / Edit Watch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("stock")}
          style={[styles.tabBtn, activeTab === "stock" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "stock" && styles.tabTextActive
            ]}
          >
            Stock ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("orders")}
          style={[styles.tabBtn, activeTab === "orders" && styles.tabBtnActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.tabTextActive
            ]}
          >
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "products" && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>
                {editingProductId ? "EDIT EXISTING WATCH" : "ADD NEW WATCH"}
              </Text>
              <Text style={styles.sectionTitle}>
                Verified Product & Brand Policy
              </Text>
              <Text style={styles.policyNote}>
                Use only visible details from actual photos. Branded names are
                published ONLY when "Brand Verified as Genuine & Authorized" is
                enabled below; otherwise the generic descriptive name is used.
              </Text>

              <Text style={styles.label}>
                Generic Descriptive Name (Used when brand is unverified) *
              </Text>
              <TextInput
                value={genericName}
                onChangeText={setGenericName}
                placeholder="e.g., Black Dial Gold-Tone Watch"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>
                    Brand Verified as Genuine & Authorized
                  </Text>
                  <Text style={styles.switchSub}>
                    Keep OFF unless authenticity & authorization are verified.
                  </Text>
                </View>
                <Switch
                  value={brandVerified}
                  onValueChange={setBrandVerified}
                  trackColor={{
                    false: COLORS.bgElevated,
                    true: COLORS.goldChampagne
                  }}
                />
              </View>

              {brandVerified && (
                <>
                  <Text style={styles.label}>Verified Brand Name</Text>
                  <TextInput
                    value={brandCandidate}
                    onChangeText={setBrandCandidate}
                    placeholder="e.g., Casio Edifice"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                  />
                  <Text style={styles.label}>Verified Branded Product Title</Text>
                  <TextInput
                    value={brandedTitle}
                    onChangeText={setBrandedTitle}
                    placeholder="Full branded title"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                  />
                </>
              )}

              <Text style={styles.label}>Collection</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 6 }}
              >
                {collections.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCollectionId(c.id)}
                    style={[
                      styles.colChip,
                      collectionId === c.id && styles.colChipActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.colChipText,
                        collectionId === c.id && styles.colChipTextActive
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Selling Price (₹) *</Text>
                  <TextInput
                    value={priceAmount}
                    onChangeText={setPriceAmount}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Original MRP (₹) *</Text>
                  <TextInput
                    value={originalPriceAmount}
                    onChangeText={setOriginalPriceAmount}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 0.8 }}>
                  <Text style={styles.label}>Stock Qty *</Text>
                  <TextInput
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.calcPreview}>
                Auto-Calculated Savings: Save {formatINR(liveCalc.savingsAmount)}{" "}
                ({liveCalc.discountPercent}% OFF)
              </Text>

              <Text style={styles.label}>
                Visible-Only Description (No invented specs/warranty) *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Describe only visible dial, bezel, hands, sub-dials, and strap details..."
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { minHeight: 72 }]}
              />

              <Text style={styles.label}>
                Product Photo URLs (One URL per line) *
              </Text>
              <TextInput
                value={imageUrlsText}
                onChangeText={setImageUrlsText}
                multiline
                numberOfLines={3}
                placeholder="https://stepup-stories.vercel.app/assets/watches/..."
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { minHeight: 72 }]}
              />

              {feedback && (
                <Text style={styles.feedbackText}>{feedback}</Text>
              )}

              <View style={styles.btnRow}>
                {editingProductId && (
                  <TouchableOpacity
                    onPress={resetForm}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleSaveProduct}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>
                    {editingProductId ? "Update Watch" : "Add Watch to Catalog"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tap any existing watch to edit */}
            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>EXISTING CATALOG</Text>
              <Text style={styles.sectionTitle}>Tap Any Watch to Edit</Text>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => startEditProduct(p)}
                  style={styles.editItemRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editItemName}>{p.name}</Text>
                    <Text style={styles.editItemMeta}>
                      {p.collection_name} • {formatINR(p.price_amount)} (MRP{" "}
                      {formatINR(p.original_price_amount)}) •{" "}
                      {p.brand_verified ? "Brand Verified" : "Generic Name"}
                    </Text>
                  </View>
                  <Text style={styles.editLink}>Edit →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === "stock" && (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>INVENTORY CONTROL</Text>
            <Text style={styles.sectionTitle}>Manage Watch Stock</Text>
            {products.map((p) => (
              <View key={p.id} style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockName}>{p.name}</Text>
                  <Text style={styles.stockSub}>
                    {p.collection_name} • {formatINR(p.price_amount)}
                  </Text>
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() =>
                      adminUpdateStock(p.id, Math.max(0, p.stock_quantity - 1))
                    }
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stockCountText}>{p.stock_quantity}</Text>
                  <TouchableOpacity
                    onPress={() => adminUpdateStock(p.id, p.stock_quantity + 1)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "orders" && (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>ORDER FULFILLMENT</Text>
            <Text style={styles.sectionTitle}>
              Customer & Guest Orders ({orders.length})
            </Text>

            {orders.length === 0 ? (
              <Text style={styles.emptyOrdersText}>
                No orders placed yet. Orders placed via COD or Razorpay will
                appear here for status management.
              </Text>
            ) : (
              orders.map((ord) => (
                <View key={ord.id} style={styles.orderAdminBlock}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.orderAdminNum}>{ord.order_number}</Text>
                    <Text style={styles.orderAdminTotal}>
                      {formatINR(ord.total_payable)} ({ord.payment_method.toUpperCase()})
                    </Text>
                  </View>

                  <Text style={styles.orderAdminAddr}>
                    {ord.shipping_address.full_name} (+91{" "}
                    {ord.shipping_address.phone}) —{" "}
                    {ord.shipping_address.address_line1},{" "}
                    {ord.shipping_address.city}, {ord.shipping_address.state} –{" "}
                    {ord.shipping_address.pincode}
                  </Text>

                  <Text style={styles.label}>Update Order Status:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                  >
                    {ORDER_STATUS_LIST.map((st) => {
                      const active = ord.status === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          onPress={() => adminUpdateOrderStatus(ord.id, st)}
                          style={[
                            styles.statusChip,
                            active && styles.statusChipActive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              active && styles.statusChipTextActive
                            ]}
                          >
                            {st.replace(/_/g, " ").toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))
            )}
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
  deniedContainer: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian,
    padding: SPACING.xxl,
    justifyContent: "center",
    alignItems: "center"
  },
  deniedTitle: {
    color: COLORS.danger,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8
  },
  deniedText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: SPACING.lg
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: "600"
  },
  topTitle: {
    color: COLORS.goldChampagne,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3
  },
  rbacBadge: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm
  },
  rbacBadgeText: {
    color: COLORS.success,
    fontSize: 9.5,
    fontWeight: "800"
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: 8
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: COLORS.goldChampagne,
    borderColor: COLORS.goldChampagne
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700"
  },
  tabTextActive: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  sectionEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 2
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6
  },
  policyNote: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: SPACING.md
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4
  },
  input: {
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.textPrimary,
    fontSize: 13
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCharcoal,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginTop: SPACING.md
  },
  switchTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700"
  },
  switchSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  colChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8
  },
  colChipActive: {
    backgroundColor: COLORS.goldChampagne,
    borderColor: COLORS.goldChampagne
  },
  colChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  colChipTextActive: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  calcPreview: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8
  },
  feedbackText: {
    color: COLORS.goldBright,
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: SPACING.md
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: SPACING.lg
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.goldChampagne,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center"
  },
  saveBtnText: {
    color: COLORS.bgObsidian,
    fontSize: 13,
    fontWeight: "800"
  },
  editItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  editItemName: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: "700"
  },
  editItemMeta: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2
  },
  editLink: {
    color: COLORS.goldBright,
    fontSize: 12.5,
    fontWeight: "700",
    marginLeft: 8
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  stockName: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: "600"
  },
  stockSub: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
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
  stockCountText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    minWidth: 24,
    textAlign: "center"
  },
  emptyOrdersText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19
  },
  orderAdminBlock: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  orderAdminNum: {
    color: COLORS.goldBright,
    fontSize: 15,
    fontWeight: "800"
  },
  orderAdminTotal: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: "700"
  },
  orderAdminAddr: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8
  },
  statusChipActive: {
    backgroundColor: COLORS.goldChampagne,
    borderColor: COLORS.goldChampagne
  },
  statusChipText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: "700"
  },
  statusChipTextActive: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
  }
});
