'use client';

import { useGuardrailsPanel } from './hooks/useGuardrailsPanel';
import { Panel, HelpSection } from '@/components';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';

export function GuardrailsPanel() {
  const { content, onChange, subtitle, isViewingHistory } = useGuardrailsPanel();

  return (
    <Panel
      title="Guardrails"
      subtitle={subtitle}
      collapsible
      defaultCollapsed={true}
    >
      <HelpSection title="What are Guardrails?">
        <div className="space-y-2">
          <p>
            <strong>What:</strong> Define hard constraints and rules the model must follow - things it should always or never do.
          </p>
          <p>
            <strong>Why:</strong> Separating constraints from instructions makes prompts clearer. Guardrails are non-negotiable rules, while the prompt is the task.
          </p>
          <div className="mt-2 p-2 bg-white rounded border border-neutral-200 text-xs">
            <p className="font-medium text-neutral-600 mb-1">Example guardrails:</p>
            <ul className="list-disc list-inside text-neutral-500 space-y-0.5">
              <li>Never mention competitor products</li>
              <li>Keep responses under 200 words</li>
              <li>Always cite sources when making claims</li>
              <li>Never provide medical or legal advice</li>
            </ul>
          </div>
        </div>
      </HelpSection>
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder="Define rules and constraints the model must follow..."
        minHeight="100px"
        borderless
        readOnly={isViewingHistory}
      />
    </Panel>
  );
}
