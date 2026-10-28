'use client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { cloneSeed, loadState, saveState } from '../../types/store'
import {
  Activity, AlertTriangle, BarChart3, Bell, Box, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, ClipboardList, Clock3, Home, LayoutDashboard, Menu, Moon, MoreHorizontal,
  Package, PanelRightClose, Plus, Search, Settings, ShoppingBag, ShoppingCart, Sun, Tag,
  TrendingUp, Truck, Users, X, Zap, Edit, Trash2, Image as ImageIcon, MessageCircle, Eye, EyeOff, Copy, Droplets, Calculator, Wallet, Receipt, Download,
} from 'lucide-react'

const nav = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'products', label: 'المنتجات', icon: ShoppingBag },
  { id: 'inventory', label: 'المخزون', icon: Box },
  { id: 'orders', label: 'الطلبات', icon: ShoppingCart },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'coupons', label: 'الكوبونات', icon: Tag },
  { id: 'accounting', label: 'الحسابات والمبيعات', icon: Calculator },
  { id: 'hero', label: 'واجهة الموقع', icon: ImageIcon },
  { id: 'activity', label: 'سجل النشاطات', icon: Activity },
  { id: 'settings', label: 'إعدادات المتجر', icon: Settings },
]

const products = [
  { id: 1, name: 'حقيبة جلدية كلاسيكية', sku: 'BG-1042', category: 'شنط يد', price: 280, stock: 42, sales: 186, status: 'منشور', color: 'navy' },
  { id: 2, name: 'حقيبة كروس عصرية', sku: 'BG-1038', category: 'شنط كروس', price: 195, stock: 18, sales: 142, status: 'منشور', color: 'rose' },
  { id: 3, name: 'حقيبة ظهر عملية', sku: 'BG-1029', category: 'شنط ظهر', price: 240, stock: 7, sales: 98, status: 'منشور', color: 'sand' },
  { id: 4, name: 'حقيبة سفر فاخرة', sku: 'BG-1017', category: 'شنط سفر', price: 420, stock: 0, sales: 76, status: 'مخفي', color: 'brown' },
  { id: 5, name: 'حقيبة لابتوب ذكية', sku: 'BG-1004', category: 'شنط لابتوب', price: 310, stock: 24, sales: 64, status: 'منشور', color: 'slate' },
]
const orders = [
  { id: '#10482', customer: 'سارة أحمد', product: 'حقيبة جلدية كلاسيكية', total: 280, date: 'اليوم، 10:42 ص', status: 'تم التوصيل' },
  { id: '#10481', customer: 'محمد خالد', product: 'حقيبة ظهر عملية', total: 240, date: 'اليوم، 09:18 ص', status: 'جاري الشحن' },
  { id: '#10480', customer: 'نور علي', product: 'حقيبة كروس عصرية', total: 195, date: 'أمس، 08:55 م', status: 'قيد المراجعة' },
  { id: '#10479', customer: 'عمر حسن', product: 'حقيبة لابتوب ذكية', total: 310, date: 'أمس، 05:20 م', status: 'تم التأكيد' },
]

function Status({ children }: { children: string }) {
  const tone = children === 'تم التوصيل' || children === 'منشور' ? 'success' : children === 'نفد' || children === 'مخفي' ? 'danger' : 'warning'
  return <span className={`status status-${tone}`}><i />{children}</span>
}

function StatCard({ icon: Icon, label, value, trend, accent }: { icon: typeof Zap, label: string, value: string, trend: string, accent: string }) {
  return <div className="stat-card">
    <div className={`stat-icon ${accent}`}><Icon size={19} /></div>
    <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small className="trend"><TrendingUp size={13} /> {trend} <em>من الشهر الماضي</em></small></div>
  </div>
}

