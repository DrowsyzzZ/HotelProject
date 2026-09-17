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

## 실행 및 배포

배포된 웹사이트는 위 GitHub Pages 링크에서 바로 확인할 수 있습니다.

로컬에서 개발하거나 수정 사항을 확인하려면 `src` 폴더를 VS Code Live Server 등의 정적 서버로 실행합니다. 별도의 JSON Server는 필요하지 않습니다.

### AI 상담 챗봇 서버

정적 프론트엔드는 GitHub Pages에서 제공하지만, AI 상담은 별도 Node.js 서버가 담당합니다. 브라우저는 이 서버의 `/api/chat`만 호출하며, LM Studio 주소와 모델명은 프론트에 노출되지 않습니다.

1. LM Studio에서 Qwen Instruct 모델을 불러오고 **OpenAI Compatible API Server**를 시작합니다.
2. 개발 PC에서는 SSH 터널을 열어 LM Studio API를 로컬 `127.0.0.1:1234`으로 연결합니다.
3. `server/.env.example`을 `server/.env`로 복사한 뒤 `LLM_BASE_URL`, `LLM_MODEL`, `CORS_ORIGINS`를 확인합니다.
4. `server` 폴더에서 `npm run dev`를 실행합니다.
5. Live Server로 사이트를 열고 우측 하단 `상담` 버튼에서 질문합니다.

기본 개발 설정은 Live Server(`http://127.0.0.1:5500`)와 챗 서버(`http://127.0.0.1:3001`)를 사용합니다. `server/.env`는 Git에 올리지 않습니다.

Qwen 3.5 9B는 기본적으로 내부 추론 토큰을 생성할 수 있으므로 `LLM_MAX_TOKENS=2048`을 권장합니다. 이 값이 너무 작으면 최종 답변 전에 생성이 끝나 응답을 반환하지 못할 수 있습니다.

### AI 상담 배포 설정

GitHub Pages는 Node 서버를 실행할 수 없으므로 `server/`는 별도의 HTTPS 서버에 배포해야 합니다. Ubuntu의 LM Studio 장비에 챗 서버를 같이 실행하고, LM Studio는 로컬에 유지한 채 챗 API만 Tailscale Funnel로 공개하는 방식을 권장합니다. 자세한 과정은 [`server/deploy/DEPLOYMENT.md`](server/deploy/DEPLOYMENT.md)를 참고합니다.

운영 환경에서는 Ubuntu가 재부팅돼도 VNC나 개발 PC 없이 복구되도록 LM Studio와 챗 API를 각각 systemd 서비스로 등록합니다.

해당 서버의 `.env`에서만 다음 값을 설정합니다.

```env
LLM_BASE_URL=https://your-llm-host.example/v1
LLM_MODEL=qwen/qwen3.5-9b
```

챗 서버와 LM Studio를 같은 Ubuntu 장비에 둘 경우 `LLM_BASE_URL`은 `http://127.0.0.1:1234/v1`으로 유지합니다. Funnel로 외부에 공개하는 대상은 LM Studio가 아니라 챗 API입니다. 이 주소와 API 키는 절대 `src/`에 넣지 않습니다.

프론트가 호출할 공개 챗 서버 주소는 GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에 `CHAT_API_BASE_URL`로 등록합니다. 값은 예를 들어 `https://api.example.com`처럼 HTTPS 주소만 사용합니다. Pages 배포 과정이 이 공개 주소만 `src/js/runtime-config.js`에 주입합니다.

### AI 상담의 실시간 호텔 데이터 조회

챗봇은 서버에서만 Supabase의 **읽기 전용** 데이터를 조회할 수 있습니다. Ubuntu의 `/etc/hotel-chat/.env`에 아래를 설정하면 객실 정보, 예상 요금, 날짜별 예약 가능 여부를 답할 수 있습니다.

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
SUPABASE_REQUEST_TIMEOUT_MS=10000
```

여기에는 기존 프론트에 사용하는 publishable key만 사용합니다. `service_role` 키, 고객 이름·전화번호, 예약 생성·취소 RPC는 챗봇에 연결하지 않습니다. LLM은 정해진 읽기 도구만 요청할 수 있고, 서버가 직접 실행한 결과만 답변에 반영합니다.

휴대폰으로 개발 서버를 시험할 때는 `server/.env`의 `HOST=0.0.0.0`으로 바꾸고, Windows의 LAN 주소를 `CORS_ORIGINS`에 추가합니다. 휴대폰과 PC가 같은 네트워크라면 Live Server의 LAN 주소로 접속했을 때 챗봇은 같은 PC의 `3001` 포트를 자동으로 사용합니다. GitHub Pages처럼 HTTPS로 열린 사이트에서 시험하려면 챗 서버도 HTTPS 터널 또는 배포 서버로 노출해야 합니다.

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
