
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Client, Property, SiteVisit, WhatsAppTemplate, CustomRole, ResourceAction, ResourceType, RolePermissions, UserRole } from '../types';

interface AdminPanelProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  pendingUsers: UserProfile[];
  onBulkImport: (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => void;
  onApproveUser: (userId: string, status: UserProfile['approvalStatus'], role?: string) => void;
  checkPermission: (resource: ResourceType, action?: ResourceAction) => boolean;
}

const RESOURCES: ResourceType[] = [
  'Leads', 
  'Properties', 
  'Site Visits', 
  'Reports', 
  'Admin: Team', 
  'Admin: Roles', 
  'Admin: Import', 
  'Admin: Templates', 
  'WhatsApp'
];

const ACTIONS: ResourceAction[] = ['Read', 'Add', 'Edit', 'Delete', 'Assign'];

const DEFAULT_PERMISSIONS = (): RolePermissions => {
  const perms: RolePermissions = {};
  RESOURCES.forEach(r => {
    perms[r] = { Read: false, Add: false, Edit: false, Delete: false, Assign: false };
  });
  return perms;
};

const CATEGORY_FIELDS: Record<string, string[]> = {
  'Clients': ['firstName', 'lastName', 'mobile', 'email', 'budgetMax', 'locations', 'priority'],
  'Properties': ['title', 'id', 'priceMin', 'priceMax', 'area', 'type', 'possessionDate'],
  'Visits': ['clientName', 'propertyName', 'scheduledAt', 'status'],
  'General': ['agentName', 'companyName', 'currentDate']
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  clients, properties, visits, pendingUsers, onBulkImport, onApproveUser, checkPermission 
}) => {
  const canSeeTeam = checkPermission('Admin: Team');
  const canSeeRoles = checkPermission('Admin: Roles');
  const canSeeImport = checkPermission('Admin: Import');
  const canSeeTemplates = checkPermission('Admin: Templates');

  const [activeTab, setActiveTab] = useState<'approvals' | 'csv' | 'templates' | 'roles'>(() => {
    if (canSeeTeam) return 'approvals';
    if (canSeeRoles) return 'roles';
    if (canSeeImport) return 'csv';
    return 'templates';
  });
  
  const [userSearch, setUserSearch] = useState('');
  
  // Create User State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: '', status: 'Approved' as 'Approved' | 'Pending' });

  // Custom Roles State
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((role: any) => {
        if (role.permissions.Admin) {
          const adminPerms = role.permissions.Admin;
          role.permissions['Admin: Team'] = { ...adminPerms };
          role.permissions['Admin: Roles'] = { ...adminPerms };
          role.permissions['Admin: Import'] = { ...adminPerms };
          role.permissions['Admin: Templates'] = { ...adminPerms };
          delete role.permissions.Admin;
        }
        return role;
      });
    }

    return [
      { id: 'role_admin', name: 'Super Admin', description: 'Full system access', permissions: RESOURCES.reduce((acc, r) => ({...acc, [r]: {Read:true, Add:true, Edit:true, Delete:true, Assign:true}}), {}), isSystem: true },
      { id: 'role_manager', name: 'Sales Manager', description: 'Team and Lead management', permissions: RESOURCES.reduce((acc, r) => {
          const isFull = ['Leads', 'Properties', 'Site Visits', 'Reports', 'Admin: Team'].includes(r);
          return {...acc, [r]: {Read:true, Add:isFull, Edit:isFull, Delete:false, Assign:isFull}};
        }, {}), isSystem: true },
      { id: 'role_agent', name: 'Standard Agent', description: 'Sales execution role', permissions: RESOURCES.reduce((acc, r) => {
          const isSales = ['Leads', 'Properties', 'Site Visits', 'WhatsApp'].includes(r);
          return {...acc, [r]: {Read:isSales, Add:isSales, Edit:isSales, Delete:false, Assign:false}};
        }, {}), isSystem: true }
    ];
  });

  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [newRoleData, setNewRoleData] = useState<Partial<CustomRole>>({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    const registryJson = localStorage.getItem('ef_user_registry');
    if (registryJson) {
      setAllUsers(JSON.parse(registryJson));
    }
  }, [pendingUsers, isCreatingUser]);

  const handleUpdateStatus = (userId: string, status: UserProfile['approvalStatus']) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, approvalStatus: status } : u);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setAllUsers(updated);
    onApproveUser(userId, status);
  };

  const handleRemoveUser = (userId: string) => {
    if (!window.confirm('Delete this profile permanently? This cannot be undone.')) return;
    const updated = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setAllUsers(updated);
    onApproveUser(userId, 'Rejected');
  };

  const handleUpdateUserRole = (userId: string, newRoleId: string) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, role: newRoleId } : u);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setAllUsers(updated);
  };

  const filteredDirectory = allUsers.filter(u => 
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
    u.approvalStatus !== 'Rejected'
  );

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('ef_wa_templates');
    return saved ? JSON.parse(saved) : [
      { id: '1', category: 'Clients', name: 'Intro Template', message: 'Hi {firstName}, I noticed you are interested in {locations}...' },
      { id: '2', category: 'Properties', name: 'Details Share', message: 'Check out this unit: *{title}* at ₹{priceMin} in {area}...' }
    ];
  });

  const [newTemplate, setNewTemplate] = useState<Partial<WhatsAppTemplate>>({ category: 'Clients', name: '', message: '' });
  const [importType, setImportType] = useState<'Clients' | 'Properties' | 'Visits'>('Clients');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleManualUserCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.role) return;

    const registryJson = localStorage.getItem('ef_user_registry');
    const registry: UserProfile[] = registryJson ? JSON.parse(registryJson) : [];
    
    const newUser: UserProfile = {
      id: `U-${Math.random().toString(36).substr(2, 9)}`,
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      role: newUserForm.role,
      approvalStatus: newUserForm.status,
      createdAt: new Date().toISOString()
    };

    const updated = [...registry, newUser];
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setAllUsers(updated);
    setIsCreatingUser(false);
    setNewUserForm({ name: '', email: '', password: '', role: '', status: 'Approved' });
  };

  const handleSaveRole = () => {
    if (!newRoleData.name) return;
    const role: CustomRole = {
      id: editingRole?.id || `role_${Math.random().toString(36).substr(2, 9)}`,
      name: newRoleData.name,
      description: newRoleData.description || '',
      permissions: (newRoleData.permissions || DEFAULT_PERMISSIONS()) as RolePermissions,
      isSystem: false
    };

    const updated = editingRole 
      ? customRoles.map(r => r.id === editingRole.id ? role : r)
      : [role, ...customRoles];
    
    setCustomRoles(updated);
    localStorage.setItem('ef_custom_roles', JSON.stringify(updated));
    setIsCreatingRole(false);
    setEditingRole(null);
    setNewRoleData({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });
  };

  const togglePermission = (resource: ResourceType, action: ResourceAction) => {
    setNewRoleData(prev => {
      const currentPermissions = (prev.permissions || DEFAULT_PERMISSIONS()) as RolePermissions;
      const resourcePermissions = currentPermissions[resource] || { Read: false, Add: false, Edit: false, Delete: false, Assign: false };
      
      return {
        ...prev,
        permissions: {
          ...currentPermissions,
          [resource]: {
            ...resourcePermissions,
            [action]: !resourcePermissions[action]
          }
        }
      };
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.message) return;
    const template: WhatsAppTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      category: newTemplate.category as any,
      name: newTemplate.name,
      message: newTemplate.message
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    localStorage.setItem('ef_wa_templates', JSON.stringify(updated));
    setNewTemplate({ category: newTemplate.category, name: '', message: '' });
  };

  const insertPlaceholder = (field: string) => {
    const placeholder = `{${field}}`;
    const textarea = textAreaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentMsg = newTemplate.message || '';
    const newMsg = currentMsg.substring(0, start) + placeholder + currentMsg.substring(end);
    setNewTemplate(prev => ({ ...prev, message: newMsg }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {} as any);
      });
      onBulkImport(importType, data);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Super Admin Console</h1>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Governance, Role Management & Directory</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors overflow-x-auto no-scrollbar">
          {canSeeTeam && <button onClick={() => setActiveTab('approvals')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Team Directory</button>}
          {canSeeRoles && <button onClick={() => setActiveTab('roles')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Roles & Access</button>}
          {canSeeImport && <button onClick={() => setActiveTab('csv')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>CSV Upload</button>}
          {canSeeTemplates && <button onClick={() => setActiveTab('templates')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>WA Templates</button>}
        </div>
      </div>

      {(activeTab === 'approvals' && canSeeTeam) && (
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Team Governance</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage access, status, and roles for all members</p>
               </div>
               <div className="flex gap-2">
                 <div className="relative w-full sm:w-64">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Filter members..." className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                 </div>
                 {checkPermission('Admin: Team', 'Add') && (
                   <button onClick={() => setIsCreatingUser(true)} className="px-8 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <i className="fas fa-user-plus"></i> Onboard
                   </button>
                 )}
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                           <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Governance Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {filteredDirectory.map(user => {
                           const isPending = user.approvalStatus === 'Pending';
                           const isDeactivated = user.approvalStatus === 'Deactivated';
                           const isApproved = user.approvalStatus === 'Approved';
                           return (
                              <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${isPending ? 'bg-amber-50 text-amber-600' : isDeactivated ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                          {user.name[0].toUpperCase()}
                                       </div>
                                       <div>
                                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{user.name}</p>
                                          <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isApproved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : isPending ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : 'bg-slate-100 text-slate-500'}`}>
                                      {user.approvalStatus}
                                    </span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="relative inline-block">
                                       <select disabled={!checkPermission('Admin: Team', 'Edit')} value={user.role} onChange={(e) => handleUpdateUserRole(user.id, e.target.value)} className="bg-indigo-50 dark:bg-indigo-900/30 border-none text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest outline-none cursor-pointer rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors appearance-none pr-8">
                                          {customRoles.map(r => (<option key={r.id} value={r.id} className="dark:bg-slate-800 text-slate-800 dark:text-white">{r.name}</option>))}
                                       </select>
                                       <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 text-[8px] pointer-events-none"></i>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <div className="flex gap-2">
                                       {(isPending && checkPermission('Admin: Team', 'Edit')) && (
                                         <button onClick={() => handleUpdateStatus(user.id, 'Approved')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase hover:bg-emerald-700 transition-all flex items-center gap-1"><i className="fas fa-check-circle"></i> Approve</button>
                                       )}
                                       {(isApproved && checkPermission('Admin: Team', 'Edit')) && (
                                         <button onClick={() => handleUpdateStatus(user.id, 'Deactivated')} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-300 hover:text-amber-500 transition-colors" title="Deactivate Account"><i className="fas fa-power-off text-xs"></i></button>
                                       )}
                                       {(isDeactivated && checkPermission('Admin: Team', 'Edit')) && (
                                         <button onClick={() => handleUpdateStatus(user.id, 'Approved')} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-300 hover:text-emerald-500 transition-colors" title="Activate Account"><i className="fas fa-play text-xs"></i></button>
                                       )}
                                       {checkPermission('Admin: Team', 'Delete') && (
                                         <button onClick={() => handleRemoveUser(user.id)} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-300 hover:text-red-500 transition-colors" title="Remove Profile"><i className="fas fa-trash-alt text-xs"></i></button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>

          {isCreatingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Manual Profile Entry</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create a team profile with designated access</p>
                  </div>
                  <button onClick={() => setIsCreatingUser(false)} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleManualUserCreate} className="p-8 space-y-4">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label><input required value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label><input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Access Level</label><select required value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase dark:text-white outline-none focus:border-indigo-500"><option value="">Select Privilege Level...</option>{customRoles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Activation Status</label><div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700"><button type="button" onClick={() => setNewUserForm({...newUserForm, status: 'Approved'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${newUserForm.status === 'Approved' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Instant Approve</button><button type="button" onClick={() => setNewUserForm({...newUserForm, status: 'Pending'})} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${newUserForm.status === 'Pending' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Send to Queue</button></div></div>
                  <div className="space-y-1.5 pt-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Entry Key</label><input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500" placeholder="••••••••" /></div>
                  <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsCreatingUser(false)} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Cancel</button><button type="submit" disabled={!newUserForm.role} className={`flex-[2] py-4 btn-3d rounded-2xl font-black text-[10px] uppercase ${newUserForm.role ? 'btn-3d-indigo text-white shadow-indigo-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}>Create Profile</button></div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {(activeTab === 'roles' && canSeeRoles) && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
             <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Privilege Architect</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define custom permission sets for the team</p></div>
             {checkPermission('Admin: Roles', 'Add') && (
               <button onClick={() => { setIsCreatingRole(true); setEditingRole(null); setNewRoleData({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() }); }} className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">+ Construct New Role</button>
             )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {customRoles.map(role => (
               <div key={role.id} className="card-neo p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 transition-colors group relative bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start mb-4">
                     <div><h4 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-tight">{role.name}</h4><p className="text-[10px] font-medium text-slate-400 uppercase mt-1 tracking-tight">{role.description}</p></div>
                     {role.isSystem ? (<span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg text-[7px] font-black uppercase">System Core</span>) : (checkPermission('Admin: Roles', 'Edit') && (
                       <button onClick={() => { setEditingRole(role); setNewRoleData(role); setIsCreatingRole(true); }} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"><i className="fas fa-edit text-xs"></i></button>
                     ))}
                  </div>
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">Active Privileges</p>
                     <div className="flex flex-wrap gap-1.5">{RESOURCES.slice(0, 4).map(res => {
                          const resPermissions = role.permissions[res];
                          const hasFull = resPermissions && ACTIONS.every(a => resPermissions[a]);
                          const hasPartial = resPermissions && resPermissions.Read;
                          if (!hasPartial) return null;
                          return (<span key={res} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${hasFull ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30'}`}>{res}: {hasFull ? 'Full' : 'Read+'}</span>);
                        })}</div>
                  </div>
               </div>
             ))}
          </div>

          {isCreatingRole && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-colors">
                  <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                     <div><h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingRole ? 'Edit Role Schema' : 'Configure New Role Schema'}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Design granular access across all functional modules</p></div>
                     <button onClick={() => setIsCreatingRole(false)} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-[1.5rem] flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-10 hide-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8"><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Identifier</label><input value={newRoleData.name} onChange={e => setNewRoleData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Regional Supervisor" className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-black dark:text-white outline-none focus:border-indigo-600 transition-colors shadow-inner" /></div><div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Context</label><input value={newRoleData.description} onChange={e => setNewRoleData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe duties..." className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-bold dark:text-white outline-none focus:border-indigo-600 transition-colors shadow-inner" /></div></div>
                     <div className="space-y-6"><div className="flex items-center gap-3 ml-1"><i className="fas fa-shield-alt text-indigo-500"></i><h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Resource Permission Matrix</h4></div>
                        <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr><th className="p-6 text-left bg-slate-50 dark:bg-slate-900/50 rounded-tl-[2rem] border-b dark:border-slate-700"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module Namespace</span></th>{ACTIONS.map(action => (<th key={action} className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{action}</span></th>))}<th className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-tr-[2rem] border-b dark:border-slate-700"></th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-700">{RESOURCES.map(res => (<tr key={res} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors"><td className="p-6 font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-tight">{res}</td>{ACTIONS.map(action => { const resourcePerms = newRoleData.permissions?.[res]; const isActive = resourcePerms ? resourcePerms[action] : false; return (<td key={action} className="p-6 text-center"><button onClick={() => togglePermission(res, action)} className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-transparent hover:border-indigo-300'}`}><i className="fas fa-check text-xs"></i></button></td>); })}<td className="p-6"><button onClick={() => { const allActions = ACTIONS.reduce((acc, a) => ({...acc, [a]: true}), {} as Record<ResourceAction, boolean>); setNewRoleData(prev => ({ ...prev, permissions: { ...(prev.permissions || DEFAULT_PERMISSIONS()), [res]: allActions } as RolePermissions })); }} className="text-[8px] font-black text-indigo-400 uppercase hover:text-indigo-600 tracking-tighter">Grant All</button></td></tr>))}</tbody></table></div>
                     </div>
                  </div>
                  <div className="p-10 border-t border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors"><button onClick={() => setIsCreatingRole(false)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Abandon</button><button onClick={handleSaveRole} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Apply Role Configuration</button></div>
               </div>
            </div>
          )}
        </div>
      )}

      {(activeTab === 'csv' && canSeeImport) && (
        <div className="max-w-3xl mx-auto space-y-8">
           <div className="card-neo p-8 rounded-[3rem] text-center space-y-8 bg-white dark:bg-slate-800 transition-colors">
              <div className="space-y-2"><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Bulk Data Injection</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sync external data sources with the central ecosystem</p></div>
              <div className="grid grid-cols-3 gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">{['Clients', 'Properties', 'Visits'].map(t => (<button key={t} onClick={() => setImportType(t as any)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${importType === t ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>))}</div>
              {checkPermission('Admin: Import', 'Add') ? (
                <div onClick={() => fileInputRef.current?.click()} className="group py-16 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[3rem] hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer flex flex-col items-center gap-4"><div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-inner"><i className="fas fa-cloud-upload-alt text-2xl"></i></div><div className="space-y-1"><p className="text-sm font-black text-slate-800 dark:text-white uppercase">Upload {importType} Manifest</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Standard UTF-8 .csv files accepted</p></div><input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleCSVUpload} /></div>
              ) : (
                <div className="py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-700"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Write permission required for data injection</p></div>
              )}
           </div>
        </div>
      )}

      {(activeTab === 'templates' && canSeeTemplates) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="card-neo p-8 rounded-[3rem] h-fit lg:sticky lg:top-36 transition-colors bg-white dark:bg-slate-800">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-8">Interaction Architect</h3>
             {checkPermission('Admin: Templates', 'Add') ? (
               <div className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contextual Category</label><select value={newTemplate.category} onChange={e => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-500 transition-colors"><option>Clients</option><option>Properties</option><option>Visits</option><option>General</option></select></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dynamic Field Injection</label><div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">{CATEGORY_FIELDS[newTemplate.category || 'General'].map(field => (<button key={field} onClick={() => insertPlaceholder(field)} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black text-indigo-600 hover:border-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-sm">{field}</button>))}</div></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Alias Name</label><input value={newTemplate.name} onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Schedule Confirmation" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-sm" /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Messaging Protocol</label><textarea ref={textAreaRef} value={newTemplate.message} onChange={e => setNewTemplate(prev => ({ ...prev, message: e.target.value }))} rows={6} placeholder="Design your template string here..." className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-sm" /></div>
                  <button onClick={handleSaveTemplate} disabled={!newTemplate.name || !newTemplate.message} className="w-full py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all">Publish Template Set</button>
               </div>
             ) : (
               <div className="py-20 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architectural access restricted</p></div>
             )}
          </div>
          <div className="space-y-6">
             <div className="flex justify-between items-center px-2"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Content Ecosystem</h4><span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-lg transition-colors">{templates.length} Modules</span></div>
             {templates.map(tpl => (
               <div key={tpl.id} className="card-neo p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 transition-colors group hover:border-indigo-400 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start mb-4">
                     <div><span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800 transition-colors mb-1.5 inline-block">{tpl.category}</span><h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{tpl.name}</h4></div>
                     {checkPermission('Admin: Templates', 'Delete') && <button className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt text-xs"></i></button>}
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                     <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 italic leading-relaxed">{tpl.message.split(/(\{.*?\})/).map((part, i) => part.startsWith('{') ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-black not-italic">{part}</span> : part)}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
