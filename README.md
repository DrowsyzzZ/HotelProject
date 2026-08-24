# HotelProject

HTML, CSS, JavaScript와 Supabase를 사용해 제작한 반응형 호텔 예약 웹사이트입니다.

배포: [HotelProject](https://drowsyzzz.github.io/HotelProject/)

## 주요 기능

- PC/모바일 반응형 메인 화면
- Swiper 기반 메인·객실·이벤트 슬라이더
- 객실별 예약 안내 및 가격 조회
- 객실 선택과 이미지 갤러리
- 예약 달력과 예약 불가 날짜 표시
- 성수기·비수기, 평일·주말·공휴일 가격 계산
- 추가 인원 금액 계산
- 예약자 입력 검증 및 예약 등록

## 기술

- HTML5
- CSS3
- Vanilla JavaScript
- Swiper
- Supabase (PostgreSQL, Data API, RLS, RPC)

## 실행

`src` 폴더를 VS Code Live Server 등의 정적 서버로 실행합니다. 별도의 JSON Server는 필요하지 않습니다.

Supabase 프로젝트를 새로 구성할 때는 SQL Editor에서 다음 파일을 순서대로 실행합니다.

1. [`supabase/schema.sql`](supabase/schema.sql): 테이블과 관계 생성
2. [`supabase/seed.sql`](supabase/seed.sql): 개발용 초기 데이터 입력
3. [`supabase/policies.sql`](supabase/policies.sql): 공개 조회 범위와 개인정보 보호 정책
4. [`supabase/reservation-rpc.sql`](supabase/reservation-rpc.sql): 예약 검증·요금 계산·중복 방지 함수

`seed.sql`은 기존 테이블 데이터를 초기화하므로 개발 초기 설정에만 사용합니다.

## 데이터 접근

- 객실·시즌·공휴일·가격: Supabase Data API 읽기
- 예약 가능 날짜: 개인정보를 제외한 예약 기간만 읽기
- 예약 등록: `create_reservation` RPC
- 예약자 이름·전화번호: 공개 키로 조회 불가

예약 등록 RPC는 객실 정원, 최대 5박, 날짜 중복, 시즌, 주말·공휴일 요금과 추가 인원 요금을 서버에서 다시 검증합니다.

## 작업 방식

- 3일 일정으로 개발하고 기능 단위 GitHub 이슈로 관리합니다.
- 큰 작업 단위별로 `feat/base-home`, `feat/reservation`, `feat/responsive-qa` 브랜치를 사용합니다.
- 이슈 하나를 완료할 때마다 관련 커밋을 남깁니다.
- 자세한 순서는 [`docs/ISSUE_PLAN.md`](docs/ISSUE_PLAN.md)를 참고합니다.

## Custom Elements

다음 공통 요소는 반드시 Custom Element로 구현합니다.

- `<app-header>`
- `<app-footer>`
- `<top-button>`

반복 렌더링 또는 독립적인 상태 관리가 필요한 다음 요소도 Custom Element로 구현합니다.

- `<room-card>`
- `<room-gallery>`
- `<reservation-calendar>`

일반 버튼, 입력 필드, 제목, 가격표 셀은 네이티브 HTML 요소와 CSS 클래스 또는 렌더 함수로 구현합니다. 전역 디자인 스타일을 재사용할 수 있도록 Shadow DOM은 사용하지 않습니다.
