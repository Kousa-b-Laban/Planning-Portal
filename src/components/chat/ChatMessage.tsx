'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
