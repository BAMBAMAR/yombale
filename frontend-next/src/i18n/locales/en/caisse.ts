import type { LocaleTranslations } from '../fr'

export const caisse: LocaleTranslations['caisse'] = {
  posTitle: 'POS Cash Register',
  searchProduct: 'Search for a product or scan barcode...',
  categories: 'Categories',
  allCategories: 'All Categories',
  cart: 'Current Cart',
  emptyCart: 'Cart is empty',
  addProductsPrompt: 'Select items to start a sale',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'VAT',
  total: 'Total Due',
  itemsCount: 'item(s)',
  clearCart: 'Clear cart',
  checkoutBtn: 'Checkout',

  // Payment modal
  paymentTitle: 'Order Checkout',
  paymentMethod: 'Payment Method',
  cash: 'Cash',
  wave: 'Wave',
  orangeMoney: 'Orange Money',
  creditDebt: 'Credit Sale (Debt)',
  amountReceived: 'Amount Received',
  changeDue: 'Change Due',
  exactAmount: 'Exact Amount',
  confirmPayment: 'Confirm Payment',
  paymentSuccess: 'Sale completed successfully!',

  // Receipt
  receiptTitle: 'Receipt',
  receiptNumber: 'Receipt #',
  cashier: 'Cashier',
  printReceipt: 'Print Receipt',
  newSale: 'New Sale',
  clientPhoneReceipt: 'Customer Phone',
  thanksMessage: 'Thank you for your business!',
  
  // Shortcuts & offline
  offlineAlert: 'Offline mode active. Sales will sync once connection is restored.',
  scannerActive: 'Scanner Active',
}
