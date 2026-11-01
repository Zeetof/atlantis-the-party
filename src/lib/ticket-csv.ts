export type TicketCsvRow = {
  providerRef: string;
  email: string;
  quantity: number;
  purchasedAt: string | null;
  line: number;
};

export type TicketCsvError = {
  line: number;
  message: string;
};

export type TicketCsvResult = {
  rows: TicketCsvRow[];
  errors: TicketCsvError[];
  usedHeader: boolean;
  totalDataRows: number;
};

const REF_HEADERS = new Set([
  "orderreference",
  "orderref",
  "reference",
  "providerref",
  "ticketreference",
  "ticketref",
  "orderid",
  "order",
]);

const EMAIL_HEADERS = new Set([
  "email",
  "emailaddress",
  "purchaseremail",
  "buyeremail",
  "customeremail",
  "purchaseemail",
]);

const QUANTITY_HEADERS = new Set(["quantity", "qty", "tickets", "ticketcount"]);
const DATE_HEADERS = new Set(["purchasedat", "purchasedate", "orderdate", "date"]);

function normaliseHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normaliseCsvRef(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function parseCsvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => cell.trim() !== ""));
}

export function parseTicketCsv(input: string, maxRows = 1000): TicketCsvResult {
  const rawRows = parseCsvRows(input);
  const errors: TicketCsvError[] = [];

  if (rawRows.length === 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: "The file is empty." }],
      usedHeader: false,
      totalDataRows: 0,
    };
  }

  const headerCells = rawRows[0].map(normaliseHeader);
  const usedHeader =
    headerCells.some((cell) => REF_HEADERS.has(cell)) &&
    headerCells.some((cell) => EMAIL_HEADERS.has(cell));

  const refIndex = usedHeader
    ? headerCells.findIndex((cell) => REF_HEADERS.has(cell))
    : 0;
  const emailIndex = usedHeader
    ? headerCells.findIndex((cell) => EMAIL_HEADERS.has(cell))
    : 1;
  const quantityIndex = usedHeader
    ? headerCells.findIndex((cell) => QUANTITY_HEADERS.has(cell))
    : 2;
  const dateIndex = usedHeader
    ? headerCells.findIndex((cell) => DATE_HEADERS.has(cell))
    : 3;

  const dataRows = usedHeader ? rawRows.slice(1) : rawRows;
  const rows: TicketCsvRow[] = [];
  const seen = new Set<string>();

  dataRows.forEach((cells, index) => {
    const line = index + (usedHeader ? 2 : 1);
    if (rows.length >= maxRows) return;

    const providerRef = normaliseCsvRef(cells[refIndex] ?? "");
    const email = (cells[emailIndex] ?? "").trim().toLowerCase();
    const quantityRaw = quantityIndex >= 0 ? (cells[quantityIndex] ?? "").trim() : "";
    const dateRaw = dateIndex >= 0 ? (cells[dateIndex] ?? "").trim() : "";

    if (!providerRef) {
      errors.push({ line, message: "Missing order reference." });
      return;
    }
    if (providerRef.length < 3 || providerRef.length > 120) {
      errors.push({ line, message: "Order reference must be 3–120 characters." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      errors.push({ line, message: "Invalid purchaser email." });
      return;
    }

    const quantity = quantityRaw === "" ? 1 : Number(quantityRaw);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      errors.push({ line, message: "Quantity must be a whole number from 1 to 20." });
      return;
    }

    let purchasedAt: string | null = null;
    if (dateRaw) {
      const parsed = new Date(dateRaw);
      if (Number.isNaN(parsed.getTime())) {
        errors.push({ line, message: "Purchase date is not a valid date." });
        return;
      }
      purchasedAt = parsed.toISOString();
    }

    if (seen.has(providerRef)) {
      errors.push({ line, message: "Duplicate order reference in this file." });
      return;
    }
    seen.add(providerRef);

    rows.push({ providerRef, email, quantity, purchasedAt, line });
  });

  if (dataRows.length > maxRows) {
    errors.push({
      line: maxRows + (usedHeader ? 2 : 1),
      message: `Only the first ${maxRows} buyer rows are imported. Split larger exports.`,
    });
  }

  return { rows, errors, usedHeader, totalDataRows: dataRows.length };
}
