import { describe, it, expect } from 'vitest';
import { parseInvoiceXML } from './xmlParser';

describe('xmlParser', () => {
  it('should successfully parse valid NF-e XML with product items', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
        <NFe>
          <infNFe>
            <det nItem="1">
              <prod>
                <xProd>Papel Sulfite A4</xProd>
                <qCom>10.0000</qCom>
                <uCom>CX</uCom>
                <vUnCom>25.5000</vUnCom>
              </prod>
            </det>
            <det nItem="2">
              <prod>
                <xProd>Caneta Esferografica Azul</xProd>
                <qCom>50.0000</qCom>
                <uCom>UN</uCom>
                <vUnCom>1.5000</vUnCom>
              </prod>
            </det>
          </infNFe>
        </NFe>
      </nfeProc>
    `;

    const result = parseInvoiceXML(xml);
    expect(result.items).toHaveLength(2);
    expect(result.competitorPrices).toHaveLength(2);

    const item1 = result.items[0]!;
    expect(item1.description).toBe('PAPEL SULFITE A4');
    expect(item1.quantity).toBe(10);
    expect(item1.unit).toBe('cx');
    expect(item1.winner_unit_price).toBe(25.50);

    // Competitor prices: P1 = 25.50 * 1.016 = 25.91, P2 = 25.50 * 1.0185 = 25.97
    expect(result.competitorPrices[0]!.p1).toBe(25.91);
    expect(result.competitorPrices[0]!.p2).toBe(25.97);

    const item2 = result.items[1]!;
    expect(item2.description).toBe('CANETA ESFEROGRAFICA AZUL');
    expect(item2.quantity).toBe(50);
    expect(item2.unit).toBe('un');
    expect(item2.winner_unit_price).toBe(1.50);
    expect(result.competitorPrices[1]!.p1).toBe(1.52);
    expect(result.competitorPrices[1]!.p2).toBe(1.53);
  });

  it('should successfully parse national NFS-e with single service item', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <tcNfse>
        <infNfse>
          <xDescServ>Manutencao preventiva de ar condicionado escolar</xDescServ>
          <vServ>850.00</vServ>
        </infNfse>
      </tcNfse>
    `;

    const result = parseInvoiceXML(xml);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.description).toBe('MANUTENCAO PREVENTIVA DE AR CONDICIONADO ESCOLAR');
    expect(result.items[0]!.quantity).toBe(1);
    expect(result.items[0]!.unit).toBe('un');
    expect(result.items[0]!.winner_unit_price).toBe(850.00);

    // Competitor prices: P1 = 850 * 1.016 = 863.60, P2 = 850 * 1.0185 = 865.73
    expect(result.competitorPrices[0]!.p1).toBe(863.60);
    expect(result.competitorPrices[0]!.p2).toBe(865.73);
  });

  it('should successfully split multiple service items in NFS-e when separated by ***', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <tcNfse>
        <infNfse>
          <xDescServ>*** R$ 450,00 - Servico de Pintura de Portao *** R$ 300,50 - Troca de Fechaduras</xDescServ>
          <vServ>750.50</vServ>
        </infNfse>
      </tcNfse>
    `;

    const result = parseInvoiceXML(xml);
    expect(result.items).toHaveLength(2);

    const item1 = result.items[0]!;
    expect(item1.description).toBe('SERVICO DE PINTURA DE PORTAO');
    expect(item1.quantity).toBe(1);
    expect(item1.winner_unit_price).toBe(450.00);
    expect(result.competitorPrices[0]!.p1).toBe(457.20); // 450 * 1.016
    expect(result.competitorPrices[0]!.p2).toBe(458.32); // 450 * 1.0185

    const item2 = result.items[1]!;
    expect(item2.description).toBe('TROCA DE FECHADURAS');
    expect(item2.quantity).toBe(1);
    expect(item2.winner_unit_price).toBe(300.50);
  });

  it('should throw Error when XML format is unsupported', () => {
    const unsupportedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <randomRoot>
        <someTag>Qualquer Conteudo</someTag>
      </randomRoot>
    `;

    expect(() => parseInvoiceXML(unsupportedXml)).toThrow('XML não suportado');
  });

  it('should throw Error when XML is malformed', () => {
    const malformedXml = `<nfeProc><NFe><prod>Open without close`;

    expect(() => parseInvoiceXML(malformedXml)).toThrow();
  });
});