function Dashboard({ setPage }: { setPage: (p: string) => void }) {
  const [range, setRange] = useState('آخر 7 أيام');
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // جلب المنتجات لحساب الإحصائيات
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRealProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // حساب الإحصائيات الحقيقية
  const totalProducts = realProducts.length;
  const outOfStockCount = realProducts.filter(p => p.stock === 0).length;
  const lowStockProducts = realProducts.filter(p => p.stock < 10 && p.stock > 0).slice(0, 4);
  const latestProducts = realProducts.slice(0, 4);

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">مرحباً بك في إدارة المتجر</p>
          <h1>نظرة عامة على الأداء <span>!</span></h1>
          <p className="subtle">إليك إحصائيات منتجاتك المخزنة في قاعدة البيانات.</p>
        </div>
        <button className="primary-button" onClick={() => setPage('products')}>
          <Plus size={17} /> إضافة منتج جديد
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={Package} label="إجمالي المنتجات" value={loading ? "..." : totalProducts.toString()} trend="محدث الآن" accent="green" />
        <StatCard icon={AlertTriangle} label="منتجات نفذت" value={loading ? "..." : outOfStockCount.toString()} trend="يحتاج انتباهك" accent="gold" />
        {/* أرقام تجريبية للطلبات لحين ربط المتجر */}
        <StatCard icon={ShoppingCart} label="إجمالي الطلبات" value="0" trend="قريباً" accent="blue" />
        <StatCard icon={CircleDollarSign} label="إجمالي المبيعات" value={`0 ${CUR}`} trend="قريباً" accent="purple" />
      </div>

      <div className="main-grid lower-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>أحدث المنتجات المضافة</h2>
              <p>آخر العطور اللي تم رفعها</p>
            </div>
            <button className="text-button" onClick={() => setPage('products')}>عرض الكل <ChevronLeft size={15} /></button>
          </div>
          <div className="product-list">
            {latestProducts.length === 0 && !loading ? <p style={{ padding: '15px', color: '#888' }}>لا توجد منتجات حتى الآن.</p> : null}
            {latestProducts.map((p, i) => (
              <div className="product-row" key={p.id}>
                <div className="product-thumb navy"><ShoppingBag size={20} /></div>
                <div className="product-info">
                  <strong>{p.name}</strong>
                  <span>{p.brand}</span>
                </div>
                <b>{p.price} {CUR}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>تنبيهات المخزون (Low Stock)</h2>
              <p>عطور قربت تخلص من المخزن (أقل من 10 قطع)</p>
            </div>
            <button className="icon-button"><MoreHorizontal size={20} /></button>
          </div>
          <div className="stock-list">
            {lowStockProducts.length === 0 && !loading ? <p style={{ padding: '15px', color: '#888' }}>المخزون ممتاز، لا توجد نواقص.</p> : null}
            {lowStockProducts.map(p => (
              <div className="stock-row" key={p.id}>
                <div className="product-thumb small rose"><ShoppingBag size={16} /></div>
                <div>
                  <strong>{p.name}</strong>
                  <span>متبقي <b>{p.stock}</b> قطع</span>
                </div>
                <Status>منخفض</Status>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderTable({ compact = false }: { compact?: boolean }) { return <div className="table-scroll"><table><thead><tr><th>رقم الطلب</th><th>العميل</th><th>المنتج</th><th>الإجمالي</th><th>التاريخ</th><th>الحالة</th><th /></tr></thead><tbody>{orders.concat(orders).slice(0, compact ? 4 : 8).map((o, i) => <tr key={`${o.id}-${i}`}><td><strong>{o.id}</strong></td><td><div className="customer"><span>{o.customer.charAt(0)}</span>{o.customer}</div></td><td>{o.product}</td><td><strong>${o.total}</strong></td><td className="muted">{o.date}</td><td><Status>{o.status}</Status></td><td><button className="icon-button"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div> }

function Products({ setPage, toast }: { setPage: (p: string) => void, toast: (m: string) => void }) {
  const [querySearch, setQuerySearch] = useState('');
  const [realProducts, setRealProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب المنتجات من فايربيز
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRealProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. تطبيق الفلتر (بحث بالاسم + القسم مع بعض)
  const filtered = realProducts.filter(p => {
    const matchSearch = (p.name && p.name.includes(querySearch)) || (p.sku && p.sku.includes(querySearch)) || (p.brand && p.brand.toLowerCase().includes(querySearch.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إدارة الكتالوج</p>
          <h1>المنتجات</h1>
          <p className="subtle">إدارة منتجات متجرك وأسعارها ومخزونها.</p>
        </div>
        <button className="primary-button" onClick={() => setPage('add-product')}>
          <Plus size={17} /> إضافة منتج
        </button>
      </div>

      <section className="panel products-panel">
        <div className="toolbar">
          <div className="search-field">
            <Search size={17} />
            <input placeholder="ابحث باسم المنتج أو SKU..." value={querySearch} onChange={e => setQuerySearch(e.target.value)} />
          </div>

        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>العطر</th>
                <th>SKU</th>
                <th>الفئة / التركيز</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل المنتجات...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد منتجات حالياً.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div className="product-thumb small navy"><Droplets size={16} /></div>
                        )}
                        <div>
                          <strong>{p.name}</strong>
                          <small className="muted" style={{ display: 'block' }}>{p.brand}</small>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{p.sku}</td>
                    <td>
                      <small style={{ display: 'block' }}>{p.gender}</small>
                      <small className="muted">{p.concentration}</small>
                    </td>
                    <td>
                      <strong>{p.price} {CUR}</strong>
                      {Array.isArray(p.variants) && p.variants.length > 1 && <small className="muted" style={{ display: 'block' }}>يبدأ من</small>}
                    </td>
                    <td><span className={p.stock < 10 ? 'low-stock' : ''}>{p.stock}</span></td>
                    <td><Status>{p.status || 'منشور'}</Status></td>
                    <td>
                      <button className="icon-button" onClick={() => setPage('inventory')} title="التعديل من صفحة المخزون">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function GenericPage({ id, setPage }: { id: string, setPage: (p: string) => void }) { const info: Record<string, [string, string, typeof Box]> = { inventory: ['المخزون', 'تابع مستويات المخزون وحركات المنتجات بسهولة.', Box], orders: ['الطلبات', 'تابع طلبات العملاء وحدّث حالتها من مكان واحد.', ClipboardList], customers: ['العملاء', 'تعرف على عملائك وسجل مشترياتهم.', Users], coupons: ['الخصومات والكوبونات', 'أنشئ عروضًا وكوبونات تزيد من مبيعاتك.', Tag], reports: ['التقارير والإحصائيات', 'حلل أداء متجرك واتخذ قرارات أفضل.', BarChart3], activity: ['سجل النشاطات', 'كل ما يحدث في متجرك موثق هنا.', Activity], settings: ['إعدادات المتجر', 'تحكم في إعدادات متجرك العامة.', Settings] }; const [title, desc, Icon] = info[id] || info.inventory; return <div className="page-content"><div className="page-title"><div><p className="eyebrow">لوحة التحكم</p><h1>{title}</h1><p className="subtle">{desc}</p></div>{id === 'orders' && <button className="primary-button"><Plus size={17} /> طلب جديد</button>}</div><section className="panel placeholder-panel"><div className="placeholder-icon"><Icon size={28} /></div><h2>{title}</h2><p>هذه الصفحة جاهزة لإدارة بياناتك. ابدأ بإضافة أول عنصر أو استعرض البيانات الموجودة.</p>{id !== 'reports' && id !== 'activity' && <button className="primary-button" onClick={() => setPage(id === 'inventory' ? 'products' : id)}><Plus size={17} /> إضافة جديد</button>}</section>{id === 'orders' && <section className="panel"><OrderTable /></section>}</div> }
// =====================================================================
//  عطور — الثوابت والأدوات والمكونات المشتركة (إضافة / تعديل / مخزون)
// =====================================================================
const CUR = 'ج.م'
const GENDERS = ['رجالي', 'حريمي', 'للجنسين']
const CONCENTRATIONS = ['Parfum', 'EDP', 'EDT', 'EDC', 'Cologne', 'Oil', 'Body Mist']
const PRODUCT_TYPES = ['أصلي', 'تستر (Tester)', 'ديكانت (عينة مفصولة)', 'زيت عطري', 'مستوحى من', 'طقم هدايا']
const FAMILIES = ['خشبي', 'شرقي', 'زهري', 'حمضي', 'فواكه', 'عودي', 'مسكي', 'أروماتيك', 'أكواتيك', 'جورماند', 'جلدي', 'بودري', 'فريش']
const SEASONS = ['صيف', 'شتاء', 'ربيع', 'خريف']
const OCCASIONS = ['يومي', 'عمل', 'سهرة', 'رسمي', 'رياضي', 'مناسبات', 'رومانسي']
const BADGES = ['جديد', 'الأكثر مبيعًا', 'وصل حديثًا', 'نادر', 'عرض خاص']
const STATUSES = ['منشور', 'مخفي', 'مسودة']
const QUICK_SIZES = [10, 30, 50, 75, 100, 125, 150, 200]
const RATING_LABELS = ['', 'ضعيف', 'متوسط', 'جيد', 'قوي', 'قوي جدًا']

type VariantForm = { size: string; price: string; oldPrice: string; cost: string; stock: string; sku: string }
type PerfumeFormData = {
  name: string; nameEn: string; brand: string; sku: string
  gender: string; concentration: string; productType: string; families: string[]
  topNotes: string; middleNotes: string; baseNotes: string
  longevity: number; sillage: number; longevityHours: string
  seasons: string[]; occasions: string[]
  origin: string; releaseYear: string; perfumer: string; similarTo: string
  customFields: { label: string; value: string }[]
  description: string; imageUrl: string; gallery: string
  variants: VariantForm[]
  lowStockThreshold: string; badges: string[]; isFeatured: boolean; status: string
}

const splitList = (s: string) => s.split(/[,،\n]/).map(x => x.trim()).filter(Boolean)
const emptyVariant = (size = ''): VariantForm => ({ size, price: '', oldPrice: '', cost: '', stock: '', sku: '' })
const emptyPerfume = (): PerfumeFormData => ({
  name: '', nameEn: '', brand: '', sku: '',
  gender: 'للجنسين', concentration: 'EDP', productType: 'أصلي', families: [],
  topNotes: '', middleNotes: '', baseNotes: '',
  longevity: 3, sillage: 3, longevityHours: '',
  seasons: [], occasions: [],
  origin: '', releaseYear: '', perfumer: '', similarTo: '', customFields: [],
  description: '', imageUrl: '', gallery: '',
  variants: [emptyVariant('50')],
  lowStockThreshold: '5', badges: [], isFeatured: false, status: 'منشور',
})

// تحويل منتج من فايربيز لشكل الفورم (للتعديل)
function formFromProduct(p: any): PerfumeFormData {
  const d = emptyPerfume()
  const variants: VariantForm[] = Array.isArray(p.variants) && p.variants.length
    ? p.variants.map((v: any) => ({
        size: String(v.size ?? ''), price: String(v.price ?? ''), oldPrice: v.oldPrice ? String(v.oldPrice) : '',
        cost: v.cost ? String(v.cost) : '', stock: String(v.stock ?? 0), sku: v.sku || '',
      }))
    : [{ ...emptyVariant(''), price: String(p.price ?? ''), stock: String(p.stock ?? 0) }]
  return {
    ...d,
    name: p.name || '', nameEn: p.nameEn || '', brand: p.brand || '', sku: p.sku || '',
    gender: p.gender || d.gender, concentration: p.concentration || d.concentration, productType: p.productType || d.productType,
    families: p.families || [],
    topNotes: (p.notes?.top || []).join('، '), middleNotes: (p.notes?.middle || []).join('، '), baseNotes: (p.notes?.base || []).join('، '),
    longevity: p.longevity || 3, sillage: p.sillage || 3, longevityHours: p.longevityHours || '',
    seasons: p.seasons || [], occasions: p.occasions || [],
    origin: p.origin || '', releaseYear: p.releaseYear ? String(p.releaseYear) : '', perfumer: p.perfumer || '', similarTo: p.similarTo || '',
    customFields: Array.isArray(p.customFields) ? p.customFields.map((c: any) => ({ label: c.label || '', value: c.value || '' })) : [],
    description: p.description || '', imageUrl: p.imageUrl || '',
    gallery: Array.isArray(p.gallery) ? p.gallery.join(', ') : (p.gallery || ''),
    variants,
    lowStockThreshold: String(p.lowStockThreshold ?? 5), badges: p.badges || [], isFeatured: !!p.isFeatured, status: p.status || 'منشور',
  }
}

// فحص البيانات قبل الحفظ — بيرجّع رسالة الخطأ أو نص فاضي
function validatePerfume(f: PerfumeFormData): string {
  if (!f.name.trim()) return 'اكتب اسم العطر'
  if (!f.brand.trim()) return 'اكتب اسم الماركة'
  const vs = f.variants.filter(v => v.size.trim() || v.price.trim())
  if (vs.length === 0) return 'أضف حجم واحد على الأقل بسعره'
  const sizes = new Set<string>()
  for (const v of vs) {
    if (!(Number(v.size) > 0)) return 'حدد حجم كل زجاجة بالمل'
    if (!(Number(v.price) > 0)) return `اكتب سعر حجم ${v.size} مل`
    if (v.oldPrice && Number(v.oldPrice) <= Number(v.price)) return `السعر القديم لحجم ${v.size} مل لازم يكون أكبر من السعر الحالي`
    if (sizes.has(String(Number(v.size)))) return `حجم ${v.size} مل مكرر`
    sizes.add(String(Number(v.size)))
  }
  return ''
}

// تجهيز البيانات للحفظ — السعر والمخزون بيتحسبوا تلقائياً من الأحجام
function buildPayload(f: PerfumeFormData) {
  const variants = f.variants
    .filter(v => Number(v.size) > 0 && Number(v.price) > 0)
    .map(v => ({
      size: Number(v.size), price: Number(v.price), oldPrice: Number(v.oldPrice) || 0,
      cost: Number(v.cost) || 0, stock: Math.max(0, Math.floor(Number(v.stock) || 0)), sku: v.sku.trim(),
    }))
    .sort((a, b) => a.size - b.size)
  const minVariant = variants.reduce((m, v) => (v.price < m.price ? v : m), variants[0])
  return {
    name: f.name.trim(), nameEn: f.nameEn.trim(), brand: f.brand.trim(),
    sku: f.sku.trim() || `PF-${Date.now().toString().slice(-6)}`,
    gender: f.gender, concentration: f.concentration, productType: f.productType,
    families: f.families,
    notes: { top: splitList(f.topNotes), middle: splitList(f.middleNotes), base: splitList(f.baseNotes) },
    longevity: f.longevity, sillage: f.sillage, longevityHours: f.longevityHours.trim(),
    seasons: f.seasons, occasions: f.occasions,
    origin: f.origin.trim(), releaseYear: Number(f.releaseYear) || 0, perfumer: f.perfumer.trim(), similarTo: f.similarTo.trim(),
    customFields: f.customFields.map(c => ({ label: c.label.trim(), value: c.value.trim() })).filter(c => c.label && c.value),
    description: f.description.trim(), imageUrl: f.imageUrl.trim(), gallery: splitList(f.gallery),
    variants,
    price: minVariant.price,                 // "يبدأ من" — بيستخدمها الداشبورد والموقع
    oldPrice: minVariant.oldPrice || 0,
    stock: variants.reduce((s, v) => s + v.stock, 0), // إجمالي المخزون
    lowStockThreshold: Number(f.lowStockThreshold) || 5,
    badges: f.badges, isFeatured: f.isFeatured, status: f.status,
  }
}

// حالة المخزون للمنتج
function stockState(p: any): 'نفد' | 'منخفض' | 'متوفر' {
  const thr = p.lowStockThreshold ?? 5
  const vs: any[] = Array.isArray(p.variants) ? p.variants : []
  const total = Number(p.stock) || 0
  if (total === 0) return 'نفد'
  if (vs.length ? vs.some(v => v.stock <= thr) : total <= thr) return 'منخفض'
  return 'متوفر'
}

const fieldStyle: CSSProperties = { padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #ddd)', background: 'var(--bg-color, #fff)', color: 'var(--text-color, #222)', width: '100%' }
const accent = 'var(--primary-color, #8b7355)'

function Chips({ options, value, onChange, single = false }: { options: string[], value: string[], onChange: (v: string[]) => void, single?: boolean }) {
  const toggle = (o: string) => {
    if (single) return onChange([o])
    onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  }
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
    {options.map(o => {
      const on = value.includes(o)
      return <button type="button" key={o} onClick={() => toggle(o)} style={{ padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', border: `1px solid ${on ? accent : 'var(--border-color, #ddd)'}`, background: on ? accent : 'transparent', color: on ? '#fff' : 'var(--text-color, #222)' }}>{o}</button>
    })}
  </div>
}

function Rating({ value, onChange }: { value: number, onChange: (n: number) => void }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} من 5`} style={{ width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${n <= value ? accent : 'var(--border-color, #ddd)'}`, background: n <= value ? accent : 'transparent', color: n <= value ? '#fff' : 'var(--text-color, #222)', fontWeight: 'bold' }}>{n}</button>
    ))}
    <small className="muted" style={{ marginInlineStart: '8px' }}>{RATING_LABELS[value]}</small>
  </div>
}

const Group = ({ title, children }: { title: string, children: ReactNode }) => (
  <div style={{ marginTop: '14px' }}>
    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold' }}>{title}</p>
    {children}
  </div>
)

// أقسام الفورم — بتتستخدم في صفحة الإضافة وفي نافذة التعديل
function PerfumeSections({ f, set }: { f: PerfumeFormData, set: (p: Partial<PerfumeFormData>) => void }) {
  const updateVariant = (i: number, patch: Partial<VariantForm>) => set({ variants: f.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) })
  const addVariant = (size = '') => {
    if (size && f.variants.some(v => Number(v.size) === Number(size))) return
    const onlyEmpty = f.variants.length === 1 && !f.variants[0].size && !f.variants[0].price
    set({ variants: onlyEmpty ? [emptyVariant(size)] : [...f.variants, emptyVariant(size)] })
  }
  const removeVariant = (i: number) => set({ variants: f.variants.length > 1 ? f.variants.filter((_, idx) => idx !== i) : f.variants })
  const totalStock = f.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
  const prices = f.variants.map(v => Number(v.price)).filter(n => n > 0)

  return <>
    <section className="panel form-panel">
      <h2>معلومات العطر</h2>
      <div className="field-grid">
        <label>اسم العطر (عربي)<input value={f.name} onChange={e => set({ name: e.target.value })} placeholder="مثال: سوفاج" /></label>
        <label>الاسم بالإنجليزي<input dir="ltr" value={f.nameEn} onChange={e => set({ nameEn: e.target.value })} placeholder="Sauvage" /></label>
        <label>الماركة<input value={f.brand} onChange={e => set({ brand: e.target.value })} placeholder="Dior" /></label>
        <label>كود المنتج (SKU)<input dir="ltr" value={f.sku} onChange={e => set({ sku: e.target.value })} placeholder="يتولد تلقائياً لو تركته فاضي" /></label>
        <label>الفئة
          <select value={f.gender} onChange={e => set({ gender: e.target.value })}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select>
        </label>
        <label>التركيز
          <select value={f.concentration} onChange={e => set({ concentration: e.target.value })}>{CONCENTRATIONS.map(c => <option key={c}>{c}</option>)}</select>
        </label>
        <label>نوع المنتج
          <select value={f.productType} onChange={e => set({ productType: e.target.value })}>{PRODUCT_TYPES.map(c => <option key={c}>{c}</option>)}</select>
        </label>
      </div>
      <label>الوصف<textarea className="tall" value={f.description} onChange={e => set({ description: e.target.value })} placeholder="اكتب وصف العطر وشخصيته والإحساس اللي بيسيبه..." /></label>
    </section>

    <section className="panel form-panel">
      <h2>البصمة العطرية</h2>
      <Group title="العائلة العطرية (اختر واحدة أو أكثر)"><Chips options={FAMILIES} value={f.families} onChange={families => set({ families })} /></Group>
      <div className="field-grid" style={{ marginTop: '14px' }}>
        <label>النوتات العليا (Top)<input value={f.topNotes} onChange={e => set({ topNotes: e.target.value })} placeholder="برغموت، فلفل" /></label>
        <label>نوتات القلب (Middle)<input value={f.middleNotes} onChange={e => set({ middleNotes: e.target.value })} placeholder="لافندر، جيرانيوم" /></label>
        <label>نوتات القاعدة (Base)<input value={f.baseNotes} onChange={e => set({ baseNotes: e.target.value })} placeholder="عنبر، أرز" /></label>
      </div>
      <p className="muted" style={{ fontSize: '12px', margin: '6px 0 0' }}>افصل بين النوتات بفاصلة.</p>
      <Group title="الثبات"><Rating value={f.longevity} onChange={longevity => set({ longevity })} /></Group>
      <label style={{ marginTop: '10px' }}>الثبات بالساعات (تقريبي)<input value={f.longevityHours} onChange={e => set({ longevityHours: e.target.value })} placeholder="مثال: 6 - 8 ساعات" /></label>
      <Group title="الفوحان (قوة الانتشار)"><Rating value={f.sillage} onChange={sillage => set({ sillage })} /></Group>
      <Group title="الموسم"><Chips options={SEASONS} value={f.seasons} onChange={seasons => set({ seasons })} /></Group>
      <Group title="المناسبة"><Chips options={OCCASIONS} value={f.occasions} onChange={occasions => set({ occasions })} /></Group>
    </section>

    <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
      <h2>الأحجام والأسعار والمخزون</h2>
      <p className="muted" style={{ fontSize: '12px', margin: '0 0 12px' }}>كل حجم له سعره ومخزونه. العميل بيختار الحجم والسعر بيتغير معاه، والمخزون الإجمالي بيتحسب تلقائياً.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <small className="muted">إضافة سريعة:</small>
        {QUICK_SIZES.map(s => {
          const used = f.variants.some(v => Number(v.size) === s)
          return <button type="button" key={s} disabled={used} onClick={() => addVariant(String(s))} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px dashed var(--border-color, #ccc)', background: 'transparent', color: 'var(--text-color, #222)', cursor: used ? 'default' : 'pointer', opacity: used ? 0.4 : 1, fontSize: '13px' }}>{s} مل</button>
        })}
        <button type="button" onClick={() => addVariant()} className="text-button"><Plus size={14} /> حجم مخصص</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {f.variants.map((v, i) => {
          const margin = Number(v.cost) > 0 && Number(v.price) > 0 ? Math.round(((Number(v.price) - Number(v.cost)) / Number(v.price)) * 100) : null
          return <div key={i} style={{ border: '1px solid var(--border-color, #ddd)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong>{v.size ? `${v.size} مل` : 'حجم جديد'}</strong>
              <button type="button" className="icon-button" onClick={() => removeVariant(i)} title="حذف الحجم" disabled={f.variants.length === 1}><Trash2 size={17} color="red" /></button>
            </div>
            <div className="field-grid">
              <label>الحجم (مل)<input type="number" min="0" value={v.size} onChange={e => updateVariant(i, { size: e.target.value })} placeholder="100" /></label>
              <label>السعر ({CUR})<input type="number" min="0" value={v.price} onChange={e => updateVariant(i, { price: e.target.value })} placeholder="0" /></label>
              <label>السعر قبل الخصم<input type="number" min="0" value={v.oldPrice} onChange={e => updateVariant(i, { oldPrice: e.target.value })} placeholder="اختياري" /></label>
              <label>سعر التكلفة<input type="number" min="0" value={v.cost} onChange={e => updateVariant(i, { cost: e.target.value })} placeholder="للحسابات الداخلية" /></label>
              <label>الكمية في المخزون<input type="number" min="0" value={v.stock} onChange={e => updateVariant(i, { stock: e.target.value })} placeholder="0" /></label>
              <label>SKU الحجم<input dir="ltr" value={v.sku} onChange={e => updateVariant(i, { sku: e.target.value })} placeholder="اختياري" /></label>
            </div>
            {margin !== null && <small className="muted">هامش الربح: {margin}% — ربح القطعة {Number(v.price) - Number(v.cost)} {CUR}</small>}
          </div>
        })}
      </div>
      <p style={{ margin: '14px 0 0', fontSize: '14px' }}>
        الإجمالي: <strong>{totalStock}</strong> قطعة
        {prices.length > 0 && <> — يبدأ من <strong>{Math.min(...prices)} {CUR}</strong></>}
      </p>
    </section>

    <section className="panel form-panel">
      <h2>الصور</h2>
      <div className="field-grid">
        <label style={{ gridColumn: '1 / -1' }}>رابط الصورة الأساسية
          <input type="url" dir="ltr" value={f.imageUrl} onChange={e => set({ imageUrl: e.target.value })} placeholder="https://i.ibb.co/perfume.jpg" style={fieldStyle} />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>روابط الصور الإضافية (افصل بفاصلة)
          <textarea dir="ltr" value={f.gallery} onChange={e => set({ gallery: e.target.value })} placeholder="Link 1, Link 2..." style={{ ...fieldStyle, minHeight: '80px' }} />
        </label>
      </div>
      {f.imageUrl && <img src={f.imageUrl} alt="معاينة" style={{ marginTop: '12px', width: '110px', height: '110px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color, #ddd)' }} />}
    </section>

    <section className="panel form-panel">
      <h2>تفاصيل إضافية (اختياري)</h2>
      <p className="muted" style={{ fontSize: '12px', margin: '0 0 12px' }}>أي حقل فاضي مش هيظهر للعميل.</p>
      <div className="field-grid">
        <label>بلد المنشأ<input value={f.origin} onChange={e => set({ origin: e.target.value })} placeholder="فرنسا" /></label>
        <label>سنة الإصدار<input type="number" value={f.releaseYear} onChange={e => set({ releaseYear: e.target.value })} placeholder="2015" /></label>
        <label>صانع العطر (Perfumer)<input value={f.perfumer} onChange={e => set({ perfumer: e.target.value })} placeholder="François Demachy" /></label>
        <label>مستوحى من<input value={f.similarTo} onChange={e => set({ similarTo: e.target.value })} placeholder="لو نوع المنتج: مستوحى من" /></label>
      </div>
    </section>

    <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
      <h2>حقول مخصصة (بتظهر للعميل في صفحة العطر)</h2>
      <p className="muted" style={{ fontSize: '12px', margin: '0 0 12px' }}>أضف أي معلومة تحتاجها بعنوانك أنت: مثل "نوع الزجاجة" أو "طريقة الاستخدام" أو "الهدية المرفقة" أو "الضمان". مش محتاج تتقيد بحقول ثابتة.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <small className="muted">اقتراحات:</small>
        {['نوع الزجاجة', 'طريقة الاستخدام', 'الهدية المرفقة', 'الضمان', 'مدة الصلاحية', 'ملاحظة مهمة'].map(s => (
          <button type="button" key={s} onClick={() => set({ customFields: [...f.customFields, { label: s, value: '' }] })} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px dashed var(--border-color, #ccc)', background: 'transparent', color: 'var(--text-color, #222)', cursor: 'pointer', fontSize: '13px' }}>+ {s}</button>
        ))}
        <button type="button" className="text-button" onClick={() => set({ customFields: [...f.customFields, { label: '', value: '' }] })}><Plus size={14} /> حقل فارغ</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {f.customFields.length === 0 && <small className="muted">لا توجد حقول مخصصة. اضغط على اقتراح أو "حقل فارغ" لإضافة حقل.</small>}
        {f.customFields.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'start' }}>
            <input value={c.label} onChange={e => set({ customFields: f.customFields.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x) })} placeholder="العنوان (مثال: نوع الزجاجة)" style={fieldStyle} />
            <textarea value={c.value} onChange={e => set({ customFields: f.customFields.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x) })} placeholder="القيمة (مثال: زجاج مضغوط مع بخاخ معدني)" style={{ ...fieldStyle, minHeight: '44px' }} />
            <button type="button" className="icon-button" onClick={() => set({ customFields: f.customFields.filter((_, idx) => idx !== i) })} title="حذف الحقل"><Trash2 size={17} color="red" /></button>
          </div>
        ))}
      </div>
    </section>

    <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
      <h2>النشر والعلامات</h2>
      <div className="field-grid">
        <label>حالة النشر
          <select value={f.status} onChange={e => set({ status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </label>
        <label>تنبيه عند وصول الكمية إلى<input type="number" min="0" value={f.lowStockThreshold} onChange={e => set({ lowStockThreshold: e.target.value })} placeholder="5" /></label>
      </div>
      <Group title="علامات تظهر على كارت العطر"><Chips options={BADGES} value={f.badges} onChange={badges => set({ badges })} /></Group>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={f.isFeatured} onChange={e => set({ isFeatured: e.target.checked })} style={{ width: 'auto' }} />
        عرضه كعطر مميز في الصفحة الرئيسية
      </label>
    </section>
  </>
}

function AddProduct({ toast }: { toast: (m: string) => void }) {
  const [f, setF] = useState<PerfumeFormData>(emptyPerfume())
  const [loading, setLoading] = useState(false)
  const set = (patch: Partial<PerfumeFormData>) => setF(prev => ({ ...prev, ...patch }))

  const handleSave = async () => {
    const err = validatePerfume(f)
    if (err) { toast(err); return }
    setLoading(true)
    try {
      const payload = buildPayload(f)
      await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      await addDoc(collection(db, 'activity_logs'), { type: 'add', message: `تم إضافة عطر جديد: ${payload.name} (${payload.brand})`, createdAt: serverTimestamp() })
      toast('تم حفظ العطر بنجاح!')
      setF(emptyPerfume())
    } catch (error) {
      console.error(error)
      toast('حدث خطأ أثناء الحفظ، تأكد من اتصالك')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">المنتجات / جديد</p>
          <h1>إضافة عطر</h1>
          <p className="subtle">أضف بيانات العطر وأحجامه وأسعاره ومخزونه لتظهر للعميل في المتجر.</p>
        </div>
      </div>
      <div className="form-grid">
        <PerfumeSections f={f} set={set} />
        <button className="primary-button full-button" onClick={handleSave} disabled={loading} style={{ gridColumn: '1 / -1', fontSize: '16px', padding: '15px' }}>
          {loading ? 'جاري الحفظ...' : 'حفظ ونشر العطر'}
        </button>
      </div>
    </div>
  )
}

function Inventory({ toast }: { toast: (m: string) => void }) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [editing, setEditing] = useState<{ id: string, form: PerfumeFormData, prevStock: number } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => { setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) })
    return () => unsub()
  }, [])

  const logActivity = (type: string, message: string) => addDoc(collection(db, 'activity_logs'), { type, message, createdAt: serverTimestamp() })

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العطر نهائياً؟')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      await logActivity('delete', `تم حذف العطر: ${productName}`)
      toast('تم حذف العطر بنجاح')
    } catch { toast('حدث خطأ أثناء الحذف') }
  }

  const handleToggleStatus = async (p: any) => {
    const next = p.status === 'منشور' ? 'مخفي' : 'منشور'
    try {
      await updateDoc(doc(db, 'products', p.id), { status: next, updatedAt: serverTimestamp() })
      await logActivity('update', `تم تغيير حالة ${p.name} إلى ${next}`)
      toast(next === 'منشور' ? 'العطر ظاهر للعملاء الآن' : 'تم إخفاء العطر عن العملاء')
    } catch { toast('حدث خطأ أثناء التحديث') }
  }

  const handleDuplicate = async (p: any) => {
    try {
      const { id, createdAt, updatedAt, ...rest } = p
      await addDoc(collection(db, 'products'), { ...rest, name: `${p.name} (نسخة)`, sku: `PF-${Date.now().toString().slice(-6)}`, status: 'مسودة', isFeatured: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      await logActivity('add', `تم نسخ العطر: ${p.name}`)
      toast('تم إنشاء نسخة كمسودة — عدّلها وانشرها')
    } catch { toast('حدث خطأ أثناء النسخ') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    const err = validatePerfume(editing.form)
    if (err) { toast(err); return }
    setSaving(true)
    try {
      const payload = buildPayload(editing.form)
      await updateDoc(doc(db, 'products', editing.id), { ...payload, updatedAt: serverTimestamp() })
      const stockNote = payload.stock !== editing.prevStock ? ` (المخزون من ${editing.prevStock} إلى ${payload.stock})` : ''
      await logActivity('update', `تم تعديل العطر: ${payload.name}${stockNote}`)
      toast('تم تحديث العطر بنجاح!')
      setEditing(null)
    } catch (error) {
      console.error(error)
      toast('حدث خطأ أثناء التحديث')
    } finally { setSaving(false) }
  }

  const filteredProducts = products.filter(p => {
    const s = searchQuery.trim().toLowerCase()
    const hay = [p.name, p.nameEn, p.brand, p.sku, ...(Array.isArray(p.variants) ? p.variants.map((v: any) => v.sku) : [])].filter(Boolean).join(' ').toLowerCase()
    const matchSearch = !s || hay.includes(s)
    const matchGender = !genderFilter || p.gender === genderFilter
    const state = stockState(p)
    const matchStock = !stockFilter || (stockFilter === 'low' ? state === 'منخفض' : stockFilter === 'out' ? state === 'نفد' : state === 'متوفر')
    return matchSearch && matchGender && matchStock
  })

  const stats = useMemo(() => {
    let units = 0, value = 0, cost = 0, low = 0, out = 0
    products.forEach(p => {
      units += Number(p.stock) || 0
      const vs: any[] = Array.isArray(p.variants) ? p.variants : []
      vs.forEach(v => { value += v.price * v.stock; cost += (v.cost || 0) * v.stock })
      const s = stockState(p)
      if (s === 'منخفض') low++
      if (s === 'نفد') out++
    })
    return { total: products.length, units, value, cost, low, out }
  }, [products])

  const selStyle: CSSProperties = { background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer' }

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إدارة المتجر</p>
          <h1>المخزون الشامل</h1>
          <p className="subtle">تابع كميات كل حجم، عدّل الأسعار والتفاصيل، وتحكم في ظهور العطور للعملاء.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Droplets} label="عدد العطور" value={String(stats.total)} trend={`${stats.units} قطعة`} accent="green" />
        <StatCard icon={CircleDollarSign} label="قيمة المخزون (بيع)" value={`${stats.value.toLocaleString('ar-EG')} ${CUR}`} trend={stats.cost ? `ربح متوقع ${(stats.value - stats.cost).toLocaleString('ar-EG')}` : 'أضف سعر التكلفة'} accent="purple" />
        <StatCard icon={AlertTriangle} label="مخزون منخفض" value={String(stats.low)} trend="يحتاج تجديد" accent="gold" />
        <StatCard icon={Box} label="نفد من المخزون" value={String(stats.out)} trend="غير متاح للبيع" accent="blue" />
      </div>

      <section className="panel">
        <div className="toolbar" style={{ marginBottom: '15px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-field" style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 10px' }}>
            <Search size={17} style={{ color: 'var(--muted)' }} />
            <input placeholder="ابحث بالاسم أو الماركة أو SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', outline: 'none', color: 'var(--text-color)' }} />
          </div>
          <select style={selStyle} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
            <option value="">رجالي وحريمي</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select style={selStyle} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
            <option value="">كل حالات المخزون</option>
            <option value="ok">متوفر</option>
            <option value="low">منخفض</option>
            <option value="out">نفد</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>صورة</th>
                <th>العطر</th>
                <th>التصنيف</th>
                <th>الأحجام والمخزون</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>النشر</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>لا توجد عطور مطابقة. جرّب تغيير البحث أو الفلاتر.</td></tr>
              ) : (
                filteredProducts.map(p => {
                  const state = stockState(p)
                  const thr = p.lowStockThreshold ?? 5
                  const vs: any[] = Array.isArray(p.variants) ? p.variants : []
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', background: 'var(--border-color, #eee)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="#999" /></div>
                        )}
                      </td>
                      <td>
                        <strong>{p.name}</strong>{p.isFeatured && <span title="عطر مميز"> ⭐</span>}<br />
                        <small className="muted">{p.brand}{p.sku ? ` — ${p.sku}` : ''}</small>
                      </td>
                      <td>
                        <small style={{ display: 'block' }}>{p.gender} — {p.concentration}</small>
                        <small className="muted" style={{ display: 'block' }}>{p.productType}{p.families?.length ? ` — ${p.families.join('، ')}` : ''}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {vs.length === 0 && <small className="muted">لا توجد أحجام</small>}
                          {vs.map((v, i) => (
                            <span key={i} className={`status ${v.stock === 0 ? 'status-danger' : v.stock <= thr ? 'status-warning' : 'status-success'}`} title={`سعر ${v.price} ${CUR}`}>
                              <i />{v.size} مل · {v.stock}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong>{p.price} {CUR}</strong>
                        {vs.length > 1 && <small className="muted" style={{ display: 'block' }}>يبدأ من</small>}
                        {p.oldPrice > 0 && <small className="muted" style={{ display: 'block', textDecoration: 'line-through' }}>{p.oldPrice} {CUR}</small>}
                      </td>
                      <td>
                        <span className={`status ${state === 'نفد' ? 'status-danger' : state === 'منخفض' ? 'status-warning' : 'status-success'}`}><i />{state}</span>
                        <small className="muted" style={{ display: 'block' }}>{p.stock} قطعة</small>
                      </td>
                      <td><Status>{p.status || 'منشور'}</Status></td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="icon-button" onClick={() => setEditing({ id: p.id, form: formFromProduct(p), prevStock: Number(p.stock) || 0 })} title="تعديل"><Edit size={18} /></button>
                          <button className="icon-button" onClick={() => handleToggleStatus(p)} title={p.status === 'منشور' ? 'إخفاء عن العملاء' : 'نشر'}>{p.status === 'منشور' ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                          <button className="icon-button" onClick={() => handleDuplicate(p)} title="نسخ كمسودة"><Copy size={18} /></button>
                          <button className="icon-button" onClick={() => handleDelete(p.id, p.name)} title="حذف"><Trash2 size={18} color="red" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* نافذة التعديل — نفس فورم الإضافة بالظبط */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '94%', maxWidth: '900px', background: 'var(--bg-color, #fff)', color: 'var(--text-color, #222)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid var(--border-color, #eee)' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>تعديل: {editing.form.name || 'عطر'}</h2>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '5px' }} title="إغلاق"><X size={24} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PerfumeSections f={editing.form} set={patch => setEditing(prev => prev ? { ...prev, form: { ...prev.form, ...patch } } : prev)}  />
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '14px 22px', borderTop: '1px solid var(--border-color, #eee)' }}>
              <button className="primary-button" style={{ flex: 1, padding: '12px', fontSize: '16px', display: 'flex', justifyContent: 'center' }} onClick={handleUpdate} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
              <button className="text-button" onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function Orders({ toast }: { toast: (m: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // للنافذة المنبثقة

  // جلب الطلبات من فايربيز (هنعمل جدول اسمه orders)
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // تحديث حالة الطلب
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast('تم تحديث حالة الطلب بنجاح');
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (error) {
      toast('حدث خطأ أثناء التحديث');
    }
  };

  // فتح محادثة واتساب
  const openWhatsApp = (phone: string) => {
    // تنسيق رقم الهاتف (بافتراض أرقام مصر +20)
    let formattedPhone = phone.startsWith('0') ? '2' + phone : phone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إدارة المبيعات</p>
          <h1>طلبات العملاء</h1>
          <p className="subtle">تابع الطلبات الجديدة، تواصل مع العملاء، وحدّث حالة الشحن.</p>
        </div>
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>المنتج</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل الطلبات...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد طلبات حتى الآن.</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id}>
                    <td className="muted">{o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleDateString('ar-EG') : 'جديد'}</td>
                    <td>
                      <strong>{o.customerName}</strong><br />
                      <small className="muted">{o.customerPhone}</small>
                    </td>
                    <td>
                      <strong>{o.productName}</strong>
                      <small style={{ display: 'block' }}>{o.size ? `الحجم: ${o.size}` : ''}</small>
                    </td>
                    <td><strong>{o.totalPrice} {CUR}</strong></td>
                    <td>
                      <select
                        value={o.status || 'جديد'}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                      >
                        <option value="جديد">🔵 جديد</option>
                        <option value="تم التأكيد">🟡 تم التأكيد</option>
                        <option value="جاري الشحن">🟠 جاري الشحن</option>
                        <option value="تم التوصيل">🟢 تم التوصيل</option>
                        <option value="ملغي">🔴 ملغي</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-button" onClick={() => setSelectedOrder(o)} title="عرض التفاصيل">
                          <Eye size={18} />
                        </button>
                        <button className="icon-button" onClick={() => openWhatsApp(o.customerPhone)} title="مراسلة واتساب">
                          <MessageCircle size={18} color="#25D366" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: '90%', maxWidth: '500px', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#111' }}>تفاصيل الطلب</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#333' }}>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>بيانات العميل</h3>
                <p style={{ margin: '5px 0' }}><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                <p style={{ margin: '5px 0' }}><strong>الهاتف:</strong> <span dir="ltr">{selectedOrder.customerPhone}</span></p>
                <p style={{ margin: '5px 0' }}><strong>العنوان بالتفصيل:</strong> {selectedOrder.address}</p>
              </div>

              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>تفاصيل المنتج</h3>
                <p style={{ margin: '5px 0' }}><strong>المنتج:</strong> {selectedOrder.productName}</p>
                <p style={{ margin: '5px 0' }}><strong>الكمية:</strong> {selectedOrder.quantity || 1}</p>
                                <p style={{ margin: '5px 0' }}><strong>الحجم:</strong> {selectedOrder.size || 'لم يحدد'}</p>
                <p style={{ margin: '5px 0', fontSize: '18px', color: 'var(--primary-color)' }}><strong>الإجمالي:</strong> {selectedOrder.totalPrice} {CUR}</p>
              </div>
            </div>

            <button
              className="primary-button"
              style={{ width: '100%', padding: '12px', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', backgroundColor: '#25D366' }}
              onClick={() => openWhatsApp(selectedOrder.customerPhone)}
            >
              <MessageCircle size={20} /> تواصل لتأكيد الطلب
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function Customers({ toast }: { toast: (m: string) => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب بيانات العملاء من قاعدة البيانات
  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // دالة لفتح الواتساب مباشرة
  const openWhatsApp = (phone: string) => {
    if (!phone) return;
    let formattedPhone = phone.startsWith('0') ? '2' + phone : phone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إدارة العملاء</p>
          <h1>قاعدة بيانات العملاء</h1>
          <p className="subtle">تتبع بيانات عملائك، وتواصل معهم لزيادة مبيعاتك.</p>
        </div>
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الطلبات</th>
                <th>إجمالي المدفوعات</th>
                <th>تاريخ الانضمام</th>
                <th>تواصل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>جاري تحميل بيانات العملاء...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا يوجد عملاء مسجلين حتى الآن.</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>{c.phone}</td>
                    <td>{c.totalOrders || 1} طلب</td>
                    <td><strong style={{ color: 'var(--primary-color)' }}>{c.totalSpent || 0} {CUR}</strong></td>
                    <td className="muted">
                      {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleDateString('ar-EG') : 'جديد'}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => openWhatsApp(c.phone)}
                        title="مراسلة واتساب"
                      >
                        <MessageCircle size={18} color="#25D366" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Coupons({ toast }: { toast: (m: string) => void }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);

  // جلب الكوبونات من قاعدة البيانات
  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // إضافة كوبون جديد
  const handleAdd = async () => {
    if (!code || !discount) {
      toast('يرجى كتابة كود الخصم ونسبة الخصم');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: code.toUpperCase(), // بنحفظه حروف كابيتال عشان يكون شكله احترافي
        discount: Number(discount),
        active: true,
        createdAt: serverTimestamp()
      });
      setCode('');
      setDiscount('');
      toast('تم إضافة الكوبون بنجاح');
    } catch (error) {
      toast('حدث خطأ أثناء الإضافة');
    } finally {
      setLoading(false);
    }
  };

  // حذف كوبون
  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من إيقاف وحذف هذا الكوبون؟')) {
      await deleteDoc(doc(db, 'coupons', id));
      toast('تم حذف الكوبون بنجاح');
    }
  };

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إدارة التسويق</p>
          <h1>الكوبونات والخصومات</h1>
          <p className="subtle">أنشئ أكواد خصم لعملائك لزيادة المبيعات والتحويلات.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <h2>إضافة كوبون جديد</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="كود الخصم (مثال: EID20)"
            style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          />
          <input
            type="number"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            placeholder="نسبة الخصم % (مثال: 15)"
            style={{ flex: 1, minWidth: '150px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          />
          <button className="primary-button" onClick={handleAdd} disabled={loading}>
            {loading ? 'جاري...' : 'إضافة الكوبون'}
          </button>
        </div>

        <h2>الكوبونات الفعالة</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>كود الخصم</th>
                <th>نسبة الخصم</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '15px' }}>لا توجد كوبونات حالياً.</td></tr> : null}
              {coupons.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ background: 'var(--bg-color)', border: '1px dashed var(--border-color)', padding: '5px 10px', borderRadius: '4px', letterSpacing: '2px' }}>
                      {c.code}
                    </strong>
                  </td>
                  <td><strong style={{ color: 'var(--primary-color)' }}>{c.discount}%</strong></td>
                  <td><Status>{c.active ? 'منشور' : 'متوقف'}</Status></td>
                  <td>
                    <button className="icon-button" onClick={() => handleDelete(c.id)}>
                      <X size={18} color="red" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب النشاطات من الجدول المخصص لها
    const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">مراقبة النظام</p>
          <h1>سجل النشاطات</h1>
          <p className="subtle">تابع كل التعديلات والحذف والإضافات في متجرك.</p>
        </div>
      </div>

      <section className="panel">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل السجل...</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>لا توجد نشاطات حتى الآن.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 20px' }}>
            {logs.map((item, index) => (
              <div key={item.id} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: index !== logs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>

                {/* أيقونة الحركة بناءً على نوعها */}
                <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.type === 'delete' ? <Trash2 size={20} color="red" /> :
                    item.type === 'update' ? <Edit size={20} color="orange" /> :
                      <Activity size={20} color="var(--primary-color)" />}
                </div>

                {/* تفاصيل الحركة */}
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: 'var(--text-color)' }}>
                    <strong>{item.message}</strong>
                  </p>
                  <small className="muted">
                    <Clock3 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '5px' }} />
                    {item.createdAt && typeof item.createdAt.toDate === 'function'
                      ? new Date(item.createdAt.toDate()).toLocaleString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'الآن'}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function StoreSettings({ toast }: { toast: (m: string) => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // جلب الإعلانات من قاعدة البيانات
  useEffect(() => {
    const docRef = doc(db, 'settings', 'announcements');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // حفظ التعديلات في قاعدة البيانات
  const handleSave = async (updatedMessages: string[]) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'announcements'), { messages: updatedMessages });
      toast('تم تحديث شريط الإعلانات بنجاح');
    } catch (error) {
      toast('حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  const addMessage = () => {
    if (!newMessage.trim()) return;
    const updated = [...messages, newMessage];
    setMessages(updated);
    setNewMessage('');
    handleSave(updated);
  };

  const removeMessage = (index: number) => {
    const updated = messages.filter((_, i) => i !== index);
    setMessages(updated);
    handleSave(updated);
  };

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إعدادات المتجر</p>
          <h1>شريط الإعلانات العُلوي</h1>
          <p className="subtle">أضف أو احذف الرسائل المتحركة التي تظهر للعملاء أعلى الموقع.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <h2>إضافة إعلان جديد</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="مثال: 🚚 شحن مجاني للطلبات فوق 500 جنيه..."
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}
          />
          <button className="primary-button" onClick={addMessage} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </div>

        <h2>الإعلانات الحالية</h2>
        {loading ? <p>جاري التحميل...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && <p className="muted" style={{ padding: '10px 0' }}>لا توجد إعلانات حالياً.</p>}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>{msg}</strong>
                <button className="icon-button" onClick={() => removeMessage(idx)} title="حذف الإعلان">
                  <X size={18} color="red" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
// =====================================================================
//  الحسابات والمبيعات — تسجيل البيع والتكلفة والهامش والمصروفات + تصدير Excel
// =====================================================================
const CHANNELS = ['واتساب', 'الموقع', 'انستجرام', 'فيسبوك', 'محل / مباشر', 'أخرى']
const PAY_METHODS = ['كاش', 'فودافون كاش', 'إنستا باي', 'تحويل بنكي', 'عند الاستلام']
const PAY_STATUS = ['مدفوع', 'آجل']
const EXPENSE_CATS = ['شحن وتوصيل', 'تغليف', 'إعلانات وتسويق', 'إيجار', 'مرتبات', 'فواتير ومرافق', 'صيانة', 'أخرى']
const RANGES: [string, string][] = [['today', 'اليوم'], ['week', 'آخر 7 أيام'], ['month', 'هذا الشهر'], ['year', 'هذه السنة'], ['all', 'الكل'], ['custom', 'فترة مخصصة']]

type SaleForm = {
  date: string; productId: string; productName: string; size: string; qty: string
  unitPrice: string; unitCost: string; discount: string
  customerName: string; phone: string; channel: string; paymentMethod: string; paymentStatus: string
  notes: string; deductStock: boolean; orderId: string
}
type ExpenseForm = { date: string; category: string; amount: string; method: string; notes: string }

const num = (v: any) => Number(v) || 0
const localStr = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const todayStr = () => localStr(new Date())
const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('ar-EG')} ${CUR}`
const showDate = (s: string) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString('ar-EG') : '')
const emptySale = (): SaleForm => ({
  date: todayStr(), productId: '', productName: '', size: '', qty: '1', unitPrice: '', unitCost: '', discount: '',
  customerName: '', phone: '', channel: 'واتساب', paymentMethod: 'كاش', paymentStatus: 'مدفوع', notes: '', deductStock: true, orderId: '',
})
const emptyExpense = (): ExpenseForm => ({ date: todayStr(), category: EXPENSE_CATS[0], amount: '', method: 'كاش', notes: '' })

function calcSale(f: { qty: any, unitPrice: any, unitCost: any, discount: any }) {
  const revenue = Math.max(0, num(f.qty) * num(f.unitPrice) - num(f.discount))
  const cost = num(f.qty) * num(f.unitCost)
  const profit = revenue - cost
  return { revenue, cost, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0 }
}

function downloadCSV(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => (typeof v === 'number' ? String(v) : `"${String(v ?? '').replace(/"/g, '""')}"`)
  const csv = '\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

// تعديل مخزون حجم معين (delta سالب = خصم، موجب = إرجاع)
async function adjustStock(productId: string, sizeMl: number, delta: number) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'products', productId)
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const p: any = snap.data()
    const vs: any[] = Array.isArray(p.variants) ? p.variants.map((v: any) => ({ ...v })) : []
    if (vs.length) {
      const v = vs.find(x => num(x.size) === sizeMl) || (vs.length === 1 ? vs[0] : null)
      if (!v) return
      v.stock = Math.max(0, num(v.stock) + delta)
      tx.update(ref, { variants: vs, stock: vs.reduce((s, x) => s + num(x.stock), 0), updatedAt: serverTimestamp() })
    } else {
      tx.update(ref, { stock: Math.max(0, num(p.stock) + delta), updatedAt: serverTimestamp() })
    }
  })
}

function KpiCard({ icon: Icon, label, value, sub, accent, tone }: { icon: typeof Zap, label: string, value: string, sub?: string, accent: string, tone?: string }) {
  return <div className="stat-card">
    <div className={`stat-icon ${accent}`}><Icon size={19} /></div>
    <div className="stat-copy"><span>{label}</span><strong style={tone ? { color: tone } : undefined}>{value}</strong>{sub && <small className="muted">{sub}</small>}</div>
  </div>
}

function Accounting({ toast }: { toast: (m: string) => void }) {
  const [tab, setTab] = useState<'summary' | 'sales' | 'expenses' | 'orders'>('summary')
  const [range, setRange] = useState('month')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [saleModal, setSaleModal] = useState<{ id?: string, form: SaleForm } | null>(null)
  const [expModal, setExpModal] = useState<{ id?: string, form: ExpenseForm } | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const subs = [
      onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), s => setSales(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')), s => setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })))),
    ]
    return () => subs.forEach(u => u())
  }, [])

  const inPeriod = (date: string) => {
    if (!date) return range === 'all'
    const t = todayStr()
    if (range === 'all') return true
    if (range === 'today') return date === t
    if (range === 'week') { const d = new Date(); d.setDate(d.getDate() - 6); return date >= localStr(d) && date <= t }
    if (range === 'month') return date.slice(0, 7) === t.slice(0, 7)
    if (range === 'year') return date.slice(0, 4) === t.slice(0, 4)
    return (!from || date >= from) && (!to || date <= to)
  }

  const fSales = useMemo(() => sales.filter(s => inPeriod(s.date)).sort((a, b) => String(b.date).localeCompare(String(a.date))), [sales, range, from, to])
  const fExpenses = useMemo(() => expenses.filter(e => inPeriod(e.date)).sort((a, b) => String(b.date).localeCompare(String(a.date))), [expenses, range, from, to])

  const k = useMemo(() => {
    const revenue = fSales.reduce((s, x) => s + num(x.revenue), 0)
    const cost = fSales.reduce((s, x) => s + num(x.cost), 0)
    const gross = revenue - cost
    const exp = fExpenses.reduce((s, x) => s + num(x.amount), 0)
    const units = fSales.reduce((s, x) => s + num(x.qty), 0)
    const pending = fSales.filter(x => x.paymentStatus === 'آجل').reduce((s, x) => s + num(x.revenue), 0)
    return { revenue, cost, gross, exp, net: gross - exp, units, count: fSales.length, margin: revenue > 0 ? (gross / revenue) * 100 : 0, avg: fSales.length ? revenue / fSales.length : 0, pending }
  }, [fSales, fExpenses])

  const topProducts = useMemo(() => {
    const m = new Map<string, any>()
    fSales.forEach(s => {
      const key = s.productName || '—'
      const r = m.get(key) || { name: key, units: 0, revenue: 0, profit: 0 }
      r.units += num(s.qty); r.revenue += num(s.revenue); r.profit += num(s.profit)
      m.set(key, r)
    })
    return Array.from(m.values()).sort((a, b) => b.profit - a.profit).slice(0, 8)
  }, [fSales])

  const byChannel = useMemo(() => {
    const m = new Map<string, any>()
    fSales.forEach(s => { const key = s.channel || 'أخرى'; const r = m.get(key) || { name: key, count: 0, revenue: 0, profit: 0 }; r.count++; r.revenue += num(s.revenue); r.profit += num(s.profit); m.set(key, r) })
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue)
  }, [fSales])

  const byMonth = useMemo(() => {
    const m = new Map<string, any>()
    const row = (key: string) => m.get(key) || { month: key, count: 0, revenue: 0, cost: 0, profit: 0, exp: 0 }
    fSales.forEach(s => { const key = String(s.date).slice(0, 7); const r = row(key); r.count++; r.revenue += num(s.revenue); r.cost += num(s.cost); r.profit += num(s.profit); m.set(key, r) })
    fExpenses.forEach(e => { const key = String(e.date).slice(0, 7); const r = row(key); r.exp += num(e.amount); m.set(key, r) })
    return Array.from(m.values()).sort((a, b) => b.month.localeCompare(a.month))
  }, [fSales, fExpenses])

  const pendingOrders = useMemo(() => orders.filter(o => !o.saleRecorded && o.status !== 'ملغي'), [orders])
  const shownSales = fSales.filter(s => !search.trim() || [s.productName, s.customerName, s.phone, s.notes].filter(Boolean).join(' ').toLowerCase().includes(search.trim().toLowerCase()))

  const log = (type: string, message: string) => addDoc(collection(db, 'activity_logs'), { type, message, createdAt: serverTimestamp() })

  // ---------- المبيعات ----------
  const setSale = (patch: Partial<SaleForm>) => setSaleModal(m => (m ? { ...m, form: { ...m.form, ...patch } } : m))
  const pickProduct = (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) { setSale({ productId: '', size: '' }); return }
    const v = Array.isArray(p.variants) && p.variants.length ? p.variants[0] : null
    setSale({ productId: id, productName: p.name, size: v ? String(v.size) : '', unitPrice: String(v ? v.price : num(p.price)), unitCost: String(v ? num(v.cost) : 0), deductStock: true })
  }
  const pickSize = (size: string) => {
    const p = products.find(x => x.id === saleModal?.form.productId)
    const v = p && Array.isArray(p.variants) ? p.variants.find((x: any) => String(x.size) === size) : null
    setSale(v ? { size, unitPrice: String(v.price), unitCost: String(num(v.cost)) } : { size })
  }
  const saleFromOrder = (o: any): SaleForm => {
    const pr = products.find(p => p.id === o.productId)
    const sizeMl = num(o.sizeMl) || num(String(o.size || '').replace(/[^\d.]/g, ''))
    const v = pr && Array.isArray(pr.variants) ? pr.variants.find((x: any) => num(x.size) === sizeMl) : null
    const qty = num(o.quantity) || 1
    return {
      ...emptySale(), productId: pr ? pr.id : '', productName: o.productName || '', size: sizeMl ? String(sizeMl) : '',
      qty: String(qty), unitPrice: String(o.price != null ? o.price : num(o.totalPrice) / qty), unitCost: String(num(v?.cost)),
      customerName: o.customerName || '', phone: o.customerPhone || '', channel: 'الموقع', paymentMethod: 'عند الاستلام',
      paymentStatus: o.status === 'تم التوصيل' ? 'مدفوع' : 'آجل', deductStock: !!pr, orderId: o.id,
    }
  }
  const openEditSale = (s: any) => setSaleModal({
    id: s.id,
    form: {
      date: s.date || todayStr(), productId: s.productId || '', productName: s.productName || '', size: s.sizeMl ? String(s.sizeMl) : '', qty: String(s.qty ?? 1),
      unitPrice: String(s.unitPrice ?? ''), unitCost: String(s.unitCost ?? ''), discount: s.discount ? String(s.discount) : '',
      customerName: s.customerName || '', phone: s.phone || '', channel: s.channel || 'أخرى', paymentMethod: s.paymentMethod || 'كاش',
      paymentStatus: s.paymentStatus || 'مدفوع', notes: s.notes || '', deductStock: false, orderId: s.orderId || '',
    },
  })

  const saveSale = async () => {
    if (!saleModal) return
    const f = saleModal.form
    if (!f.productName.trim()) { toast('اكتب أو اختر اسم المنتج'); return }
    if (!(num(f.qty) > 0)) { toast('الكمية لازم تكون أكبر من صفر'); return }
    if (f.unitPrice.trim() === '') { toast('اكتب سعر البيع'); return }
    const c = calcSale(f)
    const pr = products.find(p => p.id === f.productId)
    const payload = {
      date: f.date, productId: f.productId, productName: f.productName.trim(), brand: pr?.brand || '', sizeMl: num(f.size),
      qty: num(f.qty), unitPrice: num(f.unitPrice), unitCost: num(f.unitCost), discount: num(f.discount),
      revenue: c.revenue, cost: c.cost, profit: c.profit, margin: Math.round(c.margin * 10) / 10,
      customerName: f.customerName.trim(), phone: f.phone.trim(), channel: f.channel, paymentMethod: f.paymentMethod,
      paymentStatus: f.paymentStatus, notes: f.notes.trim(), orderId: f.orderId,
    }
    setSaving(true)
    try {
      if (saleModal.id) {
        await updateDoc(doc(db, 'sales', saleModal.id), { ...payload, updatedAt: serverTimestamp() })
        await log('update', `تم تعديل عملية بيع: ${payload.productName}`)
        toast('تم تعديل عملية البيع (المخزون ما اتغيرش)')
      } else {
        const ref = await addDoc(collection(db, 'sales'), { ...payload, stockDeducted: false, createdAt: serverTimestamp() })
        if (f.deductStock && f.productId) {
          await adjustStock(f.productId, num(f.size), -num(f.qty))
          await updateDoc(ref, { stockDeducted: true })
        }
        if (f.orderId) await updateDoc(doc(db, 'orders', f.orderId), { saleRecorded: true, saleId: ref.id })
        await log('add', `تم تسجيل بيع: ${payload.productName} × ${payload.qty} بربح ${Math.round(c.profit)} ${CUR}`)
        toast(f.deductStock && f.productId ? 'تم تسجيل البيع وخصم الكمية من المخزون' : 'تم تسجيل البيع')
      }
      setSaleModal(null)
    } catch (e) { console.error(e); toast('حدث خطأ أثناء الحفظ') } finally { setSaving(false) }
  }

  const deleteSale = async (s: any) => {
    if (!confirm('حذف عملية البيع دي نهائياً؟')) return
    try {
      if (s.stockDeducted && s.productId && confirm('ترجّع الكمية للمخزون؟')) await adjustStock(s.productId, num(s.sizeMl), num(s.qty))
      await deleteDoc(doc(db, 'sales', s.id))
      if (s.orderId) { try { await updateDoc(doc(db, 'orders', s.orderId), { saleRecorded: false, saleId: '' }) } catch { /* الطلب اتمسح */ } }
      await log('delete', `تم حذف عملية بيع: ${s.productName}`)
      toast('تم حذف عملية البيع')
    } catch { toast('حدث خطأ أثناء الحذف') }
  }

  // ---------- المصروفات ----------
  const saveExpense = async () => {
    if (!expModal) return
    const f = expModal.form
    if (!(num(f.amount) > 0)) { toast('اكتب مبلغ المصروف'); return }
    setSaving(true)
    try {
      const payload = { date: f.date, category: f.category, amount: num(f.amount), method: f.method, notes: f.notes.trim() }
      if (expModal.id) await updateDoc(doc(db, 'expenses', expModal.id), { ...payload, updatedAt: serverTimestamp() })
      else await addDoc(collection(db, 'expenses'), { ...payload, createdAt: serverTimestamp() })
      await log('add', `مصروف ${f.category}: ${num(f.amount)} ${CUR}`)
      toast('تم حفظ المصروف')
      setExpModal(null)
    } catch { toast('حدث خطأ أثناء الحفظ') } finally { setSaving(false) }
  }
  const deleteExpense = async (e: any) => {
    if (!confirm('حذف المصروف ده؟')) return
    try { await deleteDoc(doc(db, 'expenses', e.id)); toast('تم حذف المصروف') } catch { toast('حدث خطأ أثناء الحذف') }
  }

  // ---------- التصدير ----------
  const exportSales = () => downloadCSV(`مبيعات-${todayStr()}.csv`, [
    ['التاريخ', 'المنتج', 'الماركة', 'الحجم (مل)', 'الكمية', 'سعر البيع', 'خصم', 'التكلفة للقطعة', 'الإجمالي', 'إجمالي التكلفة', 'الربح', 'الهامش %', 'العميل', 'الهاتف', 'قناة البيع', 'طريقة الدفع', 'حالة الدفع', 'ملاحظات'],
    ...fSales.map(s => [s.date, s.productName, s.brand || '', num(s.sizeMl), num(s.qty), num(s.unitPrice), num(s.discount), num(s.unitCost), num(s.revenue), num(s.cost), num(s.profit), num(s.margin), s.customerName || '', s.phone || '', s.channel || '', s.paymentMethod || '', s.paymentStatus || '', s.notes || '']),
  ])
  const exportExpenses = () => downloadCSV(`مصروفات-${todayStr()}.csv`, [
    ['التاريخ', 'النوع', 'المبلغ', 'طريقة الدفع', 'ملاحظات'],
    ...fExpenses.map(e => [e.date, e.category, num(e.amount), e.method || '', e.notes || '']),
  ])
  const exportSummary = () => downloadCSV(`ملخص-الحسابات-${todayStr()}.csv`, [
    ['البند', 'القيمة'],
    ['إجمالي المبيعات', Math.round(k.revenue)], ['تكلفة البضاعة', Math.round(k.cost)], ['إجمالي الربح', Math.round(k.gross)],
    ['هامش الربح %', Math.round(k.margin * 10) / 10], ['المصروفات', Math.round(k.exp)], ['صافي الربح', Math.round(k.net)],
    ['عدد العمليات', k.count], ['عدد القطع المباعة', k.units], ['آجل غير محصّل', Math.round(k.pending)], [],
    ['الشهر', 'عدد العمليات', 'المبيعات', 'التكلفة', 'الربح', 'المصروفات', 'صافي الربح'],
    ...byMonth.map(r => [r.month, r.count, Math.round(r.revenue), Math.round(r.cost), Math.round(r.profit), Math.round(r.exp), Math.round(r.profit - r.exp)]),
  ])

  const tabBtn = (id: typeof tab, label: string, badge?: number) => (
    <button key={id} onClick={() => setTab(id)} style={{ padding: '9px 18px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600, border: `1px solid ${tab === id ? accent : 'var(--border-color, #ddd)'}`, background: tab === id ? accent : 'transparent', color: tab === id ? '#fff' : 'var(--text-color, #222)' }}>
      {label}{badge ? <span style={{ marginInlineStart: '6px', background: '#d9534f', color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '12px' }}>{badge}</span> : null}
    </button>
  )
  const selStyle: CSSProperties = { background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-color)', padding: '9px 14px', borderRadius: '8px', cursor: 'pointer' }
  const live = saleModal ? calcSale(saleModal.form) : null
  const modalShell = (title: string, onClose: () => void, body: ReactNode, footer: ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: '94%', maxWidth: '780px', background: 'var(--bg-color, #fff)', color: 'var(--text-color, #222)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid var(--border-color, #eee)' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }} title="إغلاق"><X size={24} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '18px 22px' }}>{body}</div>
        <div style={{ display: 'flex', gap: '10px', padding: '14px 22px', borderTop: '1px solid var(--border-color, #eee)' }}>{footer}</div>
      </div>
    </div>
  )
  const selProduct = saleModal ? products.find(p => p.id === saleModal.form.productId) : null

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">الحسابات</p>
          <h1>الحسابات والمبيعات</h1>
          <p className="subtle">سجّل كل بيعة بسعرها وتكلفتها، وتابع الربح والهامش والمصروفات، وصدّر التقارير لـ Excel.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary-button" onClick={() => setSaleModal({ form: emptySale() })}><Plus size={17} /> تسجيل بيع</button>
          <button className="text-button" onClick={() => setExpModal({ form: emptyExpense() })}><Wallet size={16} /> إضافة مصروف</button>
        </div>
      </div>

      <section className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {tabBtn('summary', 'الملخص')}{tabBtn('sales', 'المبيعات')}{tabBtn('expenses', 'المصروفات')}{tabBtn('orders', 'طلبات الموقع', pendingOrders.length)}
        <span style={{ flex: 1 }} />
        <select style={selStyle} value={range} onChange={e => setRange(e.target.value)}>{RANGES.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select>
        {range === 'custom' && <>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={selStyle} />
          <span>إلى</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={selStyle} />
        </>}
      </section>

      {tab === 'summary' && <>
        <div className="stats-grid">
          <KpiCard icon={CircleDollarSign} label="إجمالي المبيعات" value={money(k.revenue)} sub={`${k.count} عملية · ${k.units} قطعة`} accent="green" />
          <KpiCard icon={Box} label="تكلفة البضاعة" value={money(k.cost)} sub="سعر شراء القطع المباعة" accent="blue" />
          <KpiCard icon={TrendingUp} label="إجمالي الربح" value={money(k.gross)} sub="المبيعات − التكلفة" accent="purple" tone={k.gross < 0 ? '#d9534f' : undefined} />
          <KpiCard icon={BarChart3} label="هامش الربح" value={`${Math.round(k.margin * 10) / 10}%`} sub="الربح ÷ المبيعات" accent="gold" />
          <KpiCard icon={Wallet} label="المصروفات" value={money(k.exp)} sub={`${fExpenses.length} مصروف`} accent="blue" />
          <KpiCard icon={Calculator} label="صافي الربح" value={money(k.net)} sub="بعد خصم المصروفات" accent="green" tone={k.net < 0 ? '#d9534f' : '#2e9e5b'} />
          <KpiCard icon={Receipt} label="متوسط قيمة البيعة" value={money(k.avg)} accent="purple" />
          <KpiCard icon={Clock3} label="آجل غير محصّل" value={money(k.pending)} sub="مبيعات بحالة آجل" accent="gold" tone={k.pending > 0 ? '#d68910' : undefined} />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '4px 0 14px' }}>
          <button className="text-button" onClick={exportSummary}><Download size={15} /> تصدير الملخص (Excel)</button>
          <button className="text-button" onClick={exportSales}><Download size={15} /> تصدير المبيعات</button>
          <button className="text-button" onClick={exportExpenses}><Download size={15} /> تصدير المصروفات</button>
        </div>

        <section className="panel">
          <div className="panel-heading"><div><h2>أكثر العطور ربحاً</h2><p>مرتبة حسب صافي الربح في الفترة المختارة</p></div></div>
          <div className="table-scroll"><table>
            <thead><tr><th>العطر</th><th>القطع</th><th>المبيعات</th><th>الربح</th></tr></thead>
            <tbody>
              {topProducts.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>لا توجد مبيعات في الفترة دي.</td></tr>}
              {topProducts.map(r => <tr key={r.name}><td><strong>{r.name}</strong></td><td>{r.units}</td><td>{money(r.revenue)}</td><td style={{ color: r.profit < 0 ? '#d9534f' : '#2e9e5b' }}><strong>{money(r.profit)}</strong></td></tr>)}
            </tbody>
          </table></div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>المبيعات حسب القناة</h2></div></div>
          <div className="table-scroll"><table>
            <thead><tr><th>القناة</th><th>العمليات</th><th>المبيعات</th><th>الربح</th></tr></thead>
            <tbody>
              {byChannel.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>لا توجد بيانات.</td></tr>}
              {byChannel.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.count}</td><td>{money(r.revenue)}</td><td>{money(r.profit)}</td></tr>)}
            </tbody>
          </table></div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>الملخص الشهري</h2></div></div>
          <div className="table-scroll"><table>
            <thead><tr><th>الشهر</th><th>العمليات</th><th>المبيعات</th><th>التكلفة</th><th>الربح</th><th>المصروفات</th><th>صافي الربح</th></tr></thead>
            <tbody>
              {byMonth.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>لا توجد بيانات.</td></tr>}
              {byMonth.map(r => { const net = r.profit - r.exp; return <tr key={r.month}><td><strong>{r.month}</strong></td><td>{r.count}</td><td>{money(r.revenue)}</td><td>{money(r.cost)}</td><td>{money(r.profit)}</td><td>{money(r.exp)}</td><td style={{ color: net < 0 ? '#d9534f' : '#2e9e5b' }}><strong>{money(net)}</strong></td></tr> })}
            </tbody>
          </table></div>
        </section>
      </>}

      {tab === 'sales' && <section className="panel">
        <div className="toolbar" style={{ marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-field" style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 10px' }}>
            <Search size={17} style={{ color: 'var(--muted)' }} />
            <input placeholder="ابحث باسم العطر أو العميل أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', background: 'transparent', padding: '10px', width: '100%', outline: 'none', color: 'var(--text-color)' }} />
          </div>
          <button className="text-button" onClick={exportSales}><Download size={15} /> تصدير Excel</button>
        </div>
        <div className="table-scroll"><table>
          <thead><tr><th>التاريخ</th><th>العطر</th><th>الكمية</th><th>سعر البيع</th><th>التكلفة</th><th>الإجمالي</th><th>الربح</th><th>الهامش</th><th>الدفع</th><th /></tr></thead>
          <tbody>
            {shownSales.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>لا توجد مبيعات في الفترة دي. اضغط "تسجيل بيع" لإضافة أول عملية.</td></tr>}
            {shownSales.map(s => (
              <tr key={s.id}>
                <td className="muted">{showDate(s.date)}</td>
                <td><strong>{s.productName}</strong><small className="muted" style={{ display: 'block' }}>{s.sizeMl ? `${s.sizeMl} مل` : ''}{s.customerName ? ` · ${s.customerName}` : ''}{s.channel ? ` · ${s.channel}` : ''}</small></td>
                <td>{s.qty}</td>
                <td>{money(num(s.unitPrice))}{num(s.discount) > 0 && <small className="muted" style={{ display: 'block' }}>خصم {money(num(s.discount))}</small>}</td>
                <td>{money(num(s.unitCost))}</td>
                <td><strong>{money(num(s.revenue))}</strong></td>
                <td style={{ color: num(s.profit) < 0 ? '#d9534f' : '#2e9e5b' }}><strong>{money(num(s.profit))}</strong></td>
                <td>{num(s.margin)}%</td>
                <td><span className={`status ${s.paymentStatus === 'آجل' ? 'status-warning' : 'status-success'}`}><i />{s.paymentStatus || 'مدفوع'}</span><small className="muted" style={{ display: 'block' }}>{s.paymentMethod}</small></td>
                <td><div style={{ display: 'flex', gap: '5px' }}>
                  <button className="icon-button" onClick={() => openEditSale(s)} title="تعديل"><Edit size={17} /></button>
                  <button className="icon-button" onClick={() => deleteSale(s)} title="حذف"><Trash2 size={17} color="red" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {shownSales.length > 0 && <p style={{ margin: '14px 0 0', fontSize: '14px' }}>الإجمالي: <strong>{money(shownSales.reduce((s, x) => s + num(x.revenue), 0))}</strong> — الربح: <strong>{money(shownSales.reduce((s, x) => s + num(x.profit), 0))}</strong></p>}
      </section>}

      {tab === 'expenses' && <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>سجّل المصروفات التشغيلية فقط. تكلفة البضاعة بتتحسب تلقائياً من المبيعات، فمتسجلهاش هنا عشان ماتتحسبش مرتين.</p>
          <button className="text-button" onClick={exportExpenses}><Download size={15} /> تصدير Excel</button>
        </div>
        <div className="table-scroll"><table>
          <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>طريقة الدفع</th><th>ملاحظات</th><th /></tr></thead>
          <tbody>
            {fExpenses.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد مصروفات في الفترة دي.</td></tr>}
            {fExpenses.map(e => (
              <tr key={e.id}>
                <td className="muted">{showDate(e.date)}</td><td><strong>{e.category}</strong></td><td>{money(num(e.amount))}</td><td>{e.method}</td><td className="muted">{e.notes}</td>
                <td><div style={{ display: 'flex', gap: '5px' }}>
                  <button className="icon-button" onClick={() => setExpModal({ id: e.id, form: { date: e.date || todayStr(), category: e.category || EXPENSE_CATS[0], amount: String(e.amount ?? ''), method: e.method || 'كاش', notes: e.notes || '' } })} title="تعديل"><Edit size={17} /></button>
                  <button className="icon-button" onClick={() => deleteExpense(e)} title="حذف"><Trash2 size={17} color="red" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {fExpenses.length > 0 && <p style={{ margin: '14px 0 0', fontSize: '14px' }}>إجمالي المصروفات: <strong>{money(k.exp)}</strong></p>}
      </section>}

      {tab === 'orders' && <section className="panel">
        <p className="muted" style={{ margin: '0 0 12px', fontSize: '13px' }}>طلبات الموقع اللي لسه ما اتسجلتش كمبيعات. اضغط "تسجيل كبيعة" لتحسب الربح وتخصم الكمية من مخزون الحجم المطلوب.</p>
        <div className="table-scroll"><table>
          <thead><tr><th>التاريخ</th><th>العميل</th><th>العطر</th><th>الإجمالي</th><th>الحالة</th><th /></tr></thead>
          <tbody>
            {pendingOrders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>كل الطلبات اتسجلت. 👌</td></tr>}
            {pendingOrders.map(o => (
              <tr key={o.id}>
                <td className="muted">{o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleDateString('ar-EG') : ''}</td>
                <td><strong>{o.customerName}</strong><small className="muted" style={{ display: 'block' }}>{o.customerPhone}</small></td>
                <td><strong>{o.productName}</strong><small className="muted" style={{ display: 'block' }}>{o.size ? `${o.size} · ` : ''}× {o.quantity || 1}</small></td>
                <td><strong>{money(num(o.totalPrice))}</strong></td>
                <td><Status>{o.status || 'جديد'}</Status></td>
                <td><button className="primary-button" style={{ padding: '7px 14px' }} onClick={() => setSaleModal({ form: saleFromOrder(o) })}>تسجيل كبيعة</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>}

      {/* نافذة تسجيل / تعديل بيع */}
      {saleModal && live && modalShell(saleModal.id ? 'تعديل عملية بيع' : 'تسجيل بيع جديد', () => setSaleModal(null), (
        <div className="field-grid">
          <label>التاريخ<input type="date" value={saleModal.form.date} onChange={e => setSale({ date: e.target.value })} /></label>
          <label>اختر من المخزون
            <select value={saleModal.form.productId} onChange={e => pickProduct(e.target.value)} disabled={!!saleModal.id}>
              <option value="">— بيع يدوي (منتج غير مسجل) —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.brand ? ` — ${p.brand}` : ''}</option>)}
            </select>
          </label>
          {!saleModal.form.productId && <label style={{ gridColumn: '1 / -1' }}>اسم المنتج<input value={saleModal.form.productName} onChange={e => setSale({ productName: e.target.value })} placeholder="اكتب اسم العطر" /></label>}
          {selProduct && Array.isArray(selProduct.variants) && selProduct.variants.length > 0
            ? <label>الحجم
                <select value={saleModal.form.size} onChange={e => pickSize(e.target.value)} disabled={!!saleModal.id}>
                  {selProduct.variants.map((v: any) => <option key={v.size} value={String(v.size)}>{v.size} مل — متاح {num(v.stock)}</option>)}
                </select>
              </label>
            : <label>الحجم (مل)<input type="number" min="0" value={saleModal.form.size} onChange={e => setSale({ size: e.target.value })} placeholder="اختياري" /></label>}
          <label>الكمية<input type="number" min="1" value={saleModal.form.qty} onChange={e => setSale({ qty: e.target.value })} /></label>
          <label>سعر البيع للقطعة ({CUR})<input type="number" min="0" value={saleModal.form.unitPrice} onChange={e => setSale({ unitPrice: e.target.value })} /></label>
          <label>التكلفة للقطعة ({CUR})<input type="number" min="0" value={saleModal.form.unitCost} onChange={e => setSale({ unitCost: e.target.value })} placeholder="سعر الشراء" /></label>
          <label>خصم على الفاتورة<input type="number" min="0" value={saleModal.form.discount} onChange={e => setSale({ discount: e.target.value })} placeholder="اختياري" /></label>
          <label>اسم العميل<input value={saleModal.form.customerName} onChange={e => setSale({ customerName: e.target.value })} placeholder="اختياري" /></label>
          <label>الهاتف<input dir="ltr" value={saleModal.form.phone} onChange={e => setSale({ phone: e.target.value })} placeholder="01xxxxxxxxx" /></label>
          <label>قناة البيع<select value={saleModal.form.channel} onChange={e => setSale({ channel: e.target.value })}>{CHANNELS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>طريقة الدفع<select value={saleModal.form.paymentMethod} onChange={e => setSale({ paymentMethod: e.target.value })}>{PAY_METHODS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>حالة الدفع<select value={saleModal.form.paymentStatus} onChange={e => setSale({ paymentStatus: e.target.value })}>{PAY_STATUS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label style={{ gridColumn: '1 / -1' }}>ملاحظات<textarea value={saleModal.form.notes} onChange={e => setSale({ notes: e.target.value })} /></label>
          {!saleModal.id && saleModal.form.productId && (
            <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={saleModal.form.deductStock} onChange={e => setSale({ deductStock: e.target.checked })} style={{ width: 'auto' }} />
              خصم الكمية من مخزون الحجم ده
            </label>
          )}
          <div style={{ gridColumn: '1 / -1', background: 'var(--card-bg, rgba(139,115,85,.08))', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px 28px', fontSize: '15px' }}>
            <span>الإجمالي: <strong>{money(live.revenue)}</strong></span>
            <span>التكلفة: <strong>{money(live.cost)}</strong></span>
            <span>الربح: <strong style={{ color: live.profit < 0 ? '#d9534f' : '#2e9e5b' }}>{money(live.profit)}</strong></span>
            <span>الهامش: <strong>{Math.round(live.margin * 10) / 10}%</strong></span>
          </div>
          {saleModal.id && <p className="muted" style={{ gridColumn: '1 / -1', margin: 0, fontSize: '12px' }}>ملاحظة: تعديل البيعة مش بيغيّر المخزون. لو محتاج تعدّل الكمية افتح المخزون.</p>}
        </div>
      ), (<>
        <button className="primary-button" style={{ flex: 1, padding: '12px', fontSize: '16px', display: 'flex', justifyContent: 'center' }} onClick={saveSale} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        <button className="text-button" onClick={() => setSaleModal(null)}>إلغاء</button>
      </>))}

      {/* نافذة المصروف */}
      {expModal && modalShell(expModal.id ? 'تعديل مصروف' : 'إضافة مصروف', () => setExpModal(null), (
        <div className="field-grid">
          <label>التاريخ<input type="date" value={expModal.form.date} onChange={e => setExpModal(m => m && ({ ...m, form: { ...m.form, date: e.target.value } }))} /></label>
          <label>النوع<select value={expModal.form.category} onChange={e => setExpModal(m => m && ({ ...m, form: { ...m.form, category: e.target.value } }))}>{EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>المبلغ ({CUR})<input type="number" min="0" value={expModal.form.amount} onChange={e => setExpModal(m => m && ({ ...m, form: { ...m.form, amount: e.target.value } }))} /></label>
          <label>طريقة الدفع<select value={expModal.form.method} onChange={e => setExpModal(m => m && ({ ...m, form: { ...m.form, method: e.target.value } }))}>{PAY_METHODS.filter(m => m !== 'عند الاستلام').map(c => <option key={c}>{c}</option>)}</select></label>
          <label style={{ gridColumn: '1 / -1' }}>ملاحظات<textarea value={expModal.form.notes} onChange={e => setExpModal(m => m && ({ ...m, form: { ...m.form, notes: e.target.value } }))} /></label>
        </div>
      ), (<>
        <button className="primary-button" style={{ flex: 1, padding: '12px', fontSize: '16px', display: 'flex', justifyContent: 'center' }} onClick={saveExpense} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        <button className="text-button" onClick={() => setExpModal(null)}>إلغاء</button>
      </>))}
    </div>
  )
}

// =====================================================================
//  واجهة الموقع — التحكم في أول سيكشن (الكلام + الصور) من هنا
// =====================================================================
type HeroNew = { enabled: boolean, badge: string, title: string, highlight: string, text: string, buttonText: string, buttonLink: string, productIds: string[] }
type HeroOffer = { enabled: boolean, badge: string, title: string, highlight: string, text: string, buttonText: string, buttonLink: string, showCountdown: boolean, countdownLabel: string, countdownDate: string, productId: string, image: string }
type HeroFeatured = { enabled: boolean, badge: string, title: string, highlight: string, text: string, buttonText: string, buttonLink: string, bullets: string[], productId: string, image: string }
type HeroCfg = { bgImage: string, bgOverlay: number, slides: { new: HeroNew, offer: HeroOffer, featured: HeroFeatured } }

const HERO_DEFAULT: HeroCfg = {
  bgImage: '',
  bgOverlay: 60,
  slides: {
    new: {
      enabled: true, badge: 'وصل حديثاً', title: 'اكتشف', highlight: 'بصمتك العطرية',
      text: 'تصفح أحدث عطورنا — من الحمضيات المنعشة والزهور إلى الأخشاب الدافئة والعود. اختار الريحة اللي بتحكي قصتك.',
      buttonText: 'تسوّق الوارد حديثاً', buttonLink: 'tos.html', productIds: [],
    },
    offer: {
      enabled: true, badge: 'عرض لفترة محدودة', title: 'عروض', highlight: 'العطور الحصرية',
      text: 'أسعار مميزة على عطور مختارة لحد نفاد الكمية. احجز ريحتك المفضلة قبل ما تخلص.',
      buttonText: 'تسوّق العروض', buttonLink: 'tos.html?sale=1',
      showCountdown: true, countdownLabel: 'ينتهي العرض خلال:', countdownDate: '2026-12-31', productId: '', image: '',
    },
    featured: {
      enabled: true, badge: 'نفس', title: 'عطور', highlight: 'فاخرة',
      text: 'عطور مختارة بعناية وبثبات يدوم. اكتشف روائح أنيقة لكل موسم ولكل مناسبة.',
      buttonText: 'استكشف التشكيلة', buttonLink: 'tos.html',
      bullets: ['عطور مختارة بعناية', 'روائح بثبات يدوم', 'أحجام تناسب كل ميزانية'], productId: '', image: '',
    },
  },
}

function mergeHero(saved: any): HeroCfg {
  const d = HERO_DEFAULT
  const s = saved || {}
  const sl = s.slides || {}
  return {
    bgImage: typeof s.bgImage === 'string' ? s.bgImage : d.bgImage,
    bgOverlay: typeof s.bgOverlay === 'number' ? s.bgOverlay : d.bgOverlay,
    slides: {
      new: { ...d.slides.new, ...(sl.new || {}), productIds: Array.isArray(sl.new?.productIds) ? sl.new.productIds : [] },
      offer: { ...d.slides.offer, ...(sl.offer || {}) },
      featured: { ...d.slides.featured, ...(sl.featured || {}), bullets: Array.isArray(sl.featured?.bullets) && sl.featured.bullets.length ? [...sl.featured.bullets, '', '', ''].slice(0, 3) : d.slides.featured.bullets },
    },
  }
}

function HeroSettings({ toast }: { toast: (m: string) => void }) {
  const [cfg, setCfg] = useState<HeroCfg>(HERO_DEFAULT)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getDoc(doc(db, 'settings', 'hero')).then(s => { if (alive) { setCfg(mergeHero(s.exists() ? s.data() : null)); setLoading(false) } }).catch(() => { if (alive) setLoading(false) })
    const unsub = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { alive = false; unsub() }
  }, [])

  const patchSlide = <K extends keyof HeroCfg['slides']>(key: K, patch: Partial<HeroCfg['slides'][K]>) =>
    setCfg(c => ({ ...c, slides: { ...c.slides, [key]: { ...c.slides[key], ...patch } } }))

  const save = async () => {
    setSaving(true)
    try {
      const clean: HeroCfg = {
        ...cfg,
        bgImage: cfg.bgImage.trim(),
        slides: {
          new: { ...cfg.slides.new, productIds: cfg.slides.new.productIds.filter(Boolean) },
          offer: { ...cfg.slides.offer, image: cfg.slides.offer.image.trim() },
          featured: { ...cfg.slides.featured, image: cfg.slides.featured.image.trim(), bullets: cfg.slides.featured.bullets.map(b => b.trim()).filter(Boolean) },
        },
      }
      await setDoc(doc(db, 'settings', 'hero'), { ...clean, updatedAt: serverTimestamp() })
      await addDoc(collection(db, 'activity_logs'), { type: 'update', message: 'تم تعديل محتوى أول سيكشن في الموقع', createdAt: serverTimestamp() })
      toast('تم الحفظ — حدّث صفحة الموقع لتشوف التغيير')
    } catch (e) { console.error(e); toast('حدث خطأ أثناء الحفظ') }
    setSaving(false)
  }

  const reset = () => { if (confirm('ترجّع كل الكلام والصور للوضع الافتراضي؟ (مش هيتحفظ غير لما تضغط حفظ)')) setCfg(HERO_DEFAULT) }

  const opts = (empty: string) => <>
    <option value="">{empty}</option>
    {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.brand ? ` — ${p.brand}` : ''}</option>)}
  </>

  const textFields = (key: 'new' | 'offer' | 'featured') => {
    const s: any = cfg.slides[key]
    return <>
      <label>الشارة الصغيرة (فوق العنوان)<input value={s.badge} onChange={e => patchSlide(key, { badge: e.target.value } as any)} /></label>
      <label>الكلمة الأولى في العنوان<input value={s.title} onChange={e => patchSlide(key, { title: e.target.value } as any)} /></label>
      <label>الكلمة الملوّنة (بلون البراند)<input value={s.highlight} onChange={e => patchSlide(key, { highlight: e.target.value } as any)} /></label>
      <label>نص الزرار<input value={s.buttonText} onChange={e => patchSlide(key, { buttonText: e.target.value } as any)} /></label>
      <label style={{ gridColumn: '1 / -1' }}>الفقرة التعريفية<textarea value={s.text} onChange={e => patchSlide(key, { text: e.target.value } as any)} /></label>
      <label style={{ gridColumn: '1 / -1' }}>رابط الزرار<input dir="ltr" value={s.buttonLink} onChange={e => patchSlide(key, { buttonLink: e.target.value } as any)} placeholder="tos.html أو tos.html?sale=1 أو https://..." /></label>
    </>
  }

  const slideHead = (key: 'new' | 'offer' | 'featured', title: string, hint: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
      <div><h2 style={{ margin: 0 }}>{title}</h2><p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>{hint}</p></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
        <input type="checkbox" checked={cfg.slides[key].enabled} onChange={e => patchSlide(key, { enabled: e.target.checked } as any)} style={{ width: 'auto' }} />
        إظهار السلايد
      </label>
    </div>
  )

  if (loading) return <div className="page-content"><p>جاري التحميل...</p></div>

  return (
    <div className="page-content">
      <div className="page-title">
        <div>
          <p className="eyebrow">إعدادات المتجر</p>
          <h1>واجهة الموقع (أول سيكشن)</h1>
          <p className="subtle">تحكم في الكلام والصور اللي بتظهر في أول سيكشن في الموقع. التغييرات بتظهر بعد الحفظ وتحديث الصفحة.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary-button" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
          <a className="text-button" href="/index.html" target="_blank" rel="noreferrer"><Eye size={16} /> فتح الموقع</a>
          <button className="text-button" onClick={reset}>استرجاع الافتراضي</button>
        </div>
      </div>

      <div className="form-grid">
        <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
          {slideHead('new', 'السلايد 1 — الوارد حديثاً', 'بيعرض 4 عطور بصورهم. سيب الاختيارات "تلقائي" لو عايز آخر 4 عطور اتضافت.')}
          <div className="field-grid">{textFields('new')}</div>
          <Group title="العطور اللي تظهر (اختياري)">
            <div className="field-grid">
              {[0, 1, 2, 3].map(i => (
                <label key={i}>العطر {i + 1}
                  <select value={cfg.slides.new.productIds[i] || ''} onChange={e => { const ids = [...cfg.slides.new.productIds]; while (ids.length < 4) ids.push(''); ids[i] = e.target.value; patchSlide('new', { productIds: ids }) }}>{opts('تلقائي — من أحدث العطور')}</select>
                </label>
              ))}
            </div>
          </Group>
        </section>

        <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
          {slideHead('offer', 'السلايد 2 — العروض', 'بيعرض عطر عليه خصم. السعر والخصم بيتحسبوا من بيانات العطر.')}
          <div className="field-grid">{textFields('offer')}</div>
          <Group title="العطر والصورة">
            <div className="field-grid">
              <label>العطر المعروض
                <select value={cfg.slides.offer.productId} onChange={e => patchSlide('offer', { productId: e.target.value })}>{opts('تلقائي — العطر صاحب أكبر خصم')}</select>
              </label>
              <label>صورة مخصصة (اختياري)
                <input type="url" dir="ltr" value={cfg.slides.offer.image} onChange={e => patchSlide('offer', { image: e.target.value })} placeholder="لو فاضي بتظهر صورة العطر نفسه" style={fieldStyle} />
              </label>
            </div>
          </Group>
          <Group title="العد التنازلي">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
              <input type="checkbox" checked={cfg.slides.offer.showCountdown} onChange={e => patchSlide('offer', { showCountdown: e.target.checked })} style={{ width: 'auto' }} />
              إظهار العد التنازلي
            </label>
            {cfg.slides.offer.showCountdown && (
              <div className="field-grid">
                <label>العنوان<input value={cfg.slides.offer.countdownLabel} onChange={e => patchSlide('offer', { countdownLabel: e.target.value })} /></label>
                <label>تاريخ انتهاء العرض<input type="date" value={cfg.slides.offer.countdownDate} onChange={e => patchSlide('offer', { countdownDate: e.target.value })} /></label>
              </div>
            )}
          </Group>
        </section>

        <section className="panel form-panel" style={{ gridColumn: '1 / -1' }}>
          {slideHead('featured', 'السلايد 3 — العطر المميز', 'بيعرض عطر مميز بصورة كبيرة ونقاط مميزات.')}
          <div className="field-grid">{textFields('featured')}</div>
          <Group title="النقاط المميزة (حتى 3)">
            <div className="field-grid">
              {[0, 1, 2].map(i => (
                <label key={i}>النقطة {i + 1}
                  <input value={cfg.slides.featured.bullets[i] || ''} onChange={e => { const b = [...cfg.slides.featured.bullets, '', '', ''].slice(0, 3); b[i] = e.target.value; patchSlide('featured', { bullets: b }) }} />
                </label>
              ))}
            </div>
          </Group>
          <Group title="العطر والصورة">
            <div className="field-grid">
              <label>العطر المعروض
                <select value={cfg.slides.featured.productId} onChange={e => patchSlide('featured', { productId: e.target.value })}>{opts('تلقائي — العطر المميز ⭐')}</select>
              </label>
              <label>صورة مخصصة (اختياري)
                <input type="url" dir="ltr" value={cfg.slides.featured.image} onChange={e => patchSlide('featured', { image: e.target.value })} placeholder="لو فاضي بتظهر صورة العطر نفسه" style={fieldStyle} />
              </label>
            </div>
          </Group>
        </section>

        <button className="primary-button full-button" onClick={save} disabled={saving} style={{ gridColumn: '1 / -1', fontSize: '16px', padding: '15px' }}>
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  )
}

export default function Page() {
  const [page, setPage] = useState('dashboard'); const [mobileOpen, setMobileOpen] = useState(false); const [dark, setDark] = useState(false); const [toastMsg, setToastMsg] = useState(''); const [storeState, setStoreState] = useState(() => cloneSeed());
  useEffect(() => { const saved = loadState(); setStoreState(saved); setDark(window.localStorage.getItem('theme') === 'dark'); }, []);
  useEffect(() => { saveState(storeState); }, [storeState]);
  useEffect(() => { window.localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]); const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 2600) }; const current = nav.find(n => n.id === page)?.label || (page === 'add-product' ? 'إضافة منتج' : 'الرئيسية'); const go = (id: string) => { setPage(id); setMobileOpen(false) }; return (
    <div className={dark ? 'app-shell dark-mode' : 'app-shell'} dir="rtl">

      {/* القائمة الجانبية (Sidebar) */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Droplets size={21} /></div>
          <div><strong>نفس</strong><small>لوحة المتجر</small></div>
          <button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>

        <nav>
          <p className="nav-label">القائمة الرئيسية</p>
          {nav.slice(0, 1).map(n => (
            <button className={page === n.id ? 'nav-item active' : 'nav-item'} key={n.id} onClick={() => go(n.id)}>
              <n.icon size={18} /><span>{n.label}</span>
            </button>
          ))}

          <p className="nav-label">إدارة المتجر</p>
          {/* تم مسح رقم 12 الوهمي من قسم الطلبات هنا */}
          {nav.slice(1, 8).map(n => (
            <button className={page === n.id ? 'nav-item active' : 'nav-item'} key={n.id} onClick={() => go(n.id)}>
              <n.icon size={18} /><span>{n.label}</span>
            </button>
          ))}

          <p className="nav-label">النظام</p>
          {nav.slice(8).map(n => (
            <button className={page === n.id ? 'nav-item active' : 'nav-item'} key={n.id} onClick={() => go(n.id)}>
              <n.icon size={18} /><span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="theme-switch" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{dark ? 'الوضع النهاري' : 'الوضع الليلي'}</span><i />
          </button>
          {/* الجزء الخاص باسم المدير تحت في القائمة الجانبية (تقدر تغير الاسم من هنا بعدين) */}
          <div className="profile">
            <div className="avatar">ح</div>
            <div><strong>حسن</strong><span>مدير المتجر</span></div>
            <MoreHorizontal size={18} className="muted" />
          </div>
        </div>
      </aside>

      {/* مساحة العرض الرئيسية */}
      <div className="main-area">

        {/* الشريط العلوي (Header) */}
        <header>
          <button className="menu-button" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="header-title">
            <span>لوحة التحكم</span><ChevronLeft size={14} /><strong>{current}</strong>
          </div>

          {/* تم مسح الإشعارات، والبحث، وحرف الـ (أ) من هنا بالكامل عشان ننظف الهيدر */}
          <div className="header-actions">
            {/* فاضي تماماً */}
          </div>
        </header>

        {/* عرض الصفحات */}
        {page === 'dashboard' && <Dashboard setPage={go} />}
        {page === 'products' && <Products setPage={go} toast={toast} />}
        {page === 'add-product' && <AddProduct toast={toast} />}
        {page === 'accounting' && <Accounting toast={toast} />}
        {page === 'hero' && <HeroSettings toast={toast} />}
        {page === 'inventory' && <Inventory toast={toast} />}
        {page === 'orders' && <Orders toast={toast} />}
        {page === 'customers' && <Customers toast={toast} />}
        {page === 'coupons' && <Coupons toast={toast} />}
        {page === 'activity' && <ActivityLog />}
        {page === 'settings' && <StoreSettings toast={toast} />}
{!['dashboard', 'products', 'add-product', 'accounting', 'hero', 'inventory', 'orders', 'customers', 'coupons', 'activity', 'settings'].includes(page) && <GenericPage id={page} setPage={go} />}      </div>

      {/* نوافذ ورسائل التأكيد */}
      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}
      {toastMsg && <div className="toast"><Zap size={17} /><span>{toastMsg}</span></div>}
    </div>
  );
}
