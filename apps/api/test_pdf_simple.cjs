/**
 * Simple PDF generation test
 * Run with: node test_pdf_simple.js
 */

const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing PDF Generation\n')

const testPath = path.join(__dirname, 'storage', 'invoices', `TEST-${Date.now()}.pdf`)

console.log(`Creating test PDF at: ${testPath}\n`)

const doc = new PDFDocument({ size: 'A4', margin: 50 })
const stream = fs.createWriteStream(testPath)

stream.on('finish', () => {
  const stats = fs.statSync(testPath)
  console.log('✅ PDF generated successfully!')
  console.log(`   Size: ${stats.size} bytes`)
  console.log(`   Path: ${testPath}`)
  console.log('\n🎉 Invoice generation is working!\n')
  console.log('You can open the PDF to verify it looks correct.')
})

stream.on('error', (err) => {
  console.log('❌ FAILED:', err.message)
  process.exit(1)
})

doc.pipe(stream)

// Generate a test invoice
doc.fontSize(20).text('Althea Systems', { align: 'left' })
doc.fontSize(10).fillColor('#475569').text('Matériel médical de pointe')
doc.moveDown(2)

doc.fontSize(16).fillColor('#0f172a').text('Facture TEST-12345')
doc.fontSize(10).fillColor('#475569').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
doc.moveDown()

doc.fontSize(11).fillColor('#0f172a').text('Facturé à')
doc.fontSize(10).fillColor('#475569').text('Test User')
doc.text('123 Test Street')
doc.text('75001 Paris')
doc.text('France')
doc.moveDown(2)

// Items table
const tableTop = doc.y
doc.fontSize(10).fillColor('#0f172a')
doc.text('Produit', 50, tableTop)
doc.text('Qté', 320, tableTop, { width: 50, align: 'right' })
doc.text('PU', 380, tableTop, { width: 70, align: 'right' })
doc.text('Total', 460, tableTop, { width: 90, align: 'right' })
doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#cbd5e1').stroke()

let cursor = tableTop + 25
doc.fillColor('#475569')
doc.text('Test Product', 50, cursor, { width: 260 })
doc.text('2', 320, cursor, { width: 50, align: 'right' })
doc.text('50,00 €', 380, cursor, { width: 70, align: 'right' })
doc.text('100,00 €', 460, cursor, { width: 90, align: 'right' })

cursor += 40
doc.moveTo(50, cursor).lineTo(550, cursor).strokeColor('#cbd5e1').stroke()
cursor += 15

doc.fillColor('#0f172a')
doc.text('Sous-total', 380, cursor, { width: 70, align: 'right' })
doc.text('100,00 €', 460, cursor, { width: 90, align: 'right' })
doc.text('Livraison', 380, cursor + 18, { width: 70, align: 'right' })
doc.text('10,00 €', 460, cursor + 18, { width: 90, align: 'right' })
doc.text('TVA', 380, cursor + 36, { width: 70, align: 'right' })
doc.text('20,00 €', 460, cursor + 36, { width: 90, align: 'right' })
doc.fontSize(12)
doc.text('Total', 380, cursor + 56, { width: 70, align: 'right' })
doc.text('130,00 €', 460, cursor + 56, { width: 90, align: 'right' })

doc.end()
