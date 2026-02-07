
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Category, Product, CartItem, Order, User, SoundType, InventoryItem, Customer, Expense, OrderType, AuditLog, OrderStatus 
} from './types';
import { 
  INITIAL_PRODUCTS, COPYRIGHT_INFO, WORK_HOURS as DEFAULT_WORK_HOURS, INITIAL_INVENTORY, LOGO_URL, EMERGENCY_CODE 
} from './constants';
import { soundService } from './services/soundService';
import PizzaModal from './components/PizzaModal';
import Receipt from './components/Receipt';

const App: React.FC = () => {
  // --- Offline Persistence Engine ---
  const load = (key: string, def: any) => {
    const saved = localStorage.getItem(`pos_v4_${key}`);
    try { return saved ? JSON.parse(saved) : def; } catch { return def; }
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEmergencyLock, setIsEmergencyLock] = useState(false);
  const [emergencyInput, setEmergencyInput] = useState("");

  // System Configuration
  const [logoUrl, setLogoUrl] = useState<string>(() => load('logo', LOGO_URL));
  const [isDarkMode, setIsDarkMode] = useState(() => load('darkMode', false));
  const [workHours, setWorkHours] = useState(() => load('workHours', DEFAULT_WORK_HOURS));
  
  // App Navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'kitchen' | 'admin'>('pos');
  const [adminTab, setAdminTab] = useState<'safe' | 'expenses' | 'inventory' | 'hr' | 'crm' | 'reports' | 'logs' | 'settings'>('safe');

  // Core Data
  const [orders, setOrders] = useState<Order[]>(() => load('orders', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => load('expenses', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => load('inventory', INITIAL_INVENTORY));
  const [customers, setCustomers] = useState<Customer[]>(() => load('customers', []));
  const [employees, setEmployees] = useState<User[]>(() => load('employees', [
    { username: 'admin', role: 'admin', name: 'محمود حسن', performanceScore: 99, joinedAt: '2023-01-01', salary: 15000, delaysCount: 0 },
    { username: 'cashier', role: 'cashier', name: 'رضا البغدي', performanceScore: 85, joinedAt: '2023-06-01', salary: 4500, delaysCount: 2 },
  ]));
  const [initialSafeBalance, setInitialSafeBalance] = useState<number>(() => load('safe_init', 0));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => load('logs', []));

  // POS Interaction State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('بيتزا');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('تيك أواي');
  const [discount, setDiscount] = useState(0);
  const [deliveryFees, setDeliveryFees] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa'>('cash');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with LocalStorage
  useEffect(() => {
    const data = {
      orders, expenses, inventory, customers, employees, 
      safe_init: initialSafeBalance, logo: logoUrl, 
      logs: auditLogs, darkMode: isDarkMode, workHours
    };
    Object.entries(data).forEach(([key, val]) => {
      localStorage.setItem(`pos_v4_${key}`, JSON.stringify(val));
    });
  }, [orders, expenses, inventory, customers, employees, initialSafeBalance, logoUrl, auditLogs, isDarkMode, workHours]);

  // Logging
  const logAction = (action: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: currentUser?.name || 'النظام',
      action,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 200));
  };

  // Safe Stats
  const safeStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === today);
    const cashSales = todayOrders.filter(o => o.paymentMethod === 'cash').reduce((a, b) => a + b.total, 0);
    const visaSales = todayOrders.filter(o => o.paymentMethod === 'visa').reduce((a, b) => a + b.total, 0);
    const todayExpenses = expenses.filter(e => new Date(e.timestamp).toDateString() === today).reduce((a, b) => a + b.amount, 0);
    
    return {
      cashSales, visaSales, totalExpenses: todayExpenses,
      netCash: initialSafeBalance + cashSales - todayExpenses,
      totalSales: cashSales + visaSales
    };
  }, [orders, expenses, initialSafeBalance]);

  // Cart Calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((a, b) => a + b.totalPrice, 0);
    const total = Math.max(0, subtotal - discount + deliveryFees);
    const change = Math.max(0, paidAmount - total);
    return { subtotal, total, change };
  }, [cart, discount, deliveryFees, paidAmount]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const f = e.target as any;
    if (f.username.value === 'admin' && f.password.value === 'admin') {
      setCurrentUser(employees[0]);
      logAction("تسجيل دخول المشرف");
    } else if (f.username.value === 'cashier' && f.password.value === '123') {
      setCurrentUser(employees[1]);
      logAction("تسجيل دخول الكاشير");
    } else {
      soundService.play(SoundType.ERROR);
      alert("بيانات خاطئة!");
    }
  };

  const processOrder = () => {
    if (cart.length === 0) return;
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      subtotal: totals.subtotal,
      discount,
      deliveryFees,
      total: totals.total,
      paidAmount,
      changeAmount: totals.change,
      paymentMethod,
      status: 'preparing',
      timestamp: new Date().toISOString(),
      cashier: currentUser?.name || 'Admin',
      orderType
    };
    
    setOrders(prev => [newOrder, ...prev]);
    logAction(`إتمام بيع فاتورة بقيمة ${totals.total}`);
    setCart([]); setDiscount(0); setDeliveryFees(0); setPaidAmount(0);
    setShowReceipt(newOrder);
    soundService.play(SoundType.SUCCESS);
  };

  const addToCart = (product: Product, crepeType?: 'roll' | 'triangle') => {
    if (product.category === 'بيتزا') {
      setSelectedProduct(product);
      return;
    }
    const price = crepeType === 'roll' ? (product.prices.roll || 0) : (product.prices.triangle || product.prices.base || 0);
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name + (crepeType ? ` (${crepeType === 'roll' ? 'رول' : 'مثلث'})` : ''),
      basePrice: price, toppings: [], quantity: 1, totalPrice: price
    };
    setCart(prev => [...prev, newItem]);
    soundService.play(SoundType.ADD);
  };

  if (isEmergencyLock) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-12 text-white">
        <h1 className="text-9xl mb-8">🚨</h1>
        <h2 className="text-6xl font-black mb-12">النظام مقفل للطوارئ</h2>
        <input 
          type="password" 
          autoFocus
          className="w-full max-w-sm p-6 rounded-3xl bg-white/10 border-4 border-white/20 text-center text-5xl font-black outline-none focus:border-red-500"
          value={emergencyInput}
          onChange={e => setEmergencyInput(e.target.value)}
          placeholder="رمز الفك"
        />
        <button onClick={() => { if (emergencyInput === EMERGENCY_CODE) { setIsEmergencyLock(false); setEmergencyInput(""); logAction("تم فك قفل الطوارئ"); } }} className="mt-8 bg-red-600 px-16 py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition-all">فك القفل</button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent opacity-50"></div>
        <div className="bg-white p-16 rounded-[4rem] shadow-2xl w-full max-w-md text-center border-[12px] border-orange-500/10 animate-in zoom-in relative z-10">
          <img src={logoUrl} className="w-24 h-24 mx-auto mb-6 object-contain shadow-lg rounded-3xl bg-white p-2" />
          <h1 className="text-5xl font-black mb-8 text-slate-800 tracking-tighter">لانجولتو <span className="text-orange-600">POS</span></h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input name="username" type="text" placeholder="اسم المستخدم" className="w-full p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-800 focus:border-orange-500 outline-none transition-all text-xl shadow-inner" />
            <input name="password" type="password" placeholder="كلمة المرور" className="w-full p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-slate-800 focus:border-orange-500 outline-none transition-all text-xl shadow-inner" />
            <button className="w-full bg-orange-600 text-white font-black py-6 rounded-2xl text-2xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:bg-orange-700 active:scale-95 transition-all">دخول النظام 🚀</button>
          </form>
          <div className="mt-12 pt-8 border-t border-slate-100 space-y-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{COPYRIGHT_INFO.text}</p>
             <p className="text-[10px] font-black text-orange-500 opacity-60">Mobile: {COPYRIGHT_INFO.mobile}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar - Advanced Nav */}
      <aside className="w-28 flex flex-col items-center py-10 bg-white dark:bg-slate-900 border-l-4 border-slate-100 dark:border-slate-800 shadow-[20px_0_50px_rgba(0,0,0,0.05)] relative z-50">
        <div className="mb-16 group cursor-pointer" onClick={() => setActiveTab('pos')}>
          <img src={logoUrl} className="w-20 h-20 rounded-[2rem] border-4 border-orange-500 bg-white object-contain shadow-xl p-1 transition-transform group-hover:scale-110" />
        </div>
        <nav className="flex-1 space-y-12">
          {[
            { id: 'pos', icon: '🛒', label: 'الكاشير' },
            { id: 'orders', icon: '📋', label: 'الطلبات' },
            { id: 'kitchen', icon: '👨‍🍳', label: 'المطبخ' },
            { id: 'admin', icon: '🛠️', label: 'الإدارة' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-2 transition-all relative group ${activeTab === item.id ? 'text-orange-600 scale-110' : 'text-slate-300 hover:text-orange-400'}`}>
              <span className="text-4xl">{item.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              {activeTab === item.id && <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-10 bg-orange-600 rounded-l-full"></div>}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-6">
           <button onClick={() => setIsEmergencyLock(true)} className="text-3xl opacity-20 hover:opacity-100 transition-opacity">🔐</button>
           <button onClick={() => setCurrentUser(null)} className="text-4xl text-slate-200 hover:text-red-500 transition-colors">🚪</button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 px-12 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b-2 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-8">
            <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white">لانجولتو <span className="text-orange-600">PLATINUM</span></h2>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-4 bg-orange-50 dark:bg-slate-800/50 px-6 py-2 rounded-2xl border border-orange-100 dark:border-slate-700">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
               <span className="font-black text-sm text-orange-800 dark:text-orange-400 uppercase">{currentUser.name} | {currentUser.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="text-right flex flex-col items-end">
              <span className="text-2xl font-black tabular-nums tracking-tighter">{new Date().toLocaleTimeString('ar-EG')}</span>
              <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">{new Date().toLocaleDateString('ar-EG')}</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-3xl bg-slate-50 dark:bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner">{isDarkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {activeTab === 'pos' && (
            <div className="flex gap-8 h-full">
              {/* Menu Column */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {['بيتزا', 'كريب', 'سندوتشات', 'إضافات'].map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-xl whitespace-nowrap ${activeCategory === cat ? 'bg-orange-600 text-white scale-105' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-orange-400'}`}>{cat}</button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                  {INITIAL_PRODUCTS.filter(p => p.category === activeCategory).map(p => (
                    <div key={p.id} onClick={() => addToCart(p)} className="p-6 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl hover:shadow-2xl cursor-pointer transition-all border-4 border-transparent hover:border-orange-500 group flex flex-col items-center">
                       <div className="w-full h-32 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-6xl group-hover:scale-110 transition-transform mb-6">
                         {p.category === 'بيتزا' ? '🍕' : p.category === 'كريب' ? '🌯' : p.category === 'سندوتشات' ? '🍔' : '🍟'}
                       </div>
                       <h4 className="text-xl font-black text-center mb-6 h-12 flex items-center">{p.name}</h4>
                       {p.category === 'كريب' ? (
                         <div className="flex gap-3 w-full">
                           <button onClick={(e) => {e.stopPropagation(); addToCart(p, 'roll')}} className="flex-1 bg-orange-100 text-orange-700 py-3 rounded-2xl font-black text-xs">رول ({p.prices.roll})</button>
                           <button onClick={(e) => {e.stopPropagation(); addToCart(p, 'triangle')}} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-2xl font-black text-xs">مثلث ({p.prices.triangle})</button>
                         </div>
                       ) : (
                         <div className="w-full bg-orange-600 text-white text-center py-4 rounded-2xl font-black text-2xl shadow-lg">{p.prices.base || p.prices.S} ج.م</div>
                       )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Cart Pane */}
              <div className="w-[32rem] bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border-8 border-white dark:border-slate-800">
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b flex justify-between items-center">
                   <div className="text-right">
                      <h3 className="text-3xl font-black">السلة الذكية</h3>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Order Summary Engine</p>
                   </div>
                   <button onClick={() => setCart([])} className="bg-red-50 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm hover:bg-red-100 transition-colors">🗑️</button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
                   {cart.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                        <span className="text-9xl mb-10">🛒</span>
                        <p className="text-4xl font-black">السلة فارغة</p>
                     </div>
                   ) : (
                     cart.map(item => (
                       <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent hover:border-orange-500 transition-all group">
                         <div className="flex justify-between items-start mb-4">
                            <div className="text-right">
                               <h5 className="font-black text-lg">{item.name} {item.size && `(${item.size})`}</h5>
                               {item.isStuffedCrust && <span className="text-[10px] font-black text-blue-600 block">+ حشو أطراف ({item.stuffedCrustPrice} ج.م)</span>}
                            </div>
                            <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 text-2xl">✕</button>
                         </div>
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-700">
                               <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1, totalPrice: (i.totalPrice/i.quantity)*(i.quantity+1)} : i))} className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl font-black text-xl hover:scale-110 transition-transform">+</button>
                               <span className="font-black text-2xl tabular-nums w-8 text-center">{item.quantity}</span>
                               <button onClick={() => setCart(prev => prev.map(i => i.id === item.id && i.quantity > 1 ? {...i, quantity: i.quantity - 1, totalPrice: (i.totalPrice/i.quantity)*(i.quantity-1)} : i))} className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl font-black text-xl hover:scale-110 transition-transform">-</button>
                            </div>
                            <span className="text-3xl font-black text-orange-600 tabular-nums">{item.totalPrice}</span>
                         </div>
                       </div>
                     ))
                   )}
                </div>

                {/* Account Details Panel */}
                <div className="p-10 bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-100 dark:border-slate-800 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">مصاريف توصيل</label>
                       <input type="number" className="w-full p-5 rounded-2xl border-2 bg-white dark:bg-slate-900 text-2xl font-black shadow-inner" value={deliveryFees || ''} onChange={e => setDeliveryFees(Number(e.target.value))} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">خصم (مبلغ)</label>
                       <input type="number" className="w-full p-5 rounded-2xl border-2 bg-white dark:bg-slate-900 text-2xl font-black shadow-inner" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} placeholder="0.00" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">المبلغ المدفوع كاش</label>
                    <input type="number" className="w-full p-6 rounded-3xl border-4 border-orange-200 dark:border-orange-900 bg-white dark:bg-slate-900 text-5xl font-black text-center text-orange-600 shadow-xl focus:border-orange-500 transition-all outline-none" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} placeholder="0.00" />
                  </div>

                  <div className="flex gap-4">
                     <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all ${paymentMethod === 'cash' ? 'bg-orange-600 text-white border-orange-600 shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'}`}>نقدي (Cash)</button>
                     <button onClick={() => setPaymentMethod('visa')} className={`flex-1 py-4 rounded-2xl font-black text-sm border-2 transition-all ${paymentMethod === 'visa' ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'}`}>فيزا (Visa)</button>
                  </div>

                  <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-end">
                    <div className="text-right">
                       <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">صافي الحساب النهائي</span>
                       <span className="text-6xl font-black text-orange-600 tabular-nums tracking-tighter">{totals.total}</span>
                    </div>
                    <div className="text-left text-green-600">
                       <span className="block text-[10px] font-black opacity-50 uppercase tracking-widest">المتبقي للعميل</span>
                       <span className="text-3xl font-black tabular-nums">{totals.change}</span>
                    </div>
                  </div>
                  <button onClick={processOrder} disabled={cart.length === 0} className="w-full bg-orange-600 text-white font-black py-8 rounded-[2.5rem] text-4xl shadow-[0_25px_60px_rgba(249,115,22,0.4)] hover:bg-orange-700 active:scale-[0.98] disabled:opacity-30 transition-all flex items-center justify-center gap-6">
                    <span>إتمام الطلب</span>
                    <span className="text-5xl">✅</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in">
              <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-fit mx-auto sticky top-4 z-[100] border-4 border-white dark:border-slate-800 overflow-x-auto no-scrollbar max-w-full">
                {[
                  { id: 'safe', label: 'الخزنة والجرد' },
                  { id: 'expenses', label: 'المصروفات' },
                  { id: 'inventory', label: 'المخزن' },
                  { id: 'hr', label: 'الموظفين' },
                  { id: 'crm', label: 'العملاء والولاء' },
                  { id: 'logs', label: 'سجل النشاط' },
                  { id: 'settings', label: 'الإعدادات' },
                ].map(t => (
                  <button key={t.id} onClick={() => setAdminTab(t.id as any)} className={`px-10 py-4 rounded-[2.5rem] font-black text-sm transition-all whitespace-nowrap ${adminTab === t.id ? 'bg-orange-600 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-orange-400'}`}>{t.label}</button>
                ))}
              </div>

              {adminTab === 'safe' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom">
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl border-b-[15px] border-green-500 text-center space-y-6">
                    <span className="text-8xl block">💰</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">مبيعات اليوم (كاش)</span>
                    <div className="text-6xl font-black text-green-600 tabular-nums">{safeStats.cashSales} ج.م</div>
                    <div className="text-xs font-bold text-slate-300">مبيعات فيزا: {safeStats.visaSales} ج.م</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl border-b-[15px] border-red-500 text-center space-y-6">
                    <span className="text-8xl block">💸</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">إجمالي مصروفات اليوم</span>
                    <div className="text-6xl font-black text-red-600 tabular-nums">{safeStats.totalExpenses} ج.م</div>
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest block">Expense History Today</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl border-b-[15px] border-orange-500 text-center space-y-6 relative overflow-hidden group">
                    <span className="text-8xl block">🏦</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">الصافي الحالي بالدرج</span>
                    <div className="text-6xl font-black text-orange-600 tabular-nums">{safeStats.netCash} ج.م</div>
                    <button onClick={() => {if(confirm("هل تريد تصفير الخزنة وإغلاق اليوم؟")) { setOrders([]); setExpenses([]); logAction("تم إغلاق الوردية النهائية"); alert("تم التصفير بنجاح"); }}} className="w-full bg-black text-white font-black py-6 rounded-3xl text-2xl shadow-2xl active:scale-95 transition-all">إغلاق اليوم النهائي 🏁</button>
                  </div>
                </div>
              )}

              {adminTab === 'expenses' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-right">
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border-4 border-slate-50 dark:border-slate-800">
                    <h3 className="text-4xl font-black mb-10">تسجيل مصروف</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const f = e.target as any;
                      const exp: Expense = { id: `exp-${Date.now()}`, title: f.title.value, amount: Number(f.amount.value), timestamp: new Date().toISOString() };
                      setExpenses(prev => [exp, ...prev]);
                      logAction(`إضافة مصروف: ${exp.title} (${exp.amount})`);
                      f.reset();
                    }} className="space-y-8">
                      <div className="space-y-3">
                        <label className="font-black text-xs text-slate-400 mr-2 uppercase tracking-widest">بيان المصروف</label>
                        <input name="title" required placeholder="مثلاً: فاتورة كهرباء، كرتونة زيت..." className="w-full p-6 rounded-3xl border-2 bg-slate-50 dark:bg-slate-800 font-black text-xl text-slate-800 shadow-inner" />
                      </div>
                      <div className="space-y-3">
                        <label className="font-black text-xs text-slate-400 mr-2 uppercase tracking-widest">المبلغ</label>
                        <input name="amount" type="number" required placeholder="0.00" className="w-full p-6 rounded-3xl border-2 bg-slate-50 dark:bg-slate-800 font-black text-4xl text-center text-red-600 shadow-inner focus:border-red-500" />
                      </div>
                      <button className="w-full bg-red-600 text-white font-black py-6 rounded-3xl text-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">حفظ المصروف 💸</button>
                    </form>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border-4 border-slate-50 dark:border-slate-800 flex flex-col">
                    <h3 className="text-4xl font-black mb-8">سجل المصروفات</h3>
                    <div className="flex-1 overflow-auto space-y-4 pr-4 custom-scrollbar">
                       {expenses.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center opacity-10">
                            <span className="text-9xl">🍃</span>
                            <p className="font-black text-2xl">لا توجد سجلات</p>
                         </div>
                       ) : (
                         expenses.map(e => (
                           <div key={e.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl flex justify-between border-r-[15px] border-red-500 shadow-sm">
                             <div className="text-right">
                               <div className="font-black text-xl">{e.title}</div>
                               <div className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">{new Date(e.timestamp).toLocaleTimeString()}</div>
                             </div>
                             <div className="text-3xl font-black text-red-600 tabular-nums">{e.amount} ج.م</div>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'hr' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in">
                  {employees.map(u => (
                    <div key={u.username} className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-xl border-4 border-white dark:border-slate-800 text-center flex flex-col items-center group relative overflow-hidden transition-all hover:-translate-y-2">
                       <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-5xl mb-6 relative z-10">👤</div>
                       <h4 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{u.name}</h4>
                       <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest mb-10">{u.role}</span>
                       
                       <div className="w-full space-y-4 pt-8 border-t dark:border-slate-800">
                          <div className="flex justify-between font-black text-xs">
                             <span className="opacity-30">الراتب الشهري</span>
                             <span>{u.salary} ج.م</span>
                          </div>
                          <div className="flex justify-between font-black text-xs">
                             <span className="opacity-30">تقييم الأداء</span>
                             <span className="text-green-600">{u.performanceScore}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{ width: `${u.performanceScore}%` }}></div>
                          </div>
                       </div>
                       <div className="mt-8 flex gap-2 w-full">
                          <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-[10px]">حضور 🟢</button>
                          <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-[10px]">تأخير 🟡</button>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'logs' && (
                <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl overflow-hidden border-4 border-slate-50 dark:border-slate-800 animate-in fade-in">
                  <div className="p-10 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                     <h3 className="text-3xl font-black">سجل الرقابة والأمان (Audit Log)</h3>
                  </div>
                  <div className="max-h-[50rem] overflow-auto custom-scrollbar">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 font-black text-[10px] uppercase tracking-widest text-slate-400">
                        <tr>
                          <th className="p-8">المسؤول</th>
                          <th className="p-8">الإجراء</th>
                          <th className="p-8">التاريخ والوقت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-800">
                        {auditLogs.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="p-8 font-black text-orange-600">{l.user}</td>
                            <td className="p-8 font-bold text-slate-700 dark:text-slate-300">{l.action}</td>
                            <td className="p-8 tabular-nums opacity-40 font-bold">{new Date(l.timestamp).toLocaleString('ar-EG')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="bg-white dark:bg-slate-900 p-16 rounded-[4rem] shadow-2xl border-4 border-slate-50 dark:border-slate-800 space-y-16 animate-in zoom-in">
                  <div className="flex items-center gap-16 border-b pb-16 dark:border-slate-800">
                    <div className="relative group">
                      <img src={logoUrl} className="w-48 h-48 rounded-[3.5rem] border-8 border-orange-500 bg-white object-contain shadow-2xl p-4 transition-transform group-hover:scale-105" />
                      <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/70 text-white rounded-[3.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center font-black text-xl transition-opacity">تغيير اللوجو</button>
                      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                          const r = new FileReader();
                          r.onload = () => { setLogoUrl(r.result as string); logAction("تم تحديث شعار المطعم"); };
                          r.readAsDataURL(file);
                        }
                      }} />
                    </div>
                    <div className="text-right">
                      <h3 className="text-6xl font-black text-slate-800 dark:text-white">إعدادات الهوية</h3>
                      <p className="text-orange-500 font-bold mt-4 italic text-2xl tracking-[0.2em] uppercase">Identity & System Configuration</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <label className="text-xl font-black text-slate-400 block mr-4">رصيد عهدة الخزنة (بداية اليوم):</label>
                      <input type="number" className="w-full p-8 rounded-[2.5rem] border-4 border-slate-100 bg-slate-50 dark:bg-slate-800 text-5xl font-black text-center text-orange-600 focus:border-orange-500 outline-none transition-all shadow-inner" value={initialSafeBalance || ''} onChange={e => setInitialSafeBalance(Number(e.target.value))} />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xl font-black text-slate-400 block mr-4">مواعيد العمل (نهاية الدوام):</label>
                      <input type="time" className="w-full p-8 rounded-[2.5rem] border-4 border-slate-100 bg-slate-50 dark:bg-slate-800 text-5xl font-black text-center focus:border-orange-500 outline-none transition-all shadow-inner" value={workHours.end} onChange={e => setWorkHours({...workHours, end: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={() => { alert("تم حفظ الإعدادات بنجاح"); logAction("تعديل إعدادات النظام"); }} className="w-full bg-orange-600 text-white font-black py-8 rounded-[3rem] text-3xl shadow-[0_30px_60px_rgba(249,115,22,0.4)] hover:bg-orange-700 active:scale-[0.98] transition-all">حفظ وتطبيق التغييرات 💾</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Universal Footer */}
        <footer className="h-12 px-12 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.4em] relative z-50">
           <div className="flex items-center gap-8">
              <span className="text-orange-600 animate-pulse">Offline POS Engine Active</span>
              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-slate-400">© {new Date().getFullYear()} {COPYRIGHT_INFO.text}</span>
           </div>
           <span className="text-slate-300 dark:text-slate-600">Dev Support: {COPYRIGHT_INFO.mobile}</span>
        </footer>
      </main>

      {/* Advanced Pizza Configuration Modal */}
      {selectedProduct && (
        <PizzaModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={(item) => {
            setCart(prev => [...prev, item]);
            setSelectedProduct(null);
            soundService.play(SoundType.ADD);
            logAction(`إضافة ${item.name} للسلة`);
          }}
        />
      )}

      {/* Professional Thermal Receipt Preview */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[1000] p-10 animate-in fade-in">
           <div className="bg-white p-12 rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-auto custom-scrollbar border-[25px] border-white animate-in zoom-in slide-in-from-bottom">
              <Receipt order={showReceipt} logoUrl={logoUrl} workHours={workHours} />
              <div className="flex gap-8 mt-16 print:hidden">
                 <button onClick={() => setShowReceipt(null)} className="flex-1 bg-slate-100 text-slate-800 font-black py-8 rounded-[3rem] text-3xl transition-all shadow-xl hover:bg-slate-200">إغلاق</button>
                 <button onClick={() => window.print()} className="flex-[2] bg-orange-600 text-white font-black py-8 rounded-[3rem] text-4xl shadow-2xl hover:bg-orange-700 active:scale-95 transition-all">طباعة الفاتورة 🚀</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
