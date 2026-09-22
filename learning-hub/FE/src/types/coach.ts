export interface CoachChatPayload {
  userId: string;
  exerciseSlug: string;
  message: string;
}

export interface CoachChatResponse {
  exerciseSlug: string;
  reply: string;
  policy: {
    allowFullSolution: boolean;
    maxHintLevelUnlocked: number;
    blocked: boolean;
    reason?: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    maxPromptTokens: number;
    maxCompletionTokens: number;
  };
}

export interface CoachHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
  policyBlocked: boolean;
  policyReason?: string;
  createdAt: string;
}

export interface CoachHistoryResponse {
  userId: string;
  exerciseSlug: string;
  totalMessages: number;
  history: CoachHistoryMessage[];
}
