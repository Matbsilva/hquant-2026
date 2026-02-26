require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('composicoes').select('conteudo_completo').order('created_at', { ascending: false }).limit(1);
  if (error) console.error(error);
  else {
    const text = data[0].conteudo_completo;
    console.log("Found composition!");
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Função')) {
            console.log(`Line ${i}: ${JSON.stringify(lines[i])}`);
            console.log(`Line ${i+1}: ${JSON.stringify(lines[i+1])}`);
            console.log(`Line ${i+2}: ${JSON.stringify(lines[i+2])}`);
        }
    }
  }
}
run();
