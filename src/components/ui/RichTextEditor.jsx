import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Link2, RemoveFormatting } from 'lucide-react';

export default function RichTextEditor({ label, value, onChange, placeholder }) {
  const editorRef = useRef(null);

  // Sync external value changes (only if editor is empty or on mount to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Prevent resetting while typing
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const ToolbarButton = ({ icon: Icon, onClick, title }) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600/50 rounded-lg transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <div className="bg-dark-900/50 rounded-xl overflow-hidden border border-dark-600/30 focus-within:border-brand-500/50 transition-colors flex flex-col">
        {/* Toolbar PT-BR */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-dark-600/30 bg-dark-800/30">
          <ToolbarButton icon={Bold} title="Negrito" onClick={() => exec('bold')} />
          <ToolbarButton icon={Italic} title="Itálico" onClick={() => exec('italic')} />
          <ToolbarButton icon={Underline} title="Sublinhado" onClick={() => exec('underline')} />
          
          <div className="w-px h-5 bg-dark-600/50 mx-1" />
          
          <ToolbarButton icon={Heading1} title="Título Grande" onClick={() => exec('formatBlock', 'H1')} />
          <ToolbarButton icon={Heading2} title="Título Médio" onClick={() => exec('formatBlock', 'H2')} />
          
          <div className="w-px h-5 bg-dark-600/50 mx-1" />
          
          <ToolbarButton icon={List} title="Lista com Marcadores" onClick={() => exec('insertUnorderedList')} />
          <ToolbarButton icon={ListOrdered} title="Lista Numerada" onClick={() => exec('insertOrderedList')} />
          
          <div className="w-px h-5 bg-dark-600/50 mx-1" />
          
          <ToolbarButton 
            icon={Link2} 
            title="Inserir Link" 
            onClick={() => {
              const url = prompt('Digite a URL do link:');
              if (url) exec('createLink', url);
            }} 
          />
          <ToolbarButton icon={RemoveFormatting} title="Limpar Formatação" onClick={() => exec('removeFormat')} />
        </div>

        {/* Content Editable Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="prose-editor p-4 min-h-[200px] text-gray-200 outline-none max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600"
          data-placeholder={placeholder || "Escreva a descrição aqui..."}
        />
      </div>
      <p className="text-xs text-gray-500">
        Dica: Você pode usar as teclas de atalho (Ex: Ctrl+B para negrito) ou simplesmente quebrar linha apertando Enter.
      </p>

      <style>{`
        /* Melhorar estilos do editor gerado */
        .prose-editor h1 { font-size: 1.5rem !important; font-weight: bold !important; margin-bottom: 1rem !important; color: white !important; }
        .prose-editor h2 { font-size: 1.25rem !important; font-weight: 600 !important; margin-bottom: 0.75rem !important; color: white !important; }
        .prose-editor ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .prose-editor ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
        .prose-editor a { color: #3b82f6 !important; text-decoration: underline !important; }
        .prose-editor p { margin-bottom: 0.75rem !important; }
      `}</style>
    </div>
  );
}
