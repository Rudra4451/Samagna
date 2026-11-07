/**
 * src/lib/assistant/provider/index.ts
 * 
 * Maitriyam v0: Model Provider Layer.
 * 
 * Invariants:
 * 1. DisabledProvider is the ONLY active provider in v0 until formal owner approval
 *    under Section 9.1 is recorded in `docs/maitriyam/decisions.md`.
 * 2. Fail-closed architecture.
 * 3. Never transmits raw collector PII to any model.
 */

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelRequest {
  messages: ModelMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  content: string;
  tokensIn?: number;
  tokensOut?: number;
}

export interface ModelProvider {
  id: string;
  isEnabled(): boolean;
  complete(request: ModelRequest): Promise<ModelResponse>;
}

export class DisabledProvider implements ModelProvider {
  id = 'disabled';

  isEnabled(): boolean {
    return false;
  }

  async complete(_request: ModelRequest): Promise<ModelResponse> {
    throw new Error('Maitriyam v0 operates strictly in deterministic L0/L1/L3 mode (DisabledProvider active).');
  }
}

let activeProviderInstance: ModelProvider = new DisabledProvider();

export function getActiveModelProvider(): ModelProvider {
  return activeProviderInstance;
}
