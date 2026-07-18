import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, Trash2, Edit2, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PosisiStaff, getMasterPosisi, saveMasterPosisi, DEFAULT_STAFF_POSITIONS } from '../lib/db';

interface MasterPosisiTabProps {
  rsName: string;
}

export default function MasterPosisiTab({ rsName }: MasterPosisiTabProps) {
  const [positions, setPositions] = useState<PosisiStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PosisiStaff>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<Partial<PosisiStaff>>({ kategori: 'Lainnya', is_active: true });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getMasterPosisi(rsName);
      setPositions(data);
      setIsLoading(false);
    }
    if (rsName) {
      loadData();
    }
  }, [rsName]);

  const handleSave = async (updatedPositions: PosisiStaff[]) => {
    setPositions(updatedPositions);
    await saveMasterPosisi(rsName, updatedPositions);
  };

  const toggleStatus = async (id: string) => {
    const updated = positions.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p);
    await handleSave(updated);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus posisi ini? Posisi yang sudah dihapus tidak akan muncul lagi di pilihan responden.')) {
      const updated = positions.filter(p => p.id !== id);
      await handleSave(updated);
    }
  };

  const saveEdit = async () => {
    if (!editForm.nama_posisi || !editForm.kategori) return;
    const updated = positions.map(p => p.id === isEditing ? { ...p, ...editForm } as PosisiStaff : p);
    await handleSave(updated);
    setIsEditing(null);
  };

  const saveAdd = async () => {
    if (!addForm.nama_posisi || !addForm.kategori) return;
    const newPos: PosisiStaff = {
      id: `custom-${Date.now()}`,
      kategori: addForm.kategori,
      nama_posisi: addForm.nama_posisi,
      is_active: true
    };
    const updated = [...positions, newPos];
    await handleSave(updated);
    setIsAdding(false);
    setAddForm({ kategori: 'Lainnya', is_active: true });
  };

  const filteredPositions = positions.filter(p => 
    p.nama_posisi.toLowerCase().includes(search.toLowerCase()) || 
    p.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const groupedPositions = filteredPositions.reduce((acc, curr) => {
    if (!acc[curr.kategori]) acc[curr.kategori] = [];
    acc[curr.kategori].push(curr);
    return acc;
  }, {} as Record<string, PosisiStaff[]>);

  const allCategories = Array.from(new Set(positions.map(p => p.kategori)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Master Posisi Staff
            </h2>
            <p className="text-sm text-slate-500 mt-1">Kelola daftar posisi staff yang muncul pada form kuesioner.</p>
          </div>
          
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Tambah Posisi
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari posisi atau kategori..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50/30 border border-emerald-200 rounded-2xl p-4 mb-6"
          >
            <h4 className="text-sm font-bold text-emerald-700 mb-4">Tambah Posisi Baru</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Posisi</label>
                <input 
                  type="text" 
                  value={addForm.nama_posisi || ''}
                  onChange={e => setAddForm({...addForm, nama_posisi: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500/50"
                  placeholder="Contoh: Perawat IGD"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Kategori</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={addForm.kategori || ''}
                    onChange={e => setAddForm({...addForm, kategori: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500/50"
                    list="categories"
                  />
                  <datalist id="categories">
                    {allCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Batal</button>
              <button onClick={saveAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Simpan</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedPositions).map(([group, list]) => (
            <div key={group} className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">{group}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map(pos => (
                  <div 
                    key={pos.id}
                    className={`bg-slate-50 border ${pos.is_active ? 'border-slate-200/80' : 'border-red-100 opacity-60'} rounded-xl p-4 flex flex-col justify-between transition-colors`}
                  >
                    {isEditing === pos.id ? (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          value={editForm.nama_posisi || ''}
                          onChange={e => setEditForm({...editForm, nama_posisi: e.target.value})}
                          className="w-full bg-white border border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none"
                        />
                        <input 
                          type="text" 
                          value={editForm.kategori || ''}
                          onChange={e => setEditForm({...editForm, kategori: e.target.value})}
                          className="w-full bg-white border border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button onClick={() => setIsEditing(null)} className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                          <button onClick={saveEdit} className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"><Check className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-sm font-semibold ${pos.is_active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                            {pos.nama_posisi}
                          </span>
                          <div className="flex gap-1.5 shrink-0 ml-3">
                            <button onClick={() => { setIsEditing(pos.id); setEditForm(pos); }} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleStatus(pos.id)} className={`transition-colors ${pos.is_active ? 'text-slate-400 hover:text-amber-600' : 'text-amber-600 hover:text-amber-500'}`} title={pos.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                              {pos.is_active ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            {pos.nama_posisi !== 'Lainnya' && (
                              <button onClick={() => handleDelete(pos.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded max-w-fit font-medium border ${pos.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                          {pos.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredPositions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>Tidak ada posisi staf yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
