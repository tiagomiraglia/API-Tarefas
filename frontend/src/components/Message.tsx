import React from 'react';

interface MessageProps {
  from: 'user' | 'operator' | 'ia';
  content: string;
}

const Message: React.FC<MessageProps> = ({ from, content }) => {
  return (
    <div style={{
      textAlign: from === 'user' ? 'left' : 'right',
      margin: '8px 0',
      color: from === 'ia' ? '#007bff' : '#222',
      fontStyle: from === 'ia' ? 'italic' : 'normal',
    }}>
      <span><b>{from}:</b> {content}</span>
    </div>
  );
};

export default Message;
