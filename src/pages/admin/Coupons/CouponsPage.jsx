import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Tag, Copy, Check, X } from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardContent, Modal, EmptyState, Input, Select, Toggle } from '@/components/ui';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: 'PROMO10', type: 'percent', value: 10, maxUses: 100, used: 23, status: 'ATIVO', minPurchase: 50 },
    { id: 2, code: 'WELCOME20', type: 'fixed', value: 20, maxUses: 50, used: 50, status: 'INATIVO', minPurchase: 0 },
  ]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ code: '', type: 'percent', value: 0, maxUses: 0, minPurchase: 0, status: 'ATIVO' });

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  const handleOpenModal = (coupon = null) => {
    if (coupon) { setEditing(coupon); setFormData(coupon); }
    else { setEditing(null); setFormData({ code: '', type: 'percent', value: 0, maxUses: 0, minPurchase: 0, status: 'ATIVO' }); }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editing) setCoupons(coupons.map(c => c.id === editing.id ? { ...c, ...formData } : c));
    else setCoupons([...coupons, { ...formData, id: Date.now(), used: 0 }]);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => { if (window.confirm('Excluir cupom?')) setCoupons(coupons.filter(c => c.id !== id)); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Cupons</h1>
          <p className="text-gray-400 mt-1">{coupons.length} cupons criados</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>Novo Cupom</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar cupons..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="divide-y divide-dark-600/20">
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-dark-700/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><Tag className="w-5 h-5 text-brand-400" /></div>
                    <div>
                      <p className="text-sm font-mono font-medium text-white">{c.code}</p>
                      <p className="text-xs text-gray-500">{c.type === 'percent' ? `${c.value}% desconto` : `R$ ${c.value.toFixed(2)} off`} · Min: R$ {c.minPurchase.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-gray-500">{c.used}/{c.maxUses} usos</p>
                      <div className="w-24 h-1.5 bg-dark-600/50 rounded-full mt-1"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${(c.used / c.maxUses) * 100}%` }} /></div>
                    </div>
                    <Badge variant={c.status === 'ATIVO' ? 'success' : 'danger'} size="xs">{c.status}</Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(c)} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-brand-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Tag className="w-12 h-12" />} title="Nenhum cupom encontrado" action={<Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>Criar Cupom</Button>} />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Cupom' : 'Novo Cupom'} size="md">
        <div className="p-6 space-y-4">
          <Input label="Código" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="PROMO10" />
          <Select label="Tipo de Desconto" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
            options={[{ value: 'percent', label: 'Percentual (%)' }, { value: 'fixed', label: 'Valor Fixo (R$)' }]} />
          <Input label="Valor do Desconto" type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })} />
          <Input label="Uso Mínimo (R$)" type="number" value={formData.minPurchase} onChange={e => setFormData({ ...formData, minPurchase: Number(e.target.value) })} />
          <Input label="Máximo de Usos" type="number" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: Number(e.target.value) })} />
          <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
            options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'INATIVO', label: 'Inativo' }]} />
        </div>
        <div className="px-6 py-4 border-t border-dark-600/30 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>
    </div>
  );
}
