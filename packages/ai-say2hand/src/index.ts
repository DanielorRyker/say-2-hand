export interface AIClientOptions {
  provider?: string;
  apiKey?: string;
}

export class AIClient {
  private provider: string;
  private apiKey?: string;

  constructor(opts: AIClientOptions = {}) {
    this.provider = opts.provider || process.env.AI_PROVIDER || 'none';
    this.apiKey = opts.apiKey || process.env.AI_API_KEY;
  }

  async generateText(prompt: string): Promise<string> {
    // Simple provider switch. Add more providers here.
    if (this.provider === 'openai') {
      if (!this.apiKey) throw new Error('AI API key missing for OpenAI provider');
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`AI provider error: ${resp.status} ${txt}`);
      }

      const json = await resp.json();
      // Handle ChatCompletion and older Completion shapes
      const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
      return content ?? '';
    }

    // Fallback: return a simple echo (useful for local/dev without a key)
    return `ECHO: ${prompt}`;
  }
}
