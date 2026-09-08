export interface AIModelOption {
  id: string;
  name: string;
  badge: string;
  description?: string;
}

export const GEMINI_MODELS: AIModelOption[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    badge: "Recommended · Fast",
    description: "Best balance of reasoning speed and high-quality MCQ generation",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    badge: "High Reasoning",
    description: "Top-tier analytical capability for complex, multi-concept questions",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    badge: "Ultra Fast",
    description: "Next-gen low latency model for instant prompt responses",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    badge: "Lightweight",
    description: "Resource-efficient model optimized for high throughput",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    badge: "Standard Flash",
    description: "Reliable, general-purpose fast generation",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    badge: "Deep Context",
    description: "Large context window for extensive syllabus-based prompts",
  },
];

export const OPENAI_MODELS: AIModelOption[] = [
  { id: "gpt-4o", name: "GPT-4o", badge: "Flagship", description: "High-intelligence flagship model" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", badge: "Fast", description: "Efficient and smart small model" },
  { id: "o3-mini", name: "o3-mini", badge: "Reasoning", description: "Advanced STEM reasoning model" },
];

export const ANTHROPIC_MODELS: AIModelOption[] = [
  { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", badge: "Top Intelligence", description: "State-of-the-art coding & assessment intelligence" },
  { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", badge: "Fast", description: "Rapid, responsive generation" },
];

export const PROVIDER_MODELS_MAP: Record<string, AIModelOption[]> = {
  GEMINI: GEMINI_MODELS,
  OPENAI: OPENAI_MODELS,
  ANTHROPIC: ANTHROPIC_MODELS,
};

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

