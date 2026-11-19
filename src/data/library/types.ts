/**
 * 漏洞手册 · 类型定义（架构 07 §2 定稿）。
 *
 * 判别联合：LearningEntry（形态 A card / 形态 B interactive）与 MethodCard（kind:'method'）。
 * 本文件是批 0 所有数据结构的唯一来源，不改现有 sandbox.ts 的 SandboxCase/SandboxStage。
 * 所有新内容均为「演示样例」（source 固定 'demo'），不现场运行、非真实系统。
 */

/** 本站教学难度档（≠ 危险度★；★只展示不筛选不排序）。 */
export type LibraryDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** 场景维度（可多选）。 */
export type LibraryScene = 'Web' | 'API' | '系统' | '网络' | '云' | '移动' | 'AI' | '通用';

/** 危险度星级，只展示、不参与筛选与排序。 */
export type HazardStar = 1 | 2 | 3 | 4 | 5;

/**
 * 拼音检索三串（PRD §4.5.1 与样章 8.1 均为三串）。
 * full 带空格、joined 全拼连写、initial 首字母。
 */
export interface PinyinIndex {
  full: string;
  joined: string;
  initial: string;
}

/** 微自测的一个选项（1 对 3 错，错项逐个解释）。 */
export interface MicroQuizOption {
  text: string;
  correct: boolean;
  explain: string;
}

/** 微自测三类：认出它 / 怎么防 / 易错点。 */
export type MicroQuizKind = 'identify' | 'protect' | 'mistake';

/** 一道微自测题。 */
export interface MicroQuiz {
  kind: MicroQuizKind;
  material: string;
  question: string;
  options: [MicroQuizOption, MicroQuizOption, MicroQuizOption, MicroQuizOption];
}

/** 站外真实案例参考；不挂本站三态标签（外部资料）。 */
export interface RealCaseRef {
  refId: string;
  summary: string;
  lesson: string;
  source: string;
  credibility: '权威' | '平台' | '社区';
}

/** 形态 B 第 2 层：案例演示（静态文字，演示样例）。 */
export interface CaseDemo {
  material: string;
  language?: 'c' | 'python' | 'bash' | 'plaintext';
  note?: string;
  /** source 固定 'demo'，不设联合类型，避免与三态混淆。 */
  source: 'demo';
}

/** 形态 B 第 3 层：指导模式（静态文字，默认展开可折叠）。 */
export interface Guide {
  why: string;
  how: string;
}

/** 第二期闯关模板预留；批 0 只作写作占位，不实现。 */
export type TemplateId = 'TPL-INJECT' | 'TPL-AUTHZ' | 'TPL-FILE' | 'TPL-CHAIN' | 'TPL-CLIENT';

/** 漏洞卡公共字段。 */
export interface LearningEntryBase {
  id: string;
  kind: 'vuln';
  chapter: number;
  title: string;
  hazard?: HazardStar;
  difficulty: LibraryDifficulty;
  scene: LibraryScene[];
  aliases?: string[];
  oneLiner: string;
  cause: string;
  where: string;
  kinds?: { name: string; plain: string; signal: string }[];
  signals: string[];
  impact: string;
  verify: string[];
  protect: { root: string; harden: string; fallback: string };
  mistakes: string[];
  /** glossary id（详情页「本案例术语」行）。 */
  terms: string[];
  /** 高频词的术语网（与 GlossEntry.related 呼应）。 */
  relatedTerms?: string[];
  pinyin: PinyinIndex;
  /** 相关漏洞 id 或方法论卡 id（如 m01-three-laws）。 */
  related: string[];
  realCases?: RealCaseRef[];
  source: 'demo';
}

/** 形态 A：低难度 —— 8 段知识卡 + 固定 3 题（批 0 完整交付）。 */
export interface CardEntry extends LearningEntryBase {
  format: 'card';
  difficulty: 'beginner';
  quiz: [MicroQuiz, MicroQuiz, MicroQuiz];
}

/** 形态 B：中/高难度 —— 8 段 + caseDemo + guide；stages 第二期补。 */
export interface InteractiveEntry extends LearningEntryBase {
  format: 'interactive';
  difficulty: 'intermediate' | 'advanced';
  caseDemo: CaseDemo;
  guide: Guide;
  guideDefaultOn: true;
  /** 第二期补；批 0 固定空数组或缺省。 */
  stages?: [];
  /** 写作时预留，第二期套模板。 */
  templateId?: TemplateId;
}

export type LearningEntry = CardEntry | InteractiveEntry;

/** 方法论卡（无 hazard、可互链）。 */
export interface MethodCard {
  kind: 'method';
  id: string;
  code: string;
  title: string;
  theme: string;
  difficulty?: 'beginner' | 'intermediate';
  oneLiner: string;
  /** 正文章节（支持后续拆 sections）。 */
  body: string;
  terms: string[];
  pinyin: PinyinIndex;
  related: string[];
  source: 'demo';
  /** M08 顶部固定标注；批 0 的 M01 也带一条统一口径。 */
  nonMandatoryNote?: string;
}

export type LibraryItem = LearningEntry | MethodCard;

/**
 * 轻量列表项（LIBRARY_LIST 元素）。首页只加载它，不含 8 段正文。
 * 搜索函数只依赖此结构。
 */
export interface LibraryListItem {
  id: string;
  title: string;
  kind: 'vuln' | 'method';
  chapter: number;
  difficulty?: LibraryDifficulty;
  scene?: LibraryScene[];
  hazard?: HazardStar;
  aliases: string[];
  signals: string[];
  pinyin: PinyinIndex;
  oneLiner: string;
  format?: 'card' | 'interactive';
}
