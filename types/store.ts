export type ProductStatus = 'active' | 'hidden'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type Product = {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  material: string
  price: number
  oldPrice: number
  costPrice: number
  stock: number
  minStock: number
  sales: number
  status: ProductStatus
  images: string[]
  colors: string[]
  sizes: string[]
  createdAt: string
  updatedAt: string
}

export type Customer = { id: string; name: string; phone: string; email: string; address: string; ordersCount: number; totalSpent: number; createdAt: string; lastOrder: string }
export type OrderItem = { productId: string; name: string; sku: string; quantity: number; price: number }
export type Order = { id: string; customerId: string; customer: string; phone: string; email: string; address: string; items: OrderItem[]; subtotal: number; discount: number; shipping: number; total: number; paymentMethod: string; status: OrderStatus; trackingNumber: string; shippingCompany: string; createdAt: string; note?: string }
export type Coupon = { id: string; code: string; type: 'percentage' | 'fixed'; value: number; minOrder: number; maxDiscount: number; usageLimit: number; usageCount: number; startDate: string; endDate: string; status: 'active' | 'disabled' }
export type ActivityLog = { id: string; user: string; action: string; entity: string; description: string; date: string }
export type StoreState = { products: Product[]; orders: Order[]; customers: Customer[]; coupons: Coupon[]; categories: string[]; logs: ActivityLog[]; notifications: { id: string; title: string; body: string; read: boolean }[] }

