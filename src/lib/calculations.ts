export type CalcType = 'SQFT' | 'RUNNING_FEET' | 'PIECE' | 'FIXED_AMOUNT';

/**
 * Parses a single dimension string supporting:
 * - Feet + inches: 5'6", 5' 6", 3'6, 2'3", 10ft 6in
 * - Inches only: 18", 18in
 * - Decimal or integer feet: 14, 5.5, 16'
 */
export function parseDimensionToFeet(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  const raw = String(input || '').trim();
  if (!raw) return 0;

  // Match feet and inches e.g. 5'6", 5' 6", 5'6, 5ft 6in, 5-6
  const ftInMatch = raw.match(
    /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(\d+(?:\.\d+)?)\s*(?:"|''|in|inch|inches)?$/i
  );
  if (ftInMatch) {
    const feet = parseFloat(ftInMatch[1]);
    const inches = parseFloat(ftInMatch[2]);
    return Number((feet + inches / 12).toFixed(4));
  }

  // Match inches only e.g. 18", 18in
  const inchOnlyMatch = raw.match(/^(\d+(?:\.\d+)?)\s*(?:"|''|in|inch|inches)$/i);
  if (inchOnlyMatch) {
    const inches = parseFloat(inchOnlyMatch[1]);
    return Number((inches / 12).toFixed(4));
  }

  // Match feet only e.g. 14', 14ft, 14.5
  const cleaned = raw.replace(/(?:'|ft|feet)$/i, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Number(num.toFixed(4));
}

/**
 * Parses a quick contractor expression like:
 * "14 x 11"
 * "28 x 5"
 * "10 x 3'6""
 * "16 x 5'6" x 2"
 */
export function parseContractorExpression(expr: string): {
  lengthInput: string;
  widthInput: string;
  lengthFeet: number;
  widthFeet: number;
  quantity: number;
} {
  const normalized = String(expr || '')
    .trim()
    .replace(/[×*X]/g, 'x');
  const parts = normalized
    .split(/\s*x\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      lengthInput: '0',
      widthInput: '0',
      lengthFeet: 0,
      widthFeet: 0,
      quantity: 1,
    };
  }

  if (parts.length === 1) {
    const l = parseDimensionToFeet(parts[0]);
    return {
      lengthInput: parts[0],
      widthInput: '1',
      lengthFeet: l,
      widthFeet: 1,
      quantity: 1,
    };
  }

  const lengthInput = parts[0];
  const widthInput = parts[1];
  const qtyInput = parts[2] ? parseFloat(parts[2]) : 1;

  return {
    lengthInput,
    widthInput,
    lengthFeet: parseDimensionToFeet(lengthInput),
    widthFeet: parseDimensionToFeet(widthInput),
    quantity: isNaN(qtyInput) || qtyInput <= 0 ? 1 : qtyInput,
  };
}

export function calculateMeasurementItem(params: {
  lengthInput: string | number;
  widthInput: string | number;
  quantity: number;
  calcType: CalcType;
  rate: number;
}): {
  lengthFeet: number;
  widthFeet: number;
  areaSqft: number;
  amount: number;
} {
  const lengthFeet = parseDimensionToFeet(params.lengthInput);
  const widthFeet = parseDimensionToFeet(params.widthInput);
  const qty = Number(params.quantity) > 0 ? Number(params.quantity) : 1;
  const rate = Number(params.rate) >= 0 ? Number(params.rate) : 0;

  let areaSqft = 0;
  let amount = 0;

  switch (params.calcType) {
    case 'SQFT':
      areaSqft = Number((lengthFeet * widthFeet * qty).toFixed(2));
      amount = Number((areaSqft * rate).toFixed(2));
      break;
    case 'RUNNING_FEET':
      areaSqft = Number((lengthFeet * qty).toFixed(2));
      amount = Number((areaSqft * rate).toFixed(2));
      break;
    case 'PIECE':
      areaSqft = Number(qty.toFixed(2));
      amount = Number((qty * rate).toFixed(2));
      break;
    case 'FIXED_AMOUNT':
      areaSqft = Number((lengthFeet * widthFeet * qty).toFixed(2));
      amount = Number((rate * qty).toFixed(2));
      break;
    default:
      areaSqft = Number((lengthFeet * widthFeet * qty).toFixed(2));
      amount = Number((areaSqft * rate).toFixed(2));
  }

  return {
    lengthFeet,
    widthFeet,
    areaSqft,
    amount,
  };
}

export function formatINR(value: number | string | null | undefined): string {
  const num = Number(value || 0);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumberIN(value: number | string | null | undefined, decimals = 2): string {
  const num = Number(value || 0);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigitsToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${TENS[ten]}${one ? ' ' + ONES[one] : ''}`;
}

export function amountToIndianWords(amount: number | string): string {
  const num = Math.round(Number(amount || 0) * 100) / 100;
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const convertRupees = (val: number): string => {
    if (val === 0) return 'Zero';
    const parts: string[] = [];

    const crore = Math.floor(val / 10000000);
    val %= 10000000;
    if (crore > 0) {
      parts.push(`${convertRupees(crore)} Crore`);
    }

    const lakh = Math.floor(val / 100000);
    val %= 100000;
    if (lakh > 0) {
      parts.push(`${twoDigitsToWords(lakh)} Lakh`);
    }

    const thousand = Math.floor(val / 1000);
    val %= 1000;
    if (thousand > 0) {
      parts.push(`${twoDigitsToWords(thousand)} Thousand`);
    }

    const hundred = Math.floor(val / 100);
    val %= 100;
    if (hundred > 0) {
      parts.push(`${ONES[hundred]} Hundred`);
    }

    if (val > 0) {
      if (parts.length > 0) parts.push('and');
      parts.push(twoDigitsToWords(val));
    }

    return parts.join(' ');
  };

  let result = `Rupees ${convertRupees(rupees)}`;
  if (paise > 0) {
    result += ` and ${twoDigitsToWords(paise)} Paise`;
  }
  return `${result} Only`;
}

export const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'West Bengal', code: '19' },
];
