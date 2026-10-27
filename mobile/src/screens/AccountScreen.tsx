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
import { isFirebaseConfigured } from "../services/firebase";

interface AccountScreenProps {
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onOpenOrders,
  onOpenWishlist,
  onOpenAdmin
}) => {
  const {
    user,
    isAdmin,
    savedAddress,
    userOrders,
    wishlistIds,
    signIn,
    signUp,
    signOut
  } = useStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setAuthMessage(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (!res.ok) setAuthMessage(res.error || "Sign in failed.");
      } else {
        const res = await signUp(fullName, email, phone, password);
        if (!res.ok) setAuthMessage(res.error || "Sign up failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>COLLECTOR ACCOUNT</Text>
        <Text style={styles.title}>
          {user ? `Welcome, ${user.display_name}` : "Sign In or Create Account"}
        </Text>
      </View>

      {user ? (
        <>
          {/* Signed-in Profile Card */}
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {user.display_name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.display_name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    ROLE: {user.role.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.quickLinksRow}>
              <TouchableOpacity
                onPress={onOpenOrders}
                style={styles.quickLinkBtn}
              >
                <Text style={styles.quickLinkCount}>{userOrders.length}</Text>
                <Text style={styles.quickLinkLabel}>Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onOpenWishlist}
                style={styles.quickLinkBtn}
              >
                <Text style={styles.quickLinkCount}>{wishlistIds.length}</Text>
                <Text style={styles.quickLinkLabel}>Wishlist</Text>
              </TouchableOpacity>
            </View>

            {/* Role-Protected Admin Portal Entry */}
            {isAdmin && (
              <TouchableOpacity
                onPress={onOpenAdmin}
                style={styles.adminPortalBtn}
              >
                <View>
                  <Text style={styles.adminPortalEyebrow}>
                    ROLE-BASED ACCESS VERIFIED
                  </Text>
                  <Text style={styles.adminPortalTitle}>
                    Open Protected Store Admin Portal →
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Saved Indian Address Card */}
          {savedAddress && (
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>DEFAULT INDIAN ADDRESS</Text>
              <Text style={styles.addrName}>{savedAddress.full_name}</Text>
              <Text style={styles.addrText}>
                {savedAddress.address_line1}
                {savedAddress.address_line2
                  ? `, ${savedAddress.address_line2}`
                  : ""}
              </Text>
              <Text style={styles.addrText}>
                {savedAddress.city}, {savedAddress.state} –{" "}
                {savedAddress.pincode}
              </Text>
              <Text style={styles.addrText}>+91 {savedAddress.phone}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.card}>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => {
                setMode("signin");
                setAuthMessage(null);
              }}
              style={[styles.tabBtn, mode === "signin" && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  mode === "signin" && styles.tabBtnTextActive
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMode("signup");
                setAuthMessage(null);
              }}
              style={[styles.tabBtn, mode === "signup" && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  mode === "signup" && styles.tabBtnTextActive
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "signup" && (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Aarav Sharma"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Mobile Number (+91)</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit Indian mobile"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </>
          )}

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="collector@example.com"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Minimum 6 characters"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
          />

          {authMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{authMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting
                ? "Please wait..."
                : mode === "signin"
                ? "Sign In to Account"
                : "Create Collector Account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.adminHintBox}>
            <Text style={styles.adminHintTitle}>
              Store Admin & Guest Checkout Info
            </Text>
            <Text style={styles.adminHintText}>
              • Guest Checkout is always available directly from your Shopping
              Bag without signing in.
            </Text>
            <Text style={styles.adminHintText}>
              • {isFirebaseConfigured
                ? "Firebase Auth is active. Admin access is granted to accounts with custom claim `admin: true` or `users/{uid}.role == 'admin'`."
                : "Local test mode active (before Firebase keys are added): Sign in with `admin@stepupstories.in` and any 6+ character password to test the role-protected Admin Portal."}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl
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
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.goldSubtleBg,
    borderWidth: 1.5,
    borderColor: COLORS.goldChampagne,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarLetter: {
    color: COLORS.goldBright,
    fontSize: 22,
    fontWeight: "800"
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700"
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2
  },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: COLORS.bgCharcoal,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm
  },
  rolePillText: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  quickLinksRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: COLORS.bgCharcoal,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    alignItems: "center"
  },
  quickLinkCount: {
    color: COLORS.goldBright,
    fontSize: 20,
    fontWeight: "800"
  },
  quickLinkLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  adminPortalBtn: {
    backgroundColor: COLORS.goldSubtleBg,
    borderWidth: 1.5,
    borderColor: COLORS.goldChampagne,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  adminPortalEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1.2
  },
  adminPortalTitle: {
    color: COLORS.goldBright,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2
  },
  signOutBtn: {
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center"
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  cardEyebrow: {
    color: COLORS.goldChampagne,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 6
  },
  addrName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4
  },
  addrText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCharcoal,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    alignItems: "center"
  },
  tabBtnActive: {
    backgroundColor: COLORS.goldChampagne
  },
  tabBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  tabBtnTextActive: {
    color: COLORS.bgObsidian,
    fontWeight: "800"
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
  errorBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12
  },
  submitBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.goldChampagne,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: "center"
  },
  submitBtnText: {
    color: COLORS.bgObsidian,
    fontSize: 13.5,
    fontWeight: "800"
  },
  adminHintBox: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgCharcoal,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6
  },
  adminHintTitle: {
    color: COLORS.goldChampagne,
    fontSize: 11.5,
    fontWeight: "700"
  },
  adminHintText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    lineHeight: 17
  }
});
