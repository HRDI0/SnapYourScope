# DB Migration Rehearsal

## 목적

- 현재 SQLAlchemy 모델 기준으로 테이블 생성 상태를 검증한다.
- `DATABASE_URL` 전환 시(예: SQLite -> Postgres) 최소한의 초기 호환성을 확인한다.

## 실행

```bash
venv\Scripts\python.exe scripts\db_migration_rehearsal.py
```

## 기대 결과

- 지정한 `DATABASE_URL`에 모델 테이블이 생성된다.
- 스크립트 출력에 핵심 테이블 목록이 표시된다.

## 참고

- 본 리허설은 Alembic 기반 마이그레이션 대체가 아니라, 사전 호환성 점검용이다.
