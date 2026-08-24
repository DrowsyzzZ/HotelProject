begin;

-- 기존 데이터를 다시 넣어도 중복되지 않도록 개발용 시드 범위를 비웁니다.
truncate table public.reservations, public.prices, public.holidays, public.seasons, public.rooms restart identity cascade;

insert into public.rooms (id, name, name_eng, area, capacity, min, is_liked, images, description, description_eng) values
  (1, '스탠다드', 'standard', 78, 2, 2, false, ARRAY['standard-room-01.jpg', 'standard-room-02.jpg', 'standard-room-03.jpg', 'standard-room-04.jpg', 'standard-room-05.jpg']::text[], '편안하고 아늑한 기본 객실로, 비즈니스나 여행의 피로를 풀기에 적합한 공간입니다. 킹사이즈 침대와 기본적인 편의시설이 갖춰져 있습니다.', 'A comfortable and cozy basic room, ideal for relaxing after a day of business or travel. It features a king-sized bed and essential amenities.'),
  (2, '디럭스', 'deluxe', 94, 3, 2, false, ARRAY['deluxe-room-02.jpg', 'deluxe-room-03.jpg', 'deluxe-room-05.jpg', 'deluxe-room-01.jpg', 'deluxe-room-04.jpg']::text[], '넓고 현대적인 디자인의 객실로, 고급스러운 침대와 최신 시설이 마련되어 있어 편안한 휴식을 제공합니다.', 'A spacious and modernly designed room with luxurious bedding and the latest facilities, ensuring a comfortable and relaxing stay.'),
  (3, '프리미엄', 'premium', 105, 4, 2, false, ARRAY['premium-room-04.jpg', 'premium-room-03.jpg', 'premium-room-05.jpg', 'premium-room-01.jpg', 'premium-room-02.jpg']::text[], '세련된 인테리어와 고급스러운 가구들이 특징인 객실로, 고급스러운 분위기 속에서 여유로운 휴식을 즐길 수 있습니다.', 'A stylishly furnished room with elegant interiors and premium furniture, offering a luxurious atmosphere for a more relaxed and indulgent stay.'),
  (4, '스위트', 'suite', 200, 6, 4, false, ARRAY['suite-room-03.jpg', 'suite-room-01.jpg', 'suite-room-02.jpg', 'suite-room-05.jpg', 'suite-room-04.jpg']::text[], '넓고 세련된 공간으로, 독립된 거실과 침실이 구분되어 있어 프라이버시와 편안함을 동시에 제공합니다. 고급스러운 어메니티와 서비스가 제공됩니다.', 'A spacious and sophisticated room with a separate living area and bedroom, offering both privacy and comfort. Premium amenities and services are included.');

insert into public.seasons (id, name, ranges) values
  (1, '비수기', '[{"start_month_day":"01-01","end_month_day":"06-30"},{"start_month_day":"10-01","end_month_day":"12-31"}]'::jsonb),
  (2, '성수기', '[{"start_month_day":"07-01","end_month_day":"09-30"}]'::jsonb);

insert into public.holidays (id, holiday_name, holiday_date) values
  (1, '신정', '2026-01-01'),
  (2, '설날 연휴', '2026-02-16'),
  (3, '설날', '2026-02-17'),
  (4, '설날 연휴', '2026-02-18'),
  (5, '3·1절', '2026-03-01'),
  (6, '대체공휴일(3·1절)', '2026-03-02'),
  (7, '어린이날', '2026-05-05'),
  (8, '부처님 오신날', '2026-05-24'),
  (9, '대체공휴일(부처님 오신날)', '2026-05-25'),
  (10, '현충일', '2026-06-06'),
  (11, '광복절', '2026-08-15'),
  (12, '대체공휴일(광복절)', '2026-08-17'),
  (13, '추석 연휴', '2026-09-24'),
  (14, '추석', '2026-09-25'),
  (15, '추석 연휴', '2026-09-26'),
  (16, '대체공휴일(추석)', '2026-09-28'),
  (17, '개천절', '2026-10-03'),
  (18, '대체공휴일(개천절)', '2026-10-05'),
  (19, '한글날', '2026-10-09'),
  (20, '크리스마스', '2026-12-25'),
  (21, '노동절', '2026-05-01'),
  (22, '제헌절', '2026-07-17'),
  (23, '신정', '2027-01-01'),
  (24, '설날 연휴', '2027-02-06'),
  (25, '설날', '2027-02-07'),
  (26, '설날 연휴', '2027-02-08'),
  (27, '대체공휴일(설날)', '2027-02-09'),
  (28, '3·1절', '2027-03-01'),
  (29, '노동절', '2027-05-01'),
  (30, '대체공휴일(노동절)', '2027-05-03'),
  (31, '어린이날', '2027-05-05'),
  (32, '부처님 오신날', '2027-05-13'),
  (33, '현충일', '2027-06-06'),
  (34, '제헌절', '2027-07-17'),
  (35, '대체공휴일(제헌절)', '2027-07-19'),
  (36, '광복절', '2027-08-15'),
  (37, '대체공휴일(광복절)', '2027-08-16'),
  (38, '추석 연휴', '2027-09-14'),
  (39, '추석', '2027-09-15'),
  (40, '추석 연휴', '2027-09-16'),
  (41, '개천절', '2027-10-03'),
  (42, '대체공휴일(개천절)', '2027-10-04'),
  (43, '한글날', '2027-10-09'),
  (44, '대체공휴일(한글날)', '2027-10-11'),
  (45, '크리스마스', '2027-12-25'),
  (46, '대체공휴일(크리스마스)', '2027-12-27');

