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
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    badge: "Recommended · Fast",
    description: "Best balance of reasoning speed and high-quality MCQ generation",
    freeRpm: "15 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "1,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "15 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    badge: "High Reasoning",
    description: "Top-tier analytical capability for complex, multi-concept questions",
    freeRpm: "2 RPM",
    freeRpd: "50 RPD",
    freeTpm: "32,000 TPM",
    paidRpm: "360 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "2 RPM · 50/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    badge: "Ultra Fast",
    description: "Next-gen low latency model for instant prompt responses",
    freeRpm: "15 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "2,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "15 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    badge: "Lightweight",
    description: "Resource-efficient model optimized for high throughput",
    freeRpm: "30 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "2,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "30 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    badge: "Standard Flash",
    description: "Reliable, general-purpose fast generation",
    freeRpm: "15 RPM",
    freeRpd: "1,500 RPD",
    freeTpm: "1,000,000 TPM",
    paidRpm: "1,000 RPM",
    contextWindow: "1,048,576 tokens",
    limitsSummary: "15 RPM · 1,500/day",
    tier: "Free Tier Available",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    badge: "Deep Context",
    description: "Large context window for extensive syllabus-based prompts",
    freeRpm: "2 RPM",
    freeRpd: "50 RPD",
    freeTpm: "32,000 TPM",
    paidRpm: "360 RPM",
    contextWindow: "2,097,152 tokens",
    limitsSummary: "2 RPM · 50/day",
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

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
