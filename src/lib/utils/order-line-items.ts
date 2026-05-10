export interface VariantAwareLineItem {
  productName: string;
  variantName?: string | null;
  variationName?: string | null;
  variationId?: number | string | null;
  sku?: string | null;
  variationDetails?: Record<string, unknown> | null;
}

function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function variationDetailsLabel(
  details?: Record<string, unknown> | null,
): string | null {
  if (!details) return null;
  const parts = Object.entries(details)
    .map(([key, value]) => {
      const cleanKey = clean(key);
      const cleanValue = clean(value);
      return cleanKey && cleanValue ? `${cleanKey}: ${cleanValue}` : null;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function getLineItemVariantLabel(
  item: VariantAwareLineItem,
): string | null {
  return (
    clean(item.variantName) ??
    clean(item.variationName) ??
    variationDetailsLabel(item.variationDetails)
  );
}

export function getLineItemMetaParts(
  item: VariantAwareLineItem,
  labels: { sku: string; variant: string },
): string[] {
  const variant = getLineItemVariantLabel(item);
  const sku = clean(item.sku);
  const variationId = clean(item.variationId);

  return [
    variant,
    sku ? `${labels.sku}: ${sku}` : null,
    !variant && !sku && variationId
      ? `${labels.variant}: #${variationId}`
      : null,
  ].filter((part): part is string => Boolean(part));
}

export function buildLineItemDescription(
  item: VariantAwareLineItem,
  labels: { sku: string; variant: string },
): string {
  const meta = getLineItemMetaParts(item, labels);
  return meta.length > 0
    ? `${item.productName} - ${meta.join(" · ")}`
    : item.productName;
}
