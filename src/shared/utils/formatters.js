import dayjs from 'dayjs';

export function formatPrice(price, symbol = '৳') {
  return new Intl.NumberFormat('en').format(price ?? 0) + symbol;
}

export function formatDate(date, template = 'DD MMM YYYY') {
  if (!date) return '—';
  return dayjs(date).format(template);
}

export function formatDateTime(date) {
  return formatDate(date, 'DD MMM YYYY, hh:mm A');
}
