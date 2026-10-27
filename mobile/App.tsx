import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StatusBar,
  Platform
} from "react-native";
import { COLORS, RADIUS, SPACING } from "./src/theme/tokens";
import { StoreProvider, useStore } from "./src/context/StoreContext";
import { BrandHeader } from "./src/components/BrandHeader";
import { HomeScreen } from "./src/screens/HomeScreen";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { ProductDetailScreen } from "./src/screens/ProductDetailScreen";
import { WishlistScreen } from "./src/screens/WishlistScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { MobileProduct, OrderRecord } from "./src/types/store";

type TabRoute = "home" | "catalog" | "wishlist" | "cart" | "orders" | "account";
type OverlayRoute = "none" | "product_detail" | "checkout" | "admin";

const MainShell: React.FC = () => {
  const { wishlistIds, cartCount } = useStore();

  const [activeTab, setActiveTab] = useState<TabRoute>("home");
  const [overlay, setOverlay] = useState<OverlayRoute>("none");
  const [selectedProduct, setSelectedProduct] =
    useState<MobileProduct | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0.25,
      duration: 90,
      useNativeDriver: true
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true
      }).start();
    });
  };

  const openProduct = (product: MobileProduct) => {
    animateTransition(() => {
      setSelectedProduct(product);
      setOverlay("product_detail");
    });
  };

  const openCollection = (collectionId: string) => {
    animateTransition(() => {
      setSelectedCollectionId(collectionId);
      setOverlay("none");
      setActiveTab("catalog");
    });
  };

  const switchTab = (tab: TabRoute) => {
    animateTransition(() => {
      setOverlay("none");
      if (tab !== "orders") {
        setLatestOrder(null);
      }
      setActiveTab(tab);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgObsidian} />

      {/* Top Brand Bar (shown on main tab screens) */}
      {overlay === "none" && (
        <BrandHeader
          wishlistCount={wishlistIds.length}
          cartCount={cartCount}
          onPressSearch={() => switchTab("catalog")}
          onPressWishlist={() => switchTab("wishlist")}
          onPressCart={() => switchTab("cart")}
        />
      )}

      {/* Animated Main Viewport */}
      <Animated.View style={[styles.viewport, { opacity: fadeAnim }]}>
        {overlay === "product_detail" && selectedProduct ? (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => animateTransition(() => setOverlay("none"))}
            onGoToCart={() => switchTab("cart")}
            onBuyNow={() =>
              animateTransition(() => {
                setOverlay("checkout");
              })
            }
          />
        ) : overlay === "checkout" ? (
          <CheckoutScreen
            onBackToCart={() => switchTab("cart")}
            onSignInPrompt={() => switchTab("account")}
            onOrderSuccess={(order) =>
              animateTransition(() => {
                setLatestOrder(order);
                setOverlay("none");
                setActiveTab("orders");
              })
            }
          />
        ) : overlay === "admin" ? (
          <AdminScreen
            onBack={() => animateTransition(() => setOverlay("none"))}
          />
        ) : activeTab === "home" ? (
          <HomeScreen
            onSelectProduct={openProduct}
            onSelectCollection={openCollection}
            onNavigateCatalog={() => {
              setSelectedCollectionId(null);
              switchTab("catalog");
            }}
          />
        ) : activeTab === "catalog" ? (
          <CatalogScreen
            initialCollectionId={selectedCollectionId}
            onSelectProduct={openProduct}
          />
        ) : activeTab === "wishlist" ? (
          <WishlistScreen
            onSelectProduct={openProduct}
            onExploreCatalog={() => switchTab("catalog")}
          />
        ) : activeTab === "cart" ? (
          <CartScreen
            onSelectProduct={openProduct}
            onExploreCatalog={() => switchTab("catalog")}
            onProceedToCheckout={() =>
              animateTransition(() => setOverlay("checkout"))
            }
          />
        ) : activeTab === "orders" ? (
          <OrdersScreen
            highlightedOrder={latestOrder}
            onExploreCatalog={() => switchTab("catalog")}
          />
        ) : (
          <AccountScreen
            onOpenOrders={() => switchTab("orders")}
            onOpenWishlist={() => switchTab("wishlist")}
            onOpenAdmin={() =>
              animateTransition(() => setOverlay("admin"))
            }
          />
        )}
      </Animated.View>

      {/* Bottom Native Tab Bar */}
      {overlay === "none" && (
        <View style={styles.tabBar}>
          {(
            [
              { key: "home", icon: "⌂", label: "Home" },
              { key: "catalog", icon: "⌚", label: "Watches" },
              { key: "wishlist", icon: "♡", label: "Wishlist" },
              { key: "cart", icon: "🛍", label: "Bag" },
              { key: "orders", icon: "📦", label: "Orders" },
              { key: "account", icon: "👤", label: "Account" }
            ] as { key: TabRoute; icon: string; label: string }[]
          ).map((item) => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => switchTab(item.key)}
                style={styles.tabItem}
              >
                <View style={styles.tabIconWrap}>
                  <Text
                    style={[styles.tabIcon, active && styles.tabIconActive]}
                  >
                    {item.icon}
                  </Text>
                  {item.key === "cart" && cartCount > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{cartCount}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainShell />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgObsidian,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0
  },
  viewport: {
    flex: 1
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  tabIconWrap: {
    position: "relative"
  },
  tabIcon: {
    color: COLORS.textMuted,
    fontSize: 17
  },
  tabIconActive: {
    color: COLORS.goldChampagne
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2
  },
  tabLabelActive: {
    color: COLORS.goldBright,
    fontWeight: "800"
  },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.goldChampagne,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  tabBadgeText: {
    color: COLORS.bgObsidian,
    fontSize: 9,
    fontWeight: "800"
  }
});
