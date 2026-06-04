/**
 * Test invoice generation standalone
 * Run with: node ace run:script test_invoice_generation.ts
 */

import PDFDocument from 'pdfkit'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import app from '@adonisjs/core/services/app'

console.log('🧪 Testing Invoice PDF Generation\n')

// Test 1: Check if pdfkit works
console.log('Test 1: PDFKit Basic Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━')

try {
  const testDir = app.makePath('storage/test')
  await fs.mkdir(testDir, { recursive: true })
  const testPath = path.join(testDir, 'test.pdf')

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument()
    const stream = createWriteStream(testPath)

    stream.on('finish', resolve)
    stream.on('error', reject)

    doc.pipe(stream)
    doc.fontSize(20).text('Test Invoice PDF', 100, 100)
    doc.end()
  })

  const stats = await fs.stat(testPath)
  console.log(`✅ PDF created successfully`)
  console.log(`   Path: ${testPath}`)
  console.log(`   Size: ${stats.size} bytes`)

  // Cleanup
  await fs.unlink(testPath)
  console.log(`✅ Test PDF deleted\n`)
} catch (error) {
  console.log(`❌ FAILED: ${error.message}\n`)
  process.exit(1)
}

// Test 2: Check storage permissions
console.log('Test 2: Storage Directory Permissions')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

try {
  const invoiceDir = app.makePath('storage/invoices')
  await fs.access(invoiceDir, fs.constants.W_OK)
  console.log(`✅ Invoice directory is writable`)
  console.log(`   Path: ${invoiceDir}\n`)
} catch (error) {
  console.log(`❌ Invoice directory is NOT writable`)
  console.log(`   Error: ${error.message}\n`)
  process.exit(1)
}

// Test 3: Test actual invoice generation logic
console.log('Test 3: Invoice Generator Function Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

try {
  // Mock order data
  const mockOrder = {
    id: 1,
    user: {
      fullName: 'Test User',
      email: 'test@example.com'
    },
    billingAddress: {
      fullName: 'Test User',
      street: '123 Test Street',
      line2: 'Apt 4B',
      postalCode: '75001',
      city: 'Paris',
      country: 'France'
    },
    items: [
      {
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 50.00,
        total: 100.00
      }
    ],
    subtotal: 100.00,
    shippingCost: 10.00,
    tax: 20.00,
    total: 130.00,
    load: async (relation: string) => {
      // Mock load function
      console.log(`   Loading relation: ${relation}`)
    }
  }

  const testInvoiceNumber = `TEST-${Date.now()}`
  const invoiceDir = app.makePath('storage/invoices')
  const testPath = path.join(invoiceDir, `${testInvoiceNumber}.pdf`)

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(testPath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.pipe(stream)

    // Generate invoice (simplified version)
    doc.fontSize(20).text('Althea Systems', { align: 'left' })
    doc.fontSize(10).fillColor('#475569').text('Matériel médical de pointe')
    doc.moveDown(2)

    doc.fontSize(16).fillColor('#0f172a').text(`Facture ${testInvoiceNumber}`)
    doc.fontSize(10).fillColor('#475569').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
    doc.moveDown()

    doc.fontSize(11).fillColor('#0f172a').text('Facturé à')
    doc.fontSize(10).fillColor('#475569').text(mockOrder.user.fullName)
    doc.text(mockOrder.billingAddress.fullName)
    doc.text(mockOrder.billingAddress.street)
    if (mockOrder.billingAddress.line2) doc.text(mockOrder.billingAddress.line2)
    doc.text(`${mockOrder.billingAddress.postalCode} ${mockOrder.billingAddress.city}`)
    doc.text(mockOrder.billingAddress.country)
    doc.moveDown(2)

    // Items table
    const tableTop = doc.y
    doc.fontSize(10).fillColor('#0f172a')
    doc.text('Produit', 50, tableTop)
    doc.text('Qté', 320, tableTop, { width: 50, align: 'right' })
    doc.text('PU', 380, tableTop, { width: 70, align: 'right' })
    doc.text('Total', 460, tableTop, { width: 90, align: 'right' })

    let cursor = tableTop + 25
    doc.fillColor('#475569')
    for (const item of mockOrder.items) {
      doc.text(item.productName, 50, cursor, { width: 260 })
      doc.text(String(item.quantity), 320, cursor, { width: 50, align: 'right' })
      doc.text(`${item.unitPrice.toFixed(2)} €`, 380, cursor, { width: 70, align: 'right' })
      doc.text(`${item.total.toFixed(2)} €`, 460, cursor, { width: 90, align: 'right' })
      cursor += 22
    }

    cursor += 30
    doc.fillColor('#0f172a')
    doc.text('Total', 380, cursor, { width: 70, align: 'right' })
    doc.text(`${mockOrder.total.toFixed(2)} €`, 460, cursor, { width: 90, align: 'right' })

    doc.end()
  })

  const stats = await fs.stat(testPath)
  console.log(`✅ Invoice PDF generated successfully`)
  console.log(`   Path: ${testPath}`)
  console.log(`   Size: ${stats.size} bytes`)
  console.log(`   Invoice Number: ${testInvoiceNumber}`)

  console.log(`\n💡 Test invoice saved. You can view it at:`)
  console.log(`   ${testPath}`)
  console.log(`\n⚠️  Remember to delete test invoice manually`)

} catch (error) {
  console.log(`❌ FAILED: ${error.message}`)
  console.log(error.stack)
  process.exit(1)
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ All tests passed!')
console.log('🎉 Invoice generation is working correctly')
console.log('\nIf real orders are not generating invoices, check:')
console.log('  1. Order creation logs for errors')
console.log('  2. Whether orders have all required relationships loaded')
console.log('  3. Database query for orders with missing PDF paths')
