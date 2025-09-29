export interface ErrorMessages {
  en: string;
  es: string;
}

export const ERR: Record<string, ErrorMessages> = {
  AUTH: {
    en: 'Please sign in to continue.',
    es: 'Inicie sesión para continuar.'
  },
  AUTH_REQUIRED: {
    en: 'Authentication required to access this feature.',
    es: 'Se requiere autenticación para acceder a esta función.'
  },
  QUOTA: {
    en: 'Monthly limit reached. Please upgrade for unlimited access.',
    es: 'Límite mensual alcanzado. Actualice su plan para acceso ilimitado.'
  },
  QUOTA_WARNING: {
    en: 'You\'re approaching your monthly limit. Consider upgrading for unlimited access.',
    es: 'Te estás acercando a tu límite mensual. Considera actualizar para acceso ilimitado.'
  },
  INTERNAL: {
    en: 'Something went wrong. Try again.',
    es: 'Algo salió mal. Inténtelo de nuevo.'
  },
  NETWORK: {
    en: 'Network error. Please check your connection.',
    es: 'Error de red. Por favor verifica tu conexión.'
  },
  VALIDATION: {
    en: 'Please check your input and try again.',
    es: 'Por favor verifica tu entrada e inténtalo de nuevo.'
  },
  FILE_TOO_LARGE: {
    en: 'File is too large. Please choose a smaller file.',
    es: 'El archivo es muy grande. Por favor elige un archivo más pequeño.'
  },
  INVALID_FILE_TYPE: {
    en: 'Invalid file type. Please choose a supported file.',
    es: 'Tipo de archivo inválido. Por favor elige un archivo soportado.'
  },
  UPLOAD_FAILED: {
    en: 'Upload failed. Please try again.',
    es: 'La subida falló. Por favor inténtalo de nuevo.'
  },
  GENERATION_FAILED: {
    en: 'Document generation failed. Please try again.',
    es: 'La generación del documento falló. Por favor inténtalo de nuevo.'
  },
  SUBSCRIPTION_REQUIRED: {
    en: 'Active subscription required for this feature.',
    es: 'Se requiere suscripción activa para esta función.'
  },
  UPGRADE_REQUIRED: {
    en: 'Upgrade required for unlimited use.',
    es: 'Se requiere actualización para uso ilimitado.'
  },
  RATE_LIMIT: {
    en: 'Rate limit exceeded. Please try again later.',
    es: 'Límite de velocidad excedido. Por favor inténtalo más tarde.'
  },
  MAINTENANCE: {
    en: 'System is under maintenance. Please try again later.',
    es: 'El sistema está en mantenimiento. Por favor inténtalo más tarde.'
  },
  FEATURE_UNAVAILABLE: {
    en: 'This feature is currently unavailable.',
    es: 'Esta función no está disponible actualmente.'
  },
  ACCESS_DENIED: {
    en: 'Access denied. You don\'t have permission to perform this action.',
    es: 'Acceso denegado. No tienes permiso para realizar esta acción.'
  },
  SESSION_EXPIRED: {
    en: 'Your session has expired. Please sign in again.',
    es: 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.'
  },
  ACCOUNT_SUSPENDED: {
    en: 'Your account has been suspended. Please contact support.',
    es: 'Tu cuenta ha sido suspendida. Por favor contacta soporte.'
  },
  PAYMENT_REQUIRED: {
    en: 'Payment required to continue.',
    es: 'Se requiere pago para continuar.'
  },
  BILLING_ERROR: {
    en: 'Billing error. Please check your payment method.',
    es: 'Error de facturación. Por favor verifica tu método de pago.'
  },
  STRIPE_ERROR: {
    en: 'Payment processing error. Please try again.',
    es: 'Error en el procesamiento del pago. Por favor inténtalo de nuevo.'
  },
  SUPABASE_ERROR: {
    en: 'Database error. Please try again.',
    es: 'Error de base de datos. Por favor inténtalo de nuevo.'
  },
  OPENAI_ERROR: {
    en: 'AI service error. Please try again.',
    es: 'Error del servicio de IA. Por favor inténtalo de nuevo.'
  },
  STORAGE_ERROR: {
    en: 'File storage error. Please try again.',
    es: 'Error de almacenamiento de archivos. Por favor inténtalo de nuevo.'
  },
  EMAIL_ERROR: {
    en: 'Email sending failed. Please try again.',
    es: 'El envío del correo falló. Por favor inténtalo de nuevo.'
  },
  INVALID_INPUT: {
    en: 'Invalid input provided. Please check your data.',
    es: 'Entrada inválida proporcionada. Por favor verifica tus datos.'
  },
  MISSING_REQUIRED_FIELD: {
    en: 'Required field is missing.',
    es: 'Campo requerido faltante.'
  },
  INVALID_EMAIL: {
    en: 'Invalid email address.',
    es: 'Dirección de correo inválida.'
  },
  INVALID_PHONE: {
    en: 'Invalid phone number.',
    es: 'Número de teléfono inválido.'
  },
  INVALID_DATE: {
    en: 'Invalid date format.',
    es: 'Formato de fecha inválido.'
  },
  INVALID_AMOUNT: {
    en: 'Invalid amount. Please enter a valid number.',
    es: 'Cantidad inválida. Por favor ingresa un número válido.'
  },
  INVALID_CLAIM_NUMBER: {
    en: 'Invalid claim number format.',
    es: 'Formato de número de reclamo inválido.'
  },
  INVALID_POLICY_NUMBER: {
    en: 'Invalid policy number format.',
    es: 'Formato de número de póliza inválido.'
  },
  DOCUMENT_NOT_FOUND: {
    en: 'Document not found.',
    es: 'Documento no encontrado.'
  },
  DOCUMENT_ACCESS_DENIED: {
    en: 'You don\'t have permission to access this document.',
    es: 'No tienes permiso para acceder a este documento.'
  },
  DOCUMENT_EXPIRED: {
    en: 'Document has expired.',
    es: 'El documento ha expirado.'
  },
  DOCUMENT_CORRUPTED: {
    en: 'Document is corrupted and cannot be processed.',
    es: 'El documento está corrupto y no puede ser procesado.'
  },
  TEMPLATE_NOT_FOUND: {
    en: 'Template not found.',
    es: 'Plantilla no encontrada.'
  },
  TEMPLATE_ERROR: {
    en: 'Template processing error.',
    es: 'Error en el procesamiento de la plantilla.'
  },
  ANALYSIS_FAILED: {
    en: 'Analysis failed. Please try again.',
    es: 'El análisis falló. Por favor inténtalo de nuevo.'
  },
  CALCULATION_FAILED: {
    en: 'Calculation failed. Please check your inputs.',
    es: 'El cálculo falló. Por favor verifica tus entradas.'
  },
  COMPARISON_FAILED: {
    en: 'Comparison failed. Please try again.',
    es: 'La comparación falló. Por favor inténtalo de nuevo.'
  },
  NEGOTIATION_FAILED: {
    en: 'Negotiation strategy generation failed. Please try again.',
    es: 'La generación de estrategia de negociación falló. Por favor inténtalo de nuevo.'
  },
  ESCALATION_FAILED: {
    en: 'Escalation guide generation failed. Please try again.',
    es: 'La generación de guía de escalación falló. Por favor inténtalo de nuevo.'
  },
  STATE_RIGHTS_FAILED: {
    en: 'State rights lookup failed. Please try again.',
    es: 'La búsqueda de derechos estatales falló. Por favor inténtalo de nuevo.'
  },
  POLICY_ANALYSIS_FAILED: {
    en: 'Policy analysis failed. Please try again.',
    es: 'El análisis de póliza falló. Por favor inténtalo de nuevo.'
  }
};

