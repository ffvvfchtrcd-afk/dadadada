import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Edit2, X, Save, Ban, CheckCircle2, DollarSign, ShoppingBag } from 'lucide-react';
import { api } from '@/services/api';
import { Button, Input, Select, Badge, Card, CardHeader, CardContent, CardFooter, Modal, EmptyState, Avatar } from '@/components/ui';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [compras, setCompras] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ saldo: 0, status: 'ATIVO' });

  useEffect(() => {
    Promise.all([api.get('users').catch(() => []), api.get('compras').catch(() => [])]).then(([u, c]) => { setUsers(u); setCompras(c); });
  }, []);

  const filtered = users.filter(u =>
    (u.nome || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getUserPurchases = (userId) => compras.filter(c => c.usuarioId === userId);
  const getUserSpent = (userId) => getUserPurchases(userId).filter(c => c.status === 'APROVADO').reduce((a, c) => a + (c.valorTotal || 0), 0);

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({ saldo: user.saldo || 0, status: user.status || 'ATIVO' });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const updated = users.map(u => u.id === selectedUser.id ? { ...u, saldo: Number(formData.saldo), status: formData.status, dataAtualizacao: new Date().toISOString() } : u);
    await api.save('users', updated);
    setUsers(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Clientes</h1>
        <p className="text-gray-400 mt-1">{users.length} clientes cadastrados</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="divide-y divide-dark-600/20">
              {filtered.map((user, i) => (
                <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-dark-700/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Avatar name={user.nome} src={user.avatar} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{user.nome}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500">{getUserPurchases(user.id).length} pedidos</p>
                      <p className="text-sm font-semibold text-green-400">R$ {getUserSpent(user.id).toFixed(2)}</p>
                    </div>
                    <Badge variant={user.status === 'ATIVO' ? 'success' : 'danger'} size="xs" dot>{user.status}</Badge>
                    <button onClick={() => handleOpenEdit(user)} className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<User className="w-12 h-12" />} title="Nenhum cliente encontrado" />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gerenciar Cliente" size="md">
        <div className="p-6 space-y-6">
          {selectedUser && (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                <Avatar name={selectedUser.nome} src={selectedUser.avatar} size="lg" />
                <div>
                  <p className="font-medium text-white">{selectedUser.nome}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                  <p className="text-xs text-gray-500 mb-1">Total Gasto</p>
                  <p className="text-xl font-bold text-green-400">R$ {getUserSpent(selectedUser.id).toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                  <p className="text-xs text-gray-500 mb-1">Pedidos</p>
                  <p className="text-xl font-bold text-white">{getUserPurchases(selectedUser.id).length}</p>
                </div>
              </div>

              <Input label="Saldo (R$)" type="number" step="0.01" value={formData.saldo} onChange={e => setFormData({ ...formData, saldo: e.target.value })} icon={<DollarSign className="w-4 h-4" />} />
              <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'BLOQUEADO', label: 'Bloqueado' }]} />
            </>
          )}
        </div>
        <CardFooter>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>Salvar</Button>
        </CardFooter>
      </Modal>
    </div>
  );
}
