
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell 
} from 'recharts';
import { UserProfile, Client, Property, SiteVisit, WhatsAppTemplate, CustomRole, ResourceAction, ResourceType, RolePermissions } from '../types';

interface AdminPanelProps {
  clients: Client[];
  properties: Property[];
  visits: SiteVisit[];
  pendingUsers: UserProfile[];
  onBulkImport: (type: 'Clients' | 'Properties' | 'Visits', data: any[]) => void;
  onApproveUser: (userId: string, status: UserProfile['approvalStatus'], role?: string) => void;
  checkPermission: (resource: ResourceType, action?: ResourceAction) => boolean;
  userRole: string;
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

const CSV_SCHEMAS = {
  Clients: ['firstName', 'lastName', 'mobile', 'email', 'address', 'budgetMin', 'budgetMax', 'priority', 'source'],
  Properties: ['title', 'description', 'type', 'listingType', 'area', 'city', 'priceMin', 'priceMax', 'possessionDate', 'reraId'],
  Visits: ['clientName', 'propertyName', 'scheduledAt', 'status']
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  clients, properties, visits, pendingUsers, onBulkImport, onApproveUser, checkPermission, userRole 
}) => {
  const canSeeTeam = checkPermission('Admin: Team');
  const canSeeRoles = checkPermission('Admin: Roles');
  const canSeeImport = checkPermission('Admin: Import');
  const canSeeTemplates = checkPermission('Admin: Templates');

  const [activeTab, setActiveTab] = useState<'approvals' | 'roles' | 'csv' | 'templates'>(() => {
    if (canSeeTeam) return 'approvals';
    if (canSeeRoles) return 'roles';
    if (canSeeImport) return 'csv';
    return 'templates';
  });

  const [teamSubTab, setTeamSubTab] = useState<'registry' | 'assign'>('registry');
  const [userSearch, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [viewingUserAnalytics, setViewingUserAnalytics] = useState<UserProfile | null>(null);

  // --- Assign Module State ---
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  // --- Roles Management Logic ---
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    if (saved) return JSON.parse(saved);
    
    const createFullPermissions = (allowed: boolean): RolePermissions => 
      RESOURCES.reduce((acc, r) => ({
        ...acc, 
        [r]: { Read: allowed, Add: allowed, Edit: allowed, Delete: allowed, Assign: allowed }
      }), {} as RolePermissions);

    return [
      { id: 'role_super_admin', name: 'Super Admin', description: 'Total control over entire system', permissions: createFullPermissions(true), isSystem: true },
      { id: 'role_admin', name: 'Admin', description: 'Regional operations management', permissions: createFullPermissions(true), isSystem: true },
      { id: 'role_agent', name: 'Sales Agent', description: 'Standard sales execution', permissions: RESOURCES.reduce((acc, r) => {
          const isSales = ['Leads', 'Properties', 'Site Visits', 'WhatsApp'].includes(r);
          return {...acc, [r]: {Read:isSales, Add:isSales, Edit:isSales, Delete:false, Assign:false}};
        }, {} as RolePermissions), isSystem: true }
    ];
  });

  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  const handleEditRole = (role: CustomRole) => setEditingRole({ ...role });
  
  const handleCreateRole = () => setEditingRole({
    id: `role_${Math.random().toString(36).substr(2, 5)}`,
    name: '',
    description: '',
    permissions: RESOURCES.reduce((acc, r) => ({ 
      ...acc, 
      [r]: { Read: false, Add: false, Edit: false, Delete: false, Assign: false } 
    }), {} as RolePermissions),
    isSystem: false
  });

  const handleTogglePermission = (resource: string, action: ResourceAction) => {
    if (!editingRole) return;
    const current = editingRole.permissions[resource]?.[action] || false;
    setEditingRole({
      ...editingRole,
      permissions: {
        ...editingRole.permissions,
        [resource]: {
          ...(editingRole.permissions[resource] || { Read: false, Add: false, Edit: false, Delete: false, Assign: false }),
          [action]: !current
        }
      }
    });
  };

  const saveRole = () => {
    if (!editingRole?.name) return alert("Role name is required");
    const updated = editingRole.isSystem 
      ? customRoles.map(r => r.id === editingRole.id ? editingRole : r)
      : customRoles.some(r => r.id === editingRole.id) 
        ? customRoles.map(r => r.id === editingRole.id ? editingRole : r)
        : [...customRoles, editingRole];
    
    setCustomRoles(updated);
    localStorage.setItem('ef_custom_roles', JSON.stringify(updated));
    setEditingRole(null);
  };

  const deleteRole = (id: string) => {
    if (!window.confirm("Permanently delete this role? Users assigned to it will lose access.")) return;
    const updated = customRoles.filter(r => r.id !== id);
    setCustomRoles(updated);
    localStorage.setItem('ef_custom_roles', JSON.stringify(updated));
  };

  // --- Data Pump Logic ---
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'Clients' | 'Properties' | 'Visits'>('Clients');

  const downloadSampleCSV = (type: keyof typeof CSV_SCHEMAS) => {
    const headers = CSV_SCHEMAS[type].join(',');
    const sampleRow = CSV_SCHEMAS[type].map(h => `Sample_${h}`).join(',');
    const blob = new Blob([`${headers}\n${sampleRow}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EstateFlow_${type}_Schema.csv`;
    a.click();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim());
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i];
        });
        if (importType === 'Clients') {
          obj.id = `CL-IMP-${Math.floor(Math.random() * 10000)}`;
          obj.createdAt = new Date().toISOString();
          obj.budgetMin = Number(obj.budgetMin) || 0;
          obj.budgetMax = Number(obj.budgetMax) || 10000000;
          obj.nurturingScore = 50;
          obj.locations = [obj.address];
          obj.configuration = ['2BHK'];
        } else if (importType === 'Properties') {
          obj.id = `P-IMP-${Math.floor(Math.random() * 10000)}`;
          obj.financials = { priceMin: Number(obj.priceMin) || 0, priceMax: Number(obj.priceMax) || 0 };
          obj.location = { area: obj.area, city: obj.city };
        } else {
          obj.id = `SV-IMP-${Math.floor(Math.random() * 10000)}`;
        }
        return obj;
      });
      onBulkImport(importType, data);
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- WhatsApp Template Logic ---
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('ef_wa_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<WhatsAppTemplate>>({ category: 'Clients', name: '', message: '', attachments: [] });

  const saveTemplate = () => {
    if (!newTemplate.name || !newTemplate.message || !newTemplate.category) {
      alert("Please fill name, category and message body.");
      return;
    }
    const tpl: WhatsAppTemplate = { 
      ...newTemplate as WhatsAppTemplate, 
      id: `TPL-${Math.random().toString(36).substr(2, 5).toUpperCase()}` 
    };
    const updated = [...templates, tpl];
    setTemplates(updated);
    localStorage.setItem('ef_wa_templates', JSON.stringify(updated));
    setIsCreatingTemplate(false);
    setNewTemplate({ category: 'Clients', name: '', message: '', attachments: [] });
  };

  const deleteTemplate = (id: string) => {
    if (!window.confirm("Remove this WhatsApp script?")) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('ef_wa_templates', JSON.stringify(updated));
  };

  // --- User Management ---
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  useEffect(() => {
    const registryJson = localStorage.getItem('ef_user_registry');
    if (registryJson) setAllUsers(JSON.parse(registryJson));
  }, [pendingUsers]);

  const handleUpdateUserRole = (userId: string, role: string) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, role } : u);
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = allUsers.map(u => {
      if (u.id === userId) {
        const newStatus = u.approvalStatus === 'Deactivated' ? 'Approved' : 'Deactivated';
        return { ...u, approvalStatus: newStatus as any };
      }
      return u;
    });
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
  };

  const handleDeleteUser = (userId: string) => {
    if (!window.confirm("Permanently delete this user?")) return;
    const updated = allUsers.filter(u => u.id !== userId);
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newUser: UserProfile = {
      id: `U-${Math.random().toString(36).substr(2, 9)}`,
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string || '12345',
      role: fd.get('role') as string,
      managerId: fd.get('managerId') as string || undefined,
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString()
    };
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setIsAddUserModalOpen(false);
  };

  const handleCommitAssign = () => {
    if (!selectedAssigneeId || !selectedManagerId) return;
    if (selectedAssigneeId === selectedManagerId) {
      alert("A user cannot report to themselves.");
      return;
    }
    const updated = allUsers.map(u => u.id === selectedAssigneeId ? { ...u, managerId: selectedManagerId } : u);
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    alert("Hierarchy updated successfully.");
    setSelectedAssigneeId(null);
    setSelectedManagerId(null);
  };

  const registryUsers = allUsers.filter(u => u.approvalStatus === 'Approved' || u.approvalStatus === 'Deactivated');
  const filteredRegistry = registryUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Not Assigned';
    const manager = allUsers.find(u => u.id === managerId);
    return manager ? manager.name : 'Unknown';
  };

  const getCategoryColor = (cat?: string) => {
    switch(cat) {
      case 'Clients': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Properties': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Visits': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up pb-28">
      {/* Admin Nav */}
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors w-full overflow-x-auto no-scrollbar">
        {canSeeTeam && <button onClick={() => setActiveTab('approvals')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Team Hierarchy</button>}
        {canSeeRoles && <button onClick={() => setActiveTab('roles')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Roles & Security</button>}
        {canSeeImport && <button onClick={() => setActiveTab('csv')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Data Pump</button>}
        {canSeeTemplates && <button onClick={() => setActiveTab('templates')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>WhatsApp Scripts</button>}
      </div>

      {activeTab === 'roles' && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Control</h3>
              </div>
              <button onClick={handleCreateRole} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                 <i className="fas fa-plus mr-2"></i> New Authority Tier
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customRoles.map(role => (
                <div key={role.id} className="card-neo p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col justify-between group">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 text-[8px] font-black rounded-lg uppercase tracking-widest border ${role.isSystem ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{role.isSystem ? 'System' : 'Custom'}</span>
                        {!role.isSystem && (
                          <button onClick={() => deleteRole(role.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{role.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">{role.description}</p>
                   </div>
                   <div className="mt-8 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Tiers: {Object.values(role.permissions).flat().filter(v => Object.values(v).includes(true)).length} Active</span>
                      <button onClick={() => handleEditRole(role)} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase hover:underline">Edit Permissions</button>
                   </div>
                </div>
              ))}
           </div>

           {editingRole && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                   <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center">
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingRole.name || 'New Authority Tier'}</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure permission matrix across all modules</p>
                      </div>
                      <button onClick={() => setEditingRole(null)} className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Designation</label><input value={editingRole.name} onChange={e => setEditingRole({...editingRole, name: e.target.value})} placeholder="e.g. Area Manager" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contextual Bio</label><input value={editingRole.description} onChange={e => setEditingRole({...editingRole, description: e.target.value})} placeholder="Describe authority scope" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
                      </div>

                      <div className="overflow-x-auto rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-inner">
                         <table className="w-full text-left">
                            <thead>
                               <tr className="bg-slate-50 dark:bg-slate-900/50">
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Module / Asset</th>
                                  {ACTIONS.map(action => <th key={action} className="px-4 py-4 text-[9px] font-black text-slate-400 text-center uppercase tracking-widest">{action}</th>)}
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                               {RESOURCES.map(res => (
                                 <tr key={res} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{res}</td>
                                    {ACTIONS.map(action => (
                                      <td key={action} className="px-4 py-4 text-center">
                                         <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="hidden" checked={editingRole.permissions[res]?.[action] || false} onChange={() => handleTogglePermission(res, action)} />
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${editingRole.permissions[res]?.[action] ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
                                               {editingRole.permissions[res]?.[action] && <i className="fas fa-check text-[10px]"></i>}
                                            </div>
                                         </label>
                                      </td>
                                    ))}
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   <div className="p-10 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
                      <button onClick={() => setEditingRole(null)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest">Discard Changes</button>
                      <button onClick={saveRole} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl">Commit Registry Update</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'csv' && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex items-center gap-3 px-4">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Data Pump Interface</h3>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['Clients', 'Properties', 'Visits'] as const).map(type => (
                <div key={type} className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center space-y-6 group hover:border-emerald-400 transition-all">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform">
                      <i className={`fas ${type === 'Clients' ? 'fa-users' : type === 'Properties' ? 'fa-building' : 'fa-calendar-check'} text-3xl text-emerald-500`}></i>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">{type}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bulk {type.toLowerCase()} synchronization</p>
                   </div>
                   <div className="space-y-3">
                      <button onClick={() => downloadSampleCSV(type)} className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-all">
                         <i className="fas fa-file-download mr-2"></i> Download Schema
                      </button>
                      <button onClick={() => { setImportType(type); csvInputRef.current?.click(); }} className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                         <i className="fas fa-file-upload mr-2"></i> Upload Assets
                      </button>
                   </div>
                </div>
              ))}
           </div>
           <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCSVUpload} />
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Interaction Scripts</h3>
              </div>
              <button onClick={() => setIsCreatingTemplate(true)} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                <i className="fas fa-plus-circle mr-2"></i> New Script
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tpl => (
                <div key={tpl.id} className="card-neo p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col justify-between group transition-all hover:border-emerald-300">
                  <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-colors ${getCategoryColor(tpl.category)}`}>
                          {tpl.category}
                        </span>
                        <button onClick={() => deleteTemplate(tpl.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><i className="fas fa-trash"></i></button>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{tpl.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-3 line-clamp-4 leading-relaxed transition-colors">"{tpl.message}"</p>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem]">
                   <i className="fab fa-whatsapp text-slate-100 dark:text-slate-800 text-[100px] mb-6"></i>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No WhatsApp Scripts Found</p>
                </div>
              )}
           </div>

           {isCreatingTemplate && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                   <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center transition-colors">
                      <div>
                         <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Create Script</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Design message templates with categories</p>
                      </div>
                      <button onClick={() => setIsCreatingTemplate(false)} className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Script Category</label>
                        <select 
                          value={newTemplate.category} 
                          onChange={e => setNewTemplate({...newTemplate, category: e.target.value as any})}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all"
                        >
                          <option value="Clients">Clients</option>
                          <option value="Properties">Properties</option>
                          <option value="Visits">Visits</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Script Name</label>
                        <input 
                          value={newTemplate.name} 
                          onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                          placeholder="e.g. Post-Visit Brochure Sharing" 
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                        <textarea 
                          value={newTemplate.message} 
                          onChange={e => setNewTemplate({...newTemplate, message: e.target.value})}
                          placeholder="Write your message here..." 
                          rows={6}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-medium dark:text-white outline-none focus:border-indigo-600 transition-all" 
                        />
                      </div>
                   </div>

                   <div className="p-10 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
                      <button onClick={() => setIsCreatingTemplate(false)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest">Discard</button>
                      <button onClick={saveTemplate} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl">Deploy Script</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-10 animate-slide-up">
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 w-fit">
              <button onClick={() => setTeamSubTab('registry')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${teamSubTab === 'registry' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Registry</button>
              <button onClick={() => setTeamSubTab('assign')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${teamSubTab === 'assign' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Assign Module</button>
           </div>

           {teamSubTab === 'registry' && (
             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Personnel</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search team..." className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <button onClick={() => setIsAddUserModalOpen(true)} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                      <i className="fas fa-user-plus mr-2"></i> Provision Account
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                          <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                          <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority Tier</th>
                          <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Superior</th>
                          <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {filteredRegistry.map(user => (
                          <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewingUserAnalytics(user)}>
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">{user.name[0]}</div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight group-hover:text-indigo-600 transition-colors">{user.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <select 
                                value={user.role} 
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)} 
                                className="bg-indigo-50 dark:bg-indigo-900/30 border-none text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase outline-none cursor-pointer rounded-lg px-3 py-2 transition-colors"
                              >
                                {customRoles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                              </select>
                            </td>
                            <td className="px-8 py-5">
                               <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                                 {getManagerName(user.managerId)}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${user.approvalStatus === 'Deactivated' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{user.approvalStatus}</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setViewingUserAnalytics(user)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Audit</button>
                                <button onClick={() => handleToggleUserStatus(user.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${user.approvalStatus === 'Deactivated' ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-500 hover:text-white'}`}><i className="fas fa-power-off text-[10px]"></i></button>
                                <button onClick={() => handleDeleteUser(user.id)} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 hover:bg-red-600 hover:text-white transition-all"><i className="fas fa-trash text-[10px]"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>
           )}

           {teamSubTab === 'assign' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                <div className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 space-y-6 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-user-tag"></i></div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Step 1: Subordinate</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select user to reassign</p>
                      </div>
                   </div>
                   <div className="relative">
                      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} placeholder="Search for user..." className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 border border-slate-100 dark:border-slate-800 transition-all" />
                   </div>
                   <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
                      {allUsers.filter(u => u.name.toLowerCase().includes(assignSearch.toLowerCase())).map(u => (
                        <div 
                          key={u.id} 
                          onClick={() => setSelectedAssigneeId(u.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedAssigneeId === u.id ? 'bg-indigo-600 border-indigo-600 shadow-lg text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-400'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedAssigneeId === u.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{u.name[0]}</div>
                              <div className="text-left">
                                 <p className={`text-[11px] font-black uppercase leading-none mb-1 ${selectedAssigneeId === u.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{u.name}</p>
                                 <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedAssigneeId === u.id ? 'text-indigo-100' : 'text-slate-400'}`}>{u.role}</p>
                              </div>
                           </div>
                           {selectedAssigneeId === u.id && <i className="fas fa-check-circle"></i>}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="card-neo p-8 rounded-[3rem] bg-white dark:bg-slate-800 space-y-6 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-user-shield"></i></div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Step 2: Superior</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select the manager</p>
                      </div>
                   </div>
                   <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-2">
                      {allUsers.filter(u => u.id !== selectedAssigneeId).map(u => (
                        <div 
                          key={u.id} 
                          onClick={() => setSelectedManagerId(u.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${selectedManagerId === u.id ? 'bg-emerald-600 border-emerald-600 shadow-lg text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-400'}`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedManagerId === u.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{u.name[0]}</div>
                              <div className="text-left">
                                 <p className={`text-[11px] font-black uppercase leading-none mb-1 ${selectedManagerId === u.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{u.name}</p>
                                 <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedManagerId === u.id ? 'text-emerald-100' : 'text-slate-400'}`}>{u.role}</p>
                              </div>
                           </div>
                           {selectedManagerId === u.id && <i className="fas fa-star"></i>}
                        </div>
                      ))}
                   </div>
                   {selectedAssigneeId && selectedManagerId && (
                     <div className="pt-6 animate-slide-up">
                        <button 
                          onClick={handleCommitAssign}
                          className="w-full py-5 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20"
                        >
                          Commit Hierarchy Update
                        </button>
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up transition-colors">
              <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center transition-colors">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Provision User</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Account Creation</p>
                 </div>
                 <button onClick={() => setIsAddUserModalOpen(false)} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleCreateUser} className="p-10 space-y-5">
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label><input name="name" required placeholder="Full Name" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label><input name="email" type="email" required placeholder="Email Address" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-colors" /></div>
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label><input name="password" type="text" placeholder="Default: 12345" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Authority Tier</label>
                    <select name="role" required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all transition-colors">{customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reporting Manager</label>
                    <select name="managerId" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all transition-colors">
                       <option value="">None / Independent</option>
                       {registryUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">Discard</button>
                    <button type="submit" className="flex-[2] py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Deploy Profile</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {viewingUserAnalytics && (
        <UserPerformanceModal 
          user={viewingUserAnalytics} 
          clients={clients} 
          visits={visits} 
          properties={properties} 
          onClose={() => setViewingUserAnalytics(null)} 
        />
      )}
    </div>
  );
};

const UserPerformanceModal: React.FC<{ user: UserProfile, clients: Client[], visits: SiteVisit[], properties: Property[], onClose: () => void }> = ({ user, clients, visits, properties, onClose }) => {
  const userLeads = useMemo(() => clients.filter(c => c.agent === user.name || c.id.includes(user.id)), [user, clients]);
  const userVisits = useMemo(() => visits.filter(v => userLeads.some(ul => ul.id === v.clientId)), [userLeads, visits]);
  const activityDistribution = [
    { name: 'Leads', value: userLeads.length },
    { name: 'Visits', value: userVisits.length },
    { name: 'Deals', value: userVisits.filter(v => v.status === 'Completed').length }
  ];
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[350] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col transition-colors border border-white/20">
        <div className="p-10 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0 transition-colors">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg uppercase transition-colors">{user.name[0]}</div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight transition-colors">{user.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Intelligence Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
           <div className="h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 shadow-inner transition-colors">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={activityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b', style: { textTransform: 'uppercase' }}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                       {activityDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 justify-end transition-colors">
           <button onClick={onClose} className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Dismiss Audit</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