// Helper function to get error message by language
export function getErrorMessage(errorKey: string, language: 'en' | 'es' = 'en'): string {
  const error = ERR[errorKey];
  if (!error) {
    return language === 'es' ? 'Error desconocido' : 'Unknown error';
  }
  return error[language];
}

// Helper function to get error message with fallback
export function getErrorMessageWithFallback(
  errorKey: string, 
  language: 'en' | 'es' = 'en',
  fallback?: string
): string {
  const error = ERR[errorKey];
  if (!error) {
    return fallback || (language === 'es' ? 'Error desconocido' : 'Unknown error');
  }
  return error[language];
}

// Helper function to get all error messages for a language
export function getAllErrorMessages(language: 'en' | 'es' = 'en'): Record<string, string> {
  const messages: Record<string, string> = {};
  Object.keys(ERR).forEach(key => {
    messages[key] = ERR[key][language];
  });
  return messages;
}

// Helper function to check if error key exists
export function hasErrorMessage(errorKey: string): boolean {
  return errorKey in ERR;
}

// Helper function to get error message with context
export function getContextualErrorMessage(
  errorKey: string,
  language: 'en' | 'es' = 'en',
  context?: Record<string, string>
): string {
  let message = getErrorMessage(errorKey, language);
  
  if (context) {
    // Replace placeholders in the message
    Object.keys(context).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), context[key]);
    });
  }
  
  return message;
}
