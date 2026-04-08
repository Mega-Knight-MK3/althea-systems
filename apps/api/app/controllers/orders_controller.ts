import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { createReadStream } from 'node:fs'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Address from '#models/address'
import Invoice from '#models/invoice'
import { createOrderValidator } from '#validators/checkout'
import { quoteCart } from '#services/cart_pricing'
import { stripeClient } from '#services/stripe_service'
import { generateInvoicePdf } from '#services/invoice_generator'

export default class OrdersController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Order.query()
      .where('userId', user.id)
      .preload('items')
      .preload('invoice')
      .orderBy('createdAt', 'desc')
  }

  async show({ auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    return Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .preload('items')
      .preload('billingAddress')
      .preload('shippingAddress')
      .preload('paymentMethod')
      .preload('invoice')
      .firstOrFail()
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createOrderValidator)

    const [billing, shipping] = await Promise.all([
      Address.query()
        .where('id', payload.billingAddressId)
        .where('userId', user.id)
        .firstOrFail(),
      Address.query()
        .where('id', payload.shippingAddressId)
        .where('userId', user.id)
        .firstOrFail(),
    ])

    const quote = await quoteCart(payload.items)
    if (quote.unavailable.length > 0) {
      return response.unprocessableEntity({
        message: 'Certains produits ne sont plus disponibles.',
        unavailable: quote.unavailable,
      })
    }

    const intent = await stripeClient().paymentIntents.retrieve(payload.paymentIntentId)
    if (intent.status !== 'succeeded') {
      return response.unprocessableEntity({
        message: `Le paiement n'a pas été confirmé (statut: ${intent.status}).`,
      })
    }

    const order = await db.transaction(async (trx) => {
      const created = new Order()
      created.useTransaction(trx)
      created.merge({
        userId: user.id,
        status: 'paid',
        subtotal: quote.subtotal,
        tax: quote.tax,
        shippingCost: quote.shipping,
        total: quote.total,
        billingAddressId: billing.id,
        shippingAddressId: shipping.id,
        stripePaymentIntentId: intent.id,
        placedAt: DateTime.now(),
      })
      await created.save()

      for (const line of quote.lines) {
        const item = new OrderItem()
        item.useTransaction(trx)
        item.merge({
          orderId: created.id,
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          total: line.total,
        })
        await item.save()
      }

      const invoiceNumber = `ALT-${DateTime.now().toFormat('yyyyLLdd')}-${created.id.toString().padStart(5, '0')}`
      const invoice = new Invoice()
      invoice.useTransaction(trx)
      invoice.merge({
        orderId: created.id,
        invoiceNumber,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        issuedAt: DateTime.now(),
      })
      await invoice.save()

      return { order: created, invoiceNumber }
    })

    const pdfPath = await generateInvoicePdf(
      await Order.query().where('id', order.order.id).firstOrFail(),
      order.invoiceNumber
    )
    const invoiceRecord = await Invoice.query().where('orderId', order.order.id).firstOrFail()
    invoiceRecord.pdfPath = pdfPath
    await invoiceRecord.save()

    return response.created({
      order: await Order.query()
        .where('id', order.order.id)
        .preload('items')
        .preload('invoice')
        .firstOrFail(),
    })
  }

  async downloadInvoice({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('id', params.id)
      .where('userId', user.id)
      .preload('invoice')
      .firstOrFail()

    if (!order.invoice || !order.invoice.pdfPath) {
      return response.notFound({ message: 'Facture indisponible.' })
    }

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="${order.invoice.invoiceNumber}.pdf"`
    )
    return response.stream(createReadStream(order.invoice.pdfPath))
  }
}
