// Type declarations for retrostrap, kept as source not compiler output: the API is small enough
// that a compiler would be more trouble than these forty lines.

export interface AuditViolation {
  rule: string;
  selector: string;
  value: string;
  hint: string;
}

export interface AuditReport {
  ok: boolean;
  violations: AuditViolation[];
  stats: { checked: number; violations: number; [k: string]: unknown };
  /** Present only in paint mode (`audit({ paint: true })`): wipes the red outlines. */
  clear?: () => void;
}

export interface WidgetHandle {
  id: string;
  el: Element;
  options: Record<string, unknown>;
  pause?: () => void;
  resume?: () => void;
  destroy: () => void;
}

export interface WidgetContext {
  options: Record<string, unknown>;
  reducedMotion: boolean;
  pointerCoarse: boolean;
  budget: { claim(want: number): number; grant(): number; release(): void };
  ticker: { add(cb: (dt: number) => void): () => void };
  emit(type: string, detail?: unknown): boolean;
  announce(text: string): void;
  log(message: string): void;
}

export interface WidgetDefinition {
  id: string;
  motion?: 'decorative' | 'informative';
  pointer?: 'fine' | 'any';
  factory(el: Element, options: Record<string, unknown>, ctx: WidgetContext): Partial<WidgetHandle> | void;
}

export interface RetrostrapAPI {
  readonly version: string;
  init(root?: ParentNode): void;
  destroy(root?: ParentNode): void;
  on(type: string, handler: (e: CustomEvent) => void): () => void;
  emit(el: Element, type: string, detail?: unknown): boolean;
  ui(el: Element, name?: string): WidgetHandle | WidgetHandle[] | undefined;
  audit(opts?: { root?: ParentNode; budgets?: boolean; paint?: boolean }): AuditReport;
  config(next?: Record<string, unknown>): Record<string, unknown>;
  announce(text: string): void;
  theme: { get(): string; set(name: string): string };
  dialog: { alert(msg: string, opts?: object): Promise<void>; confirm(msg: string, opts?: object): Promise<boolean> };
  motion: { allowed(): boolean; reduced(): boolean; onChange(cb: (reduced: boolean) => void): () => void };
  budget: { status(): { particles: number; cap: number; degraded: boolean; level: number; frameMs: number } };
  widget: {
    register(def: WidgetDefinition): void;
    init(id: string, el: Element, options?: Record<string, unknown>): WidgetHandle | null;
    get(el: Element, id?: string): WidgetHandle | WidgetHandle[] | undefined;
    list(): string[];
  };
  enhancers(): string[];
  konami?: { on(seq: string, fn: () => void): () => void; trigger(): void; code: string };
}

export const Retrostrap: RetrostrapAPI;
export default Retrostrap;

declare global {
  interface Window {
    Retrostrap: RetrostrapAPI;
    RS: RetrostrapAPI;
  }
}
