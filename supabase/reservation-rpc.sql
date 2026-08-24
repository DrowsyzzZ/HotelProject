begin;

-- 같은 객실의 숙박 기간이 겹치는 예약을 DB 차원에서 차단합니다.
create extension if not exists btree_gist with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_no_overlapping_stays'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_no_overlapping_stays
      exclude using gist (
        room_id with =,
        daterange(check_in_date, check_out_date, '[)') with &&
      );
  end if;
end
$$;

create or replace function public.create_reservation(
  p_room_id integer,
  p_check_in_date date,
  p_check_out_date date,
  p_number_of_guests integer,
  p_customer_name text,
  p_phone_number text
)
returns table (
  id integer,
  total_price integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_day date;
  v_season_id integer;
  v_base_price integer;
  v_extra_guests integer;
  v_total_price integer := 0;
  v_reservation_id integer;
begin
  select *
  into v_room
  from public.rooms
  where rooms.id = p_room_id;

  if not found then
    raise exception '존재하지 않는 객실입니다.' using errcode = 'P0001';
  end if;

  if p_check_in_date < current_date then
    raise exception '오늘 이전 날짜에는 예약할 수 없습니다.' using errcode = 'P0001';
  end if;

  if p_check_out_date <= p_check_in_date then
    raise exception '퇴실일은 입실일보다 늦어야 합니다.' using errcode = 'P0001';
  end if;

  if p_check_out_date - p_check_in_date > 5 then
    raise exception '최대 5박까지 예약할 수 있습니다.' using errcode = 'P0001';
  end if;

  if p_number_of_guests < v_room.min
     or p_number_of_guests > v_room.capacity then
    raise exception '객실 정원에 맞지 않는 인원입니다.' using errcode = 'P0001';
  end if;

  if char_length(trim(p_customer_name)) < 2
     or char_length(trim(p_customer_name)) > 20
     or trim(p_customer_name) !~ '^[가-힣A-Za-z ]+$' then
    raise exception '예약명이 올바르지 않습니다.' using errcode = 'P0001';
  end if;

  if p_phone_number !~ '^01(0[0-9]{8}|[16789][0-9]{7,8})$' then
    raise exception '휴대전화 번호가 올바르지 않습니다.' using errcode = 'P0001';
  end if;

  v_extra_guests := p_number_of_guests - v_room.min;

  for v_day in
    select day_value::date
    from generate_series(
      p_check_in_date,
      p_check_out_date - 1,
      interval '1 day'
    ) as day_value
  loop
    select seasons.id
    into v_season_id
    from public.seasons
    where exists (
      select 1
      from jsonb_array_elements(seasons.ranges) as season_range
      where to_char(v_day, 'MM-DD') between
        season_range->>'start_month_day'
        and season_range->>'end_month_day'
    )
    limit 1;

    if v_season_id is null then
      raise exception '% 날짜에 적용할 시즌이 없습니다.', v_day using errcode = 'P0001';
    end if;

    select case
      when exists (
        select 1
        from public.holidays
        where holidays.holiday_date = v_day
      ) then prices.holiday_price
      when extract(isodow from v_day) in (6, 7) then prices.weekend_price
      else prices.weekday_price
    end
    into v_base_price
    from public.prices
    where prices.room_id = p_room_id
      and prices.season_id = v_season_id;

    if v_base_price is null then
      raise exception '% 날짜에 적용할 요금이 없습니다.', v_day using errcode = 'P0001';
    end if;

    v_total_price := v_total_price
      + v_base_price
      + round(v_base_price * 0.2 * v_extra_guests)::integer;
  end loop;

  insert into public.reservations (
    room_id,
    check_in_date,
    check_out_date,
    total_price,
    number_of_guests,
    customer_name,
    phone_number
  )
  values (
    p_room_id,
    p_check_in_date,
    p_check_out_date,
    v_total_price,
    p_number_of_guests,
    trim(p_customer_name),
    p_phone_number
  )
  returning reservations.id into v_reservation_id;

  return query
  select v_reservation_id, v_total_price;
exception
  when exclusion_violation then
    raise exception '선택한 기간에는 이미 예약이 있습니다.' using errcode = 'P0001';
end;
$$;

revoke all on function public.create_reservation(
  integer,
  date,
  date,
  integer,
  text,
  text
) from public;

grant execute on function public.create_reservation(
  integer,
  date,
  date,
  integer,
  text,
  text
) to anon, authenticated;

commit;
