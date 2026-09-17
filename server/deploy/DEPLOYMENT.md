# Ubuntu 챗 서버 배포

이 서버는 GitHub Pages와 별도로 Ubuntu에서 실행합니다. LM Studio와 같은 Ubuntu 장비에 두면, LM Studio는 `127.0.0.1:1234`으로만 열어 둘 수 있고 외부에는 챗 API만 공개됩니다.

## 1. 프로젝트와 Node.js 준비

Ubuntu에서 저장소를 원하는 위치에 내려받습니다. 아래 문서에서는 `/opt/hotel-project`를 예시 경로로 사용합니다.

```bash
git clone https://github.com/DrowsyzzZ/HotelProject.git /opt/hotel-project
cd /opt/hotel-project/server
node --version
```

Node.js 20.6 이상이 필요합니다. 이 서버는 Node 내장 HTTP와 `fetch`만 사용하므로 `npm install`은 필요하지 않습니다.

## 2. 운영 환경변수 만들기

```bash
sudo install -d -m 700 /etc/hotel-chat
sudo cp /opt/hotel-project/server/deploy/production.env.example /etc/hotel-chat/.env
sudo nano /etc/hotel-chat/.env
```

`CORS_ORIGINS`에는 실제 프론트 주소만 남깁니다. 기본 GitHub Pages 주소는 `https://drowsyzzz.github.io`입니다. `LLM_BASE_URL`은 같은 Ubuntu 장비의 LM Studio를 가리키므로 `http://127.0.0.1:1234/v1`을 유지합니다.

## 3. systemd로 상시 실행

`hotel-chat.service.example`의 `YOUR_LINUX_USER`, 프로젝트 경로와 Node 실행 경로를 실제 값으로 바꾼 뒤 설치합니다.

```bash
command -v node
sudo cp /opt/hotel-project/server/deploy/hotel-chat.service.example /etc/systemd/system/hotel-chat.service
sudo nano /etc/systemd/system/hotel-chat.service
sudo systemctl daemon-reload
sudo systemctl enable --now hotel-chat
sudo systemctl status hotel-chat
```

정상 실행 여부는 Ubuntu에서 확인합니다.

```bash
curl http://127.0.0.1:3001/health
```

`{"status":"ok"}`가 반환되어야 합니다. 로그 확인은 `sudo journalctl -u hotel-chat -f`를 사용합니다.

## 4. Tailscale Funnel로 챗 API만 HTTPS 공개

LM Studio의 1234 포트가 아니라, 챗 API의 3001 포트만 Funnel로 공개합니다.

```bash
sudo tailscale funnel --bg 3001
tailscale funnel status
```

출력된 `https://...ts.net` 주소 뒤에 `/health`를 붙여 외부에서 확인합니다. Funnel은 공개 HTTPS 주소를 만들고 로컬 `127.0.0.1` 서비스로 역방향 프록시합니다. 따라서 LM Studio 주소·모델 API 키는 브라우저에 공개되지 않습니다.

Funnel을 쓰려면 Tailscale 관리 화면에서 MagicDNS, HTTPS 인증서, Funnel 권한이 활성화돼 있어야 합니다.

## 5. GitHub Pages 연결

GitHub 저장소에서 **Settings → Secrets and variables → Actions → Variables**로 이동해 다음 Repository Variable을 만듭니다.

```text
CHAT_API_BASE_URL=https://YOUR_FUNNEL_HOST.ts.net
```

`main` 브랜치에 푸시하면 Pages workflow가 이 공개 주소만 프론트 파일에 넣습니다. GitHub Pages 배포가 끝난 뒤 호텔 사이트 챗봇에서 질문해 확인합니다.

## 운영 시 주의사항

- `LLM_BASE_URL`, `LLM_API_KEY`, `/etc/hotel-chat/.env`는 GitHub와 프론트에 올리지 않습니다.
- LM Studio는 Ubuntu의 `127.0.0.1:1234`에서만 실행합니다.
- 모델이 꺼져 있으면 챗 API는 안전한 오류 문구를 반환하고, LM Studio를 다시 시작하면 별도 챗 서버 재시작 없이 다음 요청부터 복구됩니다.
- Funnel 공개 주소는 인터넷에서 접근 가능하므로 `CORS_ORIGINS`를 정확한 프론트 출처로 제한합니다.
