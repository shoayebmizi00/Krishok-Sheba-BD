ALTER TABLE conversations
  MODIFY related_type ENUM('listing','bid','order','equipment_booking','transport_booking','user','general') NULL;
