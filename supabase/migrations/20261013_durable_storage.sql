begin;
create schema if not exists openvoley_private;
revoke all on schema openvoley_private from public, anon, authenticated;
create table if not exists openvoley_private.records (
 namespace text not null, owner_id text not null, key text not null,
 value jsonb not null, revision bigint not null check(revision>0), updated_at timestamptz not null default now(),
 primary key(namespace,owner_id,key), check(octet_length(value::text)<=20971520)
);
create unique index if not exists ov_accounts_email on openvoley_private.records(lower(value->>'email')) where namespace='accounts' and value<>'null'::jsonb;
create table if not exists openvoley_private.backups (
 id bigint generated always as identity primary key,namespace text not null,owner_id text not null,key text not null,
 value jsonb not null,revision bigint not null,created_at timestamptz not null default now(),kind text not null,
 day date not null default current_date
);
create index if not exists ov_backup_lookup on openvoley_private.backups(namespace,owner_id,key,created_at desc,id desc);
create unique index if not exists ov_daily_backup on openvoley_private.backups(namespace,owner_id,key,day) where kind='daily';
alter table openvoley_private.records enable row level security;
alter table openvoley_private.backups enable row level security;
revoke all on all tables in schema openvoley_private from public,anon,authenticated;

create or replace function public.ov_read_records(p_namespace text,p_owner text,p_key text default null)
returns jsonb language sql security definer set search_path=pg_catalog,openvoley_private as $$
 select coalesce(jsonb_agg(jsonb_build_object('key',key,'value',value,'revision',revision,'updatedAt',updated_at) order by key),'[]'::jsonb)
 from openvoley_private.records where namespace=p_namespace and owner_id=p_owner and (p_key is null or key=p_key);
$$;
create or replace function public.ov_storage_ready() returns jsonb language sql security definer set search_path=pg_catalog,openvoley_private as $$
 select jsonb_build_object('schemaVersion',1,'durable',true,'backups',true);
$$;
create or replace function public.ov_commit_records(p_writes jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog,openvoley_private as $$
declare w jsonb; old openvoley_private.records%rowtype; result jsonb:='[]'; fresh openvoley_private.records%rowtype;
 n text; o text; k text; v jsonb; expected bigint;
begin
 if jsonb_typeof(p_writes)<>'array' or jsonb_array_length(p_writes)>1000 then raise exception 'Invalid batch'; end if;
 for w in select item from jsonb_array_elements(p_writes) item order by item->>'namespace',item->>'owner',item->>'key' loop
  n:=w->>'namespace';o:=w->>'owner';k:=w->>'key';v:=w->'value';expected:=(w->>'baseRevision')::bigint;
  if n not in ('accounts','user','commercial') or length(o) not between 1 and 200 or length(k) not between 1 and 250 or v is null or expected is null or expected<0 then raise exception 'Invalid record'; end if;
  perform pg_advisory_xact_lock(hashtextextended(n||':'||o,0));
  perform pg_advisory_xact_lock(hashtextextended(n||':'||o||':'||k,0));
  select * into old from openvoley_private.records where namespace=n and owner_id=o and key=k for update;
  if coalesce(old.revision,0)<>expected then raise exception using errcode='40001',message='OV_CONFLICT'; end if;
  if old.revision is not null and old.value=v then
   fresh:=old;
  else
   if n='user' and (select coalesce(sum(octet_length(value::text)),0) from openvoley_private.records where namespace=n and owner_id=o and key<>k)+octet_length(v::text)>104857600 then raise exception 'Account storage quota exceeded'; end if;
   if old.revision is not null then
    insert into openvoley_private.backups(namespace,owner_id,key,value,revision,kind) values(n,o,k,old.value,old.revision,'revision');
    insert into openvoley_private.backups(namespace,owner_id,key,value,revision,kind) values(n,o,k,old.value,old.revision,'daily') on conflict do nothing;
   end if;
   insert into openvoley_private.records(namespace,owner_id,key,value,revision) values(n,o,k,v,expected+1)
   on conflict(namespace,owner_id,key) do update set value=excluded.value,revision=excluded.revision,updated_at=now() returning * into fresh;
   delete from openvoley_private.backups where namespace=n and owner_id=o and key=k and kind='revision' and id not in
    (select id from openvoley_private.backups where namespace=n and owner_id=o and key=k and kind='revision' order by id desc limit 10);
   delete from openvoley_private.backups where namespace=n and owner_id=o and key=k and kind='daily' and day<current_date-30;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('key',fresh.key,'value',fresh.value,'revision',fresh.revision,'updatedAt',fresh.updated_at));
 end loop;return result;
end;$$;
create or replace function public.ov_backups(p_owner text,p_key text) returns jsonb
language sql security definer set search_path=pg_catalog,openvoley_private as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'key',key,'revision',revision,'createdAt',created_at,'kind',kind) order by id desc),'[]'::jsonb)
 from openvoley_private.backups where namespace='user' and owner_id=p_owner and key=p_key;
