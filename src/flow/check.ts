import { repository } from "@loopback/repository";
import { OrderRepository } from "../repositories";
import { SvcConnector } from "../connectors/svc.connector";
import { CONFIG } from "../config";
import { BalanceReserve } from "../models/balance-reserve.model";
import { Message } from "../models/message.model";
import { ProductReserv } from "../models/product-reserv.model";
import { CourierReserv } from "../models/courier-reserv.model";

export class checkOrders{

    constructor (@repository(OrderRepository) private orderRepo: OrderRepository){

    }

    async check() {
        let orders=await this.orderRepo.find();
        let notify = new SvcConnector(CONFIG.notify.host, 60000, CONFIG.trace);
        let message = new Message();
        let payment = new SvcConnector(CONFIG.payment.host, 60000, CONFIG.trace);
        let payReq = new BalanceReserve();
        let stock = new SvcConnector(CONFIG.stock.host, 60000, CONFIG.trace);
        let stockRec = new ProductReserv();
        let courier = new SvcConnector(CONFIG.delivery.host, 60000, CONFIG.trace);
        let courierRec = new CourierReserv();
                            
        for (let o of orders) {
            if (o.status==STATUS.COMPLETE) continue;

            message.order_id = o.order_id;
            message.user_id = o.user_id||0;
            message.date=new Date().toString();

            payReq.order_id = o.order_id;
            payReq.user_id = o.user_id;
            payReq.price = o.price;

            stockRec.number = o.number;
            stockRec.order_id = o.order_id;
            stockRec.product_id = o.product_id;

            courierRec.date = o.date;
            courierRec.order_id = o.order_id;
            courierRec.courier_id = o.product_id;
            
            if (o.status==STATUS.NEW) {
                let payRes = await payment.postReq(payReq);
                console.log(payRes);

                if (payRes.error) {
                    //let payDel = await payment.delReq(payReq);
                    await this.orderRepo.deleteById(o.order_id);
                    console.log("Платеж не прошёл. Заказ отменён.");
                    message.message = `Оплата не прошла. Недостаточно средств на счете. Заказ ${o.order_id} отменён.`
                    notify.postReq(message);
                    return
                }

                await this.orderRepo.updateById(o.order_id, {status: STATUS.PAID});
                 //РЕЗЕРВ ТОВАРА
                
                 let stockRes = await stock.postReq(stockRec);
                 console.log(stockRes);
 
                 if (stockRes.error) {
                     let payDel = await payment.delReq(payReq);
                     
                     await this.orderRepo.deleteById(o.order_id);
                     console.log("Delete Payment", payDel);
                     message.message = `Не удалось зарезервировать товар на складе. Деньги поступят на счет в течение 15 минут. Заказ ${o.order_id} отменён.`
                     notify.postReq(message)
                     console.log(message.message)
                     return
                 }
 
                 await this.orderRepo.updateById(o.order_id, {status: STATUS.STOCK});

                 //РЕЗЕРВ КУРЬЕРА

                let courierRes = await courier.postReq(courierRec);
                console.log(courierRes);

                if (courierRes.error) {
                    let stockDel = await stock.delReq(stockRec);
                    console.log("Delete product reserve", stockDel);
                    let payDel = await payment.delReq(payReq);
                    console.log("Delete Payment", payDel);
                    await this.orderRepo.deleteById(o.order_id);
                    //let courierDel = await payment.delReq(courierRec);
                    message.message = `Невозможно доставить товар по вашему адресу. Деньги поступят на счет в течение 15 минут. Заказ ${o.order_id} отменён.`
                    notify.postReq(message);
                    return
                }

                //const newOrder = await this.orderRepo.create(_requestBody);
                await this.orderRepo.updateById(o.order_id, {status: STATUS.COMPLETE});
                message.message = "Заказ оплачен";
                notify.postReq(message);
            }

            if (o.status==STATUS.PAID) {
                //РЕЗЕРВ ТОВАРА
                
                let stockRes = await stock.postReq(stockRec);
                console.log(stockRes);

                if (stockRes.error) {
                    let payDel = await payment.delReq(payReq);
                    
                    await this.orderRepo.deleteById(o.order_id);
                    console.log("Delete Payment", payDel);
                    message.message = `Не удалось зарезервировать товар на складе. Деньги поступят на счет в течение 15 минут. Заказ ${o.order_id} отменён.`
                    notify.postReq(message)
                    console.log(message.message)
                    return
                }

                await this.orderRepo.updateById(o.order_id, {status: STATUS.STOCK});

                //РЕЗЕРВ КУРЬЕРА

                let courierRes = await courier.postReq(courierRec);
                console.log(courierRes);

                if (courierRes.error) {
                    let stockDel = await stock.delReq(stockRec);
                    console.log("Delete product reserve", stockDel);
                    let payDel = await payment.delReq(payReq);
                    console.log("Delete Payment", payDel);
                    await this.orderRepo.deleteById(o.order_id);
                    //let courierDel = await payment.delReq(courierRec);
                    message.message = `Невозможно доставить товар по вашему адресу. Деньги поступят на счет в течение 15 минут. Заказ ${o.order_id} отменён.`
                    notify.postReq(message);
                    return
                }

                //const newOrder = await this.orderRepo.create(_requestBody);
                await this.orderRepo.updateById(o.order_id, {status: STATUS.COMPLETE});
                message.message = "Заказ оплачен";
                notify.postReq(message);
            }

            if (o.status==STATUS.STOCK) {
                //РЕЗЕРВ КУРЬЕРА

                let courierRes = await courier.postReq(courierRec);
                console.log(courierRes);

                if (courierRes.error) {
                    let stockDel = await stock.delReq(stockRec);
                    console.log("Delete product reserve", stockDel);
                    let payDel = await payment.delReq(payReq);
                    console.log("Delete Payment", payDel);
                    await this.orderRepo.deleteById(o.order_id);
                    //let courierDel = await payment.delReq(courierRec);
                    message.message = `Невозможно доставить товар по вашему адресу. Деньги поступят на счет в течение 15 минут. Заказ ${o.order_id} отменён.`
                    notify.postReq(message);
                    return
                }

                //const newOrder = await this.orderRepo.create(_requestBody);
                await this.orderRepo.updateById(o.order_id, {status: STATUS.COMPLETE});
                message.message = "Заказ оплачен";
                notify.postReq(message);
            }
        }
        
    }

}

export const STATUS = {
    NEW: 'new',
    PAID: 'paid',
    STOCK: 'stock',
    COMPLETE: 'complete'
}