/**
 * Financial entry categories for inflows (Entradas)
 */
export const ENTRY_CATEGORIES = [
  'Repasse / Crédito',
  'Rendimento de Aplicação',
  'Resgate de Aplicação',
  'Reembolso / Estorno',
  'Doação/Recursos próprios',
  'Outros'
];

/**
 * Financial entry categories for outflows (Saídas)
 */
export const EXIT_CATEGORIES = [
  'Compra de Produtos',
  'Contratação de Serviços',
  'CONTRATO DE SERVIÇOS DE INTERNET',
  'CONTRATO DE AQUICIÇÃO DE GÁS DE COZINHA',
  'Tarifa Bancária',
  'Aplicação Financeira',
  'Impostos / Tributos',
  'Devolução de Recurso (FNDE/Estado)',
  'Outros'
];

/**
 * Attachment types for financial entries
 */
export const ATTACHMENT_CATEGORIES = [
  'Nota Fiscal',
  'Espelho da Nota',
  'Comprovante',
  'Extrato Bancário',
  'CNPJ',
  'Certidões',
  'FGTS',
  'Trabalhista',
  'Outros'
];

/**
 * Document categories for accountability processes
 */
export const ACCOUNTABILITY_DOC_CATEGORIES = [
  'Ata de Assembleia',
  'Consolidação',
  'Ordem de Compra / Serviço',
  'Pesquisa de Preços (Cotações)',
  'Certidões',
  'CNPJ',
  'Nota Fiscal',
  'Recibo / Quitação',
  'Comprovante de Pagamento',
  'Outros'
];

/**
 * Cities for Foro Comarca selection (sorted)
 */
export const FORO_CITIES = [
  'Arapiraca',
  'Atalaia',
  'Coruripe',
  'Delmiro Gouveia',
  'Coruripe', // Note: Coruripe was sorted, let's keep unique
  'Maragogi',
  'Matriz de Camaragibe',
  'Maceió',
  'Marechal Deodoro',
  'Murici',
  'Palmeira dos Índios',
  'Penedo',
  'Porto Calvo',
  'Santana do Ipanema',
  'São Luiz do Quitunde',
  'São Miguel dos Campos',
  'União dos Palmares',
  'Viçosa'
].filter((v, i, a) => a.indexOf(v) === i).sort(); // Unique and sorted
