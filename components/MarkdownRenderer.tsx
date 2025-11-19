import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const renderLine = (line: string, index: number) => {
    // Skip empty lines
    if (!line.trim()) {
      return <br key={index} />;
    }

    // Headers (## Header or ### Header)
    if (line.match(/^###\s+/)) {
      const content = line.replace(/^###\s+/, '');
      return <h3 key={index} className="font-bold text-lg mt-4 mb-2 text-slate-900">{content}</h3>;
    }
    if (line.match(/^##\s+/)) {
      const content = line.replace(/^##\s+/, '');
      return <h2 key={index} className="font-bold text-xl mt-5 mb-3 text-slate-900">{content}</h2>;
    }
    if (line.match(/^#\s+/)) {
      const content = line.replace(/^#\s+/, '');
      return <h1 key={index} className="font-bold text-2xl mt-6 mb-4 text-slate-900">{content}</h1>;
    }

    // Bold text (**text** or __text__)
    const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
    if (boldRegex.test(line)) {
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let match;
      boldRegex.lastIndex = 0;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        const boldText = match[1] || match[2];
        parts.push(<strong key={`bold-${match.index}`} className="font-semibold">{boldText}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      return <p key={index} className="mb-2 leading-relaxed">{parts}</p>;
    }

    // Numbered lists (1. item)
    if (line.match(/^\d+\.\s+/)) {
      const content = line.replace(/^\d+\.\s+/, '');
      return (
        <li key={index} className="ml-4 mb-2 list-decimal">
          {content.split(/\*\*([^*]+)\*\*/g).map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
          )}
        </li>
      );
    }

    // Bullet points (- item or * item)
    if (line.match(/^[-*]\s+/)) {
      const content = line.replace(/^[-*]\s+/, '');
      return (
        <li key={index} className="ml-4 mb-2 list-disc">
          {content.split(/\*\*([^*]+)\*\*/g).map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
          )}
        </li>
      );
    }

    // Regular paragraph with inline formatting
    const formattedLine = line.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return <p key={index} className="mb-2 leading-relaxed">{formattedLine}</p>;
  };

  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: JSX.Element[] = [];

  lines.forEach((line, index) => {
    const isListItem = line.match(/^(\d+\.|[-*])\s+/);
    
    if (isListItem) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(renderLine(line, index));
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="my-3 space-y-1">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      elements.push(renderLine(line, index));
    }
  });

  // Close any remaining list
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key={`list-end`} className="my-3 space-y-1">
        {listItems}
      </ul>
    );
  }

  return <div className="markdown-content">{elements}</div>;
};

