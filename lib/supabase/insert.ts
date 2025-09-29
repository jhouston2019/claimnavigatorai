import { supabaseAdmin } from './server';

export async function insertRow(table: string, row: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(row)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateRow(table: string, id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getRow(table: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function getRows(
  table: string, 
  filters: Record<string, any> = {},
  orderBy?: { column: string; ascending?: boolean }
) {
  let query = supabaseAdmin.from(table).select('*');
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteRow(table: string, id: string) {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}
