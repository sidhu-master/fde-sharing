// Display-only translations. Tool names and API payloads stay unchanged.
export const toolLabels: Record<string, string> = {
  get_order: "查询订单", get_order_history: "查询订单历史",
  cancel_order: "取消订单", reset_password: "重置密码",
  send_replacement: "补发商品", create_refund: "创建退款",
  issue_voucher: "发放优惠券", create_return: "创建退货",
  create_complaint: "记录投诉", create_ticket: "创建工单",
  update_info: "更新客户信息",
};
export const parameterLabels: Record<string, string> = {
  order_id: "订单编号", user_id: "客户编号", product_id: "商品编号",
  product_ids: "商品编号列表", amount: "金额", reason: "原因",
  type: "类型", details: "详情", category: "分类",
  name: "姓名", email: "邮箱", phone: "电话", address: "地址",
};
