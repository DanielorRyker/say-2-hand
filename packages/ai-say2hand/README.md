# @repo/ai-say2hand

Small AI client used by the monorepo. Provides a minimal TypeScript wrapper to call an AI provider.

Usage

1. Set environment variables (example):

   - AI_PROVIDER=openai
   - AI_API_KEY=sk-...

2. From a TypeScript/Node project in this monorepo:

```ts
import { AIClient } from '@repo/ai-say2hand';

const client = new AIClient();
const text = await client.generateText('Hello');
```

Notes

- This package intentionally stays small. Extend it to add provider-specific options, request streaming, or rate-limiting.
- Do not commit secrets. Use environment variables or a secrets manager.
