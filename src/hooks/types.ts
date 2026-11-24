export type StateUpdate<T> = T | ((previousValue: T) => T);
export type StateSetter<T> = (nextValue: StateUpdate<T>) => void;

export type EffectCleanup = () => void;
export type Effect = () => void | EffectCleanup;

export type StateSlot = { kind: "state"; value: unknown };

export type EffectSlot = {
  kind: "effect";
  dependencies: readonly unknown[] | undefined;
  effect: Effect;
  cleanup?: EffectCleanup;
  active: boolean;
};

export type HookSlot = StateSlot | EffectSlot | RefSlot;

export type Hooks = {
  useState: <T>(initialValue: T) => [T, StateSetter<T>];
  useEffect: (effect: Effect, dependencies?: readonly unknown[]) => void;
  useRef: <T>(initialValue: T) => RefObject<T>;
};

export type Render = () => Node;

export interface HookContext {
  nextStateSlot(initialValue: unknown): StateSlot;
  nextEffectSlot(create: () => EffectSlot): EffectSlot;
  nextRefSlot(initialValue: unknown): RefSlot;
  isConnected(): boolean;
  requestUpdate(): void;
  enqueueEffect(slot: EffectSlot): void;
}

export type RefObject<T> = {
  current: T;
};

export type RefSlot = {
  kind: "ref";
  value: RefObject<unknown>;
};
