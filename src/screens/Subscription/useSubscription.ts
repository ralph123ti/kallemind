import { useEffect, useState, useCallback, useRef } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  useIAP,
  ErrorCode,
  getAvailablePurchases as getAvailablePurchasesRoot,
} from 'expo-iap';

// -----------------------------------------------------------------------
// This hook auto-detects whether it's running inside Expo Go (which
// cannot load native modules like expo-iap) or inside a real
// custom dev client / production build (which can).
//
//   - In Expo Go        -> uses a mock purchase flow (fake buy button,
//                          no real store connection). Lets you test the
//                          rest of the app/UI without crashing.
//   - In dev/prod build -> uses the real expo-iap library.
//
// You never need to rename or swap files again — just run the app in
// whichever environment and it picks the right implementation.
// -----------------------------------------------------------------------

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface UseSubscriptionOptions {
  skus: string[];
  onPurchaseUpdate: (purchase: any) => void | Promise<void>;
  onPurchaseError: (error: any) => void;
}

interface UseSubscriptionReturn {
  purchasing: boolean;
  initError: string | null;
  subscriptions: any[];
  buy: (sku: string) => Promise<void>;
  completePurchase: (purchase: any) => Promise<void>;
  restore: () => Promise<any[]>;
}

export function useSubscription(options: UseSubscriptionOptions): UseSubscriptionReturn {
  if (isExpoGo) {
    return useMockSubscription(options);
  }
  return useRealSubscription(options);
}

// -----------------------------------------------------------------------
// MOCK — used only inside Expo Go
// -----------------------------------------------------------------------
function useMockSubscription({
  onPurchaseUpdate,
}: UseSubscriptionOptions): UseSubscriptionReturn {
  const [purchasing, setPurchasing] = useState(false);

  const buy = useCallback(async (sku: string) => {
    setPurchasing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setPurchasing(false);

    await onPurchaseUpdate({
      productId: sku,
      transactionId: 'mock-txn-' + Date.now(),
      transactionReceipt: 'mock-receipt',
      purchaseToken: 'mock-token',
    });
  }, [onPurchaseUpdate]);

  const completePurchase = useCallback(async (_purchase: any) => {
    return;
  }, []);

  const restore = useCallback(async (): Promise<any[]> => {
    return [];
  }, []);

  return {
    purchasing,
    initError: null,
    subscriptions: [],
    buy,
    completePurchase,
    restore,
  };
}

// -----------------------------------------------------------------------
// REAL — used inside custom dev client / production builds.
// expo-iap's useIAP hook manages the store connection and purchase
// listeners internally, so there's no manual initConnection/endConnection
// or listener cleanup needed anymore (expo-iap handles that lifecycle).
// -----------------------------------------------------------------------
function useRealSubscription({
  skus,
  onPurchaseUpdate,
  onPurchaseError,
}: UseSubscriptionOptions): UseSubscriptionReturn {
  const [purchasing, setPurchasing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Keep the latest skus in a ref so the fetchProducts effect below
  // doesn't need `skus` in its dependency array (avoids re-fetching
  // on every render if the caller passes a fresh array literal).
  const skusRef = useRef(skus);
  skusRef.current = skus;

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase: any) => {
      setPurchasing(false);
      await onPurchaseUpdate(purchase);
    },
    onPurchaseError: (error: any) => {
      setPurchasing(false);
      if (error?.code !== ErrorCode.UserCancelled) {
        onPurchaseError(error);
      }
    },
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: skusRef.current, type: 'subs' }).catch((err: any) => {
      setInitError(err?.message ?? 'Failed to connect to the store.');
    });
  }, [connected, fetchProducts]);

  const buy = useCallback(async (sku: string) => {
    setPurchasing(true);
    try {
      const subscription = subscriptions.find((s: any) => s.id === sku);
      await requestPurchase({
        request: {
          apple: {
            sku,
            andDangerouslyFinishTransactionAutomatically: false,
          },
          google: {
            skus: [sku],
            // Android requires subscriptionOffers for subscription purchases.
            subscriptionOffers:
              subscription?.subscriptionOfferDetailsAndroid?.map((offer: any) => ({
                sku,
                offerToken: offer.offerToken,
              })) || [],
          },
        },
        type: 'subs',
      });
      // Success/failure is reported via onPurchaseSuccess/onPurchaseError above,
      // which is where `purchasing` actually gets set back to false.
    } catch (err) {
      setPurchasing(false);
      throw err;
    }
  }, [requestPurchase, subscriptions]);

  const completePurchase = useCallback(async (purchase: any) => {
    await finishTransaction({ purchase, isConsumable: false });
  }, [finishTransaction]);

  // Uses the "root API" (direct import) version of getAvailablePurchases,
  // which returns the purchases array directly — unlike the hook version,
  // which returns void and requires reading from `availablePurchases` state.
  // This keeps restore()'s signature (Promise<Purchase[]>) matching what
  // SubscriptionScreen.tsx already expects.
  const restore = useCallback(async (): Promise<any[]> => {
    const purchases = await getAvailablePurchasesRoot();
    return purchases;
  }, []);

  return { purchasing, initError, subscriptions, buy, completePurchase, restore };
}