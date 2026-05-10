export function formatMoney(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount == null || Number.isNaN(amount)) return "";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(amount);
}
