
# 코딩 드론 플랫폼 API

강사와 학생 간의 실시간 코딩 및 드론 제어를 위한 웹 애플리케이션입니다. 강사는 실시간으로 학생들의 코드를 모니터링하고, 학생은 자신의 드론을 제어하며, 코드 실행과 질문을 할 수 있습니다.


## Features

#### 강사 기능
- 로그인
- 강의 생성
- 실시간 코드 모니터링
- 학생 창 제어
- 채팅 기능
- 일괄 코드 실행 및 드론 제어 버튼 제어
- 개별 코드 실행 및 드론 제어 버튼 제어
- 드론 일괄 제어

#### 학생 기능
- 강의 접속
- 코드 작성 및 실행
- 드론 제어
- 채팅 기능


## Tech Stack

- **Nest.js**: 백엔드 개발에 사용된 모듈 기반 Node.js 프레임워크
- **PostgreSQL**: 데이터베이스로 사용된 관계형 데이터베이스
- **Socket.IO**: 실시간 코드 및 드론 제어를 위한 WebSocket 라이브러리




## Run Locally

Clone the project

```bash
  git clone https://github.com/Echchi/coding-drone-api.git
```

Go to the project directory

```bash
  cd coding-drone-project-api
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start:dev
```


## Roadmap
💤 개발 시작 전
🟡 개발 진행 중
✅ 완료

- 데이터 베이스 설계 ✅ 
- 데이터 베이스 구축 ✅
- 개발 환경 설정 ✅ 
- API 클라이언트 도구 (Insomnia) 설정 ✅
- API 명세서 (Swagger) 설정 ✅
- 로그인
  - jwt 설정 ✅
  - 로그인 ✅
- 강사
  - 강사 조회 ✅
- 강의
  - 강의 코드 생성 ✅
  - 깅의 생성 ✅
  - 강의 상태 업데이트 ✅
  - 강의 조회 (학생 접속 의존) 💤
  - 실시간 코드 모니터링 💤
  - 학생 창 제어 💤
    - 일괄 코드 및 드론 실헹 제어 💤
    - 개별 코드 및 드론 실행 제어 💤
  - 채팅 💤
- 학생
  - 강의 접속 (의존: 강의 조회) 💤
  - 코드 작성 💤
  - 코드 실행 💤
  - 드론 제어 💤
  - 채팅 💤

