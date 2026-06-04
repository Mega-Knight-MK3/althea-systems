# Invoice Generation Analysis

## Current Flow

### 1. Order Creation (orders_controller.ts:134-179)
```typescript
// Inside database transaction:
1. Create Order record
2. Create OrderItems
3. Create Invoice record (without PDF path)
4. Commit transaction
```

### 2. PDF Generation (orders_controller.ts:181-193)
```typescript
// After transaction (asynchronously):
try {
  1. Query for order again
  2. Generate PDF (invoice_generator.ts)
  3. Update Invoice record with PDF path
  4. Send invoice email
} catch (err) {
  // ⚠️ SILENT FAILURE - Only logs error
  logger.error(...)
}
```

## Potential Issues Found

### 🔴 Issue 1: Silent PDF Generation Failure
**Location**: `orders_controller.ts:181-193`

**Problem**: If PDF generation fails, the error is caught and only logged. The order is still created successfully but **without a PDF**.

**Impact**:
- Orders created without invoices
- Users can't download their invoice
- No indication to user that something went wrong

**Example Failure Scenarios**:
- Storage directory not writable
- pdfkit dependency issues
- Missing order data (items, user, address)

**Fix Needed**: Either:
1. Generate PDF **inside** the transaction (fail order if PDF fails)
2. Return a warning to the user if PDF generation fails
3. Add a retry mechanism for failed PDFs

---

### 🟡 Issue 2: Redundant Order Query
**Location**: `orders_controller.ts:183`

```typescript
await Order.query().where('id', order.order.id).firstOrFail()
```

**Problem**: Queries for the order again unnecessarily. The order is already available as `order.order` from the transaction.

**Impact**: Minor performance overhead

**Fix**: Use the existing order object:
```typescript
const pdfPath = await generateInvoicePdf(order.order, order.invoiceNumber)
```

But wait - the order from transaction might not have relationships loaded. The `generateInvoicePdf` function loads them itself (lines 15-17), so this should work.

---

### 🟡 Issue 3: Email Sending Coupled with PDF Generation
**Location**: `orders_controller.ts:190`

**Problem**: If email sending fails, it's caught by the same try-catch as PDF generation. Difficult to distinguish which failed.

**Impact**: No way to know if PDF failed OR email failed

**Fix**: Separate try-catch blocks:
```typescript
let pdfPath
try {
  pdfPath = await generateInvoicePdf(...)
  const invoiceRecord = await Invoice.query()...
  invoiceRecord.pdfPath = pdfPath
  await invoiceRecord.save()
} catch (err) {
  logger.error({ err, orderId }, 'PDF generation failed')
  // Consider: throw error to fail the order?
}

try {
  await sendInvoiceCopy(user, order.invoiceNumber)
} catch (err) {
  logger.error({ err }, 'Email sending failed')
  // Email failure should not prevent order
}
```

---

## Invoice Generator Analysis

### File: `invoice_generator.ts`

#### ✅ Good Practices:
- Creates directory if not exists (line 12)
- Loads all required relationships (lines 15-17)
- Uses Promise wrapper for stream completion (line 19)
- Proper error handling via stream events

#### Potential Issues:

**🟢 Low Risk: Hardcoded Storage Path**
```typescript
const INVOICE_DIR = 'storage/invoices'
```
- Should this be configurable via environment?
- Works fine for now

**🟢 Low Risk: Date Formatting**
```typescript
doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
```
- Uses current date, not order.placedAt
- Should use: `order.placedAt.toFormat('dd/MM/yyyy')`

**🟢 No Issue: Field Names**
- Uses correct model fields: `street`, `line2`, `postalCode`, etc.
- All fields match Address model

---

## Testing Invoice Generation

### Manual Test Steps:

1. **Check if storage directory exists and is writable:**
```bash
ls -la apps/api/storage/
mkdir -p apps/api/storage/invoices
chmod 755 apps/api/storage/invoices
```

2. **Check if pdfkit is installed:**
```bash
cd apps/api && pnpm list pdfkit
```

3. **Create test order and check logs:**
- Create an order via API
- Check logs for "invoice.generation.failed"
- Check if PDF exists: `ls apps/api/storage/invoices/`

### Automated Test:

```typescript
// Test invoice generation directly
import { generateInvoicePdf } from '#services/invoice_generator'
import Order from '#models/order'

test('invoice PDF generates successfully', async ({ assert }) => {
  // Create test order with all relationships
  const order = await Order.query()
    .preload('items')
    .preload('user')
    .preload('billingAddress')
    .firstOrFail()

  const invoiceNumber = 'TEST-12345'
  const pdfPath = await generateInvoicePdf(order, invoiceNumber)

  assert.isTrue(await fs.exists(pdfPath))
})
```

---

## Recommendations

### Immediate (Critical):
1. ⚠️ **Don't silently fail PDF generation** - At minimum, log to a monitoring service or send alert
2. Add endpoint to regenerate invoice PDF for failed orders
3. Add admin view showing orders with missing PDFs

### Short-term:
1. Separate email sending from PDF generation error handling
2. Use `order.placedAt` date instead of `new Date()`
3. Add retry mechanism for PDF generation

### Long-term:
1. Generate PDFs asynchronously via job queue
2. Store PDFs in cloud storage (S3, etc.) instead of local filesystem
3. Add PDF generation status field to Invoice model

---

## Quick Diagnostic

Run this to check current state:

```bash
# Check if any invoices were created without PDFs
cd althea-systems/apps/api
node ace tinker
# Then in tinker:
await db.from('invoices').whereNull('pdf_path').count()
```

If count > 0, you have orders with missing invoices.
