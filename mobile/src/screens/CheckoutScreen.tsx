import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import { useStore } from "../context/StoreContext";
import {
  INDIAN_STATES_AND_UTS,
  formatINR,
  isValidIndianPhone,
  isValidIndianPincode,
  normalizeIndianPhone
} from "../constants/indianStates";
import {
  IndianDeliveryAddress,
  OrderRecord,
  PaymentMethod
} from "../types/store";
import {
  createServerRazorpayOrder,
  RazorpayOrderSession,
  verifyServerRazorpayPayment
} from "../services/paymentService";

interface CheckoutScreenProps {
  onBackToCart: () => void;
  onOrderSuccess: (order: OrderRecord) => void;
  onSignInPrompt: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onBackToCart,
  onOrderSuccess,
  onSignInPrompt
}) => {
  const { cart, cartTotals, user, savedAddress, placeOrder } = useStore();

  const [fullName, setFullName] = useState(
    savedAddress?.full_name || user?.display_name || ""
  );
  const [phone, setPhone] = useState(
    savedAddress?.phone || user?.phone || ""
  );
  const [email, setEmail] = useState(
    savedAddress?.email || user?.email || ""
  );
  const [addressLine1, setAddressLine1] = useState(
    savedAddress?.address_line1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    savedAddress?.address_line2 || ""
  );
  const [landmark, setLandmark] = useState(savedAddress?.landmark || "");
  const [pincode, setPincode] = useState(savedAddress?.pincode || "");
  const [city, setCity] = useState(savedAddress?.city || "");
  const [stateName, setStateName] = useState(
    savedAddress?.state || "Maharashtra"
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Razorpay Test/Sandbox Modal State
  const [razorpaySession, setRazorpaySession] =
    useState<RazorpayOrderSession | null>(null);

  const validateAddress = (): IndianDeliveryAddress | null => {
    if (fullName.trim().length < 2) {
      setFormError("Please enter the recipient's full name.");
      return null;
    }
    if (!isValidIndianPhone(phone)) {
      setFormError(
        "Please enter a valid 10-digit Indian mobile number (starting with 6–9)."
      );
      return null;
    }
    if (!email.trim().includes("@")) {
      setFormError("Please enter a valid email address for order updates.");
      return null;
    }
    if (addressLine1.trim().length < 3) {
      setFormError("Please enter Flat / House No. / Building details.");
      return null;
    }
    if (!isValidIndianPincode(pincode)) {
      setFormError("Please enter a valid 6-digit Indian PIN code.");
      return null;
    }
    if (city.trim().length < 2) {
      setFormError("Please enter your City / District.");
      return null;
    }
    setFormError(null);
    return {
      full_name: fullName.trim(),
      phone: normalizeIndianPhone(phone),
      email: email.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
      city: city.trim(),
      state: stateName
    };
  };

  const handlePlaceOrderPress = async () => {
    const validatedAddress = validateAddress();
    if (!validatedAddress) return;

    if (paymentMethod === "cod") {
      setIsProcessing(true);
      try {
        const order = await placeOrder({
          shippingAddress: validatedAddress,
          paymentMethod: "cod",
          testMode: false
        });
        onOrderSuccess(order);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Razorpay Online Payment Flow (initializes order on server)
    setIsProcessing(true);
    try {
      const session = await createServerRazorpayOrder({
        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity
        })),
        amount_inr: cartTotals.totalPayable,
        customer_name: validatedAddress.full_name,
        customer_phone: validatedAddress.phone
      });
      setRazorpaySession(session);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to initialize Razorpay order."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRazorpayPayment = async () => {
    if (!razorpaySession) return;
    const validatedAddress = validateAddress();
    if (!validatedAddress) return;

    setIsProcessing(true);
    try {
      const simulatedPaymentId = `pay_test_${Date.now()}`;
      const verifyRes = await verifyServerRazorpayPayment({
        razorpay_order_id: razorpaySession.order_id,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: "test_mode_verified_signature"
      });

      if (!verifyRes.verified) {
        setFormError(
          verifyRes.error || "Payment verification failed. Please try again."
        );
        setRazorpaySession(null);
        return;
      }

      const order = await placeOrder({
        shippingAddress: validatedAddress,
        paymentMethod: "razorpay",
        razorpayOrderId: razorpaySession.order_id,
        razorpayPaymentId: simulatedPaymentId,
        testMode: razorpaySession.test_mode
      });
      setRazorpaySession(null);
      onOrderSuccess(order);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBackToCart} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Bag</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>CHECKOUT (₹ INR)</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Guest vs Account Mode Banner */}
        <View style={styles.modeBanner}>
          {user ? (
            <Text style={styles.modeBannerText}>
              ✓ Signed in as{" "}
              <Text style={styles.modeHighlight}>{user.email}</Text>
            </Text>
          ) : (
            <View style={styles.guestBannerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>Checking Out as Guest</Text>
                <Text style={styles.guestSubtitle}>
                  You can complete your order right away or sign in to sync order
                  history.
                </Text>
              </View>
              <TouchableOpacity
                onPress={onSignInPrompt}
                style={styles.signInSmallBtn}
              >
                <Text style={styles.signInSmallText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Indian Delivery Address Form */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>STEP 1 • DELIVERY ADDRESS</Text>
          <Text style={styles.sectionTitle}>Indian Shipping Details</Text>

          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g., Aarav Sharma"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Mobile Number (+91) *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>PIN Code (6 digits) *</Text>
              <TextInput
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="e.g., 400001"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>
            Flat, House No., Building, Apartment *
          </Text>
          <TextInput
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="e.g., Flat 402, Imperial Heights"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Area, Street, Sector, Locality</Text>
          <TextInput
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="e.g., MG Road, Indiranagar"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Landmark (Optional)</Text>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g., Near Metro Station"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>City / District *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g., Mumbai"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputLabel}>State / Union Territory *</Text>
              <TouchableOpacity
                onPress={() => setShowStatePicker(true)}
                style={styles.pickerTrigger}
              >
                <Text style={styles.pickerValue} numberOfLines={1}>
                  {stateName}
                </Text>
                <Text style={styles.pickerCaret}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>STEP 2 • PAYMENT METHOD</Text>
          <Text style={styles.sectionTitle}>Select Payment Option</Text>

          {/* Option 1: Cash on Delivery */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("cod")}
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentOptionActive
            ]}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "cod" && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>
                Cash on Delivery (COD — Pay in ₹ at Doorstep)
              </Text>
              <Text style={styles.paymentDesc}>
                Pay via Cash or UPI upon receiving your watch delivery anywhere
                in India.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Razorpay Online Payment */}
          <TouchableOpacity
            onPress={() => setPaymentMethod("razorpay")}
            style={[
              styles.paymentOption,
              paymentMethod === "razorpay" && styles.paymentOptionActive
            ]}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "razorpay" && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rzpHeaderRow}>
                <Text style={styles.paymentTitle}>
                  Razorpay Online (UPI / Cards / NetBanking)
                </Text>
                <View style={styles.testModePill}>
                  <Text style={styles.testModePillText}>TEST MODE</Text>
                </View>
              </View>
              <Text style={styles.paymentDesc}>
                Initialized securely on the server. Secret keys are kept strictly
                in server environment variables—never inside the mobile app.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>STEP 3 • ORDER SUMMARY</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Total MRP</Text>
            <Text style={styles.summaryVal}>
              {formatINR(cartTotals.totalMrp)}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Total Savings</Text>
            <Text style={styles.summarySave}>
              − {formatINR(cartTotals.totalSavings)}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryGold}>FREE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryLine}>
            <Text style={styles.totalLabel}>Net Payable</Text>
            <Text style={styles.totalVal}>
              {formatINR(cartTotals.totalPayable)}
            </Text>
          </View>
        </View>

        {formError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {formError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          disabled={isProcessing}
          onPress={handlePlaceOrderPress}
          style={styles.placeOrderBtn}
        >
          <Text style={styles.placeOrderText}>
            {isProcessing
              ? "Processing Order..."
              : paymentMethod === "cod"
              ? `Place COD Order • ${formatINR(cartTotals.totalPayable)}`
              : `Pay via Razorpay (Test Mode) • ${formatINR(
                  cartTotals.totalPayable
                )}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indian State / UT Picker Modal */}
      <Modal
        visible={showStatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Indian State / Union Territory
              </Text>
              <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {INDIAN_STATES_AND_UTS.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => {
                    setStateName(st);
                    setShowStatePicker(false);
                  }}
                  style={[
                    styles.stateOption,
                    stateName === st && styles.stateOptionActive
                  ]}
                >
                  <Text
                    style={[
                      styles.stateOptionText,
                      stateName === st && styles.stateOptionTextActive
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Razorpay Server-Initialized Test Mode Payment Sheet */}
      <Modal
        visible={Boolean(razorpaySession)}
        transparent
        animationType="fade"
        onRequestClose={() => setRazorpaySession(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.rzpModalCard}>
            <View style={styles.rzpTestBanner}>
              <Text style={styles.rzpTestBannerText}>
                {razorpaySession?.mode_label || "RAZORPAY TEST MODE"}
              </Text>
            </View>

            <Text style={styles.rzpStoreName}>STEPUP STORIES</Text>
            <Text style={styles.rzpAmount}>
              {formatINR(razorpaySession?.amount_inr || cartTotals.totalPayable)}
            </Text>
            <Text style={styles.rzpMeta}>
              Server Order ID: {razorpaySession?.order_id}
            </Text>
            <Text style={styles.rzpMeta}>
              Public Key ID: {razorpaySession?.razorpay_key_id}
            </Text>

            <Text style={styles.rzpNote}>
              This checkout session was created by the server without exposing
              RAZORPAY_KEY_SECRET in the mobile app. Tap below to simulate a
              successful test payment and verify the server signature.
            </Text>

            <TouchableOpacity
              disabled={isProcessing}
              onPress={handleCompleteRazorpayPayment}
              style={styles.rzpApproveBtn}
            >
              <Text style={styles.rzpApproveText}>
                {isProcessing
                  ? "Verifying Server Signature..."
                  : "Approve Test Payment (UPI / Card)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isProcessing}
              onPress={() => setRazorpaySession(null)}
              style={styles.rzpCancelBtn}
            >
              <Text style={styles.rzpCancelText}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    letterSpacing: 1.4
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
    gap: SPACING.md
  },
  modeBanner: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.md
  },
  modeBannerText: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  modeHighlight: {
    color: COLORS.goldBright,
    fontWeight: "700"
  },
  guestBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md
  },
  guestTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  guestSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 2
  },
  signInSmallBtn: {
    backgroundColor: COLORS.goldSubtleBg,
    borderWidth: 1,
    borderColor: COLORS.goldChampagne,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm
  },
  signInSmallText: {
    color: COLORS.goldBright,
    fontSize: 12,
    fontWeight: "700"
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.lg
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
    marginBottom: SPACING.md
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 8
  },
  input: {
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13.5
  },
  rowInputs: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  pickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  pickerValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    flex: 1
  },
  pickerCaret: {
    color: COLORS.goldChampagne,
    fontSize: 13,
    marginLeft: 6
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCharcoal,
    marginBottom: SPACING.sm
  },
  paymentOptionActive: {
    borderColor: COLORS.goldChampagne,
    backgroundColor: COLORS.goldSubtleBg
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.goldChampagne,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.goldChampagne
  },
  rzpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6
  },
  paymentTitle: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: "700"
  },
  paymentDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  testModePill: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm
  },
  testModePillText: {
    color: COLORS.warning,
    fontSize: 9.5,
    fontWeight: "800"
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 13
  },
  summaryVal: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  summarySave: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: "700"
  },
  summaryGold: {
    color: COLORS.goldBright,
    fontSize: 13,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: 8
  },
  totalLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800"
  },
  totalVal: {
    color: COLORS.goldBright,
    fontSize: 18,
    fontWeight: "800"
  },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: RADIUS.md
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12.5,
    fontWeight: "600"
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle
  },
  placeOrderBtn: {
    backgroundColor: COLORS.goldChampagne,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: "center"
  },
  placeOrderText: {
    color: COLORS.bgObsidian,
    fontSize: 14,
    fontWeight: "800"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: SPACING.lg
  },
  modalSheet: {
    maxHeight: "80%",
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700"
  },
  modalClose: {
    color: COLORS.textMuted,
    fontSize: 18,
    padding: 4
  },
  stateOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle
  },
  stateOptionActive: {
    backgroundColor: COLORS.goldSubtleBg
  },
  stateOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  stateOptionTextActive: {
    color: COLORS.goldBright,
    fontWeight: "700"
  },
  rzpModalCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.goldChampagne,
    padding: SPACING.xl,
    alignItems: "center"
  },
  rzpTestBanner: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md
  },
  rzpTestBannerText: {
    color: COLORS.warning,
    fontSize: 10.5,
    fontWeight: "800",
    textAlign: "center"
  },
  rzpStoreName: {
    color: COLORS.goldChampagne,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8
  },
  rzpAmount: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginVertical: 8
  },
  rzpMeta: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginBottom: 2
  },
  rzpNote: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    marginVertical: SPACING.lg
  },
  rzpApproveBtn: {
    width: "100%",
    backgroundColor: COLORS.goldChampagne,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginBottom: SPACING.sm
  },
  rzpApproveText: {
    color: COLORS.bgObsidian,
    fontSize: 13.5,
    fontWeight: "800"
  },
  rzpCancelBtn: {
    width: "100%",
    paddingVertical: 11,
    alignItems: "center"
  },
  rzpCancelText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600"
  }
});
