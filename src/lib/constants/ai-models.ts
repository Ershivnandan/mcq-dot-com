export interface AIModelOption {
  id: string;
  name: string;
  badge: string;
  description?: string;
  freeRpm?: string;
  freeRpd?: string;
  freeTpm?: string;
  paidRpm?: string;
  contextWindow?: string;
  limitsSummary?: string;
  tier?: string;
}

export const GEMINI_MODELS: AIModelOption[] = [
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    badge: "Recommended · Latest",
    description: "Latest generation ultra-fast model with balanced reasoning and high accuracy",
    freeRpm: "15 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "1,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "15 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    badge: "Flagship Flash",
    description: "Next-gen hybrid reasoning and multimodal performance for complex tasks",
    freeRpm: "15 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "1,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "15 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    badge: "Ultra Fast · High Throughput",
    description: "Lowest-cost, highest-speed model for rapid batch MCQ generation",
    freeRpm: "30 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "2,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "30 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    badge: "Complex Reasoning",
    description: "Top-tier analytical capability for complex, multi-concept academic questions",
    freeRpm: "2 RPM",
    freeRpd: "50 RPD",
    freeTpm: "32,000 TPM",
    paidRpm: "360 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "2 RPM · 50/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    badge: "Cost Efficient",
    description: "Resource-efficient model optimized for rapid response generation",
    freeRpm: "30 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "2,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "30 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
];

export const OPENAI_MODELS: AIModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    badge: "Flagship",
    description: "High-intelligence flagship model",
    freeRpm: "3 RPM",
    freeRpd: "200 RPD",
    freeTpm: "40,000 TPM",
    paidRpm: "500 RPM",
    contextWindow: "128,000 tokens",
    limitsSummary: "Pay-As-You-Go",
    tier: "Usage-based tier",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    badge: "Fast",
    description: "Efficient and smart small model",
    freeRpm: "3 RPM",
    freeRpd: "200 RPD",
    freeTpm: "200,000 TPM",
    paidRpm: "1,000 RPM",
    contextWindow: "128,000 tokens",
    limitsSummary: "Cost Efficient",
    tier: "Usage-based tier",
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    badge: "Reasoning",
    description: "Advanced STEM reasoning model",
    freeRpm: "3 RPM",
    freeRpd: "100 RPD",
    freeTpm: "100,000 TPM",
    paidRpm: "500 RPM",
    contextWindow: "200,000 tokens",
    limitsSummary: "High Reasoning",
    tier: "Usage-based tier",
  },
];

export const ANTHROPIC_MODELS: AIModelOption[] = [
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    badge: "Top Intelligence",
    description: "State-of-the-art coding & assessment intelligence",
    freeRpm: "5 RPM",
    freeRpd: "100 RPD",
    freeTpm: "20,000 TPM",
    paidRpm: "50 RPM",
    contextWindow: "200,000 tokens",
    limitsSummary: "Tier 1: 50 RPM",
    tier: "Usage-based tier",
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    badge: "Fast",
    description: "Rapid, responsive generation",
    freeRpm: "5 RPM",
    freeRpd: "100 RPD",
    freeTpm: "50,000 TPM",
    paidRpm: "100 RPM",
    contextWindow: "200,000 tokens",
    limitsSummary: "Tier 1: 100 RPM",
    tier: "Usage-based tier",
  },
];

export const PROVIDER_MODELS_MAP: Record<string, AIModelOption[]> = {
  GEMINI: GEMINI_MODELS,
  OPENAI: OPENAI_MODELS,
  ANTHROPIC: ANTHROPIC_MODELS,
};

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
