// Evaluate endpoint - grades model outputs against criteria
import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { getLanguageModel } from '@/lib/ai/providers';
import { z } from 'zod';
import { EVALUATION } from '@/config/constants';

const evaluateSchema = z.object({
  modelId: z.string().optional(), // Model to run evaluation (defaults to sonnet)
  apiKey: z.string().optional(), // Client-provided API key
  promptContent: z.string(), // Original prompt
  intent: z.string().optional(), // User's intent if available
  evaluationPrompt: z.string().optional(), // Custom evaluation criteria
  outputs: z.array(
    z.object({
      modelId: z.string(),
      modelName: z.string(),
      provider: z.string(),
      output: z.string(),
    })
  ),
});

function buildEvaluationSystemPrompt(
  promptContent: string,
  intent: string | undefined,
  evaluationPrompt: string | undefined,
  outputs: Array<{ modelId: string; modelName: string; provider: string; output: string }>
): string {
  // Build intent section
  const intentSection = intent?.trim()
    ? `## User's Intent
The user's stated intent for this prompt is:
"${intent}"

Evaluate how well each output achieves this intent.
`
    : `## No Explicit Intent
The user did not specify an explicit intent. Evaluate how well each output addresses the prompt's apparent goal.
`;

  // Build custom criteria section
  const customCriteriaSection = evaluationPrompt?.trim()
    ? `## Additional Evaluation Criteria
${evaluationPrompt}
`
    : '';

  // Build outputs section
  const outputsSection = outputs
    .map(
      (o, i) => `### Output ${i + 1}: ${o.modelName} (${o.provider})
Model ID: ${o.modelId}
\`\`\`
${o.output}
\`\`\``
    )
    .join('\n\n');

  return `You are an expert prompt evaluator. Your task is to objectively evaluate LLM outputs against specified criteria.

## Scoring Scale
Score each output from ${EVALUATION.SCALE_MIN} to ${EVALUATION.SCALE_MAX}:
- ${EVALUATION.SCALE_MAX}: Perfect - fully achieves the goal with excellence
- 80-${EVALUATION.SCALE_MAX - 1}: Very Good - achieves the goal with minor issues
- 60-79: Adequate - partially achieves the goal
- 40-59: Below Average - significant issues
- 20-39: Poor - mostly fails to achieve the goal
- ${EVALUATION.SCALE_MIN}-19: Failure - does not address the goal at all

## Original Prompt Being Evaluated
\`\`\`
${promptContent}
\`\`\`

${intentSection}
${customCriteriaSection}
## Outputs to Evaluate
${outputsSection}

## Your Task
Evaluate each output and provide:
1. A score from ${EVALUATION.SCALE_MIN} to ${EVALUATION.SCALE_MAX}
2. Clear reasoning for the score
3. Key strengths (what works well)
4. Key weaknesses (what could be improved)

## Response Format
You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.
\`\`\`json
{
  "evaluations": [
    {
      "modelId": "the-model-id",
      "score": 85,
      "reasoning": "Detailed explanation of why this score was given...",
      "strengths": ["First strength", "Second strength"],
      "weaknesses": ["First weakness"]
    }
  ]
}
\`\`\`

Evaluate each output in the order they appear above. Be objective, specific, and constructive.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = evaluateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { modelId, apiKey, promptContent, intent, evaluationPrompt, outputs } = parsed.data;

    if (outputs.length === 0) {
      return Response.json({ error: 'No outputs to evaluate' }, { status: 400 });
    }

    // Build the evaluation system prompt
    const systemPrompt = buildEvaluationSystemPrompt(
      promptContent,
      intent,
      evaluationPrompt,
      outputs
    );

    // Get the evaluator model
    const model = getLanguageModel(modelId || EVALUATION.DEFAULT_MODEL_ID, apiKey);

    // Generate the evaluation (non-streaming for JSON parsing)
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please evaluate the outputs now.' },
      ],
      temperature: 0.3, // Low temperature for consistent evaluations
      maxOutputTokens: 4096,
    });

    // Parse the JSON response
    const responseText = result.text;

    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonContent = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      // Try to find raw JSON
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = responseText.slice(jsonStartIndex, jsonEndIndex + 1);
      }
    }

    try {
      const evaluations = JSON.parse(jsonContent);
      return Response.json(evaluations);
    } catch {
      // If JSON parsing fails, return the raw response with an error indicator
      console.error('Failed to parse evaluation response:', responseText);
      return Response.json(
        {
          error: 'Failed to parse evaluation response',
          rawResponse: responseText
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
