import { z } from 'zod';

// ============ Enums ============

export const ShotTypeEnum = z.enum([
  'EWS', 'WS', 'MS', 'CU', 'ECU', 'OTS', 'POV'
]);
export type ShotType = z.infer<typeof ShotTypeEnum>;

export const MoodTagEnum = z.enum([
  'emotional', 'golden', 'tension', 'humor', 'excitement', 'sadness'
]);
export type MoodTag = z.infer<typeof MoodTagEnum>;

export const CameraMovementEnum = z.enum([
  'Static', 'Pan', 'Tilt', 'Dolly', 'Pullback'
]);
export type CameraMovement = z.infer<typeof CameraMovementEnum>;

export const TransitionEnum = z.enum([
  'cut', 'fadein', 'fadeout', 'dissolve'
]);
export type Transition = z.infer<typeof TransitionEnum>;

export const CinematicStyleEnum = z.enum([
  'slash_cut', 'continuous', 'montage', 'slow_paced', 'action'
]);
export type CinematicStyle = z.infer<typeof CinematicStyleEnum>;

export const ExpansionTypeEnum = z.enum([
  'scene', 'subplot', 'character', 'dialogue'
]);
export type ExpansionType = z.infer<typeof ExpansionTypeEnum>;

// ============ Duration ============

export const DurationSchema = z.string().regex(
  /^\d+(\.\d+)?s$/,
  '지속 시간은 숫자 + s 형식이어야 합니다 (예: 2s, 3.5s)'
);

// ============ Storyboard Tool Schemas ============

export const AddPanelParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('대상 씬 ID. 지정하지 않으면 현재 선택된 씬에 추가됩니다.'),
  after_panel_id: z.string().optional()
    .describe('이 패널 ID 뒤에 새 패널을 삽입합니다.'),
  shot_type: ShotTypeEnum.optional()
    .describe('샷 타입: EWS(초원경), WS(원경), MS(중경), CU(근접), ECU(초근접), OTS(오버숄더), POV(주관)'),
  description: z.string().min(5).max(500).optional()
    .describe('패널의 시각적 묘사. 인물 동작, 배치, 환경을 구체적으로 서술. 5자 이상.'),
  dialogue: z.string().max(300).optional()
    .describe('대사. 말하는 인물이 있다면 포함.'),
  sound: z.string().max(200).optional()
    .describe('효과음이나 배경음 설명.'),
  mood_tags: z.array(MoodTagEnum).min(1).max(3).optional()
    .describe('무드 태그 배열. 1-3개 권장.'),
  generate_svg: z.boolean().optional()
    .describe('패널 추가 후 자동으로 SVG 생성할지 여부.'),
});
export type AddPanelParams = z.infer<typeof AddPanelParamsSchema>;

export const EditPanelParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널을 수정합니다.'),
  shot_type: ShotTypeEnum.optional(),
  description: z.string().min(5).max(500).optional(),
  dialogue: z.string().max(300).optional(),
  sound: z.string().max(200).optional(),
  mood_tags: z.array(MoodTagEnum).optional(),
  camera_movement: CameraMovementEnum.optional()
    .describe('카메라 움직임: Static(고정), Pan(좌우), Tilt(상하), Dolly(전후), Pullback(후퇴)'),
  duration: DurationSchema.optional(),
  transition: TransitionEnum.optional(),
});
export type EditPanelParams = z.infer<typeof EditPanelParamsSchema>;

export const DeletePanelParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널을 삭제합니다.'),
});

export const DrawSvgParamsSchema = z.object({
  panel_id: z.string().optional()
    .describe('패널 ID. 지정하지 않으면 현재 선택된 패널.'),
  description: z.string().optional()
    .describe('SVG 생성용 묘사. 없으면 기존 패널 묘사 사용.'),
  style_hint: z.enum(['minimal', 'detailed', 'sketch']).optional()
    .describe('스타일 힌트: minimal(미니멀), detailed(디테일), sketch(스케치)'),
});

export const ReorderPanelsParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('씬 ID. 지정하지 않으면 현재 선택된 씬.'),
  panel_ids: z.array(z.string()).min(1)
    .describe('새 순서대로 패널 ID 배열. 모든 패널을 포함해야 합니다.'),
});

export const BatchEditParamsSchema = z.object({
  scene_id: z.string().optional()
    .describe('씬 ID. 지정하지 않으면 현재 선택된 씬.'),
  style: CinematicStyleEnum.optional()
    .describe('시네마틱 스타일: slash_cut(짧은 컷), continuous(연속), montage(몬타주), slow_paced(느린 페이싱), action(액션)'),
  mood_tags: z.array(MoodTagEnum).optional(),
  default_duration: DurationSchema.optional(),
});

export const GenerateStoryboardParamsSchema = z.object({
  panel_count: z.number().int().min(1).max(100).optional()
    .default(16)
    .describe('생성할 총 패널 수.'),
});

// ============ Scenario Tool Schemas ============

export const EditScenarioParamsSchema = z.object({
  name: z.string().min(1).max(100).optional()
    .describe('새 시나리오 이름.'),
  description: z.string().max(500).optional()
    .describe('시나리오 설명.'),
  content: z.string().optional()
    .describe('전체 내용 교체.'),
  append_content: z.string().optional()
    .describe('내용 뒤에 추가.'),
  prepend_content: z.string().optional()
    .describe('내용 앞에 추가.'),
});

export const ExpandScenarioParamsSchema = z.object({
  expansion_type: ExpansionTypeEnum.optional()
    .default('scene')
    .describe('확장 유형: scene(새 씬), subplot(서브플롯), character(캐릭터), dialogue(대사)'),
  content: z.string().min(10)
    .describe('추가할 내용. 10자 이상.'),
});

export const CondenseScenarioParamsSchema = z.object({
  content: z.string().min(10)
    .describe('축약된 시나리오 내용.'),
});

export const PolishScenarioParamsSchema = z.object({
  content: z.string().min(10)
    .describe('다듬어진 시나리오 내용.'),
});

// ============ Skill Call Schema ============

export const SkillCallSchema = z.object({
  skill: z.string().min(1),
  tool: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()),
});

export const CopilotResponseSchema = z.object({
  thinking: z.string().optional(),
  skill_calls: z.array(SkillCallSchema).optional().default([]),
  message: z.string().optional(),
});
