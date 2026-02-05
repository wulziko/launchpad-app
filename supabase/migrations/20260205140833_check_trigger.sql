-- Check if pg_net extension exists
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';

-- Check if trigger function exists
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'trigger_workflow_orchestrator';

-- Check if trigger exists and is enabled
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'products_workflow_trigger';

-- Check recent products
SELECT id, name, status, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;
