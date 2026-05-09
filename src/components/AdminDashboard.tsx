import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, OperationType, handleFirestoreError } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { AppConfig, NotificationRecord } from '../types';
import { toast } from 'sonner';
import { LayoutDashboard, Megaphone, Settings, LogOut, Save, Plus, Trash2, ExternalLink, Smartphone, Bell, Share2, Tv, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADMIN_EMAIL = 'berthaelviramorenocolan@gmail.com';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'notifications' | 'links' | 'admins'>('ads');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as AppConfig);
      } else {
        // Initialize default config
        let defaultConfig: AppConfig;
        defaultConfig = {
            splashAd: { enabled: false, imageUrl: 'https://picsum.photos/seed/splash/1080/1920', duration: 5 },
            stickyBanner: { imageUrl: 'https://picsum.photos/seed/banner/1000/200', link: 'https://wa.me/123456789' },
            tvLink: 'https://youtube.com/live',
            socialLinks: { whatsapp: '123456789', instagram: 'https://instagram.com', tiktok: 'https://tiktok.com', facebook: 'https://facebook.com' },
            quickLinks: [
              { label: 'Sobre Nosotros', url: '#' },
              { label: 'Locutores', url: '#' },
              { label: 'Programación', url: '#' },
              { label: 'Chat en Vivo', url: '#' },
              { label: 'Pedidos Musicales', url: '#' },
              { label: 'Noticias', url: '#' },
              { label: 'Historial', url: '#' },
              { label: 'VER TV EN VIVO', url: '#' }
            ],
            authorizedAdmins: [ADMIN_EMAIL]
          };
        setDoc(doc(db, 'config', 'main'), defaultConfig).catch(e => handleFirestoreError(e, OperationType.WRITE, 'config/main'));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      toast.error('Error al iniciar sesión');
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    try {
      await updateDoc(doc(db, 'config', 'main'), newConfig as any);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/main');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black">Cargando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Acceso Restringido</h2>
          <p className="text-zinc-400 text-sm">Debes iniciar sesión para acceder al panel de administración.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-all"
          >
            Iniciar Sesión con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <LayoutDashboard size={20} />
          </div>
          <h2 className="font-bold text-xl tracking-tight">JCMC Admin</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={<ImageIcon size={20} />}
            label="Publicidad"
            active={activeTab === 'ads'}
            onClick={() => setActiveTab('ads')}
          />
          <SidebarItem
            icon={<Bell size={20} />}
            label="Notificaciones"
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
          />
          <SidebarItem
            icon={<Share2 size={20} />}
            label="Enlaces & TV"
            active={activeTab === 'links'}
            onClick={() => setActiveTab('links')}
          />
          <SidebarItem
            icon={<Settings size={20} />}
            label="Administradores"
            active={activeTab === 'admins'}
            onClick={() => setActiveTab('admins')}
          />
        </nav>

        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-zinc-700" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-12">
          <header className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {activeTab === 'ads' && 'Gestión de Publicidad'}
              {activeTab === 'notifications' && 'Consola de Notificaciones'}
              {activeTab === 'links' && 'Control de Enlaces'}
            </h1>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'ads' && config && (
              <motion.div
                key="ads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Splash Ad Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-blue-500" />
                      <h3 className="text-xl font-bold">Splash Ad Intrusivo</h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.splashAd.enabled}
                        onChange={(e) => handleSaveConfig({ ...config, splashAd: { ...config.splashAd, enabled: e.target.checked } })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL de Imagen</label>
                      <input
                        type="text"
                        value={config.splashAd.imageUrl}
                        onChange={(e) => setConfig({ ...config, splashAd: { ...config.splashAd, imageUrl: e.target.value } })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duración (segundos)</label>
                      <input
                        type="number"
                        value={config.splashAd.duration}
                        onChange={(e) => setConfig({ ...config, splashAd: { ...config.splashAd, duration: parseInt(e.target.value) } })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveConfig(config)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                  >
                    <Save size={18} /> Actualizar Splash
                  </button>
                </section>

                {/* Sticky Banner Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-blue-500" />
                    <h3 className="text-xl font-bold">Sticky Banner Manager</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL de Banner</label>
                      <input
                        type="text"
                        value={config.stickyBanner.imageUrl}
                        onChange={(e) => setConfig({ ...config, stickyBanner: { ...config.stickyBanner, imageUrl: e.target.value } })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Link de Redirección</label>
                      <input
                        type="text"
                        value={config.stickyBanner.link}
                        onChange={(e) => setConfig({ ...config, stickyBanner: { ...config.stickyBanner, link: e.target.value } })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveConfig(config)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                  >
                    <Save size={18} /> Actualizar Banner
                  </button>
                </section>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <NotificationForm />
                <NotificationHistory />
              </motion.div>
            )}

            {activeTab === 'links' && config && (
              <motion.div
                key="links"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Tv className="text-blue-500" />
                    <h3 className="text-xl font-bold">TV Link (YouTube/FB Live)</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">URL del Live</label>
                    <input
                      type="text"
                      value={config.tvLink}
                      onChange={(e) => setConfig({ ...config, tvLink: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveConfig(config)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                  >
                    <Save size={18} /> Guardar Enlace TV
                  </button>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Share2 className="text-blue-500" />
                    <h3 className="text-xl font-bold">Redes Sociales & Cabina</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialInput
                      label="WhatsApp Cabina"
                      value={config.socialLinks.whatsapp}
                      onChange={(v) => setConfig({ ...config, socialLinks: { ...config.socialLinks, whatsapp: v } })}
                    />
                    <SocialInput
                      label="Instagram"
                      value={config.socialLinks.instagram}
                      onChange={(v) => setConfig({ ...config, socialLinks: { ...config.socialLinks, instagram: v } })}
                    />
                    <SocialInput
                      label="TikTok"
                      value={config.socialLinks.tiktok}
                      onChange={(v) => setConfig({ ...config, socialLinks: { ...config.socialLinks, tiktok: v } })}
                    />
                    <SocialInput
                      label="Facebook"
                      value={config.socialLinks.facebook}
                      onChange={(v) => setConfig({ ...config, socialLinks: { ...config.socialLinks, facebook: v } })}
                    />
                  </div>
                  <button
                    onClick={() => handleSaveConfig(config)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                  >
                    <Save size={18} /> Guardar Redes
                  </button>
                </section>

                <QuickLinksManager
                  links={config.quickLinks || []}
                  onChange={(newLinks) => setConfig({ ...config, quickLinks: newLinks })}
                  onSave={() => handleSaveConfig(config)}
                />
              </motion.div>
            )}

            {activeTab === 'admins' && config && (
              <motion.div
                key="admins"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Settings className="text-blue-500" />
                    <h3 className="text-xl font-bold">Gestión de Administradores</h3>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    Añade correos electrónicos de confianza. Solo estos usuarios podrán acceder a este panel de administración.
                  </p>
                  <div className="space-y-4">
                    {config.authorizedAdmins.map((email, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-black border border-zinc-800 rounded-xl">
                        <span className="flex-1 font-mono text-sm">{email}</span>
                        {email !== ADMIN_EMAIL && (
                          <button
                            onClick={() => {
                              const newAdmins = config.authorizedAdmins.filter((_, i) => i !== index);
                              handleSaveConfig({ ...config, authorizedAdmins: newAdmins });
                            }}
                            className="text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-4">
                        <input
                            type="email"
                            placeholder="nuevo.admin@gmail.com"
                            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const email = (e.target as HTMLInputElement).value;
                                    if (email) {
                                        handleSaveConfig({ ...config, authorizedAdmins: [...config.authorizedAdmins, email] });
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-500 hover:text-white hover:bg-zinc-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SocialInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  );
}

function QuickLinksManager({ links, onChange, onSave }: { links: any[], onChange: (links: any[]) => void, onSave: () => void }) {
  const addLink = () => {
    onChange([...links, { label: 'Nuevo Enlace', url: '#' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    onChange(newLinks);
  };

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="text-blue-500" />
          <h3 className="text-xl font-bold">Enlaces Rápidos (Menú)</h3>
        </div>
        <button
          onClick={addLink}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-all"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="space-y-4">
        {links.map((link, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-black border border-zinc-800 rounded-2xl relative group">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Etiqueta</label>
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(index, 'label', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">URL</label>
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLink(index, 'url', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => removeLink(index)}
              className="md:self-end p-3 text-zinc-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-center text-zinc-600 py-4">No hay enlaces configurados</p>
        )}
      </div>

      <button
        onClick={onSave}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
      >
        <Save size={18} /> Guardar Menú
      </button>
    </section>
  );
}

function NotificationForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !body) return toast.error('Completa todos los campos');
    setSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        sentAt: new Date().toISOString()
      });
      toast.success('Notificación enviada (Simulado)');
      setTitle('');
      setBody('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="text-blue-500" />
        <h3 className="text-xl font-bold">Envío Masivo</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¡Estamos al aire!"
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cuerpo del Mensaje</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Sintoniza ahora el programa especial..."
            rows={3}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold transition-all"
      >
        <Bell size={20} /> {sending ? 'Enviando...' : 'Enviar Ahora'}
      </button>
    </section>
  );
}

function NotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationRecord));
      setNotifications(docs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
      <h3 className="text-xl font-bold">Historial de Envíos</h3>
      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-400">{n.title}</h4>
              <span className="text-[10px] text-zinc-600 uppercase font-mono">{new Date(n.sentAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-zinc-400">{n.body}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-center text-zinc-600 py-8">No hay notificaciones enviadas</p>}
      </div>
    </section>
  );
}
