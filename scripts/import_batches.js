const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function importBatches() {
  const batchDir = path.join(__dirname, '../scratch/import_batches');
  const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.sql')).sort();
  
  let totalInserted = 0;

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const content = fs.readFileSync(path.join(batchDir, file), 'utf-8');
    
    // Parse the VALUES parts of the SQL insert
    const valuesPart = content.substring(content.indexOf('VALUES') + 6).trim();
    if (!valuesPart) {
        console.log(`No values found in ${file}.`);
        continue;
    }

    // Split by `),` to get individual rows
    const rows = valuesPart.split(/\),\s*\(/);
    const parsedRows = [];

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        
        // Clean leading and trailing parenthesis
        if (i === 0) row = row.substring(1); 
        if (i === rows.length - 1) row = row.replace(/\);[\s\S]*$/, '');
        else row = row.replace(/\)$/, ''); // Sometimes edge cases

        // Split by comma out of quotes. RegEx from standard CSV split
        // This regex splits on comma, but ignores commas inside single quotes.
        const cols = row.match(/(?:[^',]+|'[^']*')+/g).map(c => c.trim());

        if(cols.length < 13) continue;

        // Clean quotes and handle booleans
        const cleanVal = (val) => {
            if (!val || val === 'NULL') return null;
            if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1).replace(/''/g, "'");
            if (val === 'true') return true;
            if (val === 'false') return false;
            return !isNaN(val) ? Number(val) : val;
        };

        const obj = {
            subject_id: cleanVal(cols[0]),
            topic_id: cleanVal(cols[1]),
            paper_number: cleanVal(cols[2]),
            question: cleanVal(cols[3]),
            option_a: cleanVal(cols[4]),
            option_b: cleanVal(cols[5]),
            option_c: cleanVal(cols[6]),
            option_d: cleanVal(cols[7]),
            correct_answer: cleanVal(cols[8]),
            explanation: cleanVal(cols[9]),
            reference_book: cleanVal(cols[10]),
            difficulty: cleanVal(cols[11]) === 'moderate' ? 'medium' : cleanVal(cols[11]),
            is_published: cleanVal(cols[12])
        };
        parsedRows.push(obj);
    }

    console.log(`Parsed ${parsedRows.length} rows from ${file}. Inserting...`);
    
    // Insert in chunks of 50
    for(let i = 0; i < parsedRows.length; i += 50) {
        const chunk = parsedRows.slice(i, i + 50);
        const { data, error } = await supabase.from('mcqs').insert(chunk);
        if (error) {
            console.error(`Error inserting chunk in ${file}:`, error.message);
        } else {
            totalInserted += chunk.length;
        }
    }
    console.log(`Finished ${file}.`);
  }

  console.log(`\nImport complete! Total inserted: ${totalInserted}`);
}

importBatches().catch(console.error);
