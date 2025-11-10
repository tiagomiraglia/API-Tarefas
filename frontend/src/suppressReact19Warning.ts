// Intercepta o warning específico do React 19 sobre element.ref
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  const message = args.join(' ');
  
  // Suprimir warnings específicos do React 19
  if (message.includes('Accessing element.ref was removed in React 19') || 
      message.includes('ref is now a regular prop') ||
      message.includes('client.ref was removed')) {
    return; // Não exibir estes warnings específicos
  }
  
  // Exibir outros warnings normalmente
  originalConsoleWarn(...args);
};

console.error = (...args) => {
  const message = args.join(' ');
  
  // Suprimir erros específicos do React 19
  if (message.includes('Accessing element.ref was removed in React 19') || 
      message.includes('ref is now a regular prop') ||
      message.includes('client.ref was removed')) {
    return; // Não exibir estes erros específicos
  }
  
  // Exibir outros erros normalmente
  originalConsoleError(...args);
};

export {};
