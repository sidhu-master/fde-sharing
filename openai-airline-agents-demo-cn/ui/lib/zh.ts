// Display translations only: identifiers used for routing remain unchanged.
export const agentLabels: Record<string, string> = {
  'Triage Agent': '接待与分流', 'FAQ Agent': '常见问题专员',
  'Seat and Special Services Agent': '座位与特殊服务专员',
  'Flight Information Agent': '航班信息专员',
  'Booking and Cancellation Agent': '预订与取消专员',
  'Refunds and Compensation Agent': '退款与补偿专员',
};
export const descriptions: Record<string, string> = {
  'Triage Agent': '识别需求，转接航班、预订、座位、常见问题及补偿等专员。',
  'FAQ Agent': '解答行李、座位、补偿等政策问题。',
  'Seat and Special Services Agent': '调整座位，处理医疗及特殊座位需求。',
  'Flight Information Agent': '查询航班状态、中转影响及替代方案。',
  'Booking and Cancellation Agent': '处理新预订、延误改签与取消。',
  'Refunds and Compensation Agent': '记录补偿申请，处理延误后的酒店和餐食支持。',
};
export const fields: Record<string, string> = {
  passenger_name: '乘客姓名', confirmation_number: '预订确认号', seat_number: '座位号',
  flight_number: '航班号', account_number: '账户编号', special_service_note: '特殊服务备注',
  origin: '出发地', destination: '目的地', itinerary: '行程', baggage: '行李',
};
export const toolLabels: Record<string, string> = {
  get_trip_details: '获取行程详情', update_seat: '修改座位',
  assign_special_service_seat: '安排特殊服务座位', display_seat_map: '展示座位图',
  flight_status_tool: '查询航班状态', get_matching_flights: '查找替代航班',
  book_new_flight: '预订航班', cancel_flight: '取消航班',
  faq_lookup_tool: '查询常见问题', issue_compensation: '发放补偿',
};
