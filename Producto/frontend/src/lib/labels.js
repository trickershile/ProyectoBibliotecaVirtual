const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const toNaturalLabel = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return 'Sin información';

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (match) => match.toUpperCase());
};

const ORDER_STATUS_LABELS = {
  pagado: 'Pagada',
  pendiente: 'Pendiente',
  cancelado: 'Cancelada',
  reembolsado: 'Reembolsada',
  confirmed: 'Confirmada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const PAYMENT_STATUS_LABELS = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
  confirmed: 'Confirmado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const TRACKING_STATUS_LABELS = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  retirado: 'Retirado',
  cancelado: 'Cancelado',
};

const REVIEW_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const PAYMENT_METHOD_LABELS = {
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia bancaria',
  presencial: 'Pago presencial',
  efectivo: 'Efectivo',
};

const ITEM_TYPE_LABELS = {
  fisico: 'Físico',
  digital: 'Digital',
  prestamo: 'Préstamo',
};

export const formatOrderStatus = (value) => ORDER_STATUS_LABELS[normalizeValue(value)] || toNaturalLabel(value);

export const formatPaymentStatus = (value) => PAYMENT_STATUS_LABELS[normalizeValue(value)] || toNaturalLabel(value);

export const formatTrackingStatus = (value) => TRACKING_STATUS_LABELS[normalizeValue(value)] || toNaturalLabel(value);

export const formatReviewStatus = (value) => REVIEW_STATUS_LABELS[normalizeValue(value)] || toNaturalLabel(value);

export const formatPaymentMethod = (value) => PAYMENT_METHOD_LABELS[normalizeValue(value)] || toNaturalLabel(value);

export const formatItemType = (value) => ITEM_TYPE_LABELS[normalizeValue(value)] || toNaturalLabel(value);
