export type Delivery = "vaginal" | "cesarean" | "assisted";

export type Feeding =
  | "nursing"
  | "pumping"
  | "combination"
  | "formula"
  | "weaning";

export type Phase = "rest" | "reconnect" | "rebuild" | "return";

export type Bleeding = "none" | "spotting" | "light" | "moderate" | "heavy";

export type PainArea =
  | "low-back"
  | "pelvis"
  | "hips"
  | "abdomen"
  | "incision"
  | "perineum"
  | "neck"
  | "wrists"
  | "head";

export type Minutes = 10 | 20 | 30;

export type Profile = {
  name: string;
  babyName: string;
  birthDate: string;
  delivery: Delivery;
  feeding: Feeding;
  cleared: boolean;
  concerns: PainArea[];
  intention: string;
  unit: "lb" | "kg";
  partnerNote: string;
};

export type CheckIn = {
  id: string;
  date: string;
  sleepHours: number;
  energy: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  pain: Partial<Record<PainArea, number>>;
  bleeding: Bleeding;
  pelvicHeaviness: boolean;
  fever: boolean;
  chestOrBreath: boolean;
  severeHeadache: boolean;
  legSwelling: boolean;
  incisionWorry: boolean;
  scaryThoughts: boolean;
  minutes: Minutes;
  note: string;
  createdAt: string;
};

export type WeightEntry = {
  date: string;
  value: number;
};

export type SessionReaction = "better" | "same" | "worse";

export type SessionLog = {
  date: string;
  movementId: string;
  reaction: SessionReaction;
};

export type WinId = "outside" | "meal" | "help" | "rest" | "lift";

export type FlagLevel = "now" | "today" | "soon";

export type RedFlag = {
  id: string;
  level: FlagLevel;
  title: string;
  detail: string;
};

export type Movement = {
  id: string;
  title: string;
  minutes: number;
  minPhase: Phase;
  minWeeks: number;
  minDays?: number;
  cesareanMinWeeks?: number;
  requiresCleared: boolean;
  okWhenUrgent: boolean;
  needsSteadyBleeding: boolean;
  loadsCore: boolean;
  avoidIfHeaviness: boolean;
  maxPain: Partial<Record<PainArea, number>>;
  helps: PainArea[];
  summary: string;
  steps: string[];
  stopIf: string[];
};

export type MealSlot = "breakfast" | "main" | "snack";

export type Meal = {
  id: string;
  title: string;
  slot: MealSlot;
  minutes: number;
  oneHand: boolean;
  summary: string;
  parts: string[];
  why: string;
};

export type Soothe = {
  id: string;
  area: PainArea | "general";
  title: string;
  minutes: number;
  steps: string[];
  why: string;
};

export type PlanSource = "model" | "rules";

export type DayPlan = {
  date: string;
  greeting: string;
  movementId: string;
  mealIds: string[];
  sootheIds: string[];
  restNote: string;
  whyToday: string;
  source: PlanSource;
  model: string | null;
  adjusted: boolean;
  modelError: string | null;
  flags: RedFlag[];
  phase: Phase;
  weeks: number;
  days: number;
};

export type Store = {
  profile: Profile | null;
  checkIns: CheckIn[];
  plans: Record<string, DayPlan>;
  weights: WeightEntry[];
  sessions: SessionLog[];
  wins: Record<string, WinId[]>;
  night: boolean;
  easeDown: boolean;
};
