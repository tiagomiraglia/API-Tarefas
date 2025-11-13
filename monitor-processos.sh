#!/bin/bash

echo "🔍 Monitorando processos do WhatsApp..."
echo "========================================"

# Mostrar processos do Node.js
echo "📊 Processos Node.js:"
ps aux | grep -E "(node|ts-node)" | grep -v grep | head -10

echo ""
echo "🖥️ Processos Chrome/Puppeteer:"
ps aux | grep -E "(chrome|puppeteer)" | grep -v grep | head -10

echo ""
echo "💾 Uso de memória:"
free -h

echo ""
echo "🔥 Top processos por CPU:"
ps aux --sort=-%cpu | head -10

echo ""
echo "💾 Top processos por memória:"
ps aux --sort=-%mem | head -10

echo ""
echo "💡 Dicas para otimizar:"
echo "1. Feche sessões WhatsApp não utilizadas"
echo "2. Reinicie o servidor periodicamente"
echo "3. Monitore o uso de memória"
echo "4. Considere usar menos sessões simultâneas"