insert into public.prices (id, room_id, season_id, weekday_price, weekend_price, holiday_price) values
  (1, 1, 1, 150000, 180000, 200000),
  (2, 1, 2, 180000, 200000, 250000),
  (3, 2, 1, 180000, 200000, 250000),
  (4, 2, 2, 200000, 250000, 280000),
  (5, 3, 1, 200000, 250000, 280000),
  (6, 3, 2, 250000, 280000, 320000),
  (7, 4, 1, 250000, 280000, 320000),
  (8, 4, 2, 280000, 320000, 400000);

insert into public.reservations (id, room_id, check_in_date, check_out_date, total_price, number_of_guests, customer_name, phone_number) values
  (19, 2, '2026-08-07', '2026-08-10', 700000, 2, '더미예약', '00000000000'),
  (20, 1, '2026-08-14', '2026-08-16', 380000, 2, '더미예약', '00000000000'),
  (21, 4, '2026-08-21', '2026-08-24', 920000, 6, '더미예약', '00000000000'),
  (22, 3, '2026-09-04', '2026-09-07', 810000, 3, '더미예약', '00000000000'),
  (23, 1, '2026-09-11', '2026-09-13', 380000, 2, '더미예약', '00000000000'),
  (24, 2, '2026-09-18', '2026-09-20', 450000, 2, '더미예약', '00000000000'),
  (25, 1, '2026-10-02', '2026-10-04', 380000, 2, '더미예약', '00000000000'),
  (26, 3, '2026-10-09', '2026-10-12', 810000, 4, '더미예약', '00000000000'),
  (27, 2, '2026-11-13', '2026-11-15', 400000, 3, '더미예약', '00000000000'),
  (28, 4, '2026-12-24', '2026-12-27', 850000, 5, '더미예약', '00000000000'),
  (29, 1, '2027-01-15', '2027-01-17', 360000, 2, '더미예약', '00000000000'),
  (30, 2, '2027-02-06', '2027-02-09', 750000, 3, '더미예약', '00000000000'),
  (31, 1, '2026-08-26', '2026-08-28', 360000, 2, '더미예약', '00000000000'),
  (32, 2, '2026-08-28', '2026-08-31', 840000, 3, '더미예약', '00000000000'),
  (33, 1, '2026-09-01', '2026-09-02', 180000, 2, '더미예약', '00000000000'),
  (34, 1, '2026-08-28', '2026-08-29', 180000, 2, '더미예약', '00000000000'),
  (35, 4, '2026-08-27', '2026-08-28', 336000, 5, '더미예약', '00000000000'),
  (36, 2, '2026-08-24', '2026-08-25', 200000, 2, '더미예약', '00000000000');

select setval(pg_get_serial_sequence('public.rooms', 'id'), coalesce((select max(id) from public.rooms), 1), true);
select setval(pg_get_serial_sequence('public.seasons', 'id'), coalesce((select max(id) from public.seasons), 1), true);
select setval(pg_get_serial_sequence('public.holidays', 'id'), coalesce((select max(id) from public.holidays), 1), true);
select setval(pg_get_serial_sequence('public.prices', 'id'), coalesce((select max(id) from public.prices), 1), true);
select setval(pg_get_serial_sequence('public.reservations', 'id'), coalesce((select max(id) from public.reservations), 1), true);

commit;

select
  (select count(*) from public.rooms) as rooms,
  (select count(*) from public.seasons) as seasons,
  (select count(*) from public.holidays) as holidays,
  (select count(*) from public.prices) as prices,
  (select count(*) from public.reservations) as reservations;
