import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, CreditCard, Palette, Search, Mail, Image, Plug, Shield, Zap, Save, ChevronRight } from 'lucide-react';
import { Button, Input, Textarea, Select, Toggle, Card, CardHeader, CardContent, Divider, Tabs } from '@/components/ui';

const sections = [
  { id: 'store', label: 'Loja', icon: Store },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'emails', label: 'E-mails', icon: Mail },
  { id: 'delivery', label: 'Entrega', icon: Zap },
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'security', label: 'Segurança', icon: Shield },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('store');

  const SectionContent = () => {
    switch (activeSection) {
      case 'store': return (
        <div className="space-y-6">
          <Input label="Nome da Loja" placeholder="NexMarket" defaultValue="NexMarket Pro" />
          <Textarea label="Descrição da Loja" placeholder="Descrição que aparece no site..." rows={3} defaultValue="Sua loja de produtos digitais favorita." />
          <Input label="URL do Logo" placeholder="https://exemplo.com/logo.png" />
          <Input label="E-mail de Contato" type="email" placeholder="contato@nexmarket.com" />
          <Divider />
          <Toggle label="Loja em modo manutenção" enabled={false} onChange={() => {}} />
          <Toggle label="Permitir cadastro de novos usuários" enabled={true} onChange={() => {}} />
        </div>
      );
      case 'payments': return (
        <div className="space-y-6">
          <Card><CardContent className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-green-400" /> PIX</h3>
            <Toggle label="Habilitar PIX" enabled={true} onChange={() => {}} />
            <Input label="Chave PIX" placeholder="sua-chave-pix" />
          </CardContent></Card>
          <Card><CardContent className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-400" /> Cartão de Crédito</h3>
            <Toggle label="Habilitar Cartão" enabled={true} onChange={() => {}} />
            <Input label="Public Key (Gateway)" placeholder="pk_test_..." />
            <Input label="Secret Key (Gateway)" type="password" placeholder="sk_test_..." />
          </CardContent></Card>
          <Card><CardContent className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">Boleto</h3>
            <Toggle label="Habilitar Boleto" enabled={false} onChange={() => {}} />
          </CardContent></Card>
        </div>
      );
      case 'appearance': return (
        <div className="space-y-6">
          <Select label="Tema" options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
          <Input label="Cor Primária" placeholder="#3B82F6" />
          <Input label="URL do Banner Principal" placeholder="https://exemplo.com/banner.jpg" />
          <Input label="URL do Favicon" placeholder="https://exemplo.com/favicon.ico" />
          <Textarea label="CSS Personalizado" placeholder="/* Seu CSS aqui */" rows={6} />
        </div>
      );
      case 'seo': return (
        <div className="space-y-6">
          <Input label="Título do Site" placeholder="NexMarket - Produtos Digitais" />
          <Textarea label="Meta Description" placeholder="Descrição para mecanismos de busca..." rows={2} />
          <Input label="Keywords" placeholder="produtos digitais, contas, streaming" />
          <Input label="URL do Sitemap" placeholder="/sitemap.xml" />
          <Divider />
          <Toggle label="Ativar Open Graph tags" enabled={true} onChange={() => {}} />
          <Toggle label="Ativar schema markup" enabled={true} onChange={() => {}} />
        </div>
      );
      case 'emails': return (
        <div className="space-y-6">
          <Input label="SMTP Host" placeholder="smtp.exemplo.com" />
          <Input label="SMTP Port" type="number" placeholder="587" />
          <Input label="SMTP Usuário" placeholder="email@exemplo.com" />
          <Input label="SMTP Senha" type="password" placeholder="••••••••" />
          <Divider />
          <Toggle label="E-mail de confirmação de compra" enabled={true} onChange={() => {}} />
          <Toggle label="E-mail de entrega de produto" enabled={true} onChange={() => {}} />
          <Toggle label="E-mail de boas-vindas" enabled={true} onChange={() => {}} />
        </div>
      );
      case 'delivery': return (
        <div className="space-y-6">
          <Toggle label="Entrega automática habilitada" enabled={true} onChange={() => {}} />
          <Toggle label="Entrega imediata (chave na tela)" enabled={true} onChange={() => {}} />
          <Input label="Tempo máximo de entrega (segundos)" type="number" placeholder="30" />
          <Divider />
          <Toggle label="Enviar credenciais por e-mail" enabled={true} onChange={() => {}} />
          <Toggle label="Mostrar credenciais no painel" enabled={true} onChange={() => {}} />
        </div>
      );
      case 'integrations': return (
        <div className="space-y-4">
          <Card><CardContent className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-white">Discord Webhook</p><p className="text-xs text-gray-500">Notificações de vendas no Discord</p></div>
            <Toggle enabled={false} onChange={() => {}} />
          </CardContent></Card>
          <Card><CardContent className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-white">Telegram Bot</p><p className="text-xs text-gray-500">Notificações via Telegram</p></div>
            <Toggle enabled={false} onChange={() => {}} />
          </CardContent></Card>
          <Card><CardContent className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-white">Google Analytics</p><p className="text-xs text-gray-500">Rastreamento de visitas</p></div>
            <Toggle enabled={false} onChange={() => {}} />
          </CardContent></Card>
        </div>
      );
      case 'security': return (
        <div className="space-y-6">
          <Toggle label="2FA para admin" enabled={false} onChange={() => {}} />
          <Toggle label="Rate limiting" enabled={true} onChange={() => {}} />
          <Input label="Máximo de tentativas de login" type="number" placeholder="5" />
          <Input label="Tempo de bloqueio (minutos)" type="number" placeholder="30" />
          <Divider />
          <Toggle label="Proteção contra bots" enabled={true} onChange={() => {}} />
          <Toggle label="Log de atividades" enabled={true} onChange={() => {}} />
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie todas as configurações da plataforma</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-0.5">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === s.id ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/30'}`}>
                  <s.icon className="w-4 h-4" /> {s.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                {React.createElement(sections.find(s => s.id === activeSection)?.icon || Store, { className: 'w-5 h-5 text-brand-400' })}
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
            </CardHeader>
            <CardContent>
              <SectionContent />
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Cancelar</Button>
              <Button icon={<Save className="w-4 h-4" />}>Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
