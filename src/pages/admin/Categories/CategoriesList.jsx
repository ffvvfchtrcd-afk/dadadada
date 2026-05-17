import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Search, FolderTree, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { api } from '@/services/api';
import { Button, Input, Select, Badge, Card, CardHeader, CardContent, CardFooter, Modal, EmptyState } from '@/components/ui';

export default function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ nome: '', slug: '', icone: 'fa-solid fa-folder', imageUrl: '', hierarquia: 1, status: 'ATIVO' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const data = await api.get('categories').catch(() => []);
    data.sort((a, b) => a.hierarquia - b.hierarquia);
    setCategories(data);
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ nome: category.nome, slug: category.slug, icone: category.icone, imageUrl: category.imageUrl || '', hierarquia: category.hierarquia, status: category.status });
    } else {
      setEditingCategory(null);
      setFormData({ nome: '', slug: '', icone: 'fa-solid fa-folder', imageUrl: '', hierarquia: categories.length + 1, status: 'ATIVO' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    let updated = [...categories];
    if (editingCategory) {
      updated = updated.map(c => c.id === editingCategory.id ? { ...c, ...formData, dataAtualizacao: new Date().toISOString() } : c);
    } else {
      updated.push({ id: Date.now(), ...formData, dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() });
    }
    await api.save('categories', updated);
    await fetchCategories();
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta categoria?')) return;
    const updated = categories.filter(c => c.id !== id);
    await api.save('categories', updated);
    await fetchCategories();
  };

  const moveCategory = async (id, direction) => {
    const idx = categories.findIndex(c => c.id === id);
    if ((direction === -1 && idx === 0) || (direction === 1 && idx === categories.length - 1)) return;
    const updated = [...categories];
    [updated[idx], updated[idx + direction]] = [updated[idx + direction], updated[idx]];
    updated.forEach((c, i) => c.hierarquia = i + 1);
    await api.save('categories', updated);
    await fetchCategories();
  };

  const filtered = categories.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Categorias</h1>
          <p className="text-gray-400 mt-1">{categories.length} categorias organizadas</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>Nova Categoria</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar categorias..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="divide-y divide-dark-600/20">
              {filtered.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-dark-700/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveCategory(cat.id, -1)} disabled={i === 0} className="p-0.5 rounded hover:bg-dark-700/50 text-gray-600 hover:text-gray-300 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveCategory(cat.id, 1)} disabled={i === filtered.length - 1} className="p-0.5 rounded hover:bg-dark-700/50 text-gray-600 hover:text-gray-300 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-dark-800/50 border border-dark-600/30 flex items-center justify-center text-brand-400 overflow-hidden flex-shrink-0">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FolderTree className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{cat.nome}</p>
                      <p className="text-xs text-gray-500 font-mono">/{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cat.status === 'ATIVO' ? 'success' : 'danger'} size="xs" dot>{cat.status}</Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(cat)} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-brand-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FolderTree className="w-12 h-12" />} title="Nenhuma categoria encontrada" />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'} size="md">
        <div className="p-6 space-y-4">
          <Input label="Nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value, slug: e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} placeholder="Nome da categoria" />
          <Input label="Slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="url-amigavel" />
          <Input label="Ícone (classe FontAwesome)" value={formData.icone} onChange={e => setFormData({ ...formData, icone: e.target.value })} placeholder="fa-solid fa-folder" />
          <Input label="URL da Imagem" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
          {formData.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-dark-600/30 h-28">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <Input label="Ordem" type="number" value={formData.hierarquia} onChange={e => setFormData({ ...formData, hierarquia: Number(e.target.value) })} />
          <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
            options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'INATIVO', label: 'Inativo' }]} />
        </div>
        <CardFooter>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </CardFooter>
      </Modal>
    </div>
  );
}
