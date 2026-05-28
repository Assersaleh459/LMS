-- Enable Supabase Realtime on notifications and messages tables
-- REPLICA IDENTITY FULL ensures the full row is sent in change events (required for filters to work)

alter table notifications replica identity full;
alter table messages     replica identity full;

-- Add tables to the supabase_realtime publication (created automatically by Supabase)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
