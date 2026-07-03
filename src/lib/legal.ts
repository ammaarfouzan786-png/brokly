// Legal document templates for the InBuilt Lawyer. Karnataka-oriented.
// Drafts only — "not legal advice"; have reviewed before signing.

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}
function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ONES[h] + ' hundred' + (r ? ' ' : '') : '') + (r ? twoDigits(r) : '');
}

/** Indian-format number to words (handles crore/lakh/thousand). */
export function numToWords(num: number): string {
  num = Math.round(num);
  if (num === 0) return 'zero';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const parts: string[] = [];
  if (crore) parts.push(twoDigits(crore) + ' crore');
  if (lakh) parts.push(twoDigits(lakh) + ' lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' thousand');
  if (num) parts.push(threeDigits(num));
  return parts.join(' ').trim();
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** e.g. 165000 -> "Rupees One Lakh Sixty Five Thousand Only" */
export function rupeesInWords(n: number): string {
  const words = numToWords(n)
    .split(' ')
    .map((w) => cap(w))
    .join(' ');
  return `Rupees ${words} Only`;
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export interface LeaseData {
  executionDate: string;
  place: string;
  lessorName: string;
  lessorRep: string;
  lessorAddress: string;
  lesseeName: string;
  lesseeRep: string;
  lesseeAddress: string;
  premisesNo: string;
  complexName: string;
  premisesAddress: string;
  floor: string;
  sbaSqft: number;
  carpetSqft: number;
  monthlyRent: number;
  maintenance: number;
  gst: boolean;
  enhancementPct: number;
  depositAmount: number;
  depositMonths: number;
  termYears: number;
  lockInYears: number;
  fitoutDays: number;
  rentStartDate: string;
  commenceDate: string;
  waterCharges: number;
}

/** Full commercial lease deed (modelled on a standard Karnataka commercial lease). */
export function commercialLease(d: LeaseData): string {
  const lessorLine = `${d.lessorName}${d.lessorRep ? `, represented by ${d.lessorRep}` : ''}, residing at ${d.lessorAddress}`;
  const lesseeLine = `${d.lesseeName}, having its office at ${d.lesseeAddress}${d.lesseeRep ? `, represented by ${d.lesseeRep}` : ''}`;

  return `THIS AGREEMENT OF LEASE is executed on this ${d.executionDate} at ${d.place} BY AND BETWEEN:

${lessorLine} (hereinafter referred to as the "LESSOR", which expression shall, wherever the context so requires or admits, mean and include their heirs, executors, administrators and assigns) — OF THE ONE PART;

AND

${lesseeLine} (hereinafter referred to as the "LESSEE", which expression shall, wherever the context so requires or admits, mean and include its successors and assigns) — OF THE OTHER PART.

WHEREAS the LESSOR is the sole and absolute owner of the commercial premises bearing No. ${d.premisesNo}, ${d.premisesAddress}, more fully described in the SCHEDULE below (the "SCHEDULE PREMISES"); AND WHEREAS at the request of the LESSEE, the LESSOR has agreed to let out the SCHEDULE PREMISES, and the parties are desirous of reducing the agreed terms into writing.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. RENT
(a) The LESSEE shall pay rent of ${inr(d.monthlyRent)}/- (${rupeesInWords(d.monthlyRent)}) per month${d.maintenance ? `, inclusive of building maintenance of ${inr(d.maintenance)}/-,` : ''} for the ${d.floor}${d.gst ? ', plus GST as applicable under law' : ''}, pertaining to the use and occupation of the SCHEDULE PREMISES.
(b) There shall be an enhancement of ${d.enhancementPct}% on the existing rent on the expiry of every 12 months.
(c) In the event of default in payment of rent and maintenance charges for three (3) consecutive months, the LESSOR shall be entitled to forfeit the tenancy without notice and to seek ejectment of the LESSEE.
(d) The SCHEDULE PREMISES are let to the LESSEE on an "as is where is" basis.

2. DURATION
The lease shall be for a period of ${d.termYears} (${cap(numToWords(d.termYears))}) years commencing from ${d.commenceDate}. A fit-out period of ${d.fitoutDays} days is granted and rent shall commence from ${d.rentStartDate}. Upon expiry of the initial term, a fresh agreement may be executed as per the prevailing market conditions as agreed by both parties. Should the parties opt for a registered rental agreement, the cost thereof shall be borne by the LESSEE.

3. DEPOSIT
The LESSEE has paid an interest-free refundable security deposit of ${inr(d.depositAmount)}/- (${rupeesInWords(d.depositAmount)}), equivalent to ${d.depositMonths} months' rent. The said deposit shall be refunded to the LESSEE at the time of vacating and handing over vacant possession of the SCHEDULE PREMISES, subject to deduction towards any arrears of rent, water and electricity charges, and the cost of repair of any damage caused by the LESSEE.

4. RATES, TAXES & OUTGOINGS
The LESSOR shall bear and pay all property taxes payable to the Corporation of the City of ${d.place} or any statutory authority in respect of the SCHEDULE PREMISES, including deposits for water and electricity connections.

5. ELECTRICITY & WATER CHARGES
The LESSEE shall bear and pay electricity charges as per meter, and water charges of ${inr(d.waterCharges)}/- per month, without default. The premises shall be kept well maintained during the LESSEE's use.

6. INSPECTION & ENTRY
The LESSOR shall be entitled at all reasonable times to enter upon the SCHEDULE PREMISES to inspect and satisfy that it is being used in accordance with the terms of this lease.

7. REPAIRS & MAINTENANCE
The LESSEE shall keep the SCHEDULE PREMISES in good condition, subject to normal wear and tear, and shall not cause or suffer any damage thereto.

8. USE OF PREMISES
The LESSEE shall use the SCHEDULE PREMISES for COMMERCIAL PURPOSE ONLY.

9. BAR ON SUB-LETTING
The LESSEE shall not sub-let, assign or otherwise part with possession of the SCHEDULE PREMISES in favour of any other person. On termination, the LESSEE shall duly deliver vacant possession of the SCHEDULE PREMISES in the condition in which it was let out (subject to wear and tear), and may remove only movable items without damage to the structure, walls or ceilings.

10. TAX DEDUCTION AT SOURCE
The LESSEE shall deduct tax at source (TDS) as may be applicable under law and shall furnish TDS certificates to the LESSOR every quarter.

11. WAIVER / FORBEARANCE
Any delay or indulgence shown by either party in enforcing any term of this lease shall not be construed as a waiver of the rights of that party, and such party shall be entitled to enforce such right without prejudice.

12. TERMINATION
The LESSEE may terminate this lease during the lease period by giving three (3) months' written notice to the LESSOR, only after the lock-in period. Should the LESSEE default in payment of rent for three consecutive months, the LESSOR may issue three months' notice and terminate this lease. THE LOCK-IN PERIOD SHALL BE ${d.lockInYears} (${cap(numToWords(d.lockInYears))}) YEARS FROM THE DATE OF SIGNING OF THIS AGREEMENT.

13. ARBITRATION
Any dispute or difference arising in respect of this lease shall be referred to the arbitration of a sole Arbitrator under the Arbitration and Conciliation Act, 1996, as amended from time to time. The decision of the Arbitrator so appointed shall be binding upon the parties.

14. LANGUAGE, JURISDICTION & VENUE
The proceedings shall be held at ${d.place} and conducted in the English language. The courts at ${d.place} alone shall have jurisdiction with regard to this lease.

15. NOTICE
No notice shall be deemed to have been served unless delivered under acknowledgement due to the addresses stated above, unless otherwise notified in writing.

SCHEDULE
All that piece and parcel of the ${d.floor} (excluding the bathroom/toilet in the rear side) measuring ${d.sbaSqft.toLocaleString('en-IN')} sq.ft of Super Built-up Area (${d.carpetSqft.toLocaleString('en-IN')} sq.ft of carpet area) in the commercial complex known as ${d.complexName} bearing No. ${d.premisesNo}, ${d.premisesAddress}.

IN WITNESS WHEREOF the parties have executed this AGREEMENT OF LEASE in the presence of the witnesses attesting hereunder.`;
}
