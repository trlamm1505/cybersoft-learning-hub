/**
 * Coach Eval Harness v0.1 — runner.
 *
 * Chạy MỘT test case qua đúng các hàm production thật (không mock, không tự
 * bịa output kỳ vọng): StubLlmClient, checkCoachResponsePolicy,
 * assertContextHasNoForbiddenData, detectPromptInjection, analyzeDebugLoop.
 *
 * Đây là bản mô phỏng lại thứ tự bước của CoachService#chat mà KHÔNG cần
 * NestJS TestingModule/Mongoose — vì StubLlmClient không có side-effect DB,
 * ta gọi thẳng nó. Nếu sau này CoachService#chat đổi thứ tự bước thực sự
 * (ví dụ thêm một lớp chặn mới), file này cần cập nhật theo để harness không
 * false-negative.
 */

import { createHash } from 'crypto';
import { StubLlmClient } from '../coach-llm.client';
import {
  assertContextHasNoForbiddenData,
  checkCoachResponsePolicy,
} from '../coach-policy';
import {
  buildInjectionRefusalReply,
  detectPromptInjection,
} from '../coach-injection-guard';
import { analyzeDebugLoop } from '../coach-debug-loop';
// Import lại đúng nguyên văn SYSTEM_PROMPT từ CoachService, KHÔNG copy riêng
// một bản khác ở đây — nếu prompt đổi ở service mà quên đổi bản copy, harness
// sẽ âm thầm kiểm thử với prompt cũ mà không ai biết.
import { SYSTEM_PROMPT } from '../coach.service';
import { ChatEvalCase, DebugLoopEvalCase } from './eval-types';

const stubLlmClient = new StubLlmClient();

// Định danh "phiên bản" của lần chạy harness này, dùng để so sánh baseline
// report giữa các lần chạy — điều kiện nghiệm thu "chạy regression theo
// prompt/model version". promptHash đổi ngay khi SYSTEM_PROMPT đổi một ký tự;
// llmClientName đổi khi thay StubLlmClient bằng client gọi model thật.
export function getEvalRunVersion(): {
  promptHash: string;
  llmClientName: string;
} {
  const promptHash = createHash('sha256')
    .update(SYSTEM_PROMPT)
    .digest('hex')
    .slice(0, 12);
  return { promptHash, llmClientName: stubLlmClient.constructor.name };
}

export interface ChatRunOutcome {
  finalContent: string;
  blocked: boolean;
  blockedReason?: string;
  blockedByInjectionGuard: boolean;
  contextAssertionThrew: boolean;
  contextAssertionError?: string;
}

/**
 * Mô phỏng lại luồng thật của CoachService#chat (bỏ phần DB/logging), theo
 * đúng thứ tự: assertContextHasNoForbiddenData -> detectPromptInjection ->
 * llmClient.chat -> checkCoachResponsePolicy.
 */
export async function runChatCase(
  testCase: ChatEvalCase,
): Promise<ChatRunOutcome> {
  try {
    assertContextHasNoForbiddenData(testCase.context);
  } catch (err) {
    return {
      finalContent: '',
      blocked: true,
      blockedByInjectionGuard: false,
      contextAssertionThrew: true,
      contextAssertionError: (err as Error).message,
    };
  }

  const injectionCheck = detectPromptInjection(testCase.userMessage);
  if (injectionCheck.suspicious) {
    return {
      finalContent: buildInjectionRefusalReply(),
      blocked: true,
      blockedReason: `prompt_injection: ${injectionCheck.reason}`,
      blockedByInjectionGuard: true,
      contextAssertionThrew: false,
    };
  }

  const llmResult = await stubLlmClient.chat(
    SYSTEM_PROMPT,
    testCase.context,
    testCase.userMessage,
  );

  const policyCheck = checkCoachResponsePolicy(
    llmResult.content,
    testCase.context,
  );

  if (!policyCheck.allowed) {
    return {
      finalContent: policyCheck.sanitizedContent ?? llmResult.content,
      blocked: true,
      blockedReason: policyCheck.reason,
      blockedByInjectionGuard: false,
      contextAssertionThrew: false,
    };
  }

  return {
    finalContent: llmResult.content,
    blocked: false,
    blockedByInjectionGuard: false,
    contextAssertionThrew: false,
  };
}

export function runDebugLoopCase(testCase: DebugLoopEvalCase) {
  return analyzeDebugLoop(testCase.input, testCase.state);
}
