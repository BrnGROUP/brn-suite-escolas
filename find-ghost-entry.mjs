// Busca e deleta pelo FITID exato: 000000_69_5

const SUPABASE_URL = 'https://yeetomqxzjhwzhyvxezc.supabase.co';
const ANON_KEY = 'sb_publishable_kpsJBUAzmS1zphJ2aEi-cw_NuR9e9DA';

const FITID = '000000_69_5';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function main() {
  console.log(`🔍 Buscando por bank_transaction_ref = "${FITID}"...\n`);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_entries?bank_transaction_ref=eq.${encodeURIComponent(FITID)}&select=id,description,value,date,status,is_reconciled,bank_transaction_ref,school_id,bank_account_id,category`,
    { headers }
  );

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    console.log('⚠️  Nenhum registro encontrado com esse FITID.');
    console.log('Resposta do banco:', JSON.stringify(data, null, 2));
    return;
  }

  console.log(`✅ Encontrado(s) ${data.length} registro(s):\n`);
  data.forEach((e, i) => {
    console.log(`[${i + 1}]`);
    console.log(`  ID:                  ${e.id}`);
    console.log(`  Descrição:           ${e.description}`);
    console.log(`  Valor:               ${e.value}`);
    console.log(`  Data:                ${e.date}`);
    console.log(`  Status:              ${e.status}`);
    console.log(`  is_reconciled:       ${e.is_reconciled}`);
    console.log(`  bank_transaction_ref:${e.bank_transaction_ref}`);
    console.log(`  category:            ${e.category}`);
    console.log(`  school_id:           ${e.school_id}`);
    console.log('');
  });

  // Deleta todos os encontrados
  const ids = data.map(e => e.id);
  console.log(`🗑️  Deletando ${ids.length} registro(s): ${ids.join(', ')}`);

  const delRes = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_entries?id=in.(${ids.join(',')})`,
    { method: 'DELETE', headers }
  );

  if (delRes.ok) {
    const deleted = await delRes.json().catch(() => []);
    console.log(`\n✅ Deletado(s) com sucesso! Registros removidos: ${ids.join(', ')}`);
  } else {
    const errText = await delRes.text();
    console.error(`\n❌ Erro ao deletar (status ${delRes.status}):`, errText);
  }
}

main().catch(console.error);
