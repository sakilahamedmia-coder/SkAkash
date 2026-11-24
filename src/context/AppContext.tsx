import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  Product,
  Order,
  DepositRequest,
  WithdrawalRequest,
  Transaction,
  RewardTask,
  ClaimHistoryItem,
  Banner,
  VideoBanner,
  SystemSettings,
  AdminStats,
  PublicActivityItem,
  NotificationLog,
  PaymentMethodBadge,
  DepositNetworkConfig,
  VerifiedAgent,
  ReferralTrackingStats
} from '../types';
import { apiFetch, isCapacitorNative, hasRemoteApiBase, getRemoteApiBaseUrl } from '../utils/apiTransport';
import {
  extractReferralCodeFromLocation,
  normalizeReferralCodeInput,
  setCachedPublicAppUrl
} from '../utils/publicUrl';

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: res.ok ? 'Unexpected server response' : `Request failed (${res.status})` };
  }
}

function persistUserSession(userId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.setItem('ceg_current_user_id', userId);
      localStorage.removeItem('ceg_logged_out');
    } else {
      localStorage.removeItem('ceg_current_user_id');
      localStorage.setItem('ceg_logged_out', '1');
    }
  } catch {
    // ignore storage errors
  }
}

export interface NotificationProvidersStatus {
  pushWebhookConfigured: boolean;
  webhookSecretConfigured?: boolean;
  fcmConfigured: boolean;
  webPushReady: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  viewMode: 'mobile' | 'admin' | 'split';
  setViewMode: (mode: 'mobile' | 'admin' | 'split') => void;
  activeMobileTab: 'home' | 'products' | 'referrals' | 'wallet' | 'profile';
  setActiveMobileTab: (tab: 'home' | 'products' | 'referrals' | 'wallet' | 'profile') => void;
  isProfileAdminOpen: boolean;
  setIsProfileAdminOpen: (val: boolean) => void;
  openProfileAdminPanel: () => void;
  deviceFrame: boolean;
  setDeviceFrame: (val: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Data
  settings: SystemSettings | null;
  banners: Banner[];
  videoBanners: VideoBanner[];
  products: Product[];
  userOrders: Order[];
  userDeposits: DepositRequest[];
  userWithdrawals: WithdrawalRequest[];
  userTransactions: Transaction[];
  userTasks: RewardTask[];
  userClaims: ClaimHistoryItem[];
  userNotifications: NotificationLog[];
  notificationProviders: NotificationProvidersStatus | null;
  publicFeed: PublicActivityItem[];
  referralData: {
    referralCode: string;
    referralCount: number;
    totalRecords?: number;
    hasMore?: boolean;
    referralEarnings: number;
    commissionPercent: number;
    firstTaskBonusPercent?: number;
    tracking?: ReferralTrackingStats;
    history: any[];
  } | null;
  pendingReferralCode: string | null;
  setPendingReferralCode: (code: string | null) => void;
  referralLandingCode: string | null;
  openReferralLanding: (code?: string) => void;
  closeReferralLanding: (openAuth?: boolean) => void;
  trackReferralEvent: (
    referralCode: string,
    eventType: 'click' | 'apk_download',
    source?: string
  ) => Promise<ReferralTrackingStats | null>;
  applyReferralCode: (code: string) => Promise<{ success: boolean; error?: string; referrerName?: string }>;
  loadMoreReferrals: () => Promise<boolean>;

  // Admin Data
  adminStats: AdminStats | null;
  allUsers: User[];
  demoUsers: User[];
  verifiedAgents: VerifiedAgent[];
  allDeposits: DepositRequest[];
  allWithdrawals: WithdrawalRequest[];
  allOrders: Order[];
  auditLogs: any[];
  adminNotificationLogs: NotificationLog[];

  // Actions
  refreshAllData: () => Promise<void>;
  fetchVerifiedAgents: () => Promise<void>;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  googleSignIn: (userData: { email: string; name: string; avatar?: string; referralCode?: string }) => Promise<boolean>;
  registerUser: (data: { name: string; email: string; password?: string; referralCode?: string }) => Promise<boolean>;
  logoutUser: () => void;
  adminLogin: (password: string, email?: string) => Promise<boolean>;
  adminLogout: () => void;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoUser: (userId: string) => Promise<void>;

  // Operations
  buyProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  submitDeposit: (amount: number, txHash: string, network?: string) => Promise<{ success: boolean; error?: string }>;
  submitWithdrawal: (amount: number, toAddress: string) => Promise<{ success: boolean; error?: string }>;
  claimReward: (taskId: string) => Promise<{ success: boolean; error?: string; reward?: number }>;
  claimProductDailyReward: (orderId: string) => Promise<{ success: boolean; error?: string; reward?: number }>;
  updateProfile: (data: {
    name?: string;
    avatar?: string;
    country?: string;
    paymentBadges?: PaymentMethodBadge[];
    whatsappNumber?: string;
    telegramLink?: string;
  }) => Promise<boolean>;
  updateNotificationSettings: (data: {
    fcmToken?: string;
    pushSubscription?: Record<string, any> | null;
    notificationPrefs?: { pushEnabled: boolean };
  }) => Promise<boolean>;
  sendTestNotification: (txType?: 'deposit' | 'withdrawal') => Promise<boolean>;
  pushPermission: NotificationPermission | 'unsupported';
  isWebPushSubscribed: boolean;
  activePushBanner: NotificationLog | null;
  enableBrowserPush: () => Promise<boolean>;
  dismissPushBanner: () => void;
  markNotificationsRead: () => void;

  // Admin Operations
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned', reason?: string) => Promise<void>;
  toggleUserVerified: (userId: string, isVerified: boolean) => Promise<void>;
  updateVerifiedUserId: (currentUserId: string, newUserId: string) => Promise<boolean>;
  approveDeposit: (id: string, notes?: string) => Promise<void>;
  rejectDeposit: (id: string, reason: string) => Promise<void>;
  approveWithdrawal: (id: string, txHash?: string, notes?: string) => Promise<void>;
  rejectWithdrawal: (id: string, reason: string) => Promise<void>;
  saveProduct: (product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<boolean>;
  addDepositMarket: (market: Partial<DepositNetworkConfig>) => Promise<boolean>;
  updateDepositMarket: (marketId: string, patch: Partial<DepositNetworkConfig>) => Promise<boolean>;
  deleteDepositMarket: (marketId: string) => Promise<boolean>;
  updateBanners: (banners: Banner[]) => Promise<void>;
  updateVideoBanners: (videos: VideoBanner[]) => Promise<void>;

  // Status
  realtimeConnected: boolean;
  toasts: Toast[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isProfileAdminOpen, setIsProfileAdminOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'admin' | 'split'>('mobile');
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'products' | 'referrals' | 'wallet' | 'profile'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return 'profile';
    }
    return 'home';
  });
  const [deviceFrame, setDeviceFrame] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [referralLandingCode, setReferralLandingCode] = useState<string | null>(() => {
    if (
      typeof window !== 'undefined' &&
      !isCapacitorNative() &&
      !window.location.pathname.startsWith('/admin')
    ) {
      return extractReferralCodeFromLocation();
    }
    return null;
  });
  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlRef = extractReferralCodeFromLocation();
      if (urlRef) {
        return urlRef;
      }
      return localStorage.getItem('ceg_pending_ref');
    }
    return null;
  });

  // App Data states
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [videoBanners, setVideoBanners] = useState<VideoBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userDeposits, setUserDeposits] = useState<DepositRequest[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userTasks, setUserTasks] = useState<RewardTask[]>([]);
  const [userClaims, setUserClaims] = useState<ClaimHistoryItem[]>([]);
  const [userNotifications, setUserNotifications] = useState<NotificationLog[]>([]);
  const [notificationProviders, setNotificationProviders] = useState<NotificationProvidersStatus | null>(null);
  const [publicFeed, setPublicFeed] = useState<PublicActivityItem[]>([]);
  const [referralData, setReferralData] = useState<AppContextType['referralData']>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [isWebPushSubscribed, setIsWebPushSubscribed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [activePushBanner, setActivePushBanner] = useState<NotificationLog | null>(null);

  // Admin Data states
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [verifiedAgents, setVerifiedAgents] = useState<VerifiedAgent[]>([]);
  const [allDeposits, setAllDeposits] = useState<DepositRequest[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminNotificationLogs, setAdminNotificationLogs] = useState<NotificationLog[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Public Settings & Content
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings/public');
      if (res.ok) {
        const data = await res.json();
        if (data.publicAppUrl) {
          setCachedPublicAppUrl(data.publicAppUrl);
        }
        setSettings(data.settings);
        setBanners(data.banners || []);
        setVideoBanners(data.videoBanners || []);
      }
    } catch (e) {
      console.error('Failed to load public settings:', e);
    }
  }, []);

  // Fetch Public Activity Feed (Real approved deposits & withdrawals)
  const fetchPublicFeed = useCallback(async () => {
    try {
      const res = await apiFetch('/api/activity/public-feed');
      if (res.ok) {
        const data = await res.json();
        setPublicFeed(data.feed || []);
      }
    } catch (e) {
      console.error('Failed to fetch public feed:', e);
    }
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
    }
  }, []);

  // Fetch Current User Specific Data (Fast, atomic, resilient)
  const fetchUserData = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const res = await apiFetch(`/api/user/${userId}/full-data`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
        if (data.orders) setUserOrders(data.orders);
        if (data.deposits) setUserDeposits(data.deposits);
        if (data.withdrawals) setUserWithdrawals(data.withdrawals);
        if (data.transactions) setUserTransactions(data.transactions);
        if (data.tasks) setUserTasks(data.tasks);
        if (data.claims) setUserClaims(data.claims);
        if (data.notifications) {
          let readSet = new Set<string>();
          if (typeof window !== 'undefined') {
            try {
              const saved = JSON.parse(localStorage.getItem('ceg_read_notif_ids') || '[]');
              if (Array.isArray(saved)) readSet = new Set(saved);
            } catch {
              // ignore storage parse error
            }
          }
          setUserNotifications(
            (data.notifications as NotificationLog[]).map((n) =>
              readSet.has(n.id) ? { ...n, isRead: true } : n
            )
          );
        }
        if (data.notificationProviders) setNotificationProviders(data.notificationProviders);
        if (data.referralData) setReferralData(data.referralData);
        return;
      }
    } catch (e) {
      // Graceful fallback to individual profile fetch
    }

    try {
      const userRes = await apiFetch(`/api/user/${userId}`);
      if (userRes.ok) {
        const u = await userRes.json();
        if (u.user) setCurrentUser(u.user);
      }
    } catch (e) {
      // Ignored for network resiliency during hot reload
    }
  }, []);

  const getAdminHeaders = useCallback(
    (tokenOverride?: string | null): Record<string, string> => {
      const token = tokenOverride ?? adminToken;
      return {
        'Content-Type': 'application/json',
        ...(token ? { 'x-admin-token': token } : {}),
        ...(currentUser?.id ? { 'x-user-id': currentUser.id } : {})
      };
    },
    [adminToken, currentUser?.id]
  );

  // Fetch Demo Users (for Mobile profile test account switch)
  const fetchDemoUsers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/demo-users');
      if (res.ok) {
        const data = await res.json();
        setDemoUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load demo users:', e);
    }
  }, []);

  // Fetch Admin-Verified Active Agents (for Wallet -> Agent tab)
  const fetchVerifiedAgents = useCallback(async () => {
    try {
      const res = await apiFetch('/api/agents/verified');
      if (res.ok) {
        const data = await res.json();
        setVerifiedAgents(data.agents || []);
      }
    } catch (e) {
      console.error('Failed to load verified agents:', e);
    }
  }, []);

  // Fetch Admin Data (Requires valid admin token + verified user account)
  const fetchAdminData = useCallback(
    async (tokenOverride?: string | null, userIdOverride?: string | null) => {
      const activeToken = tokenOverride ?? adminToken;
      const activeUserId = userIdOverride ?? currentUser?.id;
      if (!activeToken) return;

      const headers: Record<string, string> = {
        'x-admin-token': activeToken,
        ...(activeUserId ? { 'x-user-id': activeUserId } : {})
      };
      try {
        const [statsRes, usersRes, depRes, wthRes, ordersRes, logsRes, notifRes] = await Promise.all([
          apiFetch('/api/admin/stats', { headers }),
          apiFetch('/api/admin/users', { headers }),
          apiFetch('/api/admin/deposits', { headers }),
          apiFetch('/api/admin/withdrawals', { headers }),
          apiFetch('/api/admin/orders', { headers }),
          apiFetch('/api/admin/audit-logs', { headers }),
          apiFetch('/api/admin/notifications', { headers })
        ]);

        if (statsRes.status === 401 || statsRes.status === 403) {
          setIsAdmin(false);
          setAdminToken(null);
          if (statsRes.status === 403) {
            setIsProfileAdminOpen(false);
          }
          return;
        }

        if (statsRes.ok) setAdminStats((await statsRes.json()).stats);
        if (usersRes.ok) setAllUsers((await usersRes.json()).users);
        if (depRes.ok) setAllDeposits((await depRes.json()).deposits);
        if (wthRes.ok) setAllWithdrawals((await wthRes.json()).withdrawals);
        if (ordersRes.ok) setAllOrders((await ordersRes.json()).orders || []);
        if (logsRes.ok) setAuditLogs((await logsRes.json()).logs);
        if (notifRes.ok) {
          const notifJson = await notifRes.json();
          setAdminNotificationLogs(notifJson.logs || []);
          if (notifJson.providers) setNotificationProviders(notifJson.providers);
        }
      } catch (e) {
        console.error('Failed to fetch admin data:', e);
      }
    },
    [adminToken, currentUser?.id]
  );

  const refreshAllData = useCallback(async () => {
    await Promise.all([fetchPublicData(), fetchProducts(), fetchPublicFeed(), fetchDemoUsers(), fetchVerifiedAgents()]);
    if (currentUser?.id) {
      await fetchUserData(currentUser.id);
    }
    if (isAdmin && adminToken) {
      await fetchAdminData(adminToken);
    }
  }, [fetchPublicData, fetchProducts, fetchPublicFeed, fetchDemoUsers, fetchVerifiedAgents, fetchUserData, currentUser?.id, isAdmin, adminToken, fetchAdminData]);

  // Initial Load: check demo user, capture ?ref= invite link, & validate admin token
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchPublicData(), fetchProducts(), fetchPublicFeed(), fetchDemoUsers(), fetchVerifiedAgents()]);

      // Fetch baseline tasks list
      try {
        const taskRes = await apiFetch('/api/rewards/tasks');
        if (taskRes.ok) {
          const tData = await taskRes.json();
          if (tData.tasks) setUserTasks(tData.tasks);
        }
      } catch {
        // ignore
      }

      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

      // Capture ?ref=CODE or /invite/CODE /r/CODE invitation links
      if (!isAdminPath && typeof window !== 'undefined') {
        const cleanRef = extractReferralCodeFromLocation();
        if (cleanRef) {
          setPendingReferralCode(cleanRef);
          localStorage.setItem('ceg_pending_ref', cleanRef);
          if (isCapacitorNative()) {
            setIsAuthModalOpen(true);
          } else {
            setReferralLandingCode(cleanRef);
          }
        }
      }

      // Register Web Push Service Worker on web origins only (not inside Capacitor native WebView)
      if (!isCapacitorNative() && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          if (Notification.permission === 'granted') {
            setPushPermission('granted');
            setIsWebPushSubscribed(true);
          } else if (Notification.permission === 'default' && typeof Notification.requestPermission === 'function') {
            Notification.requestPermission()
              .then((perm) => {
                setPushPermission(perm);
                if (perm === 'granted') {
                  setIsWebPushSubscribed(true);
                }
              })
              .catch(() => {});
          }
        } catch {
          // Notification API not available in embedded WebView
        }
      }

      // Restore persisted signed-in user session (respect explicit logout across restarts)
      const isLoggedOut = typeof window !== 'undefined' && localStorage.getItem('ceg_logged_out') === '1';
      if (!isLoggedOut) {
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('ceg_current_user_id') : null;
        const targetId = savedUserId && savedUserId.trim() ? savedUserId.trim() : 'CEG-882941';
        try {
          let res = await apiFetch(`/api/user/${encodeURIComponent(targetId)}`);
          if (!res.ok && targetId !== 'CEG-882941') {
            res = await apiFetch('/api/user/CEG-882941');
          }
          if (res.ok) {
            const data = await parseJsonSafe(res);
            if (data.user) {
              setCurrentUser(data.user);
              persistUserSession(data.user.id);
              await fetchUserData(data.user.id);
              if (isAdminPath) {
                setActiveMobileTab('profile');
                if (data.user?.isVerified) {
                  setIsProfileAdminOpen(true);
                } else {
                  addToast('Admin Panel is restricted to verified accounts only!', 'warning');
                }
              }
            }
          }
        } catch (e) {
          console.error('Could not load persisted user:', e);
        }
      }
    };
    init();
  }, [fetchPublicData, fetchProducts, fetchPublicFeed, fetchDemoUsers, fetchVerifiedAgents, fetchUserData, addToast]);

  // Auto-lock Admin Panel if user logs out or loses verified status
  useEffect(() => {
    if (!currentUser || !currentUser.isVerified) {
      setIsProfileAdminOpen(false);
      setIsAdmin(false);
      setAdminToken(null);
      setAdminStats(null);
      setAllUsers([]);
      setAllDeposits([]);
      setAllWithdrawals([]);
      setAllOrders([]);
      setAuditLogs([]);
      setAdminNotificationLogs([]);
    }
  }, [currentUser?.id, currentUser?.isVerified]);

  const openProfileAdminPanel = useCallback(() => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      addToast('Sign in with a verified account to access the Admin Panel.', 'warning');
      return;
    }
    if (!currentUser.isVerified) {
      addToast('Only verified accounts can access the Admin Panel from Profile.', 'error');
      return;
    }
    setActiveMobileTab('profile');
    setIsProfileAdminOpen(true);
  }, [currentUser, addToast]);

  // Refs for rock-solid SSE connection without teardown/reconnect churn on user updates
  const currentUserRef = useRef<User | null>(currentUser);
  const isAdminRef = useRef<boolean>(isAdmin);
  const adminTokenRef = useRef<string | null>(adminToken);
  const fetchUserDataRef = useRef(fetchUserData);
  const fetchAdminDataRef = useRef(fetchAdminData);
  const fetchProductsRef = useRef(fetchProducts);
  const fetchPublicFeedRef = useRef(fetchPublicFeed);
  const fetchDemoUsersRef = useRef(fetchDemoUsers);
  const fetchVerifiedAgentsRef = useRef(fetchVerifiedAgents);
  const refreshAllDataRef = useRef(refreshAllData);
  const addToastRef = useRef(addToast);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);
  useEffect(() => {
    adminTokenRef.current = adminToken;
  }, [adminToken]);
  useEffect(() => {
    fetchUserDataRef.current = fetchUserData;
    fetchAdminDataRef.current = fetchAdminData;
    fetchProductsRef.current = fetchProducts;
    fetchPublicFeedRef.current = fetchPublicFeed;
    fetchDemoUsersRef.current = fetchDemoUsers;
    fetchVerifiedAgentsRef.current = fetchVerifiedAgents;
    refreshAllDataRef.current = refreshAllData;
    addToastRef.current = addToast;
  }, [
    fetchUserData,
    fetchAdminData,
    fetchProducts,
    fetchPublicFeed,
    fetchDemoUsers,
    fetchVerifiedAgents,
    refreshAllData,
    addToast
  ]);

  // Real-time Events Listener (SSE on Web/Cloud API + Local CustomEvent fallback when offline)
  useEffect(() => {
    const dispatchEventPayload = (eventName: string, payload: any) => {
      const activeUser = currentUserRef.current;
      const activeAdmin = isAdminRef.current && Boolean(adminTokenRef.current);
      const notify = addToastRef.current;

      switch (eventName) {
        case 'user_status_changed': {
          if (activeUser && activeUser.id === payload.userId) {
            setCurrentUser(prev => prev ? { ...prev, status: payload.status, banReason: payload.banReason } : null);
            if (payload.status === 'banned') {
              notify(`Alert: Your account has been banned: ${payload.banReason || 'Rule violation'}`, 'error');
            } else if (payload.status === 'suspended') {
              notify('Alert: Your account has been temporarily suspended by Administration.', 'warning');
            } else {
              notify('Success: Your account is now active!', 'success');
            }
          }
          if (activeAdmin) {
            setAllUsers(prev =>
              prev.map(u =>
                u.id === payload.userId ? { ...u, status: payload.status, banReason: payload.banReason } : u
              )
            );
            fetchAdminDataRef.current();
          }
          fetchVerifiedAgentsRef.current();
          break;
        }
        case 'user_verified_changed': {
          if (activeUser && activeUser.id === payload.userId) {
            setCurrentUser(prev => prev ? { ...prev, isVerified: payload.isVerified } : null);
            if (payload.isVerified) {
              notify('Congratulations! Your profile is now verified with a Verification Badge.', 'success');
            } else {
              notify('Your verification badge status has been updated.', 'info');
            }
          }
          if (activeAdmin) {
            setAllUsers(prev =>
              prev.map(u => (u.id === payload.userId ? { ...u, isVerified: payload.isVerified } : u))
            );
            fetchAdminDataRef.current();
          }
          fetchVerifiedAgentsRef.current();
          fetchDemoUsersRef.current();
          break;
        }
        case 'user_id_updated': {
          if (activeUser && activeUser.id === payload.oldUserId && payload.user) {
            setCurrentUser(payload.user);
            persistUserSession(payload.user.id);
          }
          fetchVerifiedAgentsRef.current();
          fetchDemoUsersRef.current();
          fetchPublicFeedRef.current();
          if (activeAdmin) {
            fetchAdminDataRef.current(adminTokenRef.current || undefined, payload.user?.id);
          }
          break;
        }
        case 'volume_vbadge_unlocked': {
          if (activeUser && activeUser.id === payload.userId) {
            setCurrentUser(prev =>
              prev
                ? {
                    ...prev,
                    hasVolumeVBadge: true,
                    totalTransactionVolume: payload.totalTransactionVolume,
                    volumeBadgeUnlockedAt: payload.volumeBadgeUnlockedAt
                  }
                : null
            );
            notify(
              'Congratulations! You exceeded $2,000 in completed volume and unlocked the Colorful V-Badge beside your name.',
              'success'
            );
          }
          fetchVerifiedAgentsRef.current();
          fetchPublicFeedRef.current();
          if (activeAdmin) {
            fetchAdminDataRef.current();
          }
          break;
        }
        case 'user_updated': {
          if (activeUser && activeUser.id === payload.id) {
            setCurrentUser(payload);
          }
          if (activeAdmin && payload?.id) {
            setAllUsers(prev => prev.map(u => (u.id === payload.id ? payload : u)));
            fetchAdminDataRef.current();
          }
          fetchVerifiedAgentsRef.current();
          break;
        }
        case 'deposit_submitted': {
          const deposit: DepositRequest | undefined = payload?.deposit || payload;
          if (deposit?.id && activeAdmin) {
            setAllDeposits(prev => {
              if (prev.some(d => d.id === deposit.id)) return prev;
              return [deposit, ...prev];
            });
            setAdminStats(prev =>
              prev
                ? {
                    ...prev,
                    pendingDepositsCount: (prev.pendingDepositsCount || 0) + 1,
                    pendingDepositsAmount: Number(
                      ((prev.pendingDepositsAmount || 0) + Number(deposit.amount || 0)).toFixed(2)
                    )
                  }
                : prev
            );
            notify(
              `New Deposit: +$${Number(deposit.amount || 0).toFixed(2)} USDT submitted by ${deposit.userName || deposit.userId}`,
              'info'
            );
            fetchAdminDataRef.current();
          }
          if (activeUser && deposit?.userId === activeUser.id) {
            fetchUserDataRef.current(activeUser.id);
          }
          break;
        }
        case 'deposit_updated': {
          const { deposit, user } = payload || {};
          if (activeUser && deposit && activeUser.id === deposit.userId) {
            if (deposit.status === 'approved') {
              notify(`Deposit Approved! +$${deposit.amount} USDT credited to your balance.`, 'success');
            } else {
              notify(`Deposit Rejected: ${deposit.notes || 'Verification failed'}`, 'error');
            }
            if (user) setCurrentUser(user);
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin && deposit?.id) {
            setAllDeposits(prev => prev.map(d => (d.id === deposit.id ? deposit : d)));
            if (user?.id) {
              setAllUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
            }
            fetchAdminDataRef.current();
          }
          fetchPublicFeedRef.current();
          break;
        }
        case 'withdrawal_submitted': {
          const withdrawal: WithdrawalRequest | undefined = payload?.withdrawal || payload;
          const user: User | undefined = payload?.user;
          if (activeUser && withdrawal && activeUser.id === withdrawal.userId) {
            if (user) setCurrentUser(user);
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin && withdrawal?.id) {
            setAllWithdrawals(prev => {
              if (prev.some(w => w.id === withdrawal.id)) return prev;
              return [withdrawal, ...prev];
            });
            if (user?.id) {
              setAllUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
            }
            setAdminStats(prev =>
              prev
                ? {
                    ...prev,
                    pendingWithdrawalsCount: (prev.pendingWithdrawalsCount || 0) + 1,
                    pendingWithdrawalsAmount: Number(
                      ((prev.pendingWithdrawalsAmount || 0) + Number(withdrawal.amount || 0)).toFixed(2)
                    )
                  }
                : prev
            );
            notify(
              `New Withdrawal: $${Number(withdrawal.amount || 0).toFixed(2)} USDT requested by ${withdrawal.userName || withdrawal.userId}`,
              'info'
            );
            fetchAdminDataRef.current();
          }
          break;
        }
        case 'withdrawal_updated': {
          const { withdrawal, user } = payload || {};
          if (activeUser && withdrawal && activeUser.id === withdrawal.userId) {
            if (withdrawal.status === 'approved') {
              notify(`Withdrawal of $${withdrawal.amount} USDT processed successfully on BEP-20!`, 'success');
            } else {
              notify(`Withdrawal Rejected: ${withdrawal.notes}. Funds refunded to balance.`, 'warning');
            }
            if (user) setCurrentUser(user);
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin && withdrawal?.id) {
            setAllWithdrawals(prev => prev.map(w => (w.id === withdrawal.id ? withdrawal : w)));
            if (user?.id) {
              setAllUsers(prev => prev.map(u => (u.id === user.id ? user : u)));
            }
            fetchAdminDataRef.current();
          }
          fetchPublicFeedRef.current();
          break;
        }
        case 'product_updated': {
          fetchProductsRef.current();
          notify('Catalog updated in real time.', 'info');
          break;
        }
        case 'settings_updated': {
          setSettings(payload);
          notify('App system settings updated in real time.', 'info');
          break;
        }
        case 'content_updated': {
          if (payload.banners) setBanners(payload.banners);
          if (payload.videoBanners) setVideoBanners(payload.videoBanners);
          notify('Home banners updated in real time.', 'info');
          break;
        }
        case 'user_registered': {
          const newUser: User | undefined = payload?.user || payload;
          if (activeAdmin && newUser?.id) {
            setAllUsers(prev => {
              if (prev.some(u => u.id === newUser.id)) return prev;
              return [newUser, ...prev];
            });
            setAdminStats(prev =>
              prev
                ? {
                    ...prev,
                    totalUsers: (prev.totalUsers || 0) + 1,
                    activeUsers: (prev.activeUsers || 0) + 1
                  }
                : prev
            );
            notify(`New User Registered: ${newUser.name} (${newUser.id})`, 'info');
            fetchAdminDataRef.current();
          }
          fetchDemoUsersRef.current();
          if (activeUser) fetchUserDataRef.current(activeUser.id);
          break;
        }
        case 'reward_claimed': {
          if (activeUser && payload.user && activeUser.id === payload.user.id) {
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin) {
            fetchAdminDataRef.current();
          }
          break;
        }
        case 'referral_bonus_earned': {
          if (activeUser && activeUser.id === payload.referrerId) {
            notify(
              `${payload.referredUserName} completed their 1st task! You earned +$${Number(payload.bonusAmount).toFixed(2)} USDT (${payload.bonusPercent}% bonus)!`,
              'success'
            );
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin) {
            fetchAdminDataRef.current();
          }
          break;
        }
        case 'referral_tracked': {
          if (activeUser && activeUser.id === payload?.referrerId) {
            const nextTracking = payload?.tracking || payload?.stats;
            if (nextTracking) {
              setReferralData(prev =>
                prev
                  ? {
                      ...prev,
                      tracking: nextTracking
                    }
                  : prev
              );
            } else {
              fetchUserDataRef.current(activeUser.id);
            }
          }
          break;
        }
        case 'referral_bound': {
          if (activeUser && payload?.referrerId === activeUser.id) {
            const nextTracking = payload?.tracking;
            const rec = payload?.referralRecord;
            setReferralData(prev => {
              if (!prev) return prev;
              const existingHistory = prev.history || [];
              const alreadyExists = rec?.referredUserId
                ? existingHistory.some((h: any) => h.referredUserId === rec.referredUserId)
                : false;
              const nextHistory = rec && !alreadyExists ? [rec, ...existingHistory] : existingHistory;
              const nextTotal = nextTracking?.totalSignups ?? Math.max(prev.totalRecords ?? prev.referralCount ?? 0, nextHistory.length);
              return {
                ...prev,
                referralCount: nextTotal,
                totalRecords: nextTotal,
                tracking: nextTracking || prev.tracking,
                history: nextHistory
              };
            });
            fetchUserDataRef.current(activeUser.id);
          } else if (activeUser && payload?.referredUserId === activeUser.id) {
            fetchUserDataRef.current(activeUser.id);
          }
          if (activeAdmin) {
            fetchAdminDataRef.current();
          }
          break;
        }
        case 'order_created': {
          const newOrder: Order | undefined = payload?.order;
          const buyer: User | undefined = payload?.user;
          if (activeAdmin && newOrder?.id) {
            setAllOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            if (buyer?.id) {
              setAllUsers(prev => prev.map(u => (u.id === buyer.id ? buyer : u)));
            }
            notify(
              `New Order: ${newOrder.productTitle} ($${Number(newOrder.productPrice || 0).toFixed(2)} USDT)`,
              'info'
            );
            fetchAdminDataRef.current();
          }
          fetchProductsRef.current();
          if (activeUser && (!buyer || buyer.id === activeUser.id || activeUser.id === buyer.referredBy)) {
            fetchUserDataRef.current(activeUser.id);
          }
          break;
        }
        case 'order_updated': {
          const updatedOrder: Order | undefined = payload?.order;
          if (activeAdmin && updatedOrder?.id) {
            setAllOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
            fetchAdminDataRef.current();
          }
          if (activeUser) fetchUserDataRef.current(activeUser.id);
          break;
        }
        case 'audit_log': {
          if (payload?.id && activeAdmin) {
            setAuditLogs(prev => {
              if (prev.some(l => l.id === payload.id)) return prev;
              return [payload, ...prev.slice(0, 99)];
            });
          }
          break;
        }
        case 'notification_logged': {
          const notif: NotificationLog = payload;
          if (activeAdmin) {
            setAdminNotificationLogs(prev => {
              if (prev.some(n => n.id === notif.id)) return prev;
              return [notif, ...prev.slice(0, 199)];
            });
          }
          if (activeUser && notif.userId === activeUser.id) {
            setUserNotifications(prev => {
              if (prev.some(n => n.id === notif.id)) return prev;
              return [notif, ...prev.slice(0, 99)];
            });
          }
          break;
        }
        case 'push_notification': {
          const notif: NotificationLog = payload;
          if (activeUser && notif.userId === activeUser.id) {
            setUserNotifications(prev => {
              if (prev.some(n => n.id === notif.id)) return prev;
              return [notif, ...prev.slice(0, 99)];
            });
            setActivePushBanner(notif);
            notify(`${notif.title} — ${notif.message}`, 'info');

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              if (!isCapacitorNative() && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                  .then((reg) => {
                    reg.showNotification(notif.title, {
                      body: notif.message,
                      tag: notif.id,
                      data: { url: '/' }
                    });
                  })
                  .catch(() => {
                    try {
                      new Notification(notif.title, { body: notif.message, tag: notif.id });
                    } catch {
                      // ignore
                    }
                  });
              } else {
                try {
                  new Notification(notif.title, { body: notif.message, tag: notif.id });
                } catch {
                  // ignore
                }
              }
            }
          }
          break;
        }
      }
    };

    const handleLocalEvent = (evt: Event) => {
      const custom = evt as CustomEvent<{ event: string; data: any }>;
      if (custom?.detail?.event) {
        dispatchEventPayload(custom.detail.event, custom.detail.data);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ceg-local-event', handleLocalEvent);
    }

    const useLocalEngineOnly = isCapacitorNative() && !hasRemoteApiBase();
    if (useLocalEngineOnly) {
      setRealtimeConnected(true);
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('ceg-local-event', handleLocalEvent);
        }
      };
    }

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;
    let retryAttempt = 0;

    const events = [
      'user_status_changed',
      'user_verified_changed',
      'user_id_updated',
      'volume_vbadge_unlocked',
      'user_updated',
      'deposit_submitted',
      'deposit_updated',
      'withdrawal_submitted',
      'withdrawal_updated',
      'product_updated',
      'settings_updated',
      'content_updated',
      'user_registered',
      'reward_claimed',
      'referral_bonus_earned',
      'referral_tracked',
      'order_created',
      'order_updated',
      'audit_log',
      'notification_logged',
      'push_notification'
    ];

    const connectSSE = () => {
      if (isDisposed) return;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      try {
        const eventsUrl = `${getRemoteApiBaseUrl()}/api/events`;
        const es = new EventSource(eventsUrl);
        eventSource = es;

        es.onopen = () => {
          const isReconnect = retryAttempt > 0;
          retryAttempt = 0;
          setRealtimeConnected(true);
          if (isReconnect) {
            refreshAllDataRef.current();
          }
        };

        es.addEventListener('connected', () => {
          setRealtimeConnected(true);
        });

        events.forEach((evtName) => {
          es.addEventListener(evtName, (e: MessageEvent) => {
            try {
              dispatchEventPayload(evtName, JSON.parse(e.data));
            } catch {
              // ignore malformed event payload
            }
          });
        });

        es.onerror = () => {
          setRealtimeConnected(false);
          if (es.readyState === EventSource.CLOSED && !isDisposed) {
            const delayMs = Math.min(15000, 1500 * Math.pow(2, retryAttempt));
            retryAttempt += 1;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectSSE, delayMs);
          }
        };
      } catch (e) {
        console.error('SSE initialization error:', e);
        if (!isDisposed) {
          const delayMs = Math.min(15000, 1500 * Math.pow(2, retryAttempt));
          retryAttempt += 1;
          reconnectTimer = setTimeout(connectSSE, delayMs);
        }
      }
    };

    connectSSE();

    const handleVisibilityOrOnline = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      refreshAllDataRef.current();
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        connectSSE();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleVisibilityOrOnline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    }

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ceg-local-event', handleLocalEvent);
        window.removeEventListener('online', handleVisibilityOrOnline);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Periodic polling fallback for resilience (faster 6s refresh when Admin Panel is active)
  useEffect(() => {
    const intervalMs = isAdmin && adminToken ? 6000 : 12000;
    const timer = setInterval(() => {
      if (currentUser?.id) {
        fetchUserData(currentUser.id);
      }
      if (isAdmin && adminToken) {
        fetchAdminData(adminToken);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [currentUser?.id, isAdmin, adminToken, fetchUserData, fetchAdminData]);

  // Auth Operations
  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data.user) {
        addToast(data.error || 'Sign in failed. Please check your email and password.', 'error');
        return false;
      }
      setCurrentUser(data.user);
      persistUserSession(data.user.id);
      await fetchUserData(data.user.id);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      return true;
    } catch (err: any) {
      addToast(err?.message || 'Sign in failed', 'error');
      return false;
    }
  };

  const clearPendingReferral = () => {
    setPendingReferralCode(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ceg_pending_ref');
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('ref') || url.searchParams.has('invite')) {
          url.searchParams.delete('ref');
          url.searchParams.delete('invite');
          window.history.replaceState({}, '', url.pathname + (url.search || ''));
        }
      } catch {
        // ignore URL manipulation on non-standard schemes
      }
    }
  };

  const openReferralLanding = useCallback(
    (code?: string) => {
      const target = normalizeReferralCodeInput(code || currentUser?.referralCode || pendingReferralCode || '');
      if (!target) return;
      setReferralLandingCode(target);
    },
    [currentUser?.referralCode, pendingReferralCode]
  );

  const closeReferralLanding = useCallback(
    (openAuth = false) => {
      const activeCode = referralLandingCode;
      setReferralLandingCode(null);
      if (activeCode) {
        setPendingReferralCode(activeCode);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ceg_pending_ref', activeCode);
            if (/^\/(?:invite|r|ref)\//i.test(window.location.pathname)) {
              window.history.replaceState({}, '', `/?ref=${encodeURIComponent(activeCode)}`);
            }
          } catch {
            // ignore storage/history errors
          }
        }
      }
      if (openAuth) {
        setIsAuthModalOpen(true);
      }
    },
    [referralLandingCode]
  );

  const trackReferralEvent = useCallback(
    async (
      referralCode: string,
      eventType: 'click' | 'apk_download',
      source?: string
    ): Promise<ReferralTrackingStats | null> => {
      const cleanCode = normalizeReferralCodeInput(referralCode);
      if (!cleanCode) return null;
      try {
        const res = await apiFetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: cleanCode,
            eventType,
            source: source || 'referral_landing'
          })
        });
        const data = await parseJsonSafe(res);
        const nextTracking = data?.tracking || data?.stats;
        if (res.ok && nextTracking) {
          if (currentUser && currentUser.id === data.referrerId) {
            setReferralData(prev => (prev ? { ...prev, tracking: nextTracking } : prev));
          }
          return nextTracking as ReferralTrackingStats;
        }
      } catch {
        // non-blocking telemetry failure
      }
      return null;
    },
    [currentUser]
  );

  const applyReferralCode = useCallback(
    async (rawCode: string): Promise<{ success: boolean; error?: string; referrerName?: string }> => {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return { success: false, error: 'Please sign in first to apply a referral code.' };
      }
      const cleanCode = normalizeReferralCodeInput(rawCode);
      if (!cleanCode || cleanCode.length < 3) {
        return { success: false, error: 'Please enter a valid referral code or invitation link.' };
      }
      try {
        const res = await apiFetch('/api/referrals/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            referralCode: cleanCode
          })
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) {
          return { success: false, error: data?.error || 'Could not link referral code.' };
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
        clearPendingReferral();
        await fetchUserData(currentUser.id);
        addToast(
          data.referrerName
            ? `Referral partner ${data.referrerName} linked successfully!`
            : 'Referral code linked successfully!',
          'success'
        );
        return { success: true, referrerName: data.referrerName };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Unable to connect right now. Please try again.' };
      }
    },
    [currentUser, fetchUserData, addToast]
  );

  const loadMoreReferrals = useCallback(async (): Promise<boolean> => {
    if (!currentUser || !referralData?.hasMore) return false;
    try {
      const offset = referralData.history?.length || 0;
      const res = await apiFetch(
        `/api/referrals/${encodeURIComponent(currentUser.id)}?limit=100&offset=${offset}`
      );
      if (!res.ok) return false;
      const data = await parseJsonSafe(res);
      const nextItems = Array.isArray(data?.history) ? data.history : [];
      setReferralData(prev => {
        if (!prev) return prev;
        const existingIds = new Set((prev.history || []).map((h: any) => h.referredUserId));
        const merged = [
          ...(prev.history || []),
          ...nextItems.filter((item: any) => !existingIds.has(item.referredUserId))
        ];
        return {
          ...prev,
          referralCount: data.referralCount ?? prev.referralCount,
          totalRecords: data.totalRecords ?? data.referralCount ?? prev.totalRecords,
          hasMore: Boolean(data.hasMore),
          tracking: data.tracking || prev.tracking,
          history: merged
        };
      });
      return true;
    } catch {
      return false;
    }
  }, [currentUser, referralData]);

  const googleSignIn = async (userData: { email: string; name: string; avatar?: string; referralCode?: string }): Promise<boolean> => {
    try {
      const cleanRef = normalizeReferralCodeInput(userData.referralCode || pendingReferralCode || '') || undefined;
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          referralCode: cleanRef
        })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data.user) {
        addToast(data.error || 'Google Sign-In failed', 'error');
        return false;
      }
      clearPendingReferral();
      setCurrentUser(data.user);
      persistUserSession(data.user.id);
      await fetchUserData(data.user.id);
      await fetchDemoUsers();
      addToast(`Connected with Google as ${data.user.name}`, 'success');
      return true;
    } catch (err: any) {
      addToast(err?.message || 'Google Sign-In error', 'error');
      return false;
    }
  };

  const registerUser = async (data: { name: string; email: string; password?: string; referralCode?: string }): Promise<boolean> => {
    try {
      const cleanRef = normalizeReferralCodeInput(data.referralCode || pendingReferralCode || '') || undefined;
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          referralCode: cleanRef
        })
      });
      const result = await parseJsonSafe(res);
      if (!res.ok || !result.user) {
        addToast(result.error || 'Registration failed', 'error');
        return false;
      }
      clearPendingReferral();
      setCurrentUser(result.user);
      persistUserSession(result.user.id);
      await fetchUserData(result.user.id);
      await fetchDemoUsers();
      addToast('Registration complete! $1.00 USDT Welcome Bonus added.', 'success');
      return true;
    } catch (err: any) {
      addToast(err?.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logoutUser = () => {
    persistUserSession(null);
    setCurrentUser(null);
    setUserOrders([]);
    setUserDeposits([]);
    setUserWithdrawals([]);
    setUserTransactions([]);
    setUserNotifications([]);
    setReferralData(null);
    addToast('Logged out successfully', 'info');
  };

  const adminLogin = async (password: string, email: string = 'admin@cryptoearngo.com'): Promise<boolean> => {
    if (!currentUser || !currentUser.isVerified) {
      addToast('Only verified accounts can access the Admin Panel.', 'error');
      return false;
    }
    try {
      const res = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Incorrect admin password or email!', 'error');
        return false;
      }
      setAdminToken(data.token);
      setIsAdmin(true);
      await fetchAdminData(data.token, currentUser.id);
      addToast('Admin authentication successful!', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Admin login failed', 'error');
      return false;
    }
  };

  const adminLogout = () => {
    if (adminToken) {
      apiFetch('/api/auth/admin-logout', {
        method: 'POST',
        headers: getAdminHeaders(adminToken)
      }).catch(() => {});
    }
    setIsAdmin(false);
    setAdminToken(null);
    setAdminStats(null);
    setAllUsers([]);
    setAllDeposits([]);
    setAllWithdrawals([]);
    setAllOrders([]);
    setAuditLogs([]);
    setAdminNotificationLogs([]);
    addToast('Admin session logged out.', 'info');
  };

  const changeAdminPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/admin/change-password', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to change password', 'error');
        return { success: false, error: data.error };
      }
      if (data.token) {
        setAdminToken(data.token);
      }
      addToast('Admin password updated successfully!', 'success');
      await fetchAdminData(data.token, currentUser?.id);
      return { success: true };
    } catch (e: any) {
      addToast(e.message || 'Password update error', 'error');
      return { success: false, error: e.message };
    }
  };

  const switchDemoUser = async (userId: string) => {
    try {
      const res = await apiFetch(`/api/user/${userId}`);
      if (res.ok) {
        const data = await parseJsonSafe(res);
        if (data.user) {
          setCurrentUser(data.user);
          persistUserSession(data.user.id);
          await fetchUserData(data.user.id);
          addToast(`Switched active user to: ${data.user.name} (${data.user.id})`, 'info');
        }
      }
    } catch (e) {
      addToast('Failed to switch user', 'error');
    }
  };

  // Mobile User Actions
  const buyProduct = async (productId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in' };
    }
    try {
      const res = await apiFetch('/api/products/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Purchase failed', 'error');
        return { success: false, error: data.error };
      }
      await fetchUserData(currentUser.id);
      addToast('Order placed successfully! Product activated.', 'success');
      return { success: true };
    } catch (err: any) {
      addToast(err.message || 'Purchase error', 'error');
      return { success: false, error: err.message };
    }
  };

  const submitDeposit = async (amount: number, txHash: string, network?: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in' };
    }
    try {
      const res = await apiFetch('/api/deposits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amount, txHash, network })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Deposit submission failed', 'error');
        return { success: false, error: data.error };
      }
      await fetchUserData(currentUser.id);
      addToast('Deposit request submitted! Admin will review and credit your balance.', 'success');
      return { success: true };
    } catch (err: any) {
      addToast(err.message || 'Deposit error', 'error');
      return { success: false, error: err.message };
    }
  };

  const submitWithdrawal = async (amount: number, toAddress: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in' };
    }
    try {
      const res = await apiFetch('/api/withdrawals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, amount, toAddress })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Withdrawal failed', 'error');
        return { success: false, error: data.error };
      }
      await fetchUserData(currentUser.id);
      addToast(`Withdrawal of $${amount} USDT submitted! Under review.`, 'success');
      return { success: true };
    } catch (err: any) {
      addToast(err.message || 'Withdrawal error', 'error');
      return { success: false, error: err.message };
    }
  };

  const claimProductDailyReward = async (orderId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in' };
    }
    try {
      const res = await apiFetch(`/api/orders/${orderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Product daily claim failed', 'error');
        return { success: false, error: data.error };
      }
      await fetchUserData(currentUser.id);
      await fetchDemoUsers();
      addToast(
        `Product daily income +$${Number(data.reward).toFixed(2)} USDT credited! (Day ${data.order?.daysClaimed}/${data.order?.durationDays})`,
        'success'
      );
      return { success: true, reward: data.reward };
    } catch (err: any) {
      addToast(err.message || 'Product claim error', 'error');
      return { success: false, error: err.message };
    }
  };

  const claimReward = async (taskId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return { success: false, error: 'Please log in' };
    }
    try {
      const res = await apiFetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, taskId })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Claim failed', 'error');
        return { success: false, error: data.error };
      }
      await fetchUserData(currentUser.id);
      await fetchDemoUsers();
      if (data.firstTaskBonus) {
        addToast(
          `🎉 Claimed +$${data.reward} USDT! Your inviter also received a +$${data.firstTaskBonus.bonusAmount.toFixed(2)} (${data.firstTaskBonus.bonusPercent}%) first-claim referral bonus!`,
          'success'
        );
      } else {
        addToast(`🎉 Claimed +$${data.reward} USDT!`, 'success');
      }
      return { success: true, reward: data.reward };
    } catch (err: any) {
      addToast(err.message || 'Claim error', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (data: {
    name?: string;
    avatar?: string;
    country?: string;
    paymentBadges?: PaymentMethodBadge[];
    whatsappNumber?: string;
    telegramLink?: string;
  }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await apiFetch(`/api/user/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.user);
        addToast('Profile updated successfully!', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update profile', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Profile update error', 'error');
      return false;
    }
  };

  const updateNotificationSettings = async (data: {
    fcmToken?: string;
    pushSubscription?: Record<string, any> | null;
    notificationPrefs?: { pushEnabled: boolean };
  }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await apiFetch(`/api/user/${currentUser.id}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        setCurrentUser(json.user);
        addToast('Push notification settings saved!', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to save notification settings', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Notification settings error', 'error');
      return false;
    }
  };

  const dismissPushBanner = useCallback(() => {
    setActivePushBanner(null);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setUserNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      if (typeof window !== 'undefined') {
        try {
          const existing = JSON.parse(localStorage.getItem('ceg_read_notif_ids') || '[]');
          const merged = new Set<string>(Array.isArray(existing) ? existing : []);
          next.forEach(n => merged.add(n.id));
          localStorage.setItem('ceg_read_notif_ids', JSON.stringify(Array.from(merged).slice(-200)));
        } catch {
          // ignore storage error
        }
      }
      return next;
    });
  }, []);

  const enableBrowserPush = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPermission('unsupported');
      addToast('This browser does not support Web Push notifications. In-app live push is active.', 'info');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        addToast('Browser notification permission was not granted. In-app live push remains active.', 'warning');
        return false;
      }

      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch {
          // Service worker registration fallback
        }
      }

      setIsWebPushSubscribed(true);
      if (currentUser) {
        await updateNotificationSettings({ notificationPrefs: { pushEnabled: true } });
      } else {
        addToast('Real-time browser push notifications enabled!', 'success');
      }
      return true;
    } catch (e: any) {
      addToast(e?.message || 'Push permission failed', 'error');
      return false;
    }
  };

  const sendTestNotification = async (txType: 'deposit' | 'withdrawal' = 'deposit'): Promise<boolean> => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }
    try {
      const res = await apiFetch(`/api/user/${currentUser.id}/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: txType })
      });
      const json = await res.json();
      if (res.ok && json.log) {
        setUserNotifications(prev => {
          if (prev.some(n => n.id === json.log.id)) return prev;
          return [json.log, ...prev];
        });
        setActivePushBanner(json.log);
        addToast(
          `Test push alert sent! Status: ${json.log.pushStatus}`,
          'success'
        );
        return true;
      } else {
        addToast(json.error || 'Test notification failed', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Test notification error', 'error');
      return false;
    }
  };

  // Admin Actions
  const toggleUserVerified = async (userId: string, isVerified: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ isVerified })
      });
      if (res.ok) {
        await res.json();
        addToast(
          `User ${userId} status: ${isVerified ? 'VERIFIED (Blue Badge Granted)' : 'UNVERIFIED (Badge Removed)'}`,
          'success'
        );
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update verification', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Verification update error', 'error');
    }
  };

  const updateVerifiedUserId = async (currentUserId: string, newUserId: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(currentUserId)}/id`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ newUserId })
      });
      const json = await res.json();
      if (res.ok && json.user) {
        const updatedUser = json.user as User;
        const effectiveAdminUserId =
          currentUser && currentUser.id === json.oldUserId ? updatedUser.id : currentUser?.id;
        if (currentUser && currentUser.id === json.oldUserId) {
          setCurrentUser(updatedUser);
          persistUserSession(updatedUser.id);
        }
        addToast(`Verified User ID updated: ${json.oldUserId} → ${updatedUser.id}`, 'success');
        await Promise.all([
          fetchDemoUsers(),
          fetchPublicFeed(),
          fetchAdminData(adminToken || undefined, effectiveAdminUserId)
        ]);
        return true;
      } else {
        addToast(json.error || 'Could not update User ID', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'User ID update error', 'error');
      return false;
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned', reason?: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status, reason })
      });
      if (res.ok) {
        addToast(`User ${userId} status set to ${status}`, 'success');
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update user status', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Status update failed', 'error');
    }
  };

  const approveDeposit = async (id: string, notes?: string) => {
    try {
      const res = await apiFetch(`/api/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        addToast(`Deposit #${id} approved! Balance credited.`, 'success');
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to approve deposit', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Approval failed', 'error');
    }
  };

  const rejectDeposit = async (id: string, reason: string) => {
    try {
      const res = await apiFetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        addToast(`Deposit #${id} rejected.`, 'info');
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to reject deposit', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Rejection failed', 'error');
    }
  };

  const approveWithdrawal = async (id: string, txHash?: string, notes?: string) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ txHash, notes })
      });
      if (res.ok) {
        addToast(`Withdrawal #${id} approved! BEP-20 tx sent.`, 'success');
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to approve withdrawal', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Approval failed', 'error');
    }
  };

  const rejectWithdrawal = async (id: string, reason: string) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        addToast(`Withdrawal #${id} rejected. Balance refunded to user.`, 'info');
        await fetchAdminData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to reject withdrawal', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Rejection failed', 'error');
    }
  };

  const saveProduct = async (productData: Partial<Product>) => {
    try {
      const isEdit = !!productData.id;
      const url = isEdit ? `/api/admin/products/${productData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        addToast(`Product ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
        await fetchProducts();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to save product', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Save product failed', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        addToast('Product deleted', 'info');
        await fetchProducts();
      }
    } catch (e: any) {
      addToast(e.message || 'Delete product failed', 'error');
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(newSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        addToast('Settings saved and synced successfully!', 'success');
        return true;
      } else {
        addToast(data.error || 'Could not save settings', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Update settings failed', 'error');
      return false;
    }
  };

  const addDepositMarket = async (market: Partial<DepositNetworkConfig>): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/admin/deposit-markets', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(market)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        addToast(`New market "${market.name || market.id}" added successfully!`, 'success');
        return true;
      } else {
        addToast(data.error || 'Could not add market', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Add market failed', 'error');
      return false;
    }
  };

  const updateDepositMarket = async (marketId: string, patch: Partial<DepositNetworkConfig>): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/deposit-markets/${encodeURIComponent(marketId)}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        if (typeof patch.enabled === 'boolean' && Object.keys(patch).length === 1) {
          addToast(
            `Market "${marketId}" is now ${patch.enabled ? 'Enabled' : 'Disabled'}!`,
            patch.enabled ? 'success' : 'info'
          );
        } else {
          addToast(`Market "${marketId}" details and address updated!`, 'success');
        }
        return true;
      } else {
        addToast(data.error || 'Could not update market', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Update market failed', 'error');
      return false;
    }
  };

  const deleteDepositMarket = async (marketId: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/admin/deposit-markets/${encodeURIComponent(marketId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        addToast(`Market "${marketId}" deleted.`, 'info');
        return true;
      } else {
        addToast(data.error || 'Could not delete market', 'error');
        return false;
      }
    } catch (e: any) {
      addToast(e.message || 'Delete market failed', 'error');
      return false;
    }
  };

  const updateBanners = async (newBanners: Banner[]) => {
    try {
      const res = await apiFetch('/api/admin/banners', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ banners: newBanners })
      });
      if (res.ok) {
        setBanners(newBanners);
        addToast('Banners saved and synced to Android app!', 'success');
      }
    } catch (e: any) {
      addToast(e.message || 'Update banners failed', 'error');
    }
  };

  const updateVideoBanners = async (videos: VideoBanner[]) => {
    try {
      const res = await apiFetch('/api/admin/videos', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ videos })
      });
      if (res.ok) {
        setVideoBanners(videos);
        addToast('Video banners updated and synced to Android app!', 'success');
      }
    } catch (e: any) {
      addToast(e.message || 'Update videos failed', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAdmin,
        setIsAdmin,
        adminToken,
        setAdminToken,
        viewMode,
        setViewMode,
        activeMobileTab,
        setActiveMobileTab,
        isProfileAdminOpen,
        setIsProfileAdminOpen,
        openProfileAdminPanel,
        deviceFrame,
        setDeviceFrame,
        theme,
        setTheme,
        settings,
        banners,
        videoBanners,
        products,
        userOrders,
        userDeposits,
        userWithdrawals,
        userTransactions,
        userTasks,
        userClaims,
        userNotifications,
        notificationProviders,
        publicFeed,
        referralData,
        pendingReferralCode,
        setPendingReferralCode,
        referralLandingCode,
        openReferralLanding,
        closeReferralLanding,
        trackReferralEvent,
        applyReferralCode,
        loadMoreReferrals,
        adminStats,
        allUsers,
        demoUsers,
        verifiedAgents,
        allDeposits,
        allWithdrawals,
        allOrders,
        auditLogs,
        adminNotificationLogs,
        refreshAllData,
        fetchVerifiedAgents,
        addToast,
        loginUser,
        googleSignIn,
        registerUser,
        logoutUser,
        adminLogin,
        adminLogout,
        changeAdminPassword,
        switchDemoUser,
        buyProduct,
        submitDeposit,
        submitWithdrawal,
        claimReward,
        claimProductDailyReward,
        updateProfile,
        updateNotificationSettings,
        sendTestNotification,
        pushPermission,
        isWebPushSubscribed,
        activePushBanner,
        enableBrowserPush,
        dismissPushBanner,
        markNotificationsRead,
        updateUserStatus,
        toggleUserVerified,
        updateVerifiedUserId,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
        saveProduct,
        deleteProduct,
        updateSettings,
        addDepositMarket,
        updateDepositMarket,
        deleteDepositMarket,
        updateBanners,
        updateVideoBanners,
        realtimeConnected,
        toasts,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isUpdateModalOpen,
        setIsUpdateModalOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
