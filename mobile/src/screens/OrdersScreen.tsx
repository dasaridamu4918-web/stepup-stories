import React, { useState } from "react";
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
import { formatINR } from "../constants/indianStates";
import { OrderRecord, OrderStatus } from "../types/store";

interface OrdersScreenProps {
  highlightedOrder?: OrderRecord | null;
  onExploreCatalog: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" }
];

function getStepIndex(status: OrderStatus): number {
  if (status === "placed") return 0;
  if (status === "confirmed") return 1;
  if (status === "packed") return 2;
  if (status === "shipped" || status === "out_for_delivery") return 3;
  if (status === "delivered") return 4;
  return -1;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  highlightedOrder = null,
  onExploreCatalog
}) => {
  const { user, userOrders, findGuestOrder } = useStore();
  const [lookupQuery, setLookupQuery] = useState("");

  const displayedOrders =
    lookupQuery.trim().length > 0 ? findGuestOrder(lookupQuery) : userOrders;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ACQUISITIONS & TRACKING</Text>
        <Text style={styles.title}>Orders & Live Status</Text>
      </View>

      {/* Order Lookup Bar (supports Guest Order ID or 10-digit Mobile Lookup) */}
      <View style={styles.lookupBar}>
        <TextInput
          value={lookupQuery}
          onChangeText={setLookupQuery}
          placeholder="Track by Order # (e.g., SUS-123456) or 10-digit Phone..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.lookupInput}
        />
        {lookupQuery.length > 0 && (
          <TouchableOpacity onPress={() => setLookupQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {highlightedOrder && (
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedTitle}>
              ✓ Order {highlightedOrder.order_number} Confirmed
            </Text>
            <Text style={styles.confirmedDesc}>
              Thank you, {highlightedOrder.shipping_address.full_name}. Your
              order has been recorded for delivery to{" "}
              {highlightedOrder.shipping_address.city},{" "}
              {highlightedOrder.shipping_address.state} (PIN{" "}
              {highlightedOrder.shipping_address.pincode}).
            </Text>
          </View>
        )}

        {!user && (
          <View style={styles.guestNote}>
            <Text style={styles.guestNoteText}>
              Showing orders placed on this device. You can also search any guest
              order above using your Order Number or 10-digit mobile number.
            </Text>
          </View>
        )}

        {displayedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyDesc}>
              {lookupQuery.trim()
                ? "No order matched that Order Number or Mobile Number."
                : "You have not placed any watch orders yet."}
            </Text>
            <TouchableOpacity
              onPress={onExploreCatalog}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Browse Watches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedOrders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            const isCancelled = order.status === "cancelled";

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <View>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.orderDate}>
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isCancelled && styles.statusBadgeCancelled
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCancelled && styles.statusBadgeTextCancelled
                      ]}
                    >
                      {order.status.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Visual Order Status Timeline */}
                {!isCancelled && (
                  <View style={styles.timelineRow}>
                    {STATUS_STEPS.map((st, idx) => {
                      const done = idx <= stepIdx;
                      return (
                        <View key={st.key} style={styles.timelineStep}>
                          <View
                            style={[
                              styles.timelineDot,
                              done && styles.timelineDotDone
                            ]}
                          >
                            <Text
                              style={[
                                styles.timelineDotText,
                                done && styles.timelineDotTextDone
                              ]}
                            >
                              {done ? "✓" : idx + 1}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.timelineLabel,
                              done && styles.timelineLabelDone
                            ]}
                          >
                            {st.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Ordered Watch Items */}
                <View style={styles.itemsList}>
                  {order.items.map((item, idx) => (
                    <View key={`${item.product_id}-${idx}`} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.quantity}×</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCollection}>
                          {item.collection_name}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        {formatINR(item.line_total)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Delivery Address & Payment Summary */}
                <View style={styles.metaSection}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaStrong}>Deliver To: </Text>
                    {order.shipping_address.full_name} (+91{" "}
                    {order.shipping_address.phone}),{" "}
                    {order.shipping_address.address_line1},{" "}
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.state} –{" "}
                    {order.shipping_address.pincode}
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaStrong}>Payment: </Text>
                    {order.payment_method === "cod"
                      ? "Cash on Delivery (COD)"
                      : `Razorpay Online (${
                          order.test_mode ? "Test Mode Verified" : "Paid"
                        })`}
                  </Text>
                  {order.tracking_code && (
                    <Text style={styles.metaLine}>
                      <Text style={styles.metaStrong}>Courier Tracking: </Text>
                      {order.tracking_code}
                    </Text>
                  )}
                </View>

                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalSavedText}>
                      Saved {formatINR(order.total_savings)} on MRP
                    </Text>
                  </View>
                  <Text style={styles.totalPaidText}>
                    Total: {formatINR(order.total_payable)}
                  </Text>
                </View>
              </View>
            );
          })
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm
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
  lookupBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  lookupInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12.5
  },
  clearBtn: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 6
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  confirmedBanner: {
    backgroundColor: COLORS.successBg,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  confirmedTitle: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4
  },
  confirmedDesc: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    lineHeight: 18
  },
  guestNote: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  guestNoteText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17
  },
  emptyCard: {
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
  orderCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg,
    marginBottom: SPACING.md
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md
  },
  orderNumber: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "800"
  },
  orderDate: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: COLORS.goldSubtleBg,
    borderWidth: 1,
    borderColor: COLORS.goldChampagne,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm
  },
  statusBadgeCancelled: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.danger
  },
  statusBadgeText: {
    color: COLORS.goldBright,
    fontSize: 10.5,
    fontWeight: "800"
  },
  statusBadgeTextCancelled: {
    color: COLORS.danger
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCharcoal,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md
  },
  timelineStep: {
    alignItems: "center",
    flex: 1
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  timelineDotDone: {
    backgroundColor: COLORS.goldChampagne,
    borderColor: COLORS.goldChampagne
  },
  timelineDotText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700"
  },
  timelineDotTextDone: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
  },
  timelineLabel: {
    color: COLORS.textMuted,
    fontSize: 9.5,
    textAlign: "center"
  },
  timelineLabelDone: {
    color: COLORS.goldBright,
    fontWeight: "700"
  },
  itemsList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 8
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  itemQty: {
    color: COLORS.goldChampagne,
    fontSize: 13,
    fontWeight: "800",
    width: 24
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  itemCollection: {
    color: COLORS.textMuted,
    fontSize: 11
  },
  itemPrice: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: "700"
  },
  metaSection: {
    gap: 4,
    marginBottom: SPACING.sm
  },
  metaLine: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17
  },
  metaStrong: {
    color: COLORS.textPrimary,
    fontWeight: "700"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  totalSavedText: {
    color: COLORS.success,
    fontSize: 11.5,
    fontWeight: "600"
  },
  totalPaidText: {
    color: COLORS.goldBright,
    fontSize: 16,
    fontWeight: "800"
  }
});
