# Panel List View 구현 디자인

## 문제
PanelGrid의 리스트 뷰 모드가 그리드 뷰와 동일하게 렌더링됨.
`gridClass` ternary가 `viewMode === 'strip'`일 때만 다른 클래스를 반환하지만, 리스트 뷰도 `'panel-grid'`를 사용함.

## 목표
1. **스크립트 리뷰**: 패널 텍스트(설명, 대사)가 잘 보이도록 가로로 넓게 표시
2. **순서 정리**: 드래그 핸들로 패널 순서 변경 가능

## 해결 방법

### PanelCard에 variant prop 추가

```tsx
interface PanelCardProps {
  // ...existing props
  variant?: 'grid' | 'list';
}
```

**list variant 특징:**
- 드래그 핸들 표시 (좌측)
- 텍스트를 카드 전체에 가로로 넓게 표시
- 이미지/썸네일은 상단에 작게 표시
- 설명, 대사, 메타데이터를 세로로 배치

### PanelGrid 수정

```tsx
const gridClass = viewMode === 'strip'
  ? 'panel-grid'
  : viewMode === 'list'
    ? 'panel-list'
    : 'panel-grid';
```

### CSS (panel-list)
- flex-direction: column
- 패널 카드들이 세로로 정렬
- 각 카드는 텍스트 conteúdo가 넓게 표시

## 변경 파일
- `src/components/panels/PanelCard.tsx` - variant prop 추가, list 렌더링 분기
- `src/components/panels/PanelGrid.tsx` - gridClass 로직 수정, variant 전달
- (있다면) 관련 CSS 파일

## 예상 결과
| 모드 | 이미지 | 텍스트 | 용도 |
|------|--------|--------|------|
| grid | 큼 | 작게 | 시각적 검토 |
| strip | 작게 | 거의 없음 | 개요 파악 |
| list | 작게(상단) | 크게 | 스크립트 리뷰 |
| slide | 하나씩 | 하나씩 | 프레임 단위 검토 |
