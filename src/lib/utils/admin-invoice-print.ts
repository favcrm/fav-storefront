import { formatCurrency } from "$lib/utils/formatting";

export interface InvoicePrintProfile {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  logo_url?: string | null;
}

export interface InvoicePrintItem {
  name: string;
  meta?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePrintContext {
  profile: InvoicePrintProfile | null;
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  shipToLines?: string[];
  items: InvoicePrintItem[];
  totals: {
    subtotal: number;
    tax?: number;
    discount?: number;
    shipping?: number;
    total: number;
    currency: string;
  };
  notes?: string | null;
}

function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function profileLogoUrl(profile: InvoicePrintProfile | null): string {
  return profile?.logoUrl ?? profile?.logo_url ?? "/images/logo.jpg";
}

function amount(value: number | undefined, currency: string): string {
  return formatCurrency(value ?? 0, currency);
}

export function openAlignedInvoicePrint(context: InvoicePrintContext): boolean {
  const {
    profile,
    invoiceNumber,
    date,
    customer,
    shipToLines = [],
    items,
    totals,
    notes,
  } = context;
  const currency = totals.currency || "HKD";
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.meta ? `<div class="muted">${escapeHtml(item.meta)}</div>` : ""}
          </td>
          <td class="right">${item.quantity}</td>
          <td class="right">${escapeHtml(amount(item.unitPrice, currency))}</td>
          <td class="right">${escapeHtml(amount(item.total, currency))}</td>
        </tr>`,
    )
    .join("");
  const shipTo = shipToLines.length
    ? shipToLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")
    : "";
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${escapeHtml(invoiceNumber)}</title>
        <style>
          body { font-family: "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif; margin: 40px; color: #111827; }
          header { display: flex; justify-content: space-between; gap: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 28px; }
          img { max-width: 140px; max-height: 72px; object-fit: contain; margin-bottom: 10px; }
          h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: .08em; }
          h2 { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: .12em; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-top: 28px; }
          th { text-align: left; color: #6b7280; font-size: 12px; border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
          td { border-bottom: 1px solid #f3f4f6; padding: 14px 0; vertical-align: top; }
          .right { text-align: right; }
          .muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .totals { margin-left: auto; width: 280px; margin-top: 24px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .total { border-top: 1px solid #111827; font-weight: 700; font-size: 18px; margin-top: 6px; padding-top: 12px !important; }
          .notes { margin-top: 28px; padding-top: 18px; border-top: 1px solid #e5e7eb; white-space: pre-wrap; }
          @media print { body { margin: 24px; } }
        </style>
      </head>
      <body>
        <header>
          <div>
            <img src="${escapeHtml(profileLogoUrl(profile))}" alt="Company logo" />
            <div><strong>${escapeHtml(profile?.name ?? "Stay In Touch Lifestyle")}</strong></div>
            ${profile?.address ? `<div class="muted">${escapeHtml(profile.address)}</div>` : ""}
            ${profile?.email ? `<div class="muted">${escapeHtml(profile.email)}</div>` : ""}
            ${profile?.phone ? `<div class="muted">${escapeHtml(profile.phone)}</div>` : ""}
          </div>
          <div class="right">
            <h1>INVOICE</h1>
            <div class="muted">${escapeHtml(invoiceNumber)}</div>
            <div class="muted">${escapeHtml(date)}</div>
          </div>
        </header>
        <section class="grid">
          <div>
            <h2>Bill to</h2>
            <div>${escapeHtml(customer.name)}</div>
            ${customer.email ? `<div class="muted">${escapeHtml(customer.email)}</div>` : ""}
            ${customer.phone ? `<div class="muted">${escapeHtml(customer.phone)}</div>` : ""}
          </div>
          ${shipTo ? `<div><h2>Ship to</h2>${shipTo}</div>` : "<div></div>"}
        </section>
        <table>
          <thead>
            <tr><th>Item</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Amount</th></tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <section class="totals">
          <div><span>Subtotal</span><span>${escapeHtml(amount(totals.subtotal, currency))}</span></div>
          ${(totals.tax ?? 0) > 0 ? `<div><span>Tax</span><span>${escapeHtml(amount(totals.tax, currency))}</span></div>` : ""}
          ${(totals.discount ?? 0) > 0 ? `<div><span>Discount</span><span>-${escapeHtml(amount(totals.discount, currency))}</span></div>` : ""}
          ${(totals.shipping ?? 0) > 0 ? `<div><span>Shipping</span><span>${escapeHtml(amount(totals.shipping, currency))}</span></div>` : ""}
          <div class="total"><span>Total</span><span>${escapeHtml(amount(totals.total, currency))} ${escapeHtml(currency)}</span></div>
        </section>
        ${notes ? `<section class="notes"><h2>Notes</h2>${escapeHtml(notes)}</section>` : ""}
        <script>window.addEventListener('load', () => window.print());</script>
      </body>
    </html>`;
  const win = window.open("", "_blank");
  if (!win) return false;
  win.opener = null;
  win.document.write(html);
  win.document.close();
  return true;
}
