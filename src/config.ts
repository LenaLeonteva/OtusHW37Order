export const CONFIG = {
  payment: {
    //host: "http://127.0.0.1:3001/balance/reserve",
    //host: "payment-service.default.svc.cluster.local/balance/reserve"
    host: process.env.PAYMENT_HOST ?? "",
  },
  stock: {
    //host: "http://127.0.0.1:3002/products/reserve",
    //host: "stock-service.default.svc.cluster.local/products/reserve",
    host: process.env.STOCK_HOST ?? "",
  },
  delivery: {
    //host: "http://127.0.0.1:3003/courier/reserve",
    //  host: "delivery-service.default.svc.cluster.local/courier/reserve",
    host: process.env.DELIVERY_HOST ?? "",
  },
  trace: true
}
