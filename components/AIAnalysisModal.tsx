import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, transactions }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
        // Prepara os dados para o Gemini
        const recentTransactions = transactions.slice(0, 50).map(t => 
            `${t.date}: ${t.type} - ${t.description} (R$ ${t.amount})`
        ).join('\n');

        const prompt = `
        Você é um consultor financeiro experiente para associações sem fins lucrativos.
        Analise as seguintes transações recentes:
        ${recentTransactions}

        Por favor, forneça:
        1. Um resumo da saúde financeira atual.
        2. Identificação de padrões de gastos ou receitas atípicas.
        3. Três sugestões práticas para melhorar o fluxo de caixa.
        
        Responda em formato HTML simples (usando tags <p>, <ul>, <li>, <strong>) para ser renderizado dentro de uma div.
        `;

        // INICIALIZAÇÃO CORRETA DO GEMINI USANDO process.env.API_KEY
        // A chave API deve estar configurada no ambiente (ex: .env)
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setAnalysis(response.text || 'Não foi possível gerar a análise.');
    } catch (error) {
        console.error("Gemini Error:", error);
        setAnalysis('<p class="text-red-500">Erro ao conectar com a IA. Verifique se a chave API está configurada no ambiente ou tente novamente mais tarde.</p>');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-yellow-300" /> Consultor IA Financeiro
            </h2>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {!analysis && !loading && (
                <div className="text-center py-10">
                    <Sparkles size={64} className="mx-auto text-purple-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Clique abaixo para que nossa Inteligência Artificial analise suas últimas 50 transações e gere insights estratégicos.
                    </p>
                    <button 
                        onClick={runAnalysis}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg transition-transform transform hover:scale-105 flex items-center mx-auto gap-2"
                    >
                        <Sparkles size={20} /> Gerar Análise Inteligente
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
                    <p className="text-gray-500 animate-pulse">Analisando dados financeiros...</p>
                </div>
            )}

            {analysis && (
                <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: analysis }} />
                </div>
            )}
        </div>
        
        {analysis && (
             <div className="p-4 border-t dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                <button onClick={() => setAnalysis('')} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mr-4">Nova Análise</button>
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Fechar</button>
            </div>
        )}
      </div>
    </div>
  );
};