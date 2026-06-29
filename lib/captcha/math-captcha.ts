import { signToken, verifyToken } from '@/lib/auth/token';

export type MathOp = '+' | '-' | '*' | '/';

const OP_SYMBOLS: Record<MathOp, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷'
};

type CaptchaPayload = {
  type: 'math-captcha';
  answer: number;
  exp: number;
};

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function buildMathQuestion() {
  const ops: MathOp[] = ['+', '-', '*', '/'];
  const op = ops[rand(0, ops.length - 1)]!;
  let a = 0;
  let b = 0;
  let answer = 0;

  switch (op) {
    case '+':
      a = rand(2, 20);
      b = rand(2, 20);
      answer = a + b;
      break;
    case '-':
      a = rand(5, 25);
      b = rand(1, a);
      answer = a - b;
      break;
    case '*':
      a = rand(2, 12);
      b = rand(2, 12);
      answer = a * b;
      break;
    case '/':
      b = rand(2, 12);
      answer = rand(2, 12);
      a = b * answer;
      break;
  }

  return {
    a,
    b,
    op,
    opSymbol: OP_SYMBOLS[op],
    answer,
    question: `${a} ${OP_SYMBOLS[op]} ${b}`
  };
}

export async function createMathCaptchaChallenge() {
  const q = buildMathQuestion();
  const token = await signToken({
    type: 'math-captcha',
    answer: q.answer,
    exp: Date.now() + 5 * 60 * 1000
  });
  return {
    token,
    question: q.question
  };
}

export async function verifyMathCaptchaAnswer(token: string, rawAnswer: unknown) {
  if (!token || rawAnswer === undefined || rawAnswer === null || rawAnswer === '') {
    return { ok: false as const, error: 'کپچا الزامی است' };
  }

  const answer = Number(String(rawAnswer).trim().replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
  if (!Number.isFinite(answer)) {
    return { ok: false as const, error: 'پاسخ کپچا باید عدد باشد' };
  }

  const payload = await verifyToken<CaptchaPayload>(token);
  if (!payload || payload.type !== 'math-captcha') {
    return { ok: false as const, error: 'کپچا نامعتبر یا منقضی شده است' };
  }
  if (payload.exp < Date.now()) {
    return { ok: false as const, error: 'کپچا منقضی شده — دوباره تلاش کنید' };
  }
  if (answer !== payload.answer) {
    return { ok: false as const, error: 'پاسخ کپچا اشتباه است' };
  }

  return { ok: true as const };
}
