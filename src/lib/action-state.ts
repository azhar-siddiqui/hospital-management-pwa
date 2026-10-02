export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const idleState: ActionState = { ok: false };
