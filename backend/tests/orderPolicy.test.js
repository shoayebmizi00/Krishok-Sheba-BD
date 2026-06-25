import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOrderCreation } from '../services/orderPolicy.js';

const buyer = { id: 'buyer-1', role: 'buyer' };
const bid = { id: 'bid-1', buyer_id: 'buyer-1', status: 'accepted', quantity_requested: 10 };
const listing = { id: 'listing-1', status: 'active', remaining_quantity: 10 };

test('buyer can create an order from their accepted bid', () => {
  assert.equal(validateOrderCreation({ user: buyer, bid, listing, quantity: 5, cropListingId: listing.id }), null);
});

test('pending and rejected bids are blocked', () => {
  for (const status of ['pending', 'rejected']) {
    const result = validateOrderCreation({ user: buyer, bid: { ...bid, status }, listing, quantity: 5 });
    assert.equal(result.status, 400);
  }
});

test('another buyer cannot use the bid', () => {
  const result = validateOrderCreation({ user: { id: 'buyer-2', role: 'buyer' }, bid, listing, quantity: 5 });
  assert.equal(result.status, 403);
});

test('farmer cannot create a buyer order', () => {
  const result = validateOrderCreation({ user: { id: 'farmer-1', role: 'farmer' }, bid, listing, quantity: 5 });
  assert.equal(result.status, 403);
});

test('quantity above remaining stock is blocked', () => {
  const result = validateOrderCreation({ user: buyer, bid, listing: { ...listing, remaining_quantity: 4 }, quantity: 5 });
  assert.deepEqual(result, { status: 409, message: 'পর্যাপ্ত পরিমাণ ফসল নেই' });
});

test('sold-out listing and mismatched listing id are blocked', () => {
  assert.equal(validateOrderCreation({ user: buyer, bid, listing: { ...listing, status: 'sold_out' }, quantity: 1 }).status, 409);
  assert.equal(validateOrderCreation({ user: buyer, bid, listing, quantity: 1, cropListingId: 'other' }).status, 400);
});
