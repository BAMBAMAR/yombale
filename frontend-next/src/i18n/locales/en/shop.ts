import type { LocaleTranslations } from '../fr'

export const shop: LocaleTranslations['shop'] = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  debts: 'Customer Debt Ledger',
  accounting: 'Accounting',
  pos: 'POS Cashier',
  analytics: 'Analytics & Sales',
  settings: 'Store Settings',
  team: 'Team & Cashiers',
  subscription: 'Subscription',
  
  // Dashboard & stats
  totalSales: 'Total Sales',
  totalOrders: 'Orders Processed',
  totalProducts: 'Total Products',
  pendingDebts: 'Pending Debts',
  quickActions: 'Quick Actions',
  newProduct: 'Add Product',
  openPos: 'Open POS Register',
  viewOrders: 'View Orders',

  // Products
  productName: 'Product Name',
  productPrice: 'Selling Price',
  productCost: 'Cost Price',
  productStock: 'Stock Quantity',
  productCategory: 'Category',
  addProductTitle: 'Add New Product',
  editProductTitle: 'Edit Product',
  deleteProductConfirm: 'Are you sure you want to delete this product?',
  inStock: 'In stock',
  outOfStock: 'Out of stock',
  lowStock: 'Low stock',

  // Debts (Carnet de dettes)
  debtBookTitle: 'Customer Debt Ledger & Credits',
  debtClientName: 'Customer Name',
  debtClientPhone: 'Phone Number',
  debtAmount: 'Amount Due',
  debtDate: 'Due Date',
  recordPayment: 'Record Repayment',
  debtSettled: 'Debt Settled',
  totalOwed: 'Total Receivables',

  // Accounting
  accountingTitle: 'Accounting & Summary',
  revenue: 'Revenue',
  expenses: 'Expenses',
  netProfit: 'Net Profit',
  exportReport: 'Export Report',
}
