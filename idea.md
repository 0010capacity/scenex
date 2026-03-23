
시나리오를 쓰면 그걸로 스토리보드를 만들어주는 앱을 만들거야. AI 기반이고, 그리고 이건 Claude Code를 "어댑터"로 쓰는 앱이야. 그러니까 이건 Tauri + React + mantine으로 만드는 앱이고, 맥 OS 대상이야. macOS로 이 앱을 실행하면 일단 이 PC에 claude code가 있는지 검사하고 있다면 그 claude code를 사용해서 ai 작업들을 수행하거야. 이렇게 하는 이유는 claude pro 구독 플랜을 활용하기 위해서. 

아무튼 이 앱은 기본적으로는 스토리보드(애니메이션이나 영상물 제작을 위한)를 만드는 프로그램인데, 시나리오 기반으로 알아서 일단 생성해주고 거기서 생성된 스토리보드를 사용자가 막 편집할 수도 있는 편리한 앱이야. 시나리오 작성도 수정해주거나 뭐 도와줄 수 있고. 그런 앱이야. 일단 UI랑 구성하면서 시작해보자. 구체화해봐.

간략히 보기
오후 8:58

SceneForge UI 설계 및 React 컴포넌트 구조 계획했음
SceneForge UI 설계 및 React 컴포넌트 구조 계획했음
좋아요! 앱의 구조와 UI를 구체화해볼게요. 먼저 전체 아키텍처를 머릿속에 그리고 인터랙티브 UI 프로토타입을 만들어볼게요.

앱 이름: SceneForge (가칭)

핵심 구조:

Claude Code 어댑터 레이어: 앱 시작 시 which claude 체크 → CLI subprocess로 AI 작업 위임
3-패널 레이아웃: 시나리오 에디터 ↔ AI 생성 ↔ 스토리보드 캔버스
프로젝트 시스템: 장면(Scene) > 샷(Shot) > 패널(Panel) 계층 구조
이제 본격적으로 UI 프로토타입을 만들어볼게요. 3개의 주요 화면을 인터랙티브하게 구현할게요.


파일 생성됨, 파일 읽음
파일 생성됨, 파일 읽음
SceneForge 프로토타입을 만들었어요. 세 가지 화면이 전부 인터랙티브하게 연결돼 있어요.

구현된 흐름:

1. 런치 스크린 — 앱 실행 시 which claude / claude --version 체크를 시뮬레이션. 순차적으로 macOS → Claude Code 경로 → 버전/인증 → 사용 모델 확인 후 "앱 시작" 버튼 활성화

2. 메인 워크스페이스 (3패널 레이아웃)

좌측 시나리오 패널: 스크립트 포맷(슬러그라인/액션/대사), 장면 탭, AI 어시스트 입력창
중앙 생성 설정 패널: Claude Code 연결 상태 뱃지, 스타일/컷 수 옵션, "스토리보드 생성" 버튼 → 실행하면 프로그레스 애니메이션
우측 스토리보드 캔버스: 6컷 그리드, 각 패널에 SVG 스케치 자동 렌더링
3. 패널 편집 오버레이 — 패널 클릭 시 열림. 샷 타입/카메라 무브먼트/설명/사운드/분위기 태그/색감 참조 편집. "AI 재생성" 버튼 포함

다음으로 구체화할 부분:

Tauri 백엔드 구조 (Claude Code subprocess 호출 방식)
실제 Mantine 컴포넌트로 포팅
PDF/이미지 내보내기 로직
어느 부분부터 실제 코드로 들어갈까요?

Sceneforge prototype
코드 · HTML 
사용자가 수동으로 스토리보드 캔버스를 생성하고 싶을 때에도 그렇게 할 수 있지?

오후 9:03

사용자 응답 대기 중이며 질문 제시 준비 완료
사용자 응답 대기 중이며 질문 제시 준비 완료
당연하죠! 현재 프로토타입에도 "+" 버튼이 있긴 한데, 수동 생성 플로우를 제대로 설계하려면 몇 가지 방향이 있어요.

수동 생성 시 필요한 게 어떤 수준인지 확인하고 싶어요.

답변에 따라 UI 설계 방향이 꽤 달라져요. 예를 들어 드로잉 지원이 필요하면 캔버스 레이어 구조 자체를 다르게 잡아야 하고, 완전 독립적으로 쓸 수 있어야 한다면 프로젝트 생성 플로우도 바꿔야 하거든요.

질문: 수동으로 패널을 만들 때 어떤 방식을 지원해야 할까요? (해당하는 항목을 모두 선택)
답변: 외부 이미지 임포트 (jpg, png, psd 등), 빈 패널 추가 후 텍스트로만 채우기, 그리고 이건 기본적으로 스토리보드 편집용 앱이야. 그러니까 AI로 생성하는 기능을 제공하는거지, 사용자가 스토리보드를 그냥 만들고 싶다면 그냥 만들 수도 있는거야. AI는 보조일 뿐, AI가 아니면 아무것도 못 하는 앱은 아니야.

질문: AI 없이 시나리오 없이도 스토리보드를 처음부터 만들 수 있어야 하나요?
답변: 네, 완전히 독립적으로

오후 9:05

스토리보드 편집기를 중심으로 AI를 선택적 보조 기능으로 재설계했다
스토리보드 편집기를 중심으로 AI를 선택적 보조 기능으로 재설계했다
명확해졌어요. 앱의 정체성을 다시 정의하면:

스토리보드 에디터 (독립 실행 가능) + AI 생성은 강력한 옵션 기능

이 방향으로 UI 구조를 재설계할게요. 핵심 변화는 두 가지예요 — 시나리오/AI 패널이 기본으로 숨겨져 있고, 캔버스가 메인이 되는 것 + 패널 추가 플로우를 제대로 만드는 것.


파일 생성됨, 파일 읽음
파일 생성됨, 파일 읽음
v2에서 바뀐 핵심 부분들이에요.

구조적 변화:

스토리보드 에디터가 주인공 — 시나리오 패널은 기본으로 닫혀있고, AI 상태 뱃지도 타이틀바 구석에. 캔버스가 처음부터 전체 화면을 차지해요.

패널 추가 모달 (가장 큰 변화) — + 버튼을 누르면 3가지 방식 중 선택:

빈 패널 → 샷 타입/설명/대사 직접 입력. 모두 선택사항이라 진짜 빈 채로 추가 가능
이미지 임포트 → 드래그&드롭 또는 클릭. JPG/PNG/PSD/PDF/TIFF 지원, 클립보드 붙여넣기(⌘V)도 명시
AI 생성 → 설명 텍스트 + 샷 힌트 입력
패널 뱃지로 출처 구분 — AI 생성 AI(골드), 수동 입력 수동(회색), 임포트 임포트(퍼플), 빈 패널 구분 가능

