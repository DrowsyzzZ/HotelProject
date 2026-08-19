# HotelProject

HTML, CSS, JavaScript와 JSON Server를 사용해 제작하는 반응형 호텔 예약 웹사이트입니다.

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
- JSON Server 0.17.4

## 실행

```powershell
yarn install
yarn start
```

`yarn start`는 `db.json`을 사용하는 JSON Server를 실행합니다. 프론트엔드 HTML은 별도의 로컬 정적 서버로 실행합니다.

## API

- `GET /rooms`
- `GET /rooms/:id`
- `GET /season`
- `GET /holiday`
- `GET /price`
- `GET /reservation`
- `POST /reservation`

## 작업 방식

- 3일 일정, 이슈 12개로 관리합니다.
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
