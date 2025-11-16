import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableSchema {
  [key: string]: {
    columns: string[];
    requiredColumns: string[];
    foreignKeys?: { [key: string]: { table: string; column: string } };
  };
}

const TABLE_SCHEMAS: TableSchema = {
  brands: {
    columns: ['id', 'name', 'created_at', 'updated_at'],
    requiredColumns: ['id', 'name'],
  },
  notes: {
    columns: ['id', 'name', 'type', 'created_at'],
    requiredColumns: ['id', 'name', 'type'],
  },
  accords: {
    columns: ['id', 'name', 'created_at'],
    requiredColumns: ['id', 'name'],
  },
  seasons: {
    columns: ['id', 'name', 'created_at'],
    requiredColumns: ['id', 'name'],
  },
  perfumes: {
    columns: ['id', 'name', 'brand_id', 'year', 'concentration', 'description', 'image_url', 'main_accord_id', 'rating', 'votes', 'longevity', 'sillage', 'created_at', 'updated_at'],
    requiredColumns: ['id', 'name'],
    foreignKeys: {
      brand_id: { table: 'brands', column: 'id' },
      main_accord_id: { table: 'accords', column: 'id' },
    },
  },
  perfume_notes: {
    columns: ['perfume_id', 'note_id'],
    requiredColumns: ['perfume_id', 'note_id'],
    foreignKeys: {
      perfume_id: { table: 'perfumes', column: 'id' },
      note_id: { table: 'notes', column: 'id' },
    },
  },
  perfume_accords: {
    columns: ['perfume_id', 'accord_id'],
    requiredColumns: ['perfume_id', 'accord_id'],
    foreignKeys: {
      perfume_id: { table: 'perfumes', column: 'id' },
      accord_id: { table: 'accords', column: 'id' },
    },
  },
  perfume_seasons: {
    columns: ['perfume_id', 'season_id'],
    requiredColumns: ['perfume_id', 'season_id'],
    foreignKeys: {
      perfume_id: { table: 'perfumes', column: 'id' },
      season_id: { table: 'seasons', column: 'id' },
    },
  },
  perfume_similar: {
    columns: ['perfume_id', 'similar_id'],
    requiredColumns: ['perfume_id', 'similar_id'],
    foreignKeys: {
      perfume_id: { table: 'perfumes', column: 'id' },
      similar_id: { table: 'perfumes', column: 'id' },
    },
  },
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
      i++;
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function validateUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tableName = formData.get('table') as string;
    const conflictMode = (formData.get('conflictMode') as string) || 'skip';

    if (!file || !tableName) {
      return new Response(
        JSON.stringify({ error: 'File and table name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const schema = TABLE_SCHEMAS[tableName];
    if (!schema) {
      return new Response(
        JSON.stringify({ error: `Invalid table name: ${tableName}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'CSV file is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check row count limit (10,000 rows max)
    const MAX_ROWS = 10000;
    if (rows.length - 1 > MAX_ROWS) { // -1 for header row
      return new Response(
        JSON.stringify({ 
          error: `Too many rows. Maximum is ${MAX_ROWS} rows. Your file has ${rows.length - 1} data rows.`,
          suggestion: 'Split your file into smaller chunks.'
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Validate headers
    const missingColumns = schema.requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing required columns: ${missingColumns.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extraColumns = headers.filter(h => !schema.columns.includes(h));
    if (extraColumns.length > 0) {
      return new Response(
        JSON.stringify({ error: `Extra columns not in schema: ${extraColumns.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errors: { row: number; error: string }[] = [];
    const validRows: any[] = [];

    // Validate and prepare rows
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowData: any = {};
      let hasError = false;

      for (let j = 0; j < headers.length; j++) {
        const column = headers[j];
        const value = row[j]?.trim();

        if (!value && schema.requiredColumns.includes(column)) {
          errors.push({ row: i + 2, error: `Missing required value for column: ${column}` });
          hasError = true;
          break;
        }

        if (value) {
          // UUID validation
          if (column.includes('_id') || column === 'id') {
            if (!validateUUID(value)) {
              errors.push({ row: i + 2, error: `Invalid UUID format for ${column}: ${value}` });
              hasError = true;
              break;
            }
          }

          // Integer validation
          if (['year', 'votes', 'rating'].includes(column)) {
            const num = Number(value);
            if (isNaN(num)) {
              errors.push({ row: i + 2, error: `Invalid number format for ${column}: ${value}` });
              hasError = true;
              break;
            }
            rowData[column] = num;
          } else {
            rowData[column] = value;
          }
        }
      }

      if (!hasError) {
        validRows.push(rowData);
      }
    }

    // Validate foreign keys
    if (schema.foreignKeys && validRows.length > 0) {
      for (const [column, fk] of Object.entries(schema.foreignKeys)) {
        const uniqueIds = [...new Set(validRows.map(r => r[column]).filter(Boolean))];
        
        if (uniqueIds.length > 0) {
          const { data: existingRecords } = await supabaseClient
            .from(fk.table)
            .select(fk.column)
            .in(fk.column, uniqueIds);

          const existingIds = new Set(existingRecords?.map((r: any) => r[fk.column]) || []);
          
          for (let i = 0; i < validRows.length; i++) {
            const value = validRows[i][column];
            if (value && !existingIds.has(value)) {
              errors.push({ 
                row: i + 2, 
                error: `Foreign key violation: ${column} value ${value} does not exist in ${fk.table}` 
              });
              validRows.splice(i, 1);
              i--;
            }
          }
        }
      }
    }

    let successfulRows = 0;
    let skippedRows = 0;

    // Insert in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);

      if (conflictMode === 'skip') {
        const { data, error } = await supabaseClient
          .from(tableName)
          .insert(batch)
          .select();

        if (error) {
          console.error('Insert error:', error);
          // Individual row errors
          batch.forEach((_, idx) => {
            errors.push({ row: i + idx + 2, error: error.message });
          });
          skippedRows += batch.length;
        } else {
          successfulRows += data?.length || 0;
        }
      } else {
        // Upsert mode
        const { data, error } = await supabaseClient
          .from(tableName)
          .upsert(batch)
          .select();

        if (error) {
          console.error('Upsert error:', error);
          batch.forEach((_, idx) => {
            errors.push({ row: i + idx + 2, error: error.message });
          });
          skippedRows += batch.length;
        } else {
          successfulRows += data?.length || 0;
        }
      }
    }

    // Log the import
    await supabaseClient.from('import_logs').insert({
      table_name: tableName,
      filename: file.name,
      total_rows: dataRows.length,
      successful_rows: successfulRows,
      failed_rows: errors.length,
      error_details: errors.length > 0 ? errors : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_rows: dataRows.length,
        successful_rows: successfulRows,
        skipped_rows: skippedRows,
        failed_rows: errors.length,
        errors: errors.slice(0, 100), // Return first 100 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});