'use client';

import { useIntentPanel } from './hooks/useIntentPanel';
import { Panel, HelpSection } from '@/components';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';

export function IntentPanel() {
  const { content, onChange, subtitle, isViewingHistory } = useIntentPanel();

  return (
    <Panel
      title="Intent"
      subtitle={subtitle}
      collapsible
      defaultCollapsed={true}
    >
      <HelpSection title="What is Intent?">
        <div className="space-y-2">
          <p>
            <strong>What:</strong> Describe the high-level goal of your prompt - what you want it to achieve, not how.
          </p>
          <p>
            <strong>Why:</strong> Intent helps models understand the purpose behind your instructions. When outputs miss the mark, clarifying intent often fixes the problem without changing the prompt itself.
          </p>
          <p className="text-neutral-500 italic">
            Example: &quot;Generate friendly, concise customer support responses that resolve issues on first reply while maintaining brand voice.&quot;
          </p>
        </div>
      </HelpSection>
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder="Describe what you want this prompt to achieve..."
        minHeight="100px"
        borderless
        readOnly={isViewingHistory}
      />
    </Panel>
  );
}
