begin;

-- Data API에서 public 스키마를 사용할 수 있게 하되,
-- 각 테이블의 실제 권한은 아래에서 필요한 범위만 부여합니다.
grant usage on schema public to anon, authenticated;

-- 공개 데이터: 누구나 조회할 수 있지만 수정할 수는 없습니다.
revoke all on table public.rooms from anon, authenticated;
revoke all on table public.seasons from anon, authenticated;
revoke all on table public.holidays from anon, authenticated;
revoke all on table public.prices from anon, authenticated;

grant select on table public.rooms to anon, authenticated;
grant select on table public.seasons to anon, authenticated;
grant select on table public.holidays to anon, authenticated;
grant select on table public.prices to anon, authenticated;

drop policy if exists "Public can read rooms" on public.rooms;
create policy "Public can read rooms"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read seasons" on public.seasons;
create policy "Public can read seasons"
on public.seasons
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read holidays" on public.holidays;
create policy "Public can read holidays"
on public.holidays
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read prices" on public.prices;
create policy "Public can read prices"
on public.prices
for select
to anon, authenticated
using (true);

-- 예약자 개인정보는 공개하지 않습니다.
-- 예약 가능 여부 확인에 필요한 네 개 컬럼만 읽을 수 있습니다.
revoke all on table public.reservations from anon, authenticated;

grant select (
  id,
  room_id,
  check_in_date,
  check_out_date
)
on table public.reservations
to anon, authenticated;

drop policy if exists "Public can read reservation availability" on public.reservations;
create policy "Public can read reservation availability"
on public.reservations
for select
to anon, authenticated
using (true);

commit;