장면 빈 상태(Empty State) — S2처럼 패널이 없는 장면엔 "패널 추가"와 "AI 자동 생성" 두 CTA가 나란히 나와요. AI를 강제하지 않음

```
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SceneForge v2</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Playfair+Display:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg0:#0B0C10; --bg1:#13141A; --bg2:#1A1C24; --bg3:#21242F; --bg4:#282C39;
  --border:#2A2D3A; --border2:#3D4259; --border3:#4D5170;
  --gold:#E8A838; --gold2:#F5C760; --gold-dim:rgba(232,168,56,0.12);
  --blue:#5B8DEF; --blue-dim:rgba(91,141,239,0.14);
  --green:#4ECBA5; --green-dim:rgba(78,203,165,0.12);
  --red:#E05252; --red-dim:rgba(224,82,82,0.12);
  --purple:#9B7FE8; --purple-dim:rgba(155,127,232,0.12);
  --text:#E8E5DC; --text2:#9A9790; --text3:#4E4C48;
  --mono:'DM Mono',monospace; --sans:'DM Sans',sans-serif; --serif:'Playfair Display',serif;
  --r4:4px; --r6:6px; --r8:8px; --r12:12px;
}
html,body{width:100%;height:100%;background:var(--bg0);color:var(--text);font-family:var(--sans);font-size:14px;overflow:hidden;line-height:1.5}
button{font-family:var(--sans)}

/* ════════════════ LAYOUT ════════════════ */
#app{display:flex;flex-direction:column;height:100vh}

/* ════════════════ TITLEBAR ════════════════ */
.titlebar{
  height:38px;background:var(--bg1);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 14px;gap:10px;flex-shrink:0;
  -webkit-app-region:drag;
}
.traffic{display:flex;gap:5px;-webkit-app-region:no-drag}
.traffic span{width:11px;height:11px;border-radius:50%;cursor:pointer;opacity:0.85;transition:opacity .15s}
.traffic span:hover{opacity:1}
.t-close{background:#E05252}.t-min{background:#E8A838}.t-max{background:#4ECBA5}
.app-wordmark{font-family:var(--serif);font-size:13px;font-weight:400;color:var(--text2);flex:1;text-align:center;letter-spacing:0.02em}
.app-wordmark b{color:var(--text);font-weight:400}
.tb-right{display:flex;gap:4px;-webkit-app-region:no-drag;align-items:center}
.tb-btn{
  background:none;border:1px solid transparent;color:var(--text3);
  padding:3px 9px;border-radius:var(--r4);font-size:11px;cursor:pointer;transition:all .15s;
  display:flex;align-items:center;gap:4px
}
.tb-btn:hover{border-color:var(--border2);color:var(--text2)}
.tb-btn.accent{border-color:rgba(232,168,56,0.4);color:var(--gold)}
.tb-btn.accent:hover{background:var(--gold-dim)}
.tb-divider{width:1px;height:16px;background:var(--border);margin:0 2px}
.ai-status{
  display:flex;align-items:center;gap:5px;
  background:var(--green-dim);border:1px solid rgba(78,203,165,0.2);
  padding:2px 8px;border-radius:10px;cursor:pointer;transition:all .15s
}
.ai-status:hover{background:rgba(78,203,165,0.18)}
.ai-dot{width:5px;height:5px;border-radius:50%;background:var(--green)}
.ai-label{font-size:10px;color:var(--green);letter-spacing:0.04em}

/* ════════════════ TOOLBAR ════════════════ */
.toolbar{
  height:42px;background:var(--bg1);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 16px;gap:6px;flex-shrink:0
}
.tool-group{display:flex;align-items:center;gap:2px}
.tool-btn{
  background:none;border:1px solid transparent;color:var(--text3);
  padding:5px 8px;border-radius:var(--r4);font-size:12px;cursor:pointer;
  transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px
}
.tool-btn:hover{background:var(--bg3);border-color:var(--border);color:var(--text2)}
.tool-btn.active{background:var(--bg3);border-color:var(--border2);color:var(--text)}
.tool-sep{width:1px;height:20px;background:var(--border);margin:0 4px}
.view-toggle{display:flex;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r6);overflow:hidden}
.vt-btn{
  background:none;border:none;color:var(--text3);padding:4px 10px;
  font-size:11px;cursor:pointer;transition:all .15s;
}
.vt-btn.active{background:var(--bg4);color:var(--text)}
.scene-select{
  background:var(--bg2);border:1px solid var(--border);color:var(--text2);
  padding:4px 8px;border-radius:var(--r4);font-size:12px;outline:none;cursor:pointer;
  font-family:var(--sans)
}
.zoom-group{display:flex;align-items:center;gap:2px;margin-left:auto}
.zoom-val{font-size:11px;color:var(--text3);min-width:36px;text-align:center;font-family:var(--mono)}

/* ════════════════ WORKSPACE ════════════════ */
.workspace{flex:1;display:flex;overflow:hidden;position:relative}

/* ── Left sidebar (scenario, collapsible) ── */
.left-sidebar{
  width:0;background:var(--bg1);border-right:1px solid var(--border);
  display:flex;flex-direction:column;transition:width .25s;overflow:hidden;flex-shrink:0
}
.left-sidebar.open{width:300px}
.sidebar-header{
  height:40px;display:flex;align-items:center;padding:0 14px;
  border-bottom:1px solid var(--border);flex-shrink:0;gap:8px
}
.sidebar-title{font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:var(--text3)}
.sidebar-close{
  margin-left:auto;background:none;border:none;color:var(--text3);
  cursor:pointer;font-size:13px;padding:2px 4px;border-radius:3px;transition:color .15s
}
.sidebar-close:hover{color:var(--text)}

/* ── Canvas ── */
.canvas-area{flex:1;overflow:auto;background:var(--bg0);position:relative}
.canvas-inner{padding:28px 28px 80px;min-width:600px}
.canvas-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;min-height:400px;gap:16px
}
.empty-icon{
  width:64px;height:64px;border:1px dashed var(--border2);border-radius:var(--r12);
  display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:24px
}
.empty-title{font-size:15px;font-weight:500;color:var(--text2)}
.empty-sub{font-size:12px;color:var(--text3);text-align:center;max-width:280px;line-height:1.6}
.empty-actions{display:flex;gap:8px;margin-top:4px}

/* ── Right panel (inspector, collapsible) ── */
.right-panel{
  width:0;background:var(--bg1);border-left:1px solid var(--border);
  display:flex;flex-direction:column;transition:width .25s;overflow:hidden;flex-shrink:0
}
.right-panel.open{width:260px}

/* ════════════════ SCENE GROUPS ════════════════ */
.scene-group{margin-bottom:32px}
.scene-row{
  display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer
}
.scene-chip{
  font-size:10px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;
  background:var(--bg3);border:1px solid var(--border2);color:var(--text2);
  padding:3px 8px;border-radius:10px;font-family:var(--mono);flex-shrink:0
}
.scene-name{font-size:12px;font-weight:500;color:var(--text2)}
.scene-dur{font-size:10px;color:var(--text3);font-family:var(--mono)}
.scene-line{flex:1;height:1px;background:var(--border)}
.scene-add-btn{
  background:none;border:1px solid var(--border);color:var(--text3);
  padding:2px 8px;border-radius:var(--r4);font-size:11px;cursor:pointer;transition:all .15s
}
.scene-add-btn:hover{border-color:var(--border2);color:var(--text2)}

/* ── Panel grid ── */
.panel-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:14px
}

/* ── Panel card ── */
.panel-card{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r8);
  overflow:hidden;cursor:pointer;transition:all .2s;position:relative;
  user-select:none
}
.panel-card:hover{border-color:var(--border2);transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.panel-card.selected{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
.panel-card.dragging{opacity:0.5;border-style:dashed}

.panel-frame{
  aspect-ratio:16/9;background:var(--bg3);
  position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center
}
/* Empty panel state */
.panel-frame.empty{background:var(--bg2)}
.panel-frame.has-image img{width:100%;height:100%;object-fit:cover}
.frame-overlay{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0);transition:background .2s
}
.panel-card:hover .frame-overlay{background:rgba(0,0,0,0.25)}
.frame-edit-btn{
  opacity:0;transition:opacity .2s;
  background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);
  color:white;padding:4px 10px;border-radius:var(--r4);font-size:11px;cursor:pointer
}
.panel-card:hover .frame-edit-btn{opacity:1}

.panel-num{
  position:absolute;top:5px;left:6px;
  font-family:var(--mono);font-size:9px;color:var(--text3);
  background:rgba(0,0,0,0.5);padding:1px 5px;border-radius:2px
}
.panel-cam-tag{
  position:absolute;bottom:5px;right:5px;
  font-size:9px;color:var(--blue);background:var(--blue-dim);
  padding:1px 5px;border-radius:2px;font-family:var(--mono);border:1px solid rgba(91,141,239,0.2)
}
.panel-type-badge{
  position:absolute;top:5px;right:5px;
  font-size:8px;padding:1px 5px;border-radius:2px;font-family:var(--mono);
  border:1px solid currentColor
}
.badge-manual{color:var(--text3);border-color:var(--border)}
.badge-imported{color:var(--purple);border-color:rgba(155,127,232,0.3);background:var(--purple-dim)}
.badge-ai{color:var(--gold);border-color:rgba(232,168,56,0.3);background:var(--gold-dim)}

.panel-meta{padding:8px 10px 10px}
.panel-shot{font-size:11px;font-weight:500;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.panel-desc{font-size:10px;color:var(--text3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:28px}
.panel-footer{display:flex;align-items:center;gap:5px;margin-top:6px}
.panel-tag{font-size:9px;padding:2px 5px;border-radius:2px;font-family:var(--mono);background:var(--bg4);color:var(--text3)}
.panel-tag.dur{color:var(--text2)}
.panel-drag-handle{
  position:absolute;left:0;top:0;bottom:0;width:4px;
  background:transparent;cursor:grab;transition:background .15s
}
.panel-card:hover .panel-drag-handle{background:var(--border2)}

/* ── Add panel card ── */
.add-panel-card{
  background:transparent;border:1px dashed var(--border);border-radius:var(--r8);
  cursor:pointer;transition:all .2s;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:6px;
  aspect-ratio:unset;min-height:140px
}
.add-panel-card:hover{border-color:var(--border2);background:var(--bg2)}
.add-panel-icon{font-size:18px;color:var(--text3)}
.add-panel-label{font-size:11px;color:var(--text3)}

/* ════════════════ ADD PANEL MODAL ════════════════ */
.modal-backdrop{
  position:fixed;inset:0;background:rgba(8,9,13,0.85);
  display:none;align-items:center;justify-content:center;z-index:200;
  backdrop-filter:blur(6px)
}
.modal-backdrop.open{display:flex}

/* ── ADD PANEL modal ── */
.ap-modal{
  background:var(--bg1);border:1px solid var(--border2);border-radius:var(--r12);
  width:520px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.7)
}
.ap-header{
  padding:18px 20px 16px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between
}
.ap-header h2{font-size:15px;font-weight:500;color:var(--text)}
.ap-close{
  background:none;border:none;color:var(--text3);cursor:pointer;
  font-size:16px;line-height:1;transition:color .15s
}
.ap-close:hover{color:var(--text)}
.ap-body{padding:20px;display:flex;flex-direction:column;gap:10px}

/* Method cards */
.method-card{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r8);
  padding:16px 18px;cursor:pointer;transition:all .2s;display:flex;align-items:flex-start;gap:14px
}
.method-card:hover{border-color:var(--border2);background:var(--bg3)}
.method-card.selected{border-color:var(--gold);background:var(--gold-dim)}
.method-icon{
  width:36px;height:36px;border-radius:var(--r6);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:16px
}
.mc-blank .method-icon{background:var(--bg4);color:var(--text3)}
.mc-import .method-icon{background:var(--purple-dim);color:var(--purple);border:1px solid rgba(155,127,232,0.2)}
.mc-ai .method-icon{background:var(--gold-dim);color:var(--gold);border:1px solid rgba(232,168,56,0.2)}
.method-text h3{font-size:13px;font-weight:500;color:var(--text);margin-bottom:3px}
.method-text p{font-size:11px;color:var(--text3);line-height:1.5}

/* Blank panel options (shown when blank selected) */
.blank-options{
  background:var(--bg3);border:1px solid var(--border);border-radius:var(--r8);
  padding:14px;display:none;flex-direction:column;gap:10px
}
.blank-options.show{display:flex}
.bo-row{display:flex;gap:8px}
.bo-field{flex:1}
.bo-field label{display:block;font-size:10px;font-weight:500;color:var(--text3);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:5px}
.bo-field input,.bo-field select,.bo-field textarea{
  width:100%;background:var(--bg2);border:1px solid var(--border);
  color:var(--text);padding:6px 9px;border-radius:var(--r4);font-size:12px;
  font-family:var(--sans);outline:none;transition:border .15s
}
.bo-field input:focus,.bo-field textarea:focus{border-color:var(--border2)}
.bo-field textarea{resize:none;line-height:1.5}
.bo-field select{cursor:pointer;background-color:var(--bg2)}

/* Import options */
.import-options{
  background:var(--bg3);border:1px solid var(--border);border-radius:var(--r8);
  padding:14px;display:none;flex-direction:column;gap:10px
}
.import-options.show{display:flex}
.drop-zone{
  background:var(--bg2);border:1px dashed var(--border2);border-radius:var(--r8);
  padding:24px;text-align:center;cursor:pointer;transition:all .2s
}
.drop-zone:hover{border-color:var(--purple);background:var(--purple-dim)}
.drop-zone-icon{font-size:22px;margin-bottom:6px;color:var(--text3)}
.drop-zone-text{font-size:12px;color:var(--text3);margin-bottom:4px}
.drop-zone-sub{font-size:10px;color:var(--text3);opacity:0.6}
.file-formats{display:flex;gap:5px;flex-wrap:wrap}
.fmt-badge{font-size:10px;padding:2px 6px;border-radius:3px;background:var(--bg4);color:var(--text3);font-family:var(--mono)}
.import-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}

/* AI panel options (mini version inline) */
.ai-options{
  background:var(--bg3);border:1px solid var(--border);border-radius:var(--r8);
  padding:14px;display:none;flex-direction:column;gap:10px
}
.ai-options.show{display:flex}
.ai-prompt-area{
  background:var(--bg2);border:1px solid var(--border);border-radius:var(--r6);
  padding:10px;display:flex;gap:8px;align-items:flex-start
}
.ai-prompt-icon{font-size:12px;color:var(--gold);margin-top:2px;flex-shrink:0}
.ai-prompt-input{
  flex:1;background:none;border:none;color:var(--text);font-family:var(--sans);
  font-size:12px;outline:none;resize:none;line-height:1.5;min-height:54px
}
.ai-prompt-input::placeholder{color:var(--text3)}

/* Footer */
.ap-footer{
  padding:14px 20px;border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:flex-end;gap:8px
}
.btn-cancel{
  background:none;border:1px solid var(--border);color:var(--text2);
  padding:7px 14px;border-radius:var(--r6);font-size:12px;cursor:pointer;transition:all .15s
}
.btn-cancel:hover{border-color:var(--border2)}
.btn-confirm{
  background:var(--gold);color:#1A0E00;border:none;
  padding:7px 18px;border-radius:var(--r6);font-size:12px;font-weight:600;
  cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px
}
.btn-confirm:hover{background:var(--gold2)}
.btn-confirm:disabled{background:var(--bg4);color:var(--text3);cursor:not-allowed}

/* ════════════════ PANEL INSPECTOR (right panel) ════════════════ */
.inspector-header{
  height:40px;display:flex;align-items:center;padding:0 14px;
  border-bottom:1px solid var(--border);flex-shrink:0;gap:8px
}
.inspector-title{font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:var(--text3)}
.inspector-body{flex:1;overflow-y:auto;padding:14px}
.insp-section{margin-bottom:18px}
.insp-sec-label{font-size:10px;font-weight:500;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px}
.insp-field{margin-bottom:10px}
.insp-field label{display:block;font-size:10px;color:var(--text3);margin-bottom:4px}
.insp-field input,.insp-field select,.insp-field textarea{
  width:100%;background:var(--bg2);border:1px solid var(--border);
  color:var(--text);padding:6px 8px;border-radius:var(--r4);font-size:12px;
  font-family:var(--sans);outline:none;transition:border .15s
}
.insp-field input:focus,.insp-field select:focus,.insp-field textarea:focus{border-color:var(--border2)}
.insp-field textarea{resize:vertical;min-height:60px;line-height:1.5}
.insp-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mood-tags{display:flex;flex-wrap:wrap;gap:4px}
.mood-tag{
  font-size:10px;padding:2px 7px;border-radius:3px;
  background:var(--bg3);border:1px solid var(--border);
  color:var(--text2);cursor:pointer;transition:all .15s
}
.mood-tag.on{background:var(--blue-dim);border-color:var(--blue);color:var(--blue)}
.insp-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:32px 16px;gap:8px;text-align:center
}
.insp-empty-icon{font-size:20px;color:var(--text3);margin-bottom:4px}
.insp-empty-text{font-size:11px;color:var(--text3);line-height:1.6}
.insp-ai-btn{
  width:100%;padding:8px;background:var(--gold-dim);border:1px solid rgba(232,168,56,0.3);
  color:var(--gold);border-radius:var(--r6);font-size:11px;cursor:pointer;
  font-family:var(--sans);transition:all .15s;margin-top:4px
}
.insp-ai-btn:hover{background:rgba(232,168,56,0.2)}

/* ════════════════ SCENARIO SIDEBAR ════════════════ */
.script-line{margin-bottom:2px;padding:2px 14px;line-height:1.6;cursor:text}
.script-line:hover{background:var(--bg3)}
.script-slug{font-family:var(--mono);font-size:10px;font-weight:500;color:var(--gold);letter-spacing:0.06em;background:rgba(232,168,56,0.08);padding:4px 8px;margin:12px 0 6px;display:block}
.script-action{font-family:var(--mono);font-size:11px;color:var(--text2);line-height:1.7;padding:0 4px}
.script-char{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--text);text-align:center;margin-top:8px;letter-spacing:0.04em;padding:2px 0}
.script-dialog{font-family:var(--mono);font-size:11px;color:var(--text);text-align:center;max-width:220px;margin:0 auto;line-height:1.6}
.script-paren{font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;font-style:italic}
.sidebar-ai-bar{border-top:1px solid var(--border);padding:8px 12px;display:flex;gap:6px;flex-shrink:0;background:var(--bg0)}
.sidebar-ai-input{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r4);padding:6px 9px;color:var(--text);font-family:var(--sans);font-size:12px;outline:none}
.sidebar-ai-input:focus{border-color:var(--border2)}
.sidebar-ai-input::placeholder{color:var(--text3)}
.sidebar-ai-send{background:none;border:1px solid var(--border);color:var(--text3);width:28px;height:28px;border-radius:var(--r4);cursor:pointer;flex-shrink:0;transition:all .15s}
.sidebar-ai-send:hover{border-color:rgba(232,168,56,0.4);color:var(--gold)}

/* ════════════════ MISC ════════════════ */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
select option{background:var(--bg2)}
</style>
</head>
<body>
<div id="app">

  <!-- ▸ TITLEBAR -->
  <div class="titlebar">
    <div class="traffic">
      <span class="t-close"></span>
      <span class="t-min"></span>
      <span class="t-max"></span>
    </div>
    <div class="app-wordmark">Scene<b>Forge</b> — <span id="project-name" style="color:var(--text2)">새 프로젝트</span></div>
    <div class="tb-right">
      <div class="ai-status" onclick="toggleAiPanel()" id="ai-status-btn">
        <div class="ai-dot"></div>
        <span class="ai-label">Claude Code</span>
      </div>
      <div class="tb-divider"></div>
      <button class="tb-btn" onclick="toggleScenario()">📄 시나리오</button>
      <button class="tb-btn" onclick="exportProject()">↑ 내보내기</button>
      <button class="tb-btn accent" onclick="openAiGenModal()">✦ AI 생성</button>
    </div>
  </div>

  <!-- ▸ TOOLBAR -->
  <div class="toolbar">
    <div class="tool-group">
      <select class="scene-select" id="scene-select" onchange="filterScene(this.value)">
        <option value="all">전체 장면</option>
        <option value="s1">S1 — 옥상 (저녁)</option>
        <option value="s2">S2 — 교실</option>
      </select>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-group">
      <button class="tool-btn" onclick="addScene()">+ 장면 추가</button>
      <button class="tool-btn active" onclick="openAddPanel()">+ 패널 추가</button>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-group">
      <div class="view-toggle">
        <button class="vt-btn active" onclick="setView('grid',this)">그리드</button>
        <button class="vt-btn" onclick="setView('strip',this)">스트립</button>
        <button class="vt-btn" onclick="setView('slide',this)">슬라이드</button>
      </div>
    </div>
    <div class="tool-sep"></div>
    <button class="tool-btn" id="insp-toggle" onclick="toggleInspector()">속성 패널</button>

    <div class="zoom-group">
      <button class="tool-btn" onclick="zoom(-10)">−</button>
      <span class="zoom-val" id="zoom-val">100%</span>
      <button class="tool-btn" onclick="zoom(10)">+</button>
    </div>
  </div>

  <!-- ▸ WORKSPACE -->
  <div class="workspace">

    <!-- Left: Scenario sidebar -->
    <div class="left-sidebar" id="left-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">시나리오</span>
        <button class="sidebar-close" onclick="toggleScenario()">✕</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:8px 0">
        <div class="script-line"><span class="script-slug">INT. 고등학교 옥상 — 저녁</span></div>
        <div class="script-line"><span class="script-action">노을이 지는 하늘. 서울 도심의 빌딩 숲이 붉게 물들어 있다. 미소(17)가 난간에 등을 기댄 채 이어폰을 꽂고 눈을 감고 있다.</span></div>
        <div class="script-line"><span class="script-action">계단 문이 삐걱 열리며 준혁(18)이 올라온다. 손에는 편의점 봉투.</span></div>
        <div class="script-line" style="margin-top:4px"><span class="script-char">준혁</span></div>
        <div class="script-line"><span class="script-paren">(숨을 고르며)</span></div>
        <div class="script-line"><span class="script-dialog">야, 여기서 또 숨어 있었어?</span></div>
        <div class="script-line" style="margin-top:4px"><span class="script-action">미소는 눈을 뜨지 않은 채 손을 내밀며 뭔가를 요구하는 시늉을 한다.</span></div>
        <div class="script-line"><span class="script-char">미소</span></div>
        <div class="script-line"><span class="script-paren">(눈 감은 채)</span></div>
        <div class="script-line"><span class="script-dialog">아이스크림 사왔지?</span></div>
        <div class="script-line" style="margin-top:4px"><span class="script-slug">INT. 교실 — 낮</span></div>
        <div class="script-line"><span class="script-action">수업 중인 교실. 미소는 창밖을 멍하니 바라보고 있다.</span></div>
      </div>
      <div class="sidebar-ai-bar">
        <input class="sidebar-ai-input" placeholder="시나리오 수정 요청..." />
        <button class="sidebar-ai-send">✦</button>
      </div>
    </div>

    <!-- Center: Canvas -->
    <div class="canvas-area" id="canvas-area">
      <div class="canvas-inner" id="canvas-inner">
        <!-- Scene 1 -->
        <div class="scene-group" id="sg-s1">
          <div class="scene-row">
            <span class="scene-chip">S1</span>
            <span class="scene-name">옥상 (저녁)</span>
            <span class="scene-dur">19s</span>
            <div class="scene-line"></div>
            <button class="scene-add-btn" onclick="openAddPanel('s1')">+ 패널</button>
          </div>
          <div class="panel-grid" id="grid-s1">
            <!-- Panels injected by JS -->
          </div>
        </div>

        <!-- Scene 2 -->
        <div class="scene-group" id="sg-s2">
          <div class="scene-row">
            <span class="scene-chip">S2</span>
            <span class="scene-name">교실 (낮)</span>
            <span class="scene-dur">—</span>
            <div class="scene-line"></div>
            <button class="scene-add-btn" onclick="openAddPanel('s2')">+ 패널</button>
          </div>
          <div class="panel-grid" id="grid-s2">
            <!-- empty state for scene 2 -->
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Inspector -->
    <div class="right-panel" id="right-panel">
      <div class="inspector-header">
        <span class="inspector-title">속성</span>
        <button class="sidebar-close" onclick="toggleInspector()">✕</button>
      </div>
      <div class="inspector-body" id="inspector-body">
        <div class="insp-empty" id="insp-empty">
          <div class="insp-empty-icon">☐</div>
          <div class="insp-empty-text">패널을 선택하면<br>속성을 편집할 수 있어요</div>
        </div>
        <div id="insp-content" style="display:none">
          <div class="insp-section">
            <div class="insp-sec-label">프레임</div>
            <div class="insp-row">
              <div class="insp-field"><label>샷 타입</label>
                <select><option>EWS</option><option>WS</option><option>MS</option><option selected>CU</option><option>ECU</option><option>OTS</option><option>POV</option></select>
              </div>
              <div class="insp-field"><label>지속 시간</label>
                <input type="text" value="3s">
              </div>
            </div>
            <div class="insp-field"><label>카메라 무브먼트</label>
              <select><option selected>고정 (Static)</option><option>팬</option><option>틸트</option><option>달리</option><option>풀백</option></select>
            </div>
          </div>
          <div class="insp-section">
            <div class="insp-sec-label">내용</div>
            <div class="insp-field"><label>장면 설명</label>
              <textarea>눈 감은 미소. 노을빛이 뺨에 반사된다. 이어폰 코드가 흔들린다.</textarea>
            </div>
            <div class="insp-field"><label>대사 / 나레이션</label>
              <input type="text" placeholder="없음" value="아이스크림 사왔지?">
            </div>
            <div class="insp-field"><label>사운드</label>
              <input type="text" placeholder="없음" value="도심 소음, 멀리 음악">
            </div>
          </div>
          <div class="insp-section">
            <div class="insp-sec-label">분위기</div>
            <div class="mood-tags">
              <span class="mood-tag on" onclick="this.classList.toggle('on')">감성적</span>
              <span class="mood-tag on" onclick="this.classList.toggle('on')">황금빛</span>
              <span class="mood-tag" onclick="this.classList.toggle('on')">긴장감</span>
              <span class="mood-tag" onclick="this.classList.toggle('on')">유머</span>
              <span class="mood-tag" onclick="this.classList.toggle('on')">설렘</span>
              <span class="mood-tag" onclick="this.classList.toggle('on')">슬픔</span>
            </div>
          </div>
          <div class="insp-section">
            <div class="insp-sec-label">전환</div>
            <div class="insp-field">
              <select><option>컷 (Cut)</option><option>페이드인</option><option>디졸브</option></select>
            </div>
          </div>
          <div class="insp-section">
            <div class="insp-sec-label">AI</div>
            <button class="insp-ai-btn" onclick="alert('선택된 패널을 AI로 재생성합니다')">✦ 이 패널 AI 재생성</button>
            <button class="insp-ai-btn" style="margin-top:6px;background:var(--bg3);border-color:var(--border);color:var(--text2)" onclick="alert('AI로 설명 자동 완성')">✦ 설명 자동 완성</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ════════════════ ADD PANEL MODAL ════════════════ -->
<div class="modal-backdrop" id="add-panel-modal">
  <div class="ap-modal">
    <div class="ap-header">
      <h2>패널 추가</h2>
      <button class="ap-close" onclick="closeAddPanel()">✕</button>
    </div>
    <div class="ap-body">

      <!-- Method: Blank -->
      <div class="method-card mc-blank" id="mc-blank" onclick="selectMethod('blank')">
        <div class="method-icon">□</div>
        <div class="method-text">
          <h3>빈 패널</h3>
          <p>빈 프레임으로 시작합니다. 텍스트로 설명을 직접 입력하거나 나중에 이미지를 추가할 수 있어요.</p>
        </div>
      </div>
      <div class="blank-options" id="blank-options">
        <div class="bo-row">
          <div class="bo-field">
            <label>샷 타입</label>
            <select>
              <option>지정 안 함</option>
              <option>EWS — 익스트림 와이드</option>
              <option>WS — 와이드샷</option>
              <option>MS — 미디엄샷</option>
              <option>CU — 클로즈업</option>
              <option>ECU — 익스트림 CU</option>
              <option>OTS — 오버더숄더</option>
              <option>POV — 시점샷</option>
            </select>
          </div>
          <div class="bo-field">
            <label>지속 시간</label>
            <input type="text" placeholder="예: 3s, 00:05">
          </div>
        </div>
        <div class="bo-field">
          <label>장면 설명 <span style="color:var(--text3);font-size:9px;text-transform:none;letter-spacing:0">(선택 사항)</span></label>
          <textarea rows="2" placeholder="이 프레임에서 무슨 일이 일어나나요?"></textarea>
        </div>
        <div class="bo-row">
          <div class="bo-field">
            <label>대사</label>
            <input type="text" placeholder="없음">
          </div>
          <div class="bo-field">
            <label>사운드</label>
            <input type="text" placeholder="없음">
          </div>
        </div>
      </div>

      <!-- Method: Import -->
      <div class="method-card mc-import" id="mc-import" onclick="selectMethod('import')">
        <div class="method-icon">↓</div>
        <div class="method-text">
          <h3>이미지 임포트</h3>
          <p>JPG, PNG, PSD, PDF 등 외부 이미지를 패널로 가져옵니다. 직접 그린 스케치도 OK.</p>
        </div>
      </div>
      <div class="import-options" id="import-options">
        <div class="drop-zone" onclick="fakeFileSelect()">
          <div class="drop-zone-icon">⊕</div>
          <div class="drop-zone-text">파일을 드래그하거나 클릭해서 선택</div>
          <div class="drop-zone-sub">또는 클립보드에서 붙여넣기 (⌘V)</div>
          <div style="display:flex;gap:5px;justify-content:center;margin-top:10px">
            <span class="fmt-badge">JPG</span>
            <span class="fmt-badge">PNG</span>
            <span class="fmt-badge">PSD</span>
            <span class="fmt-badge">PDF</span>
            <span class="fmt-badge">TIFF</span>
            <span class="fmt-badge">WEBP</span>
          </div>
        </div>
        <div class="import-meta">
          <div class="bo-field">
            <label>샷 타입</label>
            <select><option>자동 감지</option><option>직접 지정</option></select>
          </div>
          <div class="bo-field">
            <label>지속 시간</label>
            <input type="text" placeholder="예: 3s">
          </div>
          <div class="bo-field" style="grid-column:span 2">
            <label>설명 (선택)</label>
            <input type="text" placeholder="이 프레임 설명...">
          </div>
        </div>
        <div id="import-preview" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r6);padding:10px;display:flex;align-items:center;gap:10px">
          <div style="width:60px;height:34px;background:var(--bg4);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--text3)">미리보기</div>
          <div>
            <div style="font-size:12px;color:var(--text)">sketch_01.png</div>
            <div style="font-size:10px;color:var(--text3)">1920 × 1080 · 234KB</div>
          </div>
          <button style="margin-left:auto;background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px">✕</button>
        </div>
      </div>

      <!-- Method: AI -->
      <div class="method-card mc-ai" id="mc-ai" onclick="selectMethod('ai')">
        <div class="method-icon">✦</div>
        <div class="method-text">
          <h3>AI 생성</h3>
          <p>설명을 입력하면 Claude가 이 패널에 맞는 스토리보드 설명과 카메라 설정을 자동으로 생성해요.</p>
        </div>
      </div>
      <div class="ai-options" id="ai-options">
        <div class="ai-prompt-area">
          <span class="ai-prompt-icon">✦</span>
          <textarea class="ai-prompt-input" placeholder="예: 미소가 창밖을 바라보는 클로즈업. 수업 중이지만 딴생각을 하고 있다. 오후의 빛이 창문을 통해 들어온다."></textarea>
        </div>
        <div class="bo-row">
          <div class="bo-field">
            <label>샷 타입 힌트</label>
            <select><option>AI 자동 결정</option><option>EWS</option><option>WS</option><option>MS</option><option>CU</option></select>
          </div>
          <div class="bo-field">
            <label>지속 시간</label>
            <input type="text" placeholder="AI 자동">
          </div>
        </div>
      </div>
    </div>

    <div class="ap-footer">
      <button class="btn-cancel" onclick="closeAddPanel()">취소</button>
      <button class="btn-confirm" id="confirm-btn" onclick="confirmAddPanel()">
        <span id="confirm-label">패널 추가</span>
      </button>
    </div>
  </div>
</div>

<script>
/* ──────────────── DATA ──────────────── */
const panelsS1 = [
  {id:'p1',num:'01',shot:'EWS',desc:'노을진 서울 전경. 미소의 실루엣이 난간에 기대어 있다.',dur:'4s',type:'ai',
    svg:`<svg viewBox="0 0 160 90" width="100%" height="100%">
      <rect width="160" height="90" fill="#1A1C24"/>
      <rect width="160" height="55" fill="#3D2520" opacity=".65"/>
      <ellipse cx="95" cy="42" rx="14" ry="12" fill="#E8A838" opacity=".45"/>
      <rect y="50" width="25" height="40" fill="#1A1C24"/>
      <rect x="20" y="42" width="15" height="48" fill="#1A1C24"/>
      <rect x="40" y="54" width="18" height="36" fill="#1A1C24"/>
      <rect x="65" y="46" width="12" height="44" fill="#1A1C24"/>
      <rect x="82" y="58" width="20" height="32" fill="#1A1C24"/>
      <rect x="108" y="44" width="14" height="46" fill="#1A1C24"/>
      <rect x="128" y="50" width="32" height="40" fill="#1A1C24"/>
      <rect y="72" width="160" height="18" fill="#21242F"/>
      <rect y="69" width="160" height="2" fill="#3D4259"/>
      <ellipse cx="110" cy="64" rx="5" ry="5" fill="#5E5C58"/>
      <rect x="107" y="69" width="6" height="14" rx="2" fill="#5E5C58"/>
    </svg>`},
  {id:'p2',num:'02',shot:'CU',desc:'눈 감은 미소. 노을빛이 뺨에 반사된다. 이어폰.',dur:'3s',type:'ai',
    svg:`<svg viewBox="0 0 160 90" width="100%" height="100%">
      <rect width="160" height="90" fill="#1A1C24"/>
      <rect width="160" height="60" fill="#2D1F18" opacity=".8"/>
      <ellipse cx="80" cy="38" rx="22" ry="24" fill="#3D3530"/>
      <rect x="58" y="50" width="44" height="40" rx="5" fill="#2E2825"/>
      <ellipse cx="80" cy="22" rx="24" ry="14" fill="#1E1A17"/>
      <rect x="56" y="28" width="6" height="28" rx="3" fill="#1E1A17"/>
      <path d="M70,40 Q62,52 66,64" stroke="#5E5C58" stroke-width="1.2" fill="none"/>
      <path d="M68,36 Q73,33 78,36" stroke="#5E5C58" stroke-width="1.2" fill="none"/>
      <path d="M84,36 Q89,33 93,36" stroke="#5E5C58" stroke-width="1.2" fill="none"/>
      <ellipse cx="80" cy="38" rx="22" ry="24" fill="#E8603C" opacity=".08"/>
    </svg>`},
  {id:'p3',num:'03',shot:'MS',desc:'삐걱이는 문. 준혁이 봉투를 들고 옥상으로 올라온다.',dur:'2s',type:'ai',
    svg:`<svg viewBox="0 0 160 90" width="100%" height="100%">
      <rect width="160" height="90" fill="#1A1C24"/>
      <rect width="160" height="72" fill="#21242F"/>
      <rect y="72" width="160" height="18" fill="#282C39"/>
      <rect x="55" y="20" width="50" height="70" rx="3" fill="#1A1C24" stroke="#3D4259" stroke-width="1"/>
      <rect x="57" y="22" width="30" height="66" fill="#2A2E3A"/>
      <ellipse cx="96" cy="36" rx="8" ry="8" fill="#4A4840"/>
      <rect x="88" y="44" width="16" height="28" rx="3" fill="#3D3D50"/>
      <ellipse cx="82" cy="55" rx="6" ry="8" fill="#2E3040" stroke="#3D4259" stroke-width=".5"/>
    </svg>`},
  {id:'p4',num:'04',shot:'MS',desc:'수동으로 추가된 패널 — 스케치 임포트',dur:'2s',type:'manual',
    svg:`<svg viewBox="0 0 160 90" width="100%" height="100%">
      <rect width="160" height="90" fill="#1E2028"/>
      <rect x="20" y="15" width="120" height="60" rx="4" fill="#252830" stroke="#3A3D4A" stroke-width="1"/>
      <line x1="20" y1="15" x2="140" y2="75" stroke="#3A3D4A" stroke-width=".8" stroke-dasharray="3,3"/>
      <line x1="140" y1="15" x2="20" y2="75" stroke="#3A3D4A" stroke-width=".8" stroke-dasharray="3,3"/>
      <text x="80" y="48" text-anchor="middle" fill="#4E4C48" font-size="9" font-family="monospace">스케치 미리보기</text>
    </svg>`},
  {id:'p5',num:'05',shot:'—',desc:'새로 추가된 빈 패널',dur:'—',type:'empty',
    svg:null},
];

/* ──────────────── RENDER PANELS ──────────────── */
function renderPanel(p, gridId){
  const grid = document.getElementById(gridId);
  const card = document.createElement('div');
  card.className = 'panel-card';
  card.id = 'card-'+p.id;
  card.onclick = () => selectPanel(p.id);

  const isEmpty = p.type === 'empty';
  const badge = {ai:'AI',manual:'수동',imported:'임포트',empty:'빈 패널'}[p.type] || '';
  const badgeCls = {ai:'badge-ai',manual:'badge-manual',imported:'badge-imported',empty:'badge-manual'}[p.type] || '';

  card.innerHTML = `
    <div class="panel-frame ${isEmpty?'empty':''}">
      ${isEmpty ? `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;height:100%">
          <div style="font-size:20px;color:var(--text3);opacity:.4">□</div>
          <div style="font-size:9px;color:var(--text3);opacity:.5">빈 프레임</div>
        </div>
      ` : `${p.svg}`}
      <span class="panel-num">${p.num}</span>
      ${p.shot!=='—'?`<span class="panel-cam-tag">${p.shot}</span>`:''}
      <span class="panel-type-badge ${badgeCls}">${badge}</span>
      <div class="frame-overlay">
        <button class="frame-edit-btn" onclick="event.stopPropagation();openEditPanel('${p.id}')">편집</button>
      </div>
    </div>
    <div class="panel-meta">
      <div class="panel-shot">${p.shot==='—'?'빈 패널':p.shot+' — '+descShot(p.shot)}</div>
      <div class="panel-desc">${p.desc}</div>
      <div class="panel-footer">
        <span class="panel-tag">S1-${p.num}</span>
        <span class="panel-tag dur">${p.dur}</span>
      </div>
    </div>
    <div class="panel-drag-handle"></div>
  `;
  grid.appendChild(card);
}

function descShot(s){
  return {EWS:'익스트림 와이드',WS:'와이드',MS:'미디엄',CU:'클로즈업',ECU:'익스트림 CU',OTS:'오버더숄더',POV:'시점',}[s]||'';
}

// Render add button
function renderAddBtn(gridId, sceneId){
  const grid = document.getElementById(gridId);
  const btn = document.createElement('div');
  btn.className = 'add-panel-card';
  btn.innerHTML = `<div class="add-panel-icon">+</div><div class="add-panel-label">패널 추가</div>`;
  btn.onclick = () => openAddPanel(sceneId);
  grid.appendChild(btn);
}

function initCanvas(){
  const g = document.getElementById('grid-s1');
  g.innerHTML = '';
  panelsS1.forEach(p => renderPanel(p, 'grid-s1'));
  renderAddBtn('grid-s1','s1');
  // S2 empty
  const g2 = document.getElementById('grid-s2');
  g2.innerHTML = `
    <div style="grid-column:1/-1;padding:24px 0 8px;display:flex;flex-direction:column;align-items:flex-start;gap:8px">
      <div style="font-size:12px;color:var(--text3)">이 장면에는 아직 패널이 없어요.</div>
      <div style="display:flex;gap:8px">
        <button style="background:var(--bg2);border:1px solid var(--border);color:var(--text2);padding:6px 12px;border-radius:var(--r6);font-size:11px;cursor:pointer" onclick="openAddPanel('s2')">+ 패널 추가</button>
        <button style="background:var(--gold-dim);border:1px solid rgba(232,168,56,.3);color:var(--gold);padding:6px 12px;border-radius:var(--r6);font-size:11px;cursor:pointer" onclick="openAiGenModal()">✦ AI로 자동 생성</button>
      </div>
    </div>
  `;
}
initCanvas();

/* ──────────────── PANEL SELECTION ──────────────── */
let selectedPanel = null;
function selectPanel(id){
  document.querySelectorAll('.panel-card').forEach(c=>c.classList.remove('selected'));
  const c = document.getElementById('card-'+id);
  if(c){ c.classList.add('selected'); selectedPanel=id; }
  // Open inspector
  if(!document.getElementById('right-panel').classList.contains('open')){
    openInspector();
  }
  document.getElementById('insp-empty').style.display='none';
  document.getElementById('insp-content').style.display='block';
}

/* ──────────────── ADD PANEL MODAL ──────────────── */
let currentMethod = null;
let targetScene = 's1';

function openAddPanel(scene){
  targetScene = scene || 's1';
  currentMethod = null;
  document.querySelectorAll('.method-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('blank-options').classList.remove('show');
  document.getElementById('import-options').classList.remove('show');
  document.getElementById('ai-options').classList.remove('show');
  document.getElementById('add-panel-modal').classList.add('open');
  updateConfirmBtn();
}
function closeAddPanel(){
  document.getElementById('add-panel-modal').classList.remove('open');
}

function selectMethod(method){
  currentMethod = method;
  document.querySelectorAll('.method-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('mc-'+method).classList.add('selected');
  document.getElementById('blank-options').classList.toggle('show', method==='blank');
  document.getElementById('import-options').classList.toggle('show', method==='import');
  document.getElementById('ai-options').classList.toggle('show', method==='ai');
  updateConfirmBtn();
}

function updateConfirmBtn(){
  const btn = document.getElementById('confirm-btn');
  const lbl = document.getElementById('confirm-label');
  const labels = {blank:'빈 패널 추가', import:'파일 선택 후 추가', ai:'✦ AI 생성 후 추가'};
  if(!currentMethod){ btn.disabled=true; lbl.textContent='방식을 선택하세요'; }
  else { btn.disabled=false; lbl.textContent=labels[currentMethod]; }
}

function confirmAddPanel(){
  if(!currentMethod) return;
  closeAddPanel();
  const grid = document.getElementById('grid-'+targetScene);
  // Remove add button, add new panel, re-add button
  const addBtn = grid.querySelector('.add-panel-card');
  if(addBtn) grid.removeChild(addBtn);

  const newNum = String(grid.querySelectorAll('.panel-card').length+1).padStart(2,'0');
  const types = {blank:'empty',import:'imported',ai:'ai'};
  const newPanel = {
    id:'p_'+Date.now(),num:newNum,shot:'—',
    desc: currentMethod==='blank'?'새로 추가된 빈 패널':
          currentMethod==='import'?'임포트된 이미지 패널':
          'AI 생성 중...',
    dur:'—', type:types[currentMethod], svg:null
  };
  renderPanel(newPanel, 'grid-'+targetScene);
  renderAddBtn('grid-'+targetScene, targetScene);
}

function fakeFileSelect(){
  const prev = document.getElementById('import-preview');
  if(prev) prev.style.display='flex';
}

/* ──────────────── SIDEBAR TOGGLES ──────────────── */
function toggleScenario(){
  document.getElementById('left-sidebar').classList.toggle('open');
}
function toggleInspector(){
  const p = document.getElementById('right-panel');
  p.classList.toggle('open');
}
function openInspector(){
  document.getElementById('right-panel').classList.add('open');
}
function toggleAiPanel(){
  // Could show/hide an AI generation panel
  alert('Claude Code 연결 상태: 정상\n모델: claude-opus-4\n버전: v1.0.3');
}

/* ──────────────── ZOOM ──────────────── */
let zoomLevel = 100;
function zoom(delta){
  zoomLevel = Math.max(50, Math.min(200, zoomLevel+delta));
  document.getElementById('zoom-val').textContent = zoomLevel+'%';
  document.getElementById('canvas-inner').style.transform = `scale(${zoomLevel/100})`;
  document.getElementById('canvas-inner').style.transformOrigin = 'top left';
}

/* ──────────────── VIEW ──────────────── */
function setView(v, btn){
  document.querySelectorAll('.vt-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const inner = document.getElementById('canvas-inner');
  if(v==='strip'){
    document.querySelectorAll('.panel-grid').forEach(g=>{
      g.style.gridTemplateColumns='repeat(auto-fill,minmax(140px,1fr))';
    });
  } else {
    document.querySelectorAll('.panel-grid').forEach(g=>{
      g.style.gridTemplateColumns='repeat(auto-fill,minmax(200px,1fr))';
    });
  }
}

/* ──────────────── MISC ──────────────── */
function filterScene(v){
  document.getElementById('sg-s1').style.display=(v==='all'||v==='s1')?'block':'none';
  document.getElementById('sg-s2').style.display=(v==='all'||v==='s2')?'block':'none';
}
function addScene(){
  const name = prompt('새 장면 이름:','S3 — 새 장면');
  if(name) alert('장면 "'+name+'" 추가됨 (실제 앱에서 캔버스에 삽입)');
}
function openEditPanel(id){ selectPanel(id); openInspector(); }
function openAiGenModal(){ alert('AI 일괄 생성 패널\n(시나리오 전체 또는 선택 장면 기반으로 스토리보드 자동 생성)'); }
function exportProject(){ alert('내보내기\n· PDF 스토리보드\n· 이미지 패키지 (ZIP)\n· 파이널 컷 XML\n· 프리미어 XML'); }

// Click outside modal
document.getElementById('add-panel-modal').addEventListener('click', e=>{
  if(e.target===document.getElementById('add-panel-modal')) closeAddPanel();
});
</script>
</body>
</html>
```
