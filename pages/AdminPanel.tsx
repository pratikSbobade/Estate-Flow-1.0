
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Client, Property, SiteVisit, WhatsAppTemplate, CustomRole, ResourceAction, ResourceType, RolePermissions, UserRole } from '../types';

interface AdminPanelProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  pendingUsers: UserProfile[];
  onBulkImport: (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => void;
  onApproveUser: (userId: string, status: 'Approved' | 'Rejected', role?: string) => void;
}

const RESOURCES: ResourceType[] = ['Leads', 'Properties', 'Site Visits', 'Users', 'Reports', 'Admin', 'WhatsApp'];
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
  clients, properties, visits, pendingUsers, onBulkImport, onApproveUser 
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'csv' | 'templates' | 'roles'>('approvals');
  
  // Create User State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'role_agent' });

  // Custom Roles State
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    return saved ? JSON.parse(saved) : [
      { id: 'role_admin', name: 'Super Admin', description: 'Full system access', permissions: RESOURCES.reduce((acc, r) => ({...acc, [r]: {Read:true, Add:true, Edit:true, Delete:true, Assign:true}}), {}), isSystem: true },
      { id: 'role_agent', name: 'Standard Agent', description: 'Sales execution role', permissions: RESOURCES.reduce((acc, r) => ({...acc, [r]: {Read:true, Add:true, Edit:true, Delete:false, Assign:false}}), {}), isSystem: true }
    ];
  });

  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [newRoleData, setNewRoleData] = useState<Partial<CustomRole>>({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() });

  // WhatsApp Templates State
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

  // Approval State
  const [userRoleMap, setUserRoleMap] = useState<Record<string, string>>({});

  const handleManualUserCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const registryJson = localStorage.getItem('ef_user_registry');
    const registry: UserProfile[] = registryJson ? JSON.parse(registryJson) : [];
    
    const newUser: UserProfile = {
      id: `U-${Math.random().toString(36).substr(2, 9)}`,
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      role: newUserForm.role,
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('ef_user_registry', JSON.stringify([...registry, newUser]));
    setIsCreatingUser(false);
    setNewUserForm({ name: '', email: '', password: '', role: 'role_agent' });
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
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Management, Compliance & Scaling</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('approvals')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Approvals & Users</button>
          <button onClick={() => setActiveTab('roles')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Roles & Access</button>
          <button onClick={() => setActiveTab('csv')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>CSV Upload</button>
          <button onClick={() => setActiveTab('templates')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>WA Templates</button>
        </div>
      </div>

      {activeTab === 'approvals' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">User Orchestration</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approve signups or add team members manually</p>
             </div>
             <button 
               onClick={() => setIsCreatingUser(true)}
               className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
             >
               + Create Team Access
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map(user => (
              <div key={user.id} className="card-neo p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <i className="fas fa-user-shield text-xl"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate leading-tight">{user.name}</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.region || 'Remote'} • Signup Pending</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Professional Email</p>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">{user.email}</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Access Role</label>
                    <div className="relative">
                      <select 
                        value={userRoleMap[user.id] || ''}
                        onChange={(e) => setUserRoleMap(prev => ({...prev, [user.id]: e.target.value}))}
                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase dark:text-white outline-none focus:border-indigo-500 shadow-sm"
                      >
                        <option value="">Select a Role...</option>
                        {customRoles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onApproveUser(user.id, 'Rejected')} className="flex-1 py-4 btn-3d btn-3d-red text-white rounded-xl text-[9px] font-black uppercase">Reject</button>
                  <button 
                    onClick={() => onApproveUser(user.id, 'Approved', userRoleMap[user.id])} 
                    disabled={!userRoleMap[user.id]}
                    className={`flex-[2] py-4 btn-3d rounded-xl text-[9px] font-black uppercase transition-all ${userRoleMap[user.id] ? 'btn-3d-emerald text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
                  >
                    Grant Access
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 && (
              <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                <i className="fas fa-check-double text-slate-200 text-5xl mb-4"></i>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Team registry is fully validated</p>
              </div>
            )}
          </div>

          {isCreatingUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Add Team Member</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant activation bypasses approval</p>
                  </div>
                  <button onClick={() => setIsCreatingUser(false)} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleManualUserCreate} className="p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input required value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl text-xs font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email ID</label>
                    <input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl text-xs font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Access Key</label>
                    <input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl text-xs font-bold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Designated Role</label>
                    <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-2xl text-[10px] font-black uppercase dark:text-white outline-none">
                       {customRoles.map(r => (
                         <option key={r.id} value={r.id}>{r.name}</option>
                       ))}
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsCreatingUser(false)} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase">Discard</button>
                    <button type="submit" className="flex-[2] py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase">Create & Activate</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Roles & Access Orchestrator</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define granular permission matrices</p>
             </div>
             <button 
              onClick={() => { setIsCreatingRole(true); setEditingRole(null); setNewRoleData({ name: '', description: '', permissions: DEFAULT_PERMISSIONS() }); }} 
              className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
             >
               + Create New Role
             </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {customRoles.map(role => (
               <div key={role.id} className="card-neo p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-tight">{role.name}</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase mt-1 tracking-tight">{role.description}</p>
                     </div>
                     {role.isSystem ? (
                       <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg text-[7px] font-black uppercase">System</span>
                     ) : (
                       <button 
                        onClick={() => { setEditingRole(role); setNewRoleData(role); setIsCreatingRole(true); }}
                        className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <i className="fas fa-edit text-xs"></i>
                       </button>
                     )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-3">Privilege Summary</p>
                     <div className="flex flex-wrap gap-1.5">
                        {RESOURCES.slice(0, 4).map(res => {
                          const resPermissions = role.permissions[res];
                          const hasFull = resPermissions && ACTIONS.every(a => resPermissions[a]);
                          const hasPartial = resPermissions && resPermissions.Read;
                          if (!hasPartial) return null;
                          return (
                            <span key={res} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${hasFull ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30'}`}>
                              {res}: {hasFull ? 'Full' : 'Read+'}
                            </span>
                          );
                        })}
                     </div>
                  </div>
               </div>
             ))}
          </div>

          {isCreatingRole && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up transition-colors">
                  <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingRole ? 'Edit Privilege Level' : 'Configure New Role'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Set granular access via the matrix below</p>
                     </div>
                     <button onClick={() => setIsCreatingRole(false)} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-[1.5rem] flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-times"></i></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-10 hide-scrollbar">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Identifier Name</label>
                           <input 
                              value={newRoleData.name}
                              onChange={e => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Nagpur Senior Agent"
                              className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-black dark:text-white outline-none focus:border-indigo-600 transition-colors shadow-inner"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope Description</label>
                           <input 
                              value={newRoleData.description}
                              onChange={e => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe the responsibilities..."
                              className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-bold dark:text-white outline-none focus:border-indigo-600 transition-colors shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3 ml-1">
                           <i className="fas fa-shield-alt text-indigo-500"></i>
                           <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Resource Permission Matrix</h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                           <table className="w-full border-collapse">
                              <thead>
                                 <tr>
                                    <th className="p-6 text-left bg-slate-50 dark:bg-slate-900/50 rounded-tl-[2rem] border-b dark:border-slate-700">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Master</span>
                                    </th>
                                    {ACTIONS.map(action => (
                                       <th key={action} className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{action}</span>
                                       </th>
                                    ))}
                                    <th className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-tr-[2rem] border-b dark:border-slate-700"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                 {RESOURCES.map(res => (
                                    <tr key={res} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                                       <td className="p-6 font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-tight">{res}</td>
                                       {ACTIONS.map(action => {
                                          const resourcePerms = newRoleData.permissions?.[res];
                                          const isActive = resourcePerms ? resourcePerms[action] : false;
                                          return (
                                             <td key={action} className="p-6 text-center">
                                                <button 
                                                   onClick={() => togglePermission(res, action)}
                                                   className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                                                      isActive 
                                                         ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                                         : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-transparent hover:border-indigo-300'
                                                   }`}
                                                >
                                                   <i className="fas fa-check text-xs"></i>
                                                </button>
                                             </td>
                                          );
                                       })}
                                       <td className="p-6">
                                          <button 
                                             onClick={() => {
                                                const allActions = ACTIONS.reduce((acc, a) => ({...acc, [a]: true}), {} as Record<ResourceAction, boolean>);
                                                setNewRoleData(prev => ({
                                                   ...prev,
                                                   permissions: { 
                                                      ...(prev.permissions || DEFAULT_PERMISSIONS()), 
                                                      [res]: allActions 
                                                   } as RolePermissions
                                                }));
                                             }}
                                             className="text-[8px] font-black text-indigo-400 uppercase hover:text-indigo-600 tracking-tighter"
                                          >
                                             Grant All
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 border-t border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
                     <button onClick={() => setIsCreatingRole(false)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Abandon</button>
                     <button onClick={handleSaveRole} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl">Apply Role Configuration</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="max-w-3xl mx-auto space-y-8">
           <div className="card-neo p-8 rounded-[3rem] text-center space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Bulk Data Injection</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select category and upload your CSV source</p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
                 {['Clients', 'Properties', 'Visits'].map(t => (
                   <button 
                     key={t}
                     onClick={() => setImportType(t as any)}
                     className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${importType === t ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {t}
                   </button>
                 ))}
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group py-16 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[3rem] hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer flex flex-col items-center gap-4"
              >
                 <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-inner">
                    <i className="fas fa-cloud-upload-alt text-2xl"></i>
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Upload {importType} Master List</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Standard UTF-8 .csv files only</p>
                 </div>
                 <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="card-neo p-8 rounded-[3rem] h-fit lg:sticky lg:top-36 transition-colors">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-8">Craft New Template</h3>
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Category</label>
                   <select 
                     value={newTemplate.category} 
                     onChange={e => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                     className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-500 transition-colors"
                   >
                      <option>Clients</option>
                      <option>Properties</option>
                      <option>Visits</option>
                      <option>General</option>
                   </select>
                </div>
                
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Insert Dynamic Fields</label>
                   <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {CATEGORY_FIELDS[newTemplate.category || 'General'].map(field => (
                        <button 
                          key={field}
                          onClick={() => insertPlaceholder(field)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black text-indigo-600 hover:border-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-sm"
                        >
                          {field}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                   <input 
                     value={newTemplate.name} 
                     onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="e.g. Possession Update"
                     className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-sm" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Body Content</label>
                   <textarea 
                     ref={textAreaRef}
                     value={newTemplate.message} 
                     onChange={e => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                     rows={6}
                     placeholder="Type your message here. Click chips above to insert variables..."
                     className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors shadow-sm"
                   />
                </div>
                <button 
                  onClick={handleSaveTemplate}
                  disabled={!newTemplate.name || !newTemplate.message}
                  className="w-full py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Publish Template
                </button>
             </div>
          </div>

          {/* Template List */}
          <div className="space-y-6">
             <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Template Repository</h4>
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-lg transition-colors">{templates.length} Active</span>
             </div>
             {templates.map(tpl => (
               <div key={tpl.id} className="card-neo p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 transition-colors group hover:border-indigo-400">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800 transition-colors mb-1.5 inline-block">{tpl.category}</span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{tpl.name}</h4>
                     </div>
                     <button className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                     <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 italic leading-relaxed">
                       {tpl.message.split(/(\{.*?\})/).map((part, i) => 
                         part.startsWith('{') ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-black not-italic">{part}</span> : part
                       )}
                     </p>
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