$$;
create or replace function public.ov_restore(p_owner text,p_key text,p_backup_id bigint,p_base_revision bigint) returns jsonb
language plpgsql security definer set search_path=pg_catalog,openvoley_private as $$
declare b openvoley_private.backups%rowtype;
begin
 select * into b from openvoley_private.backups where id=p_backup_id and namespace='user' and owner_id=p_owner and key=p_key;
 if b.id is null then raise exception 'Backup not found';end if;
 return public.ov_commit_records(jsonb_build_array(jsonb_build_object('namespace','user','owner',p_owner,'key',p_key,'value',b.value,'baseRevision',p_base_revision)));
end;$$;
-- Browser roles have no direct access. The Google-session server derives owner_id.
revoke all on function public.ov_read_records(text,text,text),public.ov_storage_ready(),public.ov_commit_records(jsonb),public.ov_backups(text,text),public.ov_restore(text,text,bigint,bigint) from public,anon,authenticated;
grant execute on function public.ov_read_records(text,text,text),public.ov_storage_ready(),public.ov_commit_records(jsonb),public.ov_backups(text,text),public.ov_restore(text,text,bigint,bigint) to service_role;
commit;

begin;
create or replace function public.ov_montage_inbox(p_email text) returns jsonb
language sql security definer set search_path=pg_catalog,openvoley_private as $$
 select coalesce(jsonb_agg(montage order by montage->>'publishedAt' desc),'[]'::jsonb)
 from openvoley_private.records r cross join lateral jsonb_array_elements(case when jsonb_typeof(r.value)='array' then r.value else '[]'::jsonb end) montage
 where r.namespace='user' and r.key='openvoley_smart_sports_montages_v1'
 and lower(montage->>'recipientEmail')=lower(p_email) and coalesce(montage->>'publishedAt','')<>'';
$$;
revoke all on function public.ov_montage_inbox(text) from public,anon,authenticated;
grant execute on function public.ov_montage_inbox(text) to service_role;
commit;

begin;
create table if not exists openvoley_private.exports (
 id bigint generated always as identity primary key, export_id uuid not null, payload jsonb not null,created_at timestamptz not null default now()
);
alter table openvoley_private.exports enable row level security;
revoke all on openvoley_private.exports from public,anon,authenticated;
create index if not exists ov_export_id on openvoley_private.exports(export_id,id);
create or replace function public.ov_prepare_export() returns jsonb
language plpgsql security definer set search_path=pg_catalog,openvoley_private as $$
declare batch uuid:=gen_random_uuid(); count_rows bigint;
begin
 delete from openvoley_private.exports where created_at<now()-interval '2 days';
 insert into openvoley_private.exports(export_id,payload)
 select batch,jsonb_build_object('kind','record','namespace',namespace,'owner',owner_id,'key',key,'value',value,'revision',revision,'updatedAt',updated_at) from openvoley_private.records
 union all
 select batch,jsonb_build_object('kind','backup','namespace',namespace,'owner',owner_id,'key',key,'value',value,'revision',revision,'createdAt',created_at,'backupKind',kind,'day',day) from openvoley_private.backups;
 get diagnostics count_rows=row_count;
 return jsonb_build_object('exportId',batch,'count',count_rows,'createdAt',now());
end;$$;
create or replace function public.ov_export_page(p_export_id uuid,p_after bigint default 0,p_limit integer default 10) returns jsonb
language sql security definer set search_path=pg_catalog,openvoley_private as $$
 select jsonb_build_object('rows',coalesce(jsonb_agg(jsonb_build_object('id',id,'payload',payload) order by id),'[]'::jsonb),'next',coalesce(max(id),p_after))
 from (select id,payload from openvoley_private.exports where export_id=p_export_id and id>p_after order by id limit least(greatest(p_limit,1),20)) q;
$$;
create or replace function public.ov_finish_export(p_export_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,openvoley_private as $$
begin delete from openvoley_private.exports where export_id=p_export_id;return '{"success":true}'::jsonb;end;$$;
create or replace function public.ov_archive_local(p_owner text,p_key text,p_value jsonb,p_revision bigint) returns jsonb
language plpgsql security definer set search_path=pg_catalog,openvoley_private as $$
declare backup_id bigint;
begin
 if octet_length(p_value::text)>20971520 then raise exception 'Invalid backup';end if;
 insert into openvoley_private.backups(namespace,owner_id,key,value,revision,kind) values('user',p_owner,p_key,p_value,p_revision,'local-conflict') returning id into backup_id;
 delete from openvoley_private.backups where namespace='user' and owner_id=p_owner and key=p_key and kind='local-conflict' and id not in
 (select id from openvoley_private.backups where namespace='user' and owner_id=p_owner and key=p_key and kind='local-conflict' order by id desc limit 10);
 return jsonb_build_object('id',backup_id);
end;$$;
revoke all on function public.ov_prepare_export(),public.ov_export_page(uuid,bigint,integer),public.ov_finish_export(uuid),public.ov_archive_local(text,text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.ov_prepare_export(),public.ov_export_page(uuid,bigint,integer),public.ov_finish_export(uuid),public.ov_archive_local(text,text,jsonb,bigint) to service_role;
commit;
