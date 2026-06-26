import bkashLogo from '@/assets/payment/bkash.svg';
import nagadLogo from '@/assets/payment/nagad.svg';
import rocketLogo from '@/assets/payment/rocket.png';
import upayLogo from '@/assets/payment/upay.png';

export const PAYMENT_METHODS = [
  {
    id: 'bkash',
    group: 'মোবাইল ব্যাংকিং',
    name: 'bKash',
    description: 'Fast Mobile Payment',
    logo: bkashLogo,
    type: 'mobile'
  },
  {
    id: 'nagad',
    group: 'মোবাইল ব্যাংকিং',
    name: 'Nagad',
    description: 'Secure Mobile Banking',
    logo: nagadLogo,
    type: 'mobile'
  },
  {
    id: 'rocket',
    group: 'মোবাইল ব্যাংকিং',
    name: 'Rocket',
    description: 'Instant Transfer',
    logo: rocketLogo,
    type: 'mobile'
  },
  {
    id: 'upay',
    group: 'মোবাইল ব্যাংকিং',
    name: 'Upay',
    description: 'Quick Mobile Payment',
    logo: upayLogo,
    type: 'mobile'
  },
  {
    id: 'bank_transfer',
    group: 'ব্যাংক পেমেন্ট',
    name: 'Bank Transfer',
    description: 'Direct Bank Deposit',
    logo: '/assets/payment/bank.svg',
    type: 'bank'
  },
  {
    id: 'visa',
    group: 'কার্ড পেমেন্ট',
    name: 'Visa',
    description: 'Debit/Credit Card',
    logo: '/assets/payment/visa.svg',
    type: 'card'
  },
  {
    id: 'mastercard',
    group: 'কার্ড পেমেন্ট',
    name: 'MasterCard',
    description: 'Debit/Credit Card',
    logo: '/assets/payment/mastercard.svg',
    type: 'card'
  },
  {
    id: 'amex',
    group: 'কার্ড পেমেন্ট',
    name: 'American Express',
    description: 'Premium Card Payment',
    logo: '/assets/payment/amex.svg',
    type: 'card'
  },
  {
    id: 'cash_on_delivery',
    group: 'অন্যান্য',
    name: 'Cash on Delivery',
    description: 'Pay After Delivery',
    logo: '/assets/payment/cod.svg',
    type: 'cod'
  }
];

export const PAYMENT_METHOD_BY_ID = Object.fromEntries(PAYMENT_METHODS.map((method) => [method.id, method]));

export const paymentMethodLabel = (id) => PAYMENT_METHOD_BY_ID[id]?.name || String(id || '').replaceAll('_', ' ');
