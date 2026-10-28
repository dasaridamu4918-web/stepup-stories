import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../services/firebase";
import {
  SEED_COLLECTIONS,
  SEED_PRODUCTS,
  WEBSITE_BASE_URL,
  resolvePublicProductName
} from "../data/seedCatalog";
import { calculateSavings } from "../constants/indianStates";
import {
  CartItem,
  IndianDeliveryAddress,
  MobileCollection,
  MobileProduct,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  UserProfile
} from "../types/store";

const STORAGE_KEYS = {
  PRODUCTS: "@stepup_products_v1",
  CART: "@stepup_cart_v1",
  WISHLIST: "@stepup_wishlist_v1",
  ORDERS: "@stepup_orders_v1",
  USER: "@stepup_user_v1",
  SAVED_ADDRESS: "@stepup_saved_address_v1"
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  packed: "Packed & Quality Checked",
  shipped: "Shipped via Insured Courier",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Order Cancelled"
};

interface StoreContextValue {
  collections: MobileCollection[];
  products: MobileProduct[];
  isLoadingCatalog: boolean;
  refreshCatalog: () => Promise<void>;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotals: {
    totalMrp: number;
    totalSavings: number;
    deliveryFee: number;
    totalPayable: number;
  };
  addToCart: (product: MobileProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Wishlist
  wishlistIds: string[];
  wishlistProducts: MobileProduct[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Auth & Role-Based Access
  user: UserProfile | null;
  isAdmin: boolean;
  savedAddress: IndianDeliveryAddress | null;
  saveDeliveryAddress: (addr: IndianDeliveryAddress) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Orders
  orders: OrderRecord[];
  userOrders: OrderRecord[];
  placeOrder: (params: {
    shippingAddress: IndianDeliveryAddress;
    paymentMethod: PaymentMethod;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    testMode?: boolean;
  }) => Promise<OrderRecord>;
  findGuestOrder: (queryText: string) => OrderRecord[];

  // Protected Admin Operations (requires isAdmin === true)
  adminUpsertProduct: (
    productInput: Omit<
      MobileProduct,
      "savings_amount" | "discount_percent" | "price_currency" | "name"
    > & { branded_title?: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  adminUpdateStock: (
    productId: string,
    newStock: number
  ) => Promise<{ ok: boolean; error?: string }>;
  adminUpdateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    trackingCode?: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [collections, setCollections] =
    useState<MobileCollection[]>(SEED_COLLECTIONS);
  const [products, setProducts] = useState<MobileProduct[]>(SEED_PRODUCTS);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [savedAddress, setSavedAddress] =
    useState<IndianDeliveryAddress | null>(null);

  // Load persisted state from AsyncStorage on startup
  useEffect(() => {
    (async () => {
      try {
        const [
          storedProducts,
          storedCart,
          storedWishlist,
          storedOrders,
          storedUser,
          storedAddress
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.WISHLIST),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_ADDRESS)
        ]);

        if (storedProducts) {
          const parsed = JSON.parse(storedProducts) as MobileProduct[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        }
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
        if (storedWishlist) {
          setWishlistIds(JSON.parse(storedWishlist));
        }
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        }
        if (storedUser && !isFirebaseConfigured) {
          const parsedUser = JSON.parse(storedUser) as UserProfile;
          // Never restore an unverified local admin role without a server-issued admin token
          if (parsedUser.role === "admin" && !parsedUser.admin_token) {
            parsedUser.role = "customer";
          }
          setUser(parsedUser);
        }
        if (storedAddress) {
          setSavedAddress(JSON.parse(storedAddress));
        }
      } catch (e) {
        console.warn("Failed to hydrate mobile store state:", e);
      }
    })();
  }, []);

  // Listen to Firebase Auth state when Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }
      try {
        const tokenResult = await fbUser.getIdTokenResult();
        let role: "customer" | "admin" =
          tokenResult.claims.admin === true ? "admin" : "customer";

        if (db) {
          // Only trust the server-protected `admins/{uid}` registry, never client-writable `users/{uid}`
          const adminDoc = await getDoc(doc(db, "admins", fbUser.uid));
          if (adminDoc.exists()) {
            role = "admin";
          }
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.saved_address) {
              setSavedAddress(data.saved_address as IndianDeliveryAddress);
            }
          }
        }

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          display_name:
            fbUser.displayName || fbUser.email?.split("@")[0] || "Valued Collector",
          role
        };
        setUser(profile);
      } catch {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || "",
          display_name: fbUser.displayName || "Collector",
          role: "customer"
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync catalog from Firestore or STEPUP STORIES Website Backend API
  const refreshCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      if (isFirebaseConfigured && db) {
        const prodSnap = await getDocs(
          query(collection(db, "products"), orderBy("sort_order", "asc"))
        );
        if (!prodSnap.empty) {
          const fbProducts = prodSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as MobileProduct)
          );
          setProducts(fbProducts);
          await AsyncStorage.setItem(
            STORAGE_KEYS.PRODUCTS,
            JSON.stringify(fbProducts)
          );
          setIsLoadingCatalog(false);
          return;
        }
      }

      const res = await fetch(`${WEBSITE_BASE_URL}/api/mobile/catalog`);
      if (res.ok) {
        const data = (await res.json()) as {
          collections?: MobileCollection[];
          products?: MobileProduct[];
        };
        if (Array.isArray(data.collections) && data.collections.length > 0) {
          setCollections(data.collections);
        }
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          await AsyncStorage.setItem(
            STORAGE_KEYS.PRODUCTS,
            JSON.stringify(data.products)
          );
        }
      }
    } catch {
      // Keep local/seed catalog when offline
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // Cart Operations
  const persistCart = useCallback(async (nextCart: CartItem[]) => {
    setCart(nextCart);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(nextCart));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addToCart = useCallback(
    (product: MobileProduct, quantity = 1) => {
      const maxStock = Math.max(1, product.stock_quantity);
      const existingIndex = cart.findIndex((i) => i.product.id === product.id);
      let next: CartItem[];
      if (existingIndex >= 0) {
        next = cart.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                product,
                quantity: Math.min(maxStock, item.quantity + quantity)
              }
            : item
        );
      } else {
        next = [
          ...cart,
          { product, quantity: Math.min(maxStock, Math.max(1, quantity)) }
        ];
      }
      persistCart(next);
    },
    [cart, persistCart]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        persistCart(cart.filter((i) => i.product.id !== productId));
        return;
      }
      const next = cart.map((item) => {
        if (item.product.id !== productId) return item;
        const maxStock = Math.max(1, item.product.stock_quantity);
        return { ...item, quantity: Math.min(maxStock, quantity) };
      });
      persistCart(next);
    },
    [cart, persistCart]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      persistCart(cart.filter((i) => i.product.id !== productId));
    },
    [cart, persistCart]
  );

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartTotals = useMemo(() => {
    let totalMrp = 0;
    let totalPayable = 0;
    for (const item of cart) {
      const sale = item.product.price_amount;
      const orig = Math.max(sale, item.product.original_price_amount);
      totalMrp += orig * item.quantity;
      totalPayable += sale * item.quantity;
    }
    const totalSavings = Math.max(0, totalMrp - totalPayable);
    return {
      totalMrp,
      totalSavings,
      deliveryFee: 0,
      totalPayable
    };
  }, [cart]);

  // Wishlist Operations
  const toggleWishlist = useCallback(
    async (productId: string) => {
      const exists = wishlistIds.includes(productId);
      const next = exists
        ? wishlistIds.filter((id) => id !== productId)
        : [productId, ...wishlistIds];
      setWishlistIds(next);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(next));
        if (isFirebaseConfigured && db && user) {
          await setDoc(
            doc(db, "wishlists", user.uid),
            { product_ids: next, updated_at: new Date().toISOString() },
            { merge: true }
          );
        }
      } catch {
        // ignore
      }
    },
    [wishlistIds, user]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  // Delivery Address Persistence
  const saveDeliveryAddress = useCallback(
    async (addr: IndianDeliveryAddress) => {
      setSavedAddress(addr);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SAVED_ADDRESS,
          JSON.stringify(addr)
        );
        if (isFirebaseConfigured && db && user) {
          await setDoc(
            doc(db, "users", user.uid),
            { saved_address: addr, updated_at: new Date().toISOString() },
            { merge: true }
          );
        }
      } catch {
        // ignore
      }
    },
    [user]
  );

  // Authentication & Role-Based Access
  const isAdmin = Boolean(user?.role === "admin");

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { ok: false, error: "Please enter both email and password." };
      }

      // 1. Server-verified Admin Authentication check (/api/admin/session)
      try {
        const adminRes = await fetch(`${WEBSITE_BASE_URL}/api/admin/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password })
        });
        if (adminRes.ok) {
          const adminData = (await adminRes.json()) as {
            ok?: boolean;
            token?: string;
          };
          if (adminData.ok && adminData.token) {
            const adminProfile: UserProfile = {
              uid: `admin_${Date.now()}`,
              email: normalizedEmail,
              display_name: "Store Administrator",
              role: "admin",
              admin_token: adminData.token
            };
            setUser(adminProfile);
            await AsyncStorage.setItem(
              STORAGE_KEYS.USER,
              JSON.stringify(adminProfile)
            );
            return { ok: true };
          }
        }
      } catch {
        // Continue to standard customer auth if server admin check is unreachable
      }

      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, password);
          return { ok: true };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Unable to sign in with Firebase Auth."
          };
        }
      }

      // Customer sign-in fallback: never grants 'admin' role locally.
      // Admin role is strictly granted by server /api/admin/session or Firebase admins/{uid}.
      const profile: UserProfile = {
        uid: `user_${Date.now()}`,
        email: normalizedEmail,
        display_name: normalizedEmail.split("@")[0] || "Collector",
        role: "customer",
        admin_token: null
      };
      setUser(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      return { ok: true };
    },
    []
  );

  const signUp = useCallback(
    async (
      fullName: string,
      email: string,
      phone: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!fullName.trim() || !normalizedEmail || password.length < 6) {
        return {
          ok: false,
          error: "Please provide your name, email, and a password of at least 6 characters."
        };
      }

      if (isFirebaseConfigured && auth) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );
          const profile: UserProfile = {
            uid: cred.user.uid,
            email: normalizedEmail,
            display_name: fullName.trim(),
            phone: phone.trim(),
            role: "customer"
          };
          if (db) {
            await setDoc(doc(db, "users", cred.user.uid), {
              ...profile,
              created_at: new Date().toISOString()
            });
          }
          setUser(profile);
          return { ok: true };
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error ? err.message : "Could not create account."
          };
        }
      }

      const profile: UserProfile = {
        uid: `user_${Date.now()}`,
        email: normalizedEmail,
        display_name: fullName.trim(),
        phone: phone.trim(),
        role: "customer"
      };
      setUser(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      return { ok: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // Order Placement (Guest & Signed-In)
  const placeOrder = useCallback(
    async (params: {
      shippingAddress: IndianDeliveryAddress;
      paymentMethod: PaymentMethod;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      testMode?: boolean;
    }): Promise<OrderRecord> => {
      const now = new Date().toISOString();
      const orderNumber = `SUS-${Date.now().toString().slice(-6)}`;
      const orderId = `ord_${Date.now()}`;

      const orderItems = cart.map((c) => {
        const sale = c.product.price_amount;
        const orig = Math.max(sale, c.product.original_price_amount);
        return {
          product_id: c.product.id,
          slug: c.product.slug,
          name: c.product.name,
          collection_name: c.product.collection_name,
          image_url: c.product.images[0]?.url || "",
          unit_price: sale,
          original_unit_price: orig,
          quantity: c.quantity,
          line_total: sale * c.quantity,
          line_savings: Math.max(0, (orig - sale) * c.quantity)
        };
      });

      const initialStatus: OrderStatus = "placed";
      const hasProviderConfirmedPayment = Boolean(
        params.paymentMethod === "razorpay" &&
          params.razorpayOrderId &&
          params.razorpayPaymentId
      );
      const paymentStatus =
        params.paymentMethod === "cod"
          ? "pending_cod"
          : hasProviderConfirmedPayment
            ? params.testMode
              ? "paid_test_mode"
              : "paid"
            : "pending_online";

      const newOrder: OrderRecord = {
        id: orderId,
        order_number: orderNumber,
        user_id: user?.uid ?? null,
        is_guest: !user,
        items: orderItems,
        shipping_address: params.shippingAddress,
        total_mrp: cartTotals.totalMrp,
        total_savings: cartTotals.totalSavings,
        delivery_fee: cartTotals.deliveryFee,
        total_payable: cartTotals.totalPayable,
        currency: "INR",
        payment_method: params.paymentMethod,
        payment_status: paymentStatus,
        razorpay_order_id: params.razorpayOrderId ?? null,
        razorpay_payment_id: params.razorpayPaymentId ?? null,
        test_mode: params.testMode ?? true,
        status: initialStatus,
        tracking_code: null,
        status_history: [
          {
            status: "placed",
            label: "Order Placed",
            timestamp: now
          }
        ],
        created_at: now,
        updated_at: now
      };

      // Sync order to STEPUP STORIES Backend API so Admin Dashboard receives it immediately
      try {
        await fetch(`${WEBSITE_BASE_URL}/api/mobile/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: params.shippingAddress.full_name,
            customer_email:
              params.shippingAddress.email || "guest@stepupstories.in",
            customer_phone: params.shippingAddress.phone,
            delivery_address: {
              address_line1: params.shippingAddress.address_line1,
              address_line2: params.shippingAddress.address_line2 || "",
              landmark: params.shippingAddress.landmark || "",
              city: params.shippingAddress.city,
              state: params.shippingAddress.state,
              pincode: params.shippingAddress.pincode
            },
            items: orderItems.map((it) => ({
              product_id: it.product_id,
              slug: it.slug,
              name: it.name,
              collection_name: it.collection_name,
              image_url: it.image_url,
              unit_price: it.unit_price,
              original_unit_price: it.original_unit_price,
              quantity: it.quantity
            })),
            payment_method: params.paymentMethod,
            payment_reference: params.razorpayOrderId || "",
            source: "mobile_app"
          })
        });
      } catch {
        // Offline tolerance
      }

      // Decrement stock for ordered watches
      const updatedProducts = products.map((p) => {
        const ordered = cart.find((c) => c.product.id === p.id);
        if (!ordered) return p;
        const nextStock = Math.max(0, p.stock_quantity - ordered.quantity);
        return {
          ...p,
          stock_quantity: nextStock,
          availability_status:
            nextStock > 0 ? ("available" as const) : ("out_of_stock" as const)
        };
      });
      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(updatedProducts)
      );

      const nextOrders = [newOrder, ...orders];
      setOrders(nextOrders);
      await AsyncStorage.setItem(
        STORAGE_KEYS.ORDERS,
        JSON.stringify(nextOrders)
      );
      await saveDeliveryAddress(params.shippingAddress);

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, "orders", orderId), newOrder);
        } catch (e) {
          console.warn("Firestore order write warning:", e);
        }
      }

      clearCart();
      return newOrder;
    },
    [cart, cartTotals, clearCart, orders, products, saveDeliveryAddress, user]
  );

  const userOrders = useMemo(() => {
    if (!user) return orders.filter((o) => o.is_guest);
    return orders.filter(
      (o) =>
        o.user_id === user.uid ||
        o.shipping_address.email.toLowerCase() === user.email.toLowerCase()
    );
  }, [orders, user]);

  const findGuestOrder = useCallback(
    (queryText: string): OrderRecord[] => {
      const q = queryText.trim().toLowerCase();
      if (!q) return [];
      return orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.id.toLowerCase() === q ||
          o.shipping_address.phone.includes(q.replace(/\D/g, ""))
      );
    },
    [orders]
  );

  // Protected Admin Operations (RBAC checked)
  const adminUpsertProduct = useCallback(
    async (
      productInput: Omit<
        MobileProduct,
        "savings_amount" | "discount_percent" | "price_currency" | "name"
      > & { branded_title?: string }
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isAdmin) {
        return {
          ok: false,
          error: "Access denied. Store Administrator role is required."
        };
      }

      const { savingsAmount, discountPercent } = calculateSavings(
        productInput.price_amount,
        productInput.original_price_amount
      );

      const publicName = resolvePublicProductName({
        name: productInput.branded_title || productInput.generic_name,
        generic_name: productInput.generic_name,
        brand_candidate: productInput.brand_candidate,
        brand_verified: productInput.brand_verified
      });

      const fullProduct: MobileProduct = {
        ...productInput,
        name: publicName,
        savings_amount: savingsAmount,
        discount_percent: discountPercent,
        price_currency: "INR"
      };

      const exists = products.some((p) => p.id === fullProduct.id);
      const nextProducts = exists
        ? products.map((p) => (p.id === fullProduct.id ? fullProduct : p))
        : [fullProduct, ...products];

      setProducts(nextProducts);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(nextProducts)
      );

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, "products", fullProduct.id), fullProduct, {
            merge: true
          });
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to sync product to Firestore."
          };
        }
      }

      return { ok: true };
    },
    [isAdmin, products]
  );

  const adminUpdateStock = useCallback(
    async (
      productId: string,
      newStock: number
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isAdmin) {
        return {
          ok: false,
          error: "Access denied. Store Administrator role is required."
        };
      }
      const safeStock = Math.max(0, Math.floor(newStock));
      const nextProducts = products.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock_quantity: safeStock,
              availability_status:
                safeStock > 0 ? ("available" as const) : ("out_of_stock" as const)
            }
          : p
      );
      setProducts(nextProducts);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(nextProducts)
      );

      if (isFirebaseConfigured && db) {
        try {
          await updateDoc(doc(db, "products", productId), {
            stock_quantity: safeStock,
            availability_status: safeStock > 0 ? "available" : "out_of_stock"
          });
        } catch {
          // ignore offline
        }
      }
      return { ok: true };
    },
    [isAdmin, products]
  );

  const adminUpdateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: OrderStatus,
      trackingCode?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!isAdmin) {
        return {
          ok: false,
          error: "Access denied. Store Administrator role is required."
        };
      }

      const now = new Date().toISOString();
      const nextOrders = orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          tracking_code: trackingCode ?? o.tracking_code ?? null,
          status_history: [
            ...o.status_history,
            {
              status: newStatus,
              label: ORDER_STATUS_LABELS[newStatus],
              timestamp: now
            }
          ],
          updated_at: now
        };
      });

      setOrders(nextOrders);
      await AsyncStorage.setItem(
        STORAGE_KEYS.ORDERS,
        JSON.stringify(nextOrders)
      );

      if (isFirebaseConfigured && db) {
        try {
          const target = nextOrders.find((o) => o.id === orderId);
          if (target) {
            await updateDoc(doc(db, "orders", orderId), {
              status: newStatus,
              tracking_code: target.tracking_code,
              status_history: target.status_history,
              updated_at: now
            });
          }
        } catch {
          // ignore offline
        }
      }

      return { ok: true };
    },
    [isAdmin, orders]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      collections,
      products,
      isLoadingCatalog,
      refreshCatalog,
      cart,
      cartCount,
      cartTotals,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      wishlistIds,
      wishlistProducts,
      toggleWishlist,
      isInWishlist,
      user,
      isAdmin,
      savedAddress,
      saveDeliveryAddress,
      signIn,
      signUp,
      signOut,
      orders,
      userOrders,
      placeOrder,
      findGuestOrder,
      adminUpsertProduct,
      adminUpdateStock,
      adminUpdateOrderStatus
    }),
    [
      collections,
      products,
      isLoadingCatalog,
      refreshCatalog,
      cart,
      cartCount,
      cartTotals,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      wishlistIds,
      wishlistProducts,
      toggleWishlist,
      isInWishlist,
      user,
      isAdmin,
      savedAddress,
      saveDeliveryAddress,
      signIn,
      signUp,
      signOut,
      orders,
      userOrders,
      placeOrder,
      findGuestOrder,
      adminUpsertProduct,
      adminUpdateStock,
      adminUpdateOrderStatus
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}
