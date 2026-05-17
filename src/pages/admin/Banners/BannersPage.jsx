import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Image, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardContent, Modal, EmptyState, Input, Select, Toggle } from '@/components/ui';
import { api } from '@/services/api';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: '', imageUrl: '', link: '', position: 'home-top', status: 'ATIVO', order: 1 });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await api.get('banners');
      data.sort((a, b) => a.order - b.order);
      setBanners(data);
    } catch (err) {
      console.error('Erro ao buscar banners:', err);
    }
  };

  const filtered = banners.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  const handleOpenModal = (banner = null) => {
    if (banner) { 
      setEditing(banner); 
      setFormData(banner); 
    } else { 
      setEditing(null); 
      setFormData({ title: '', imageUrl: '', link: '', position: 'home-top', status: 'ATIVO', order: banners.length + 1 }); 
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      let updated = [...banners];
      if (editing) {
        updated = updated.map(b => b.id === editing.id ? { ...b, ...formData } : b);
      } else {
        updated.push({ ...formData, id: Date.now() });
      }
      await api.save('banners', updated);
      await fetchBanners();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar banner:', err);
    }
  };

  const handleDelete = async (id) => { 
    if (window.confirm('Excluir banner?')) {
      try {
        const updated = banners.filter(b => b.id !== id);
        await api.save('banners', updated);
        await fetchBanners();
      } catch (err) {
        console.error('Erro ao deletar banner:', err);
      }
    }
  };

  const moveBanner = async (id, dir) => {
    const idx = banners.findIndex(b => b.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === banners.length - 1)) return;
    const updated = [...banners];
    [updated[idx], updated[idx + dir]] = [updated[idx + dir], updated[idx]];
    updated.forEach((b, i) => b.order = i + 1);
    try {
      await api.save('banners', updated);
      await fetchBanners();
    } catch (err) {
      console.error('Erro ao mover banner:', err);
    }
  };

  const positions = [{ value: 'home-top', label: 'Home - Topo' }, { value: 'home-mid', label: 'Home - Meio' }, { value: 'home-bottom', label: 'Home - Rodapé' }, { value: 'category', label: 'Página de Categoria' }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Banners</h1>
          <p className="text-gray-400 mt-1">{banners.length} banners configurados</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>Novo Banner</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar banners..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="divide-y divide-dark-600/20">
              {filtered.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-dark-700/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveBanner(b.id, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-dark-700/50 text-gray-600 hover:text-gray-300 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveBanner(b.id, 1)} disabled={i === filtered.length - 1} className="p-0.5 rounded hover:bg-dark-700/50 text-gray-600 hover:text-gray-300 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="w-20 h-10 rounded-lg bg-dark-800 border border-dark-600/30 overflow-hidden flex-shrink-0">
                      {b.imageUrl ? <img src={b.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-gray-600" /></div>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{b.title}</p>
                      <p className="text-xs text-gray-500">{positions.find(p => p.value === b.position)?.label || b.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={b.status === 'ATIVO' ? 'success' : 'danger'} size="xs">{b.status}</Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(b)} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-brand-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Image className="w-12 h-12" />} title="Nenhum banner encontrado" action={<Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>Criar Banner</Button>} />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Banner' : 'Novo Banner'} size="lg">
        <div className="p-6 space-y-4">
          <Input label="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Nome do banner" />
          <Input label="URL da Imagem" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://exemplo.com/banner.jpg" />
          {formData.imageUrl && <div className="rounded-xl overflow-hidden border border-dark-600/30"><img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover" /></div>}
          <Input label="Link de Destino" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} placeholder="/categoria/streaming" />
          <Select label="Posição" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} options={positions} />
          <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'INATIVO', label: 'Inativo' }]} />
        </div>
        <div className="px-6 py-4 border-t border-dark-600/30 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </Modal>
    </div>
  );
}
