
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { UserProfile, Client, Property, SiteVisit, WhatsAppTemplate, CustomRole, ResourceAction, ResourceType, RolePermissions, UserRole, ClientType, ClientStatus } from '../types';

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

const CATEGORY_ATTRIBUTES: Record<string, string[]> = {
  'Clients': ['firstName', 'lastName', 'mobile', 'email', 'budgetMax', 'priority', 'agent'],
  'Properties': ['title', 'type', 'listingType', 'area', 'priceMin', 'possessionDate', 'id'],
  'Visits': ['clientName', 'propertyName', 'scheduledAt', 'status'],
  'General': ['companyName', 'currentDate', 'agentName']
};

const CSV_SCHEMAS = {
  Clients: ['salutation', 'firstName', 'lastName', 'mobile', 'email', 'address', 'budgetMin', 'budgetMax', 'priority', 'source'],
  Properties: ['title', 'description', 'type', 'listingType', 'area', 'city', 'priceMin', 'priceMax', 'possessionDate', 'reraId']
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

  const [teamSubTab, setTeamSubTab] = useState<'registry' | 'transfer'>('registry');
  const [userSearch, setUserSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [viewingUserAnalytics, setViewingUserAnalytics] = useState<UserProfile | null>(null);

  const [sourceAgentId, setSourceAgentId] = useState('');
  const [targetAgentId, setTargetAgentId] = useState('');

  const [importType, setImportType] = useState<'Clients' | 'Properties'>('Clients');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadExampleCSV = () => {
    const headers = CSV_SCHEMAS[importType].join(',');
    const exampleRow = importType === 'Clients' 
      ? 'Mr.,John,Doe,9876543210,john@example.com,Nagpur,2000000,5000000,Hot,Portal'
      : 'Luxury Villa,Large 4BHK Villa,Villa,Sale,Mihan,Nagpur,15000000,20000000,2025-12-31,RERA12345';
    const blob = new Blob([`${headers}\n${exampleRow}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EstateFlow_${importType}_Template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, i) => {
          obj[header] = values[i];
          return obj;
        }, {} as any);
      });
      setCsvPreview(parsedData);
    };
    reader.readAsText(file);
  };

  const commitCSVImport = () => {
    if (csvPreview.length === 0) return;
    onBulkImport(importType === 'Clients' ? 'Clients' : 'Properties', csvPreview);
    setCsvPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert(`${csvPreview.length} records successfully injected.`);
  };

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('ef_wa_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<WhatsAppTemplate>>({ category: 'Clients', name: '', message: '' });
  const templateTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const insertAttribute = (attr: string) => {
    const textarea = templateTextAreaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{${attr}}`;
    const text = newTemplate.message || '';
    const updated = text.substring(0, start) + placeholder + text.substring(end);
    setNewTemplate({ ...newTemplate, message: updated });
    setTimeout(() => {
      textarea.focus();
      textarea.setRangeText(placeholder, start, end, 'end');
    }, 0);
  };

  const saveTemplate = () => {
    if (!newTemplate.name || !newTemplate.message) return;
    const tpl: WhatsAppTemplate = { ...newTemplate as WhatsAppTemplate, id: `TPL-${Math.random().toString(36).substr(2, 5).toUpperCase()}` };
    const updated = [...templates, tpl];
    setTemplates(updated);
    localStorage.setItem('ef_wa_templates', JSON.stringify(updated));
    setIsCreatingTemplate(false);
    setNewTemplate({ category: 'Clients', name: '', message: '' });
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('ef_wa_templates', JSON.stringify(updated));
  };

  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'role_super_admin', name: 'Super Admin', description: 'Total control over entire system', permissions: RESOURCES.reduce((acc, r) => ({...acc, [r]: {Read:true, Add:true, Edit:true, Delete:true, Assign:true}}), {}), isSystem: true },
      { id: 'role_admin', name: 'Admin', description: 'Regional operations management', permissions: RESOURCES.reduce((acc, r) => ({...acc, [r]: {Read:true, Add:true, Edit:true, Delete:true, Assign:true}}), {}), isSystem: true },
      { id: 'role_manager', name: 'Sales Manager', description: 'Lead assignment & team reporting', permissions: RESOURCES.reduce((acc, r) => {
          const isFull = ['Leads', 'Properties', 'Site Visits', 'Reports', 'Admin: Team'].includes(r);
          return {...acc, [r]: {Read:true, Add:isFull, Edit:isFull, Delete:false, Assign:isFull}};
        }, {}), isSystem: true },
      { id: 'role_agent', name: 'Sales Agent', description: 'Standard sales execution', permissions: RESOURCES.reduce((acc, r) => {
          const isSales = ['Leads', 'Properties', 'Site Visits', 'WhatsApp'].includes(r);
          return {...acc, [r]: {Read:isSales, Add:isSales, Edit:isSales, Delete:false, Assign:false}};
        }, {}), isSystem: true }
    ];
  });

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newUser: UserProfile = {
      id: `U-${Math.random().toString(36).substr(2, 9)}`,
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      role: fd.get('role') as string,
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString()
    };
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setIsAddUserModalOpen(false);
  };

  const handleCreateRole = (role: CustomRole) => {
    const updated = [...customRoles, role];
    setCustomRoles(updated);
    localStorage.setItem('ef_custom_roles', JSON.stringify(updated));
    setIsCreateRoleModalOpen(false);
  };

  const approvalQueue = allUsers.filter(u => u.approvalStatus === 'Pending');
  const registryUsers = allUsers.filter(u => u.approvalStatus === 'Approved' || u.approvalStatus === 'Deactivated');
  const filteredRegistry = registryUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <div className="space-y-8 animate-slide-up pb-28">
      {/* Centralized Admin Navigation Bar */}
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors w-full overflow-x-auto no-scrollbar">
        {canSeeTeam && (
          <button 
            onClick={() => setActiveTab('approvals')} 
            className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Team Hierarchy
          </button>
        )}
        {canSeeRoles && (
          <button 
            onClick={() => setActiveTab('roles')} 
            className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Roles
          </button>
        )}
        {canSeeImport && (
          <button 
            onClick={() => setActiveTab('csv')} 
            className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Data Pump
          </button>
        )}
        {canSeeTemplates && (
          <button 
            onClick={() => setActiveTab('templates')} 
            className={`flex-1 min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            WhatsApp Template
          </button>
        )}
      </div>

      {activeTab === 'csv' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
           <div className="card-neo rounded-[3rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-10 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">ETL Injection Module</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bulk create records from CSV manifest</p>
                 </div>
                 <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                    <button onClick={() => setImportType('Clients')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${importType === 'Clients' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Leads</button>
                    <button onClick={() => setImportType('Properties')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${importType === 'Properties' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Properties</button>
                 </div>
              </div>
              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">1. Download Blueprint</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Ensure your data matches the system's required schema.</p>
                       <button onClick={downloadExampleCSV} className="w-full py-4 btn-3d btn-3d-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                         <i className="fas fa-file-csv text-emerald-500"></i> Download {importType} Template
                       </button>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">2. Upload Manifest</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed">Select your modified CSV file to parse the records.</p>
                       <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
                       <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 btn-3d btn-3d-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                         <i className="fas fa-upload"></i> Choose CSV File
                       </button>
                    </div>
                 </div>
                 {csvPreview.length > 0 && (
                   <div className="space-y-6 pt-6 border-t dark:border-slate-700 animate-slide-up">
                      <div className="flex justify-between items-center px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Injection Readiness Preview ({csvPreview.length} records)</h4>
                        <button onClick={() => setCsvPreview([])} className="text-red-500 text-[9px] font-black uppercase">Clear All</button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar border border-slate-100 dark:border-slate-700 rounded-[2rem] bg-slate-50 dark:bg-slate-900/40">
                         <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                               <tr className="border-b dark:border-slate-700">
                                  {Object.keys(csvPreview[0]).map(k => (
                                    <th key={k} className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{k}</th>
                                  ))}
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                               {csvPreview.map((row, i) => (
                                 <tr key={i} className="hover:bg-indigo-50/20">
                                    {Object.values(row).map((v: any, j) => (
                                      <td key={j} className="px-6 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{v}</td>
                                    ))}
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <button onClick={commitCSVImport} className="w-full py-5 btn-3d btn-3d-emerald text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl">
                        Commit Injection Flow
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Interaction Templates</h3>
              </div>
              <button onClick={() => setIsCreatingTemplate(true)} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                <i className="fas fa-plus-circle mr-2"></i> New Template
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tpl => (
                <div key={tpl.id} className="card-neo p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col justify-between group transition-all hover:border-emerald-300">
                   <div>
                      <div className="flex justify-between items-start mb-4">
                         <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-lg uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">{tpl.category}</span>
                         <button onClick={() => deleteTemplate(tpl.id)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                           <i className="fas fa-trash-alt text-[10px]"></i>
                         </button>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{tpl.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-3 line-clamp-4 leading-relaxed">"{tpl.message}"</p>
                   </div>
                   <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase">ID: {tpl.id}</span>
                      <button className="text-[9px] font-black text-emerald-600 uppercase hover:underline">Edit Blueprint</button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-10 animate-slide-up">
           <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 w-fit">
              <button onClick={() => setTeamSubTab('registry')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${teamSubTab === 'registry' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Registry & Queue</button>
              <button onClick={() => setTeamSubTab('transfer')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${teamSubTab === 'transfer' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Lead Transfers</button>
           </div>

           {teamSubTab === 'registry' && (
             <div className="space-y-12">
                {approvalQueue.length > 0 && (
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Approval Queue</h3>
                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg">{approvalQueue.length} Pending</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvalQueue.map(user => (
                          <div key={user.id} className="card-neo p-8 rounded-[3rem] border border-amber-100 dark:border-amber-900 bg-white dark:bg-slate-800/50 transition-colors animate-slide-up">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">{user.name[0]}</div>
                                <div className="min-w-0">
                                   <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">{user.name}</h4>
                                   <p className="text-[10px] font-bold text-slate-400 truncate">{user.email}</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onApproveUser(user.id, 'Rejected')} className="py-4 btn-3d btn-3d-white rounded-2xl text-[9px] font-black uppercase tracking-widest text-red-500">Decline</button>
                                <button onClick={() => onApproveUser(user.id, 'Approved', 'role_agent')} className="py-4 btn-3d btn-3d-emerald text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg">Approve</button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                <div className="space-y-6">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                         <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Personnel Registry</h3>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                           <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                           <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search team..." className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <button onClick={() => setIsAddUserModalOpen(true)} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                           <i className="fas fa-user-plus mr-2"></i> Add Account
                        </button>
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead>
                               <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identify</th>
                                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority Tier</th>
                                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Manager Oversight</th>
                                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Performance & Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                               {filteredRegistry.map(user => (
                                 <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-8 py-5">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">{user.name[0]}</div>
                                          <div>
                                             <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{user.name}</p>
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
                                       <select 
                                         value={(user as any).reportingTo || ''} 
                                         onChange={(e) => {
                                           const updated = allUsers.map(u => u.id === user.id ? { ...u, reportingTo: e.target.value } : u);
                                           localStorage.setItem('ef_user_registry', JSON.stringify(updated));
                                           setAllUsers(updated);
                                         }} 
                                         className="bg-slate-50 dark:bg-slate-900/50 border-none text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase outline-none cursor-pointer rounded-lg px-3 py-2 transition-colors"
                                       >
                                          <option value="">-- Independent --</option>
                                          {registryUsers.filter(ru => ru.id !== user.id).map(ru => (
                                            <option key={ru.id} value={ru.id}>{ru.name}</option>
                                          ))}
                                       </select>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => setViewingUserAnalytics(user)}
                                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 dark:border-indigo-900"
                                            title="Deep Performance Analysis"
                                          >
                                            <i className="fas fa-chart-pie mr-1.5"></i> Audit Performance
                                          </button>
                                          <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 mx-1"></div>
                                          <span className={`w-2 h-2 rounded-full ${user.approvalStatus === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase">{user.approvalStatus}</span>
                                       </div>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {teamSubTab === 'transfer' && (
             <div className="max-w-2xl mx-auto animate-slide-up">
                <div className="card-neo p-12 rounded-[3.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-10 shadow-2xl">
                   <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto shadow-xl"><i className="fas fa-project-diagram text-2xl"></i></div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Portfolio Governance</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execute mass lead migration between agents</p>
                   </div>
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Donor Agent (From)</label>
                         <select value={sourceAgentId} onChange={e => setSourceAgentId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all">
                            <option value="">Select source agent...</option>
                            {registryUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                         </select>
                      </div>
                      <div className="flex justify-center py-2"><div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300"><i className="fas fa-exchange-alt"></i></div></div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Agent (To)</label>
                         <select value={targetAgentId} onChange={e => setTargetAgentId(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all">
                            <option value="">Select recipient agent...</option>
                            {registryUsers.filter(u => u.id !== sourceAgentId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                         </select>
                      </div>
                   </div>
                   <button onClick={() => { setSourceAgentId(''); setTargetAgentId(''); alert('Portfolio Reassigned'); }} disabled={!sourceAgentId || !targetAgentId} className={`w-full py-5 btn-3d rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl transition-all ${sourceAgentId && targetAgentId ? 'btn-3d-indigo text-white shadow-indigo-100' : 'bg-slate-100 text-slate-300'}`}>
                     Authorize Global Transfer
                   </button>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Security Access Control</h3>
             </div>
             <button onClick={() => setIsCreateRoleModalOpen(true)} className="px-6 py-3 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
               <i className="fas fa-plus-circle mr-2"></i> Create Authority Policy
             </button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {customRoles.map(role => (
                <div key={role.id} className="card-neo p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 transition-colors bg-white dark:bg-slate-800 flex flex-col justify-between group overflow-hidden relative shadow-md">
                   {role.isSystem && (
                     <div className="absolute top-0 right-0 p-4">
                        <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-bl-3xl">System Root</span>
                     </div>
                   )}
                   <div>
                     <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tight">{role.name}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest leading-relaxed">{role.description}</p>
                     <div className="mt-10 grid grid-cols-2 gap-y-8 gap-x-12">
                        {RESOURCES.map(res => {
                          const perms = role.permissions[res] || { Read: false, Add: false, Edit: false, Delete: false, Assign: false };
                          const hasAny = Object.values(perms).some(v => v);
                          if (!hasAny) return null;
                          return (
                            <div key={res} className="space-y-3">
                               <p className="text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter flex items-center gap-1.5"><div className="w-1 h-1 bg-indigo-400 rounded-full"></div> {res}</p>
                               <div className="flex flex-wrap gap-2">
                                  {Object.entries(perms).map(([act, val]) => val && (
                                    <span key={act} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[7px] font-black uppercase" title={act}>{act}</span>
                                  ))}
                               </div>
                            </div>
                          );
                        })}
                     </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up transition-colors">
              <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Manual Provisioning</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct User Account Creation</p>
                 </div>
                 <button onClick={() => setIsAddUserModalOpen(false)} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleCreateUser} className="p-10 space-y-6">
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label><input name="name" required placeholder="Full Name" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
                 <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label><input name="email" type="email" required placeholder="Email Address" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-500 transition-all" /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Type</label>
                       <select name="role" required className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all">{customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Superior Oversight</label>
                       <select name="reportingTo" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black dark:text-white outline-none focus:border-indigo-600 transition-all"><option value="">Independent</option>{registryUsers.map(ru => <option key={ru.id} value={ru.id}>{ru.name}</option>)}</select>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
                    <button type="submit" className="flex-[2] py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Deploy Profile</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isCreateRoleModalOpen && (
        <CreateRoleModal onClose={() => setIsCreateRoleModalOpen(false)} onSave={handleCreateRole} />
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
  const completedVisits = useMemo(() => userVisits.filter(v => v.status === 'Completed'), [userLeads, userVisits]);
  const hotLeads = useMemo(() => userLeads.filter(c => c.priority === ClientStatus.HOT), [userLeads]);
  
  // Daily Metrics for Admin Review
  const dailyMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInteractions = userLeads.flatMap(c => c.interactions || [])
      .filter(i => i.timestamp.startsWith(todayStr));
    const todayCalls = todayInteractions.filter(i => i.type === 'Call');
    const connectedCalls = todayCalls.filter(i => {
      const d = i.description.toLowerCase();
      return d.includes('contacted') || d.includes('schedule visit') || d.includes('callback');
    });
    const todayVisits = userVisits.filter(v => v.scheduledAt.startsWith(todayStr));

    return {
      callsToday: todayCalls.length,
      connectedToday: connectedCalls.length,
      visitsToday: todayVisits.length
    };
  }, [userLeads, userVisits]);

  const revenueData = useMemo(() => {
    const closedCount = userVisits.filter(v => v.feedback?.nextAction === 'Deal' && v.feedback?.bookingFormUploaded).length;
    return {
      closed: closedCount,
      revenue: closedCount * 7500000, 
      pipeline: hotLeads.length * 5000000 
    };
  }, [userVisits, hotLeads]);

  const activityDistribution = [
    { name: 'Leads', value: userLeads.length },
    { name: 'Visits', value: userVisits.length },
    { name: 'Deals', value: revenueData.closed }
  ];

  const leadPriorityShare = [
    { name: 'Hot', value: hotLeads.length, color: '#ef4444' },
    { name: 'Warm', value: userLeads.filter(c => c.priority === ClientStatus.WARM).length, color: '#4f46e5' },
    { name: 'Cold', value: userLeads.filter(c => c.priority === ClientStatus.COLD).length, color: '#94a3b8' },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[350] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col transition-colors border border-white/20">
        <div className="p-10 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg uppercase">{user.name[0]}</div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{user.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Intelligence Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
           {/* Daily KPI Snapshot */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                 <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Real-time Daily Pulse</h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <AdminMetricCard label="Calls Logged" value={dailyMetrics.callsToday} color="indigo" icon="fa-phone-volume" sub="Today" />
                 <AdminMetricCard label="Lead Connections" value={dailyMetrics.connectedToday} color="emerald" icon="fa-user-check" sub="Connected" />
                 <AdminMetricCard label="Visits Planned" value={dailyMetrics.visitsToday} color="purple" icon="fa-calendar-day" sub="Scheduled" />
              </div>
           </div>

           {/* Core Performance Histograms & Ratios */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Pipeline Volume</h5>
                 </div>
                 <div className="h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={activityDistribution}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b', textTransform: 'uppercase'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b'}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                             {activityDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                    <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Lead Maturity Ratio</h5>
                 </div>
                 <div className="h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 shadow-inner flex flex-col justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                            data={leadPriorityShare} 
                            innerRadius={55} outerRadius={75} 
                            paddingAngle={5} dataKey="value"
                            stroke="none"
                          >
                             {leadPriorityShare.map((entry, index) => (
                                <Cell key={`cell-p-${index}`} fill={entry.color} />
                             ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{fontSize: '9px', fontWeight: 800, textTransform: 'uppercase'}} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Conversion Timeline */}
           <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                 <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Recent Performance Timeline</h5>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] overflow-hidden shadow-sm">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-700">
                       <tr>
                          <th className="px-8 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">Disposition</th>
                          <th className="px-8 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">Lead Identity</th>
                          <th className="px-8 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Logged At</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                       {userVisits.slice(0, 8).map(v => (
                          <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                             <td className="px-8 py-4">
                                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border ${v.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{v.status} Tour</span>
                             </td>
                             <td className="px-8 py-4"><p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate max-w-[200px]">{v.clientName}</p></td>
                             <td className="px-8 py-4 text-right"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(v.scheduledAt).toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {userVisits.length === 0 && <div className="py-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">No audit data captured</div>}
              </div>
           </div>
        </div>

        <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 justify-end transition-colors">
           <button onClick={onClose} className="px-8 py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Dismiss Dossier</button>
        </div>
      </div>
    </div>
  );
};

const AdminMetricCard: React.FC<{ label: string, value: number, color: string, icon: string, sub: string }> = ({ label, value, color, icon, sub }) => (
  <div className="card-neo p-6 rounded-[2.5rem] bg-white dark:bg-slate-700 flex items-center justify-between border border-slate-100 dark:border-slate-600 shadow-sm transition-all group hover:scale-[1.02]">
     <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600' : color === 'emerald' ? 'text-emerald-600' : color === 'purple' ? 'text-purple-600' : 'text-purple-600'}`}>
          {value.toString().padStart(2, '0')}
        </h4>
        <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{sub}</p>
     </div>
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color === 'indigo' ? 'bg-indigo-600 shadow-indigo-100' : color === 'emerald' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-purple-600 shadow-purple-100'}`}>
        <i className={`fas ${icon}`}></i>
     </div>
  </div>
);

const CreateRoleModal: React.FC<{ onClose: () => void, onSave: (role: CustomRole) => void }> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<RolePermissions>(
    RESOURCES.reduce((acc, r) => {
      acc[r] = { Read: false, Add: false, Edit: false, Delete: false, Assign: false };
      return acc;
    }, {} as RolePermissions)
  );
  const togglePermission = (resource: string, action: ResourceAction) => {
    setPermissions(prev => ({ ...prev, [resource]: { ...prev[resource], [action]: !prev[resource][action] } }));
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); if (!name) return;
    onSave({ id: `role_${name.toLowerCase().replace(/\s+/g, '_')}`, name, description, permissions, isSystem: false });
  };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
       <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up transition-colors flex flex-col">
          <div className="p-10 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
             <div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Create Access Policy</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Define custom permissions matrix</p></div>
             <button onClick={onClose} className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Title</label><input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales Director" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
               <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Purpose Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Regional management" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all" /></div>
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-3"><div className="w-1 h-6 bg-indigo-500 rounded-full"></div><h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Permissions Matrix</h4></div>
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="border-b dark:border-slate-800"><th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Resource Stream</th>{ACTIONS.map(action => (<th key={action} className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{action}</th>))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {RESOURCES.map(res => (
                           <tr key={res} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors"><td className="px-8 py-4"><span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">{res}</span></td>{ACTIONS.map(action => (<td key={action} className="px-4 py-4 text-center"><button type="button" onClick={() => togglePermission(res, action)} className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${permissions[res]?.[action] ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-transparent'}`}><i className="fas fa-check text-[8px]"></i></button></td>))}</tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </form>
          <div className="p-10 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-4 shrink-0 transition-colors">
             <button type="button" onClick={onClose} className="flex-1 py-4 btn-3d btn-3d-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Discard</button>
             <button type="submit" onClick={handleSave} className="flex-[2] py-4 btn-3d btn-3d-indigo text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Commit Policy</button>
          </div>
       </div>
    </div>
  );
};

export default AdminPanel;
