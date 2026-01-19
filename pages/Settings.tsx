import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { User, CreditCard, Shield, Zap, Plus, Download, Save, Check, Loader2, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, Transaction } from '../services/supabaseClient';
import { Button } from '../components/ui/Button';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface SettingsProps {
   onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
   const { t } = useLanguage();
   const { user, profile, updateProfile, refreshProfile } = useAuth();
   const fileInputRef = useRef<HTMLInputElement>(null);

   const [activeTab, setActiveTab] = useState<'profile' | 'credits'>('profile');
   const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

   // Persist brutal mode in local storage
   const [isBrutalMode, setIsBrutalMode] = useState(() => localStorage.getItem('finglow_brutal_mode') === 'true');
   const [isSaving, setIsSaving] = useState(false);
   const [isSaved, setIsSaved] = useState(false);

   // Profile Form State
   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');
   const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

   // Transactions State
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loadingTransactions, setLoadingTransactions] = useState(false);

   // Initialize form with profile data
   useEffect(() => {
      if (profile) {
         if (profile.name) {
            const parts = profile.name.split(' ');
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(' '));
         }
         setAvatarPreview(profile.avatar_url || null);
      }
   }, [profile]);

   // Save brutal mode persistence
   useEffect(() => {
      localStorage.setItem('finglow_brutal_mode', String(isBrutalMode));
   }, [isBrutalMode]);

   // Fetch transactions
   useEffect(() => {
      const fetchHistory = async () => {
         if (!user?.id) return;
         setLoadingTransactions(true);
         try {
            const data = await getTransactions(user.id);
            setTransactions(data || []);
         } catch (error) {
            console.error('Error fetching transactions:', error);
         } finally {
            setLoadingTransactions(false);
         }
      };

      if (activeTab === 'credits') {
         fetchHistory();
      }
   }, [user?.id, activeTab]);

   const handleUploadClick = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
         if (file.size > 2 * 1024 * 1024) {
            alert("File is too large. Please select an image under 2MB.");
            return;
         }

         const reader = new FileReader();
         reader.onloadend = () => {
            const base64String = reader.result as string;
            setAvatarPreview(base64String);
         };
         reader.readAsDataURL(file);
      }
   };

   const handleDeleteAvatar = () => {
      setAvatarPreview(null);
   };

   const handleSaveProfile = async () => {
      setIsSaving(true);
      try {
         const fullName = `${firstName} ${lastName}`.trim();
         await updateProfile({
            name: fullName,
            avatar_url: avatarPreview
         });

         setIsSaved(true);
         setTimeout(() => setIsSaved(false), 2000);
      } catch (error) {
         console.error("Failed to update profile", error);
         alert("Failed to update profile");
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <Layout credits={profile?.credits || 0} onLogout={onLogout} onAddCredits={() => setIsCheckoutOpen(true)}>
         <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={(amount) => refreshProfile()}
         />

         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
               <div className="flex items-center text-sm text-slate-500 mb-2">
                  <span>Settings</span>
                  <span className="mx-2">/</span>
                  <span className="text-emerald-400 capitalize">{activeTab}</span>
               </div>
               <h1 className="text-3xl font-bold text-white tracking-tight">{t.settings.title}</h1>
               <p className="text-slate-400 mt-1">{t.settings.subtitle}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
               {/* Sidebar Tabs */}
               <div className="w-full lg:w-64 space-y-1">
                  <button
                     onClick={() => setActiveTab('profile')}
                     className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
                  >
                     <User className="w-4 h-4 mr-3" /> {t.settings.tabs.profile}
                  </button>
                  <button
                     onClick={() => setActiveTab('credits')}
                     className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'credits' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
                  >
                     <CreditCard className="w-4 h-4 mr-3" /> {t.settings.tabs.credits}
                  </button>
               </div>

               {/* Content Area */}
               <div className="flex-1">
                  {activeTab === 'profile' && (
                     <div className="space-y-6">
                        {/* Profile Card */}
                        <Card className="bg-slate-900 border-slate-800">
                           <CardHeader>
                              <CardTitle>{t.settings.profile.avatarTitle}</CardTitle>
                           </CardHeader>
                           <CardContent>
                              <div className="flex items-center gap-6">
                                 <div className="relative group">
                                    {avatarPreview ? (
                                       <div className="w-24 h-24 rounded-full p-1 border-2 border-emerald-500/30">
                                          <img
                                             src={avatarPreview}
                                             alt="Profile"
                                             className="w-full h-full rounded-full object-cover"
                                          />
                                       </div>
                                    ) : (
                                       <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl font-bold text-emerald-500 border-2 border-emerald-500/30">
                                          {firstName ? firstName[0] : (profile?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                       </div>
                                    )}

                                    {/* Hidden File Input */}
                                    <input
                                       type="file"
                                       ref={fileInputRef}
                                       onChange={handleFileChange}
                                       className="hidden"
                                       accept="image/png, image/jpeg, image/jpg"
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <h4 className="font-medium text-white">{t.settings.profile.avatarTitle}</h4>
                                    <p className="text-xs text-slate-500">{t.settings.profile.avatarDesc}</p>
                                    <div className="flex gap-3">
                                       <button
                                          onClick={handleUploadClick}
                                          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md border border-slate-700 transition-colors flex items-center"
                                       >
                                          <Upload className="w-3 h-3 mr-2" />
                                          {t.settings.profile.upload}
                                       </button>
                                       {avatarPreview && (
                                          <button
                                             onClick={handleDeleteAvatar}
                                             className="text-xs px-3 py-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                                          >
                                             {t.settings.profile.delete}
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.settings.profile.firstName}</label>
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.settings.profile.lastName}</label>
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-emerald-500 outline-none" />
                                 </div>
                                 <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{t.settings.profile.email}</label>
                                    <input type="email" value={user?.email || ''} readOnly className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 cursor-not-allowed outline-none focus:ring-0" />
                                 </div>
                              </div>

                              <div className="flex justify-end mt-8">
                                 <Button
                                    size="md"
                                    onClick={handleSaveProfile}
                                    disabled={isSaving || isSaved}
                                    className={isSaved ? 'bg-emerald-600' : ''}
                                 >
                                    {isSaving ? (
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isSaved ? (
                                       <>
                                          <Check className="w-4 h-4 mr-2" /> Saved
                                       </>
                                    ) : (
                                       <>
                                          <Save className="w-4 h-4 mr-2" /> {t.settings.profile.save}
                                       </>
                                    )}
                                 </Button>
                              </div>
                           </CardContent>
                        </Card>

                        {/* AI Preferences */}
                        <Card className="bg-slate-900 border-slate-800">
                           <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                 <Zap className="w-4 h-4 text-amber-400" />
                                 {t.settings.profile.aiPreferences}
                              </CardTitle>
                           </CardHeader>
                           <CardContent>
                              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                 <div>
                                    <div className="font-medium text-white mb-1">
                                       {isBrutalMode ? t.settings.profile.modeBrutal : t.settings.profile.modeConservative}
                                    </div>
                                    <div className="text-xs text-slate-500 max-w-sm">
                                       {isBrutalMode ? t.settings.profile.modeDesc : t.settings.profile.aiDesc}
                                    </div>
                                 </div>
                                 <div
                                    onClick={() => setIsBrutalMode(!isBrutalMode)}
                                    className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isBrutalMode ? 'bg-rose-500' : 'bg-slate-700'}`}
                                 >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isBrutalMode ? 'translate-x-7' : 'translate-x-0'}`} />
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     </div>
                  )}

                  {activeTab === 'credits' && (
                     <div className="space-y-6">
                        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                           <div className="relative z-10 flex items-center justify-between">
                              <div>
                                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{t.settings.credits.balance}</p>
                                 <div className="text-5xl font-bold text-white mb-1">
                                    {profile?.credits || 0} <span className="text-lg text-slate-500 font-normal">credits</span>
                                 </div>
                              </div>
                              <Button onClick={() => setIsCheckoutOpen(true)} className="h-12 px-6">
                                 <Plus className="w-5 h-5 mr-2" /> {t.dashboard.addCredits}
                              </Button>
                           </div>
                        </div>

                        <Card className="bg-slate-900 border-slate-800">
                           <CardHeader>
                              <CardTitle>{t.settings.credits.history}</CardTitle>
                           </CardHeader>
                           <CardContent>
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                       <th className="pb-3 font-medium">{t.settings.credits.date}</th>
                                       <th className="pb-3 font-medium">{t.settings.credits.amount}</th>
                                       <th className="pb-3 font-medium">{t.settings.credits.status}</th>
                                       <th className="pb-3 font-medium text-right">{t.settings.credits.invoice}</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-800">
                                    {loadingTransactions ? (
                                       <tr><td colSpan={4} className="py-8 text-center text-slate-500">Loading history...</td></tr>
                                    ) : transactions.length === 0 ? (
                                       <tr><td colSpan={4} className="py-8 text-center text-slate-500">No transactions found</td></tr>
                                    ) : (
                                       transactions.map((tx) => (
                                          <tr key={tx.id}>
                                             <td className="py-4 text-sm text-slate-300">{new Date(tx.created_at).toLocaleDateString()}</td>
                                             <td className="py-4 text-sm font-medium text-white">+ {tx.credits} Credits (R${tx.amount.toFixed(2)})</td>
                                             <td className="py-4">
                                                <span className={`text-xs px-2 py-1 rounded border ${tx.status === 'completed'
                                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                   }`}>
                                                   {tx.status}
                                                </span>
                                             </td>
                                             <td className="py-4 text-right">
                                                {tx.status === 'completed' && (
                                                   <button className="text-slate-500 hover:text-white" title="Invoice">
                                                      <Download className="w-4 h-4" />
                                                   </button>
                                                )}
                                             </td>
                                          </tr>
                                       ))
                                    )}
                                 </tbody>
                              </table>
                           </CardContent>
                        </Card>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </Layout>
   );
};