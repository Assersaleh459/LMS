-- In-app notifications
create table if not exists notifications (
  id          uuid        primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  user_id     uuid        not null references users(id) on delete cascade,
  title_ar    text        not null,
  body_ar     text,
  link        text,
  is_read     boolean     not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notif_user on notifications(user_id, created_at desc);
alter table notifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notif_own') then
    create policy "notif_own" on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notif_insert_admin') then
    create policy "notif_insert_admin" on notifications for insert with check (auth.uid() is not null);
  end if;
end $$;

-- Parent-teacher messages
create table if not exists messages (
  id            uuid        primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id) on delete cascade,
  sender_id     uuid        not null references users(id) on delete cascade,
  recipient_id  uuid        not null references users(id) on delete cascade,
  body          text        not null,
  is_read       boolean     not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_msg_sender    on messages(sender_id,    created_at desc);
create index if not exists idx_msg_recipient on messages(recipient_id, created_at desc);
alter table messages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='msg_own') then
    create policy "msg_own" on messages for all
      using (auth.uid() = sender_id or auth.uid() = recipient_id)
      with check (auth.uid() = sender_id);
  end if;
end $$;
