import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingBag,
  CheckCircle,
  Package,
  Clock,
  ArrowRight,
  X,
  Layers,
  Gift,
  CalendarDays
} from 'lucide-react';
import { Product, Order } from '../../types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatRemainingTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const MobileProducts: React.FC = () => {
  const {
    products,
    userOrders,
    currentUser,
    buyProduct,
    claimProductDailyReward,
    setIsAuthModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [claimingOrderId, setClaimingOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePurchase = async (productId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsBuying(true);
    const res = await buyProduct(productId);
    setIsBuying(false);
    if (res.success) {
      setSelectedProduct(null);
      setActiveTab('orders');
    }
  };

  const handleClaimOrderDaily = async (orderId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setClaimingOrderId(orderId);
    const res = await claimProductDailyReward(orderId);
    setClaimingOrderId(null);
    if (res.success) {
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.65 }
        });
      } catch {
        // ignore confetti error
      }
    }
  };

  const getOrderClaimState = (order: Order) => {
    const durationDays = order.durationDays || 30;
    const daysClaimed = order.daysClaimed || 0;
    const dailyReward = order.dailyRewardAmount || 0;
    const expiresAtMs = order.expiresAt
      ? new Date(order.expiresAt).getTime()
      : new Date(order.createdAt).getTime() + durationDays * ONE_DAY_MS;
    const isCompleted = daysClaimed >= durationDays;
    const isExpired = now > expiresAtMs;

    if (dailyReward <= 0) {
      return { status: 'no-reward' as const, remainingMs: 0, daysLeft: 0 };
    }
    if (isCompleted) {
      return { status: 'completed' as const, remainingMs: 0, daysLeft: 0 };
    }
    if (isExpired) {
      return { status: 'expired' as const, remainingMs: 0, daysLeft: 0 };
    }

    const daysLeft = Math.max(0, Math.ceil((expiresAtMs - now) / ONE_DAY_MS));
    if (order.lastClaimedAt) {
      const elapsed = now - new Date(order.lastClaimedAt).getTime();
      if (elapsed < ONE_DAY_MS) {
        return { status: 'cooldown' as const, remainingMs: ONE_DAY_MS - elapsed, daysLeft };
      }
    }

    return { status: 'ready' as const, remainingMs: 0, daysLeft };
  };

  const totalEarnedFromProducts = userOrders.reduce(
    (sum, o) => sum + (o.totalEarnedFromOrder || 0),
    0
  );

  return (
    <div className="pb-24 space-y-4 px-4 pt-3">
      {/* Top Segmented Control */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 min-h-[40px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-h-[40px] py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Plans ({userOrders.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="space-y-3.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Categories bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-semibold px-3 min-h-[36px] rounded-lg shrink-0 transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const durationDays = product.durationDays || 30;
              const dailyReward = product.dailyRewardAmount ?? Number((product.price * 0.05).toFixed(2));
              const totalReturn = dailyReward * durationDays;

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
                >
                  <div>
                    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 mb-2.5">
                      <img
                        src={product.image}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <span className="text-amber-400 font-semibold">{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{product.stock > 0 ? `${product.stock} left` : 'Out of Stock'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>

                    {/* 30-day Daily Earning Metrics */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Daily Income</span>
                        <span className="font-bold text-emerald-400 tabular-nums">+${dailyReward.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Duration</span>
                        <span className="font-bold text-white tabular-nums">{durationDays} days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Return</span>
                        <span className="font-bold text-amber-400 tabular-nums">${totalReturn.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                      <span className="text-sm font-black text-amber-400 tabular-nums">
                        ${product.price.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-slate-400">USDT</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                      className="px-4 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-300">No products found</h4>
              <p className="text-xs text-slate-500 mt-1">Choose another category or clear your search.</p>
            </div>
          )}
        </div>
      ) : (
        /* MY ACTIVE 30-DAY PRODUCT PLANS */
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Earned from Products</span>
              <span className="text-lg font-black text-emerald-400 tabular-nums">
                +${totalEarnedFromProducts.toFixed(2)} USDT
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Orders</span>
              <span className="text-sm font-bold text-white tabular-nums">{userOrders.length}</span>
            </div>
          </div>

          {userOrders.length > 0 ? (
            userOrders.map((order) => {
              const durationDays = order.durationDays || 30;
              const daysClaimed = order.daysClaimed || 0;
              const dailyReward = order.dailyRewardAmount || 0;
              const progressPct = Math.min(100, Math.round((daysClaimed / durationDays) * 100));
              const claimState = getOrderClaimState(order);
              const isClaiming = claimingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 tabular-nums">
                        <span className="font-mono">#{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug mt-0.5">
                        {order.productTitle}
                      </h4>
                    </div>
                    <span className="text-xs font-black text-amber-400 tabular-nums shrink-0">
                      ${order.productPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* 30-day Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                        <span>Claim Progress</span>
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {daysClaimed} / {durationDays} days ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Daily Income</span>
                      <span className="font-bold text-emerald-400 tabular-nums">+${dailyReward.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Earned</span>
                      <span className="font-bold text-white tabular-nums">
                        ${(order.totalEarnedFromOrder || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Remaining</span>
                      <span className="font-bold text-slate-200 tabular-nums">
                        {claimState.status === 'completed'
                          ? 'Completed'
                          : claimState.status === 'expired'
                          ? 'Expired'
                          : `${claimState.daysLeft} days`}
                      </span>
                    </div>
                  </div>

                  {/* Daily Claim Button */}
                  {claimState.status === 'ready' ? (
                    <button
                      type="button"
                      disabled={isClaiming}
                      onClick={() => handleClaimOrderDaily(order.id)}
                      className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Gift className="w-4 h-4" />
                      <span>
                        {isClaiming
                          ? 'Crediting...'
                          : `Claim Today's Income (+$${dailyReward.toFixed(2)} USDT)`}
                      </span>
                    </button>
                  ) : claimState.status === 'cooldown' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full min-h-[44px] rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed tabular-nums"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Next claim: {formatRemainingTime(claimState.remainingMs)}</span>
                    </button>
                  ) : (
                    <div className="w-full min-h-[40px] rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                      {claimState.status === 'completed'
                        ? `All ${durationDays} days completed`
                        : claimState.status === 'expired'
                        ? 'Plan Expired'
                        : 'No daily income configured'}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-2.5">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">No products purchased yet</h4>
              <p className="text-xs text-slate-400">
                Purchase any product to claim guaranteed daily USDT income for up to 30 days.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="mt-2 px-5 min-h-[44px] bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                Browse Products
              </button>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 p-safe">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="relative h-44 w-full bg-slate-950 shrink-0">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-900"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              <div>
                <span className="text-[11px] font-semibold text-amber-400">
                  {selectedProduct.category} · {selectedProduct.stock} in stock
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedProduct.title}
                </h3>
                <div className="text-lg font-black text-amber-400 tabular-nums mt-1">
                  ${selectedProduct.price.toFixed(2)} USDT
                </div>
              </div>

              {/* 30-day Earning Breakdown */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950 border border-slate-800 p-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Daily Income</span>
                  <span className="text-xs font-extrabold text-emerald-400 tabular-nums">
                    +${(selectedProduct.dailyRewardAmount ?? Number((selectedProduct.price * 0.05).toFixed(2))).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="text-xs font-extrabold text-white tabular-nums">
                    {selectedProduct.durationDays || 30} days
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Return</span>
                  <span className="text-xs font-extrabold text-amber-400 tabular-nums">
                    ${((selectedProduct.dailyRewardAmount ?? Number((selectedProduct.price * 0.05).toFixed(2))) * (selectedProduct.durationDays || 30)).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedProduct.description}
              </p>

              {selectedProduct.features && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 block">Features</span>
                  {selectedProduct.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Your USDT Balance:</span>
                <span
                  className={`font-bold tabular-nums ${
                    currentUser && currentUser.balance >= selectedProduct.price
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  ${currentUser ? currentUser.balance.toFixed(2) : '0.00'} USDT
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBuying || !selectedProduct.isAvailable || selectedProduct.stock <= 0}
                onClick={() => handlePurchase(selectedProduct.id)}
                className="flex-1 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isBuying ? (
                  <span>Ordering...</span>
                ) : (
                  <>
                    <span>Confirm Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

