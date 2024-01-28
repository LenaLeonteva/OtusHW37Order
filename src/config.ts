export const CONFIG = {
  payment: {
    //host: "http://127.0.0.1:3001/balance/reserve",
    //host: "http://payment-service.default.svc.cluster.local/balance/reserve"
    host: process.env.PAYMENT_HOST ?? "",
  },
  stock: {
    //host: "http://127.0.0.1:3002/products/reserve",
    //host: "http://stock-service.default.svc.cluster.local/products/reserve",
    host: process.env.STOCK_HOST ?? "",
  },
  delivery: {
    //host: "http://127.0.0.1:3003/courier/reserve",
    //  host: "http://delivery-service.default.svc.cluster.local/courier/reserve",
    host: process.env.DELIVERY_HOST ?? "",
  },
  notify: {
    //host: "http://127.0.0.1:3004/message/send",
    host: process.env.NOTIFY_HOST ?? "",
  },
  trace: false
}
