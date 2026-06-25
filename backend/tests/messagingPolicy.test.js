import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartRelatedConversation, isConversationParticipant } from '../services/messagingPolicy.js';

const farmer = { id: 'farmer', role: 'farmer' };
const buyer = { id: 'buyer', role: 'buyer', is_active: true };
const equipmentOwner = { id: 'equipment', role: 'equipment_owner', is_active: true };
const transportOwner = { id: 'transport', role: 'transport_provider', is_active: true };

test('only participants can access a private conversation', () => {
  const conversation = { participant_ids: ['farmer', 'buyer'] };
  assert.equal(isConversationParticipant(conversation, 'farmer', 'farmer'), true);
  assert.equal(isConversationParticipant(conversation, 'random', 'buyer'), false);
  assert.equal(isConversationParticipant(conversation, 'admin', 'admin'), true);
});

test('farmer can message buyer connected to a bid or order', () => {
  assert.equal(canStartRelatedConversation({ user: farmer, receiver: buyer, relatedType: 'bid', relation: { buyer_id: 'buyer', farmer_id: 'farmer' } }), true);
  assert.equal(canStartRelatedConversation({ user: farmer, receiver: buyer, relatedType: 'order', relation: { buyer_id: 'buyer', seller_id: 'farmer' } }), true);
});

test('buyer can start a listing conversation only with that listing farmer', () => {
  assert.equal(canStartRelatedConversation({ user: buyer, receiver: { ...farmer, is_active: true }, relatedType: 'listing', relation: { farmer_id: 'farmer' } }), true);
  assert.equal(canStartRelatedConversation({ user: transportOwner, receiver: { ...farmer, is_active: true }, relatedType: 'listing', relation: { farmer_id: 'farmer' } }), false);
});

test('farmer can message connected equipment and transport owners', () => {
  assert.equal(canStartRelatedConversation({ user: farmer, receiver: equipmentOwner, relatedType: 'equipment_booking', relation: { farmer_id: 'farmer', owner_id: 'equipment' } }), true);
  assert.equal(canStartRelatedConversation({ user: farmer, receiver: transportOwner, relatedType: 'transport_booking', relation: { farmer_id: 'farmer', provider_id: 'transport' } }), true);
});

test('random unrelated users cannot start a conversation', () => {
  assert.equal(canStartRelatedConversation({ user: farmer, receiver: buyer, relatedType: 'bid', relation: { buyer_id: 'other', farmer_id: 'farmer' } }), false);
});

test('admin can message any active user', () => {
  assert.equal(canStartRelatedConversation({ user: { id: 'admin', role: 'admin' }, receiver: buyer, relatedType: 'user', relation: null }), true);
});
