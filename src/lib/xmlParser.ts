export interface ParsedXMLItem {
  description: string;
  quantity: number;
  unit: string;
  winner_unit_price: number;
}

export interface ParseXMLResult {
  items: ParsedXMLItem[];
  competitorPrices: { p1: number; p2: number }[];
}

/**
 * Parses an NF-e or NFS-e XML string into structured items and calculated competitor quotes.
 *
 * Implements strict schema validation (Option B):
 * If the XML does not match standard NF-e (<det>) or NFS-e (<xDescServ>) formats,
 * it throws a strict "XML não suportado" error.
 */
export const parseInvoiceXML = (text: string): ParseXMLResult => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Check for XML parsing errors in DOMParser
  const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('XML malformado ou inválido.');
  }

  const items: ParsedXMLItem[] = [];
  const competitorPrices: { p1: number; p2: number }[] = [];

  // Price factor multipliers (from legacy constants)
  const P1_FACTOR = 1.016;
  const P2_FACTOR = 1.0185;

  // 1. Detect Standard NF-e (Products)
  const detElements = xmlDoc.getElementsByTagName('det');
  if (detElements.length > 0) {
    for (let i = 0; i < detElements.length; i++) {
      const det = detElements[i];
      if (!det) continue;

      const prod = det.getElementsByTagName('prod')[0];
      if (!prod) continue;

      const description = prod.getElementsByTagName('xProd')[0]?.textContent || '';
      const quantity = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0');
      const unit = prod.getElementsByTagName('uCom')[0]?.textContent || 'un';
      const winnerPrice = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');

      if (!description) continue;

      items.push({
        description: description.trim().toUpperCase(),
        quantity: isNaN(quantity) ? 0 : quantity,
        unit: unit.trim().toLowerCase(),
        winner_unit_price: isNaN(winnerPrice) ? 0 : winnerPrice
      });

      competitorPrices.push({
        p1: Number((winnerPrice * P1_FACTOR).toFixed(2)),
        p2: Number((winnerPrice * P2_FACTOR).toFixed(2))
      });
    }
  }
  // 2. Detect NFS-e (Services - National Standard)
  else {
    const xDescServ = xmlDoc.getElementsByTagName('xDescServ')[0]?.textContent;
    const vServ = xmlDoc.getElementsByTagName('vServ')[0]?.textContent;

    if (xDescServ) {
      const totalValue = parseFloat(vServ || '0');
      const finalVal = isNaN(totalValue) ? 0 : totalValue;

      // Try to split items by '***' or other delimiters if present
      if (xDescServ.includes('***')) {
        const parts = xDescServ.split('***').map(p => p.trim()).filter(Boolean);

        parts.forEach(part => {
          // Regex to detect pattern: R$ 1.234,56: Description
          const priceRegex = /R\$\s*([\d\.,]+)[:\-\s]+(.*)/i;
          const match = part.match(priceRegex);

          if (match && match[1] && match[2]) {
            const priceStr = match[1].replace(/\./g, '').replace(',', '.');
            const price = parseFloat(priceStr);
            const finalPrice = isNaN(price) ? 0 : price;
            const desc = match[2].trim();

            items.push({
              description: desc.toUpperCase(),
              quantity: 1,
              unit: 'un',
              winner_unit_price: finalPrice
            });

            competitorPrices.push({
              p1: Number((finalPrice * P1_FACTOR).toFixed(2)),
              p2: Number((finalPrice * P2_FACTOR).toFixed(2))
            });
          } else {
            items.push({
              description: part.toUpperCase(),
              quantity: 1,
              unit: 'un',
              winner_unit_price: 0
            });
            competitorPrices.push({ p1: 0, p2: 0 });
          }
        });
      } else {
        // Single service item
        items.push({
          description: xDescServ.trim().toUpperCase(),
          quantity: 1,
          unit: 'un',
          winner_unit_price: finalVal
        });

        competitorPrices.push({
          p1: Number((finalVal * P1_FACTOR).toFixed(2)),
          p2: Number((finalVal * P2_FACTOR).toFixed(2))
        });
      }
    } else {
      // Throw strict exception when schema doesn't match standard layouts (Option B)
      throw new Error('XML não suportado');
    }
  }

  return { items, competitorPrices };
};
