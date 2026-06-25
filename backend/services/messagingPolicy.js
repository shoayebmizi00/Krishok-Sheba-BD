export function isConversationParticipant(conversation, userId, role) {
  if (role === 'admin') return true;
  const participants = conversation?.participant_ids || [
    conversation?.participant_one_id,
    conversation?.participant_two_id
  ];
  return participants.filter(Boolean).includes(userId);
}

export function canStartRelatedConversation({ user, receiver, relatedType, relation }) {
  if (!user || !receiver || user.id === receiver.id || !receiver.is_active) return false;
  if (user.role === 'admin' || receiver.role === 'admin') return true;
  if (!relation) return false;

  if (relatedType === 'listing') {
    return user.role === 'buyer' && receiver.role === 'farmer' && relation.farmer_id === receiver.id;
  }
  if (['bid', 'order'].includes(relatedType)) {
    return [relation.buyer_id, relation.farmer_id || relation.seller_id].includes(user.id)
      && [relation.buyer_id, relation.farmer_id || relation.seller_id].includes(receiver.id);
  }
  if (relatedType === 'equipment_booking') {
    return [relation.farmer_id, relation.owner_id].includes(user.id)
      && [relation.farmer_id, relation.owner_id].includes(receiver.id);
  }
  if (relatedType === 'transport_booking') {
    return [relation.farmer_id, relation.provider_id].includes(user.id)
      && [relation.farmer_id, relation.provider_id].includes(receiver.id);
  }
  return false;
}