export const seedState: StoreState = {
  categories: ['شنط يد', 'شنط كروس', 'شنط ظهر', 'شنط سفر', 'شنط لابتوب'],
  products: [
    { id: 'p1', name: 'حقيبة جلدية كلاسيكية', sku: 'BG-1042', category: 'شنط يد', brand: 'حقيبة', material: 'جلد طبيعي', price: 280, oldPrice: 340, costPrice: 150, stock: 42, minStock: 10, sales: 186, status: 'active', images: [], colors: ['أسود', 'بني'], sizes: ['Medium'], createdAt: '2026-08-01', updatedAt: '2026-08-23' },
    { id: 'p2', name: 'حقيبة كروس عصرية', sku: 'BG-1038', category: 'شنط كروس', brand: 'حقيبة', material: 'جلد نباتي', price: 195, oldPrice: 240, costPrice: 95, stock: 18, minStock: 8, sales: 142, status: 'active', images: [], colors: ['وردي', 'أسود'], sizes: ['Small'], createdAt: '2026-07-28', updatedAt: '2026-08-23' },
    { id: 'p3', name: 'حقيبة ظهر عملية', sku: 'BG-1029', category: 'شنط ظهر', brand: 'حقيبة', material: 'كانفاس', price: 240, oldPrice: 280, costPrice: 120, stock: 7, minStock: 10, sales: 98, status: 'active', images: [], colors: ['بيج'], sizes: ['Large'], createdAt: '2026-07-19', updatedAt: '2026-08-22' },
    { id: 'p4', name: 'حقيبة سفر فاخرة', sku: 'BG-1017', category: 'شنط سفر', brand: 'حقيبة', material: 'جلد', price: 420, oldPrice: 0, costPrice: 250, stock: 0, minStock: 5, sales: 76, status: 'hidden', images: [], colors: ['بني'], sizes: ['XL'], createdAt: '2026-06-12', updatedAt: '2026-08-20' },
    { id: 'p5', name: 'حقيبة لابتوب ذكية', sku: 'BG-1004', category: 'شنط لابتوب', brand: 'حقيبة', material: 'نايلون', price: 310, oldPrice: 360, costPrice: 170, stock: 24, minStock: 8, sales: 64, status: 'active', images: [], colors: ['رمادي'], sizes: ['Large'], createdAt: '2026-05-30', updatedAt: '2026-08-21' },
  ],
  customers: [
    { id: 'c1', name: 'سارة أحمد', phone: '0501234567', email: 'sara@example.com', address: 'الرياض، حي الملقا', ordersCount: 8, totalSpent: 2140, createdAt: '2026-02-01', lastOrder: '2026-08-23' },
    { id: 'c2', name: 'محمد خالد', phone: '0507654321', email: 'mohamed@example.com', address: 'جدة، حي الروضة', ordersCount: 4, totalSpent: 980, createdAt: '2026-03-14', lastOrder: '2026-08-23' },
    { id: 'c3', name: 'نور علي', phone: '0554443322', email: 'noor@example.com', address: 'الدمام، الشاطئ', ordersCount: 2, totalSpent: 430, createdAt: '2026-06-09', lastOrder: '2026-08-22' },
  ],
  orders: [
    { id: '#10482', customerId: 'c1', customer: 'سارة أحمد', phone: '0501234567', email: 'sara@example.com', address: 'الرياض، حي الملقا', items: [{ productId: 'p1', name: 'حقيبة جلدية كلاسيكية', sku: 'BG-1042', quantity: 1, price: 280 }], subtotal: 280, discount: 0, shipping: 25, total: 305, paymentMethod: 'بطاقة بنكية', status: 'delivered', trackingNumber: 'TRK-8842', shippingCompany: 'سمسا', createdAt: '2026-08-23T10:42:00' },
    { id: '#10481', customerId: 'c2', customer: 'محمد خالد', phone: '0507654321', email: 'mohamed@example.com', address: 'جدة، حي الروضة', items: [{ productId: 'p3', name: 'حقيبة ظهر عملية', sku: 'BG-1029', quantity: 1, price: 240 }], subtotal: 240, discount: 0, shipping: 25, total: 265, paymentMethod: 'الدفع عند الاستلام', status: 'shipped', trackingNumber: 'TRK-8841', shippingCompany: 'أرامكس', createdAt: '2026-08-23T09:18:00' },
    { id: '#10480', customerId: 'c3', customer: 'نور علي', phone: '0554443322', email: 'noor@example.com', address: 'الدمام، الشاطئ', items: [{ productId: 'p2', name: 'حقيبة كروس عصرية', sku: 'BG-1038', quantity: 1, price: 195 }], subtotal: 195, discount: 0, shipping: 20, total: 215, paymentMethod: 'بطاقة بنكية', status: 'pending', trackingNumber: '', shippingCompany: '', createdAt: '2026-08-22T20:55:00' },
  ],
  coupons: [{ id: 'co1', code: 'WELCOME15', type: 'percentage', value: 15, minOrder: 200, maxDiscount: 100, usageLimit: 100, usageCount: 34, startDate: '2026-08-01', endDate: '2026-09-01', status: 'active' }],
  logs: [{ id: 'l1', user: 'أحمد محمد', action: 'إضافة', entity: 'منتج', description: 'تمت إضافة حقيبة لابتوب ذكية', date: '2026-08-23 11:20' }],
  notifications: [{ id: 'n1', title: 'طلب جديد #10482', body: 'منذ 5 دقائق', read: false }, { id: 'n2', title: 'مخزون منخفض', body: 'حقيبة ظهر عملية', read: false }, { id: 'n3', title: 'تم شحن الطلب #10481', body: 'منذ ساعة', read: true }],
}

export const loadState = (): StoreState => { if (typeof window === 'undefined') return seedState; try { const saved = window.localStorage.getItem('bag-store-state'); return saved ? { ...seedState, ...JSON.parse(saved) } : seedState } catch { return seedState } }
export const saveState = (state: StoreState) => { if (typeof window !== 'undefined') window.localStorage.setItem('bag-store-state', JSON.stringify(state)) }
export const money = (value: number) => `$${value.toLocaleString('en-US')}`
export const orderStatusLabel: Record<OrderStatus, string> = { pending: 'قيد المراجعة', confirmed: 'تم التأكيد', processing: 'جاري التجهيز', shipped: 'جاري الشحن', delivered: 'تم التوصيل', cancelled: 'ملغي' }
export const stockLabel = (p: Product) => p.stock === 0 ? 'نفد المخزون' : p.stock <= p.minStock ? 'مخزون منخفض' : 'متوفر'
export const stockTone = (p: Product) => p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success'
export const discountPercent = (p: Product) => p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
export const profitMargin = (p: Product) => p.price ? Math.round(((p.price - p.costPrice) / p.price) * 100) : 0
export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const cloneSeed = (): StoreState => JSON.parse(JSON.stringify(seedState))

export const productColorClass = (index: number) => ['navy', 'rose', 'sand', 'brown', 'slate'][index % 5]
