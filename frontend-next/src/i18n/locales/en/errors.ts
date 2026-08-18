import type { LocaleTranslations } from '../fr'

export const errors: LocaleTranslations['errors'] = {
  genericError: 'An unexpected error occurred.',
  networkError: 'Connection error. Please check your network.',
  unauthorized: 'Unauthorized access. Please log in.',
  sessionExpired: 'Your session has expired.',
  fieldRequired: 'This field is required.',
  invalidEmail: 'Invalid email address.',
  invalidPhone: 'Invalid phone number.',
  passwordTooShort: 'Password must be at least 6 characters.',
  notFound: 'Item not found.',
  serverError: 'Remote server returned an error.',
}
