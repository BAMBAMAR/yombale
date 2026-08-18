import type { LocaleTranslations } from '../fr'

export const shop: LocaleTranslations['shop'] = {
  dashboard: 'لوحة التحكم',
  products: 'المنتجات',
  orders: 'الطلبات',
  debts: 'دفتر الديون والعملاء',
  accounting: 'المحاسبة',
  pos: 'نقطة البيع (POS)',
  analytics: 'الإحصائيات والمبيعات',
  settings: 'إعدادات المتجر',
  team: 'فريق العمل والكاشير',
  subscription: 'الاشتراك',
  
  // Dashboard & stats
  totalSales: 'إجمالي المبيعات',
  totalOrders: 'الطلبات المكتملة',
  totalProducts: 'إجمالي المنتجات',
  pendingDebts: 'الديون المعلقة',
  quickActions: 'إجراءات سريعة',
  newProduct: 'إضافة منتج',
  openPos: 'فتح الكاشير',
  viewOrders: 'عرض الطلبات',

  // Products
  productName: 'اسم المنتج',
  productPrice: 'سعر البيع',
  productCost: 'سعر التكلفة',
  productStock: 'الكمية في المخزون',
  productCategory: 'الفئة',
  addProductTitle: 'إضافة منتج جديد',
  editProductTitle: 'تعديل المنتج',
  deleteProductConfirm: 'هل أنت متأكد من حذف هذا المنتج؟',
  inStock: 'متوفر',
  outOfStock: 'نفد المخزون',
  lowStock: 'مخزون منخفض',

  // Debts (Carnet de dettes)
  debtBookTitle: 'دفتر ديون العملاء والتسهيلات',
  debtClientName: 'اسم العميل',
  debtClientPhone: 'رقم الهاتف',
  debtAmount: 'المبلغ المستحق',
  debtDate: 'تاريخ الاستحقاق',
  recordPayment: 'تسجيل دفعة سداد',
  debtSettled: 'تمت تسوية الدين',
  totalOwed: 'إجمالي المستحقات',

  // Accounting
  accountingTitle: 'المحاسبة والتقارير',
  revenue: 'الإيرادات',
  expenses: 'المصروفات',
  netProfit: 'صافي الأرباح',
  exportReport: 'تصدير التقرير',
}
