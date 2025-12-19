'use client';

import { usePromptEditor } from './hooks/usePromptEditor';
import { Panel, MarkdownEditor } from '@/components';

export function PromptEditor() {
  const {
    content,
    promptName,
    promptId,
    isExecuting,
    onChange,
    onNameChange,
  } = usePromptEditor();

  return (
    <Panel
      title={promptName}
      titlePlaceholder="Prompt"
      onTitleChange={onNameChange}
      className="h-full flex flex-col"
      contentClassName="flex-1 flex flex-col overflow-hidden p-0"
    >
      {/* Key forces re-mount when prompt changes, ensuring editor state resets */}
      <MarkdownEditor
        key={promptId}
        value={content}
        onChange={onChange}
        placeholder="Write your prompt here... (Cmd+Enter to run)"
        disabled={isExecuting}
        className="flex-1"
        minHeight="100%"
        borderless
      />
    </Panel>
  );
}
