import type { LocaleTranslations } from '../fr'

export const errors: LocaleTranslations['errors'] = {
  genericError: 'حدث خطأ غير متوقع.',
  networkError: 'خطأ في الاتصال. يرجى التحقق من الشبكة.',
  unauthorized: 'وصول غير مصرح به. يرجى تسجيل الدخول.',
  sessionExpired: 'انتهت جلستك.',
  fieldRequired: 'هذا الحقل مطلوب.',
  invalidEmail: 'عنوان البريد الإلكتروني غير صالح.',
  invalidPhone: 'رقم الهاتف غير صالح.',
  passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
  notFound: 'العنصر غير موجود.',
  serverError: 'أرجع الخادم البعيد خطأ.',
}
