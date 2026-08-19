# GitHub 운영 설정

## 권장 라벨

| 라벨 | 용도 |
| --- | --- |
| `setup` | 개발 환경과 초기 설정 |
| `design` | HTML/CSS 및 반응형 UI |
| `feature` | JavaScript 기능 |
| `api` | JSON Server 연동 |
| `data` | db.json과 데이터 규칙 |
| `bug` | 오류 수정 |
| `test` | 테스트와 검수 |
| `priority-high` | 우선 작업 |
| `blocked` | 선행 작업으로 진행 불가 |

## Project 컬럼

1. Backlog
2. Ready
3. In Progress
4. Review
5. Done

## 커밋 예시

```text
chore: initialize project structure (#1)
feat: implement common layout (#2)
feat: add reservation calendar (#7)
fix: prevent overlapping reservations (#7)
```

## 브랜치 예시

```powershell
git switch main
git switch -c feat/base-home
```

큰 작업 단위가 끝난 뒤 `main`에 병합하고 다음 브랜치를 생성합니다.

