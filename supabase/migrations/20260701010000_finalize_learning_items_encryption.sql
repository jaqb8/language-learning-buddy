-- Copy this file into supabase/migrations with a new current timestamp only
-- after encrypted writes are live and the backfill has completed successfully.

begin;

do $$
begin
  if exists (
    select 1
    from public.learning_items
    where encrypted_payload is null
       or original_sentence is not null
       or corrected_sentence is not null
       or explanation is not null
       or translation is not null
  ) then
    raise exception 'Cannot finalize learning_items encryption: plaintext or unencrypted rows remain';
  end if;
end;
$$;

alter table public.learning_items
  alter column encrypted_payload set not null;

alter table public.learning_items
  drop column original_sentence,
  drop column corrected_sentence,
  drop column explanation,
  drop column translation;

commit;
