
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Client, Property, SiteVisit, WhatsAppTemplate, CustomRole, ResourceAction, ResourceType, RolePermissions, UserRole, ClientType, ClientStatus } from '../types';

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

const APP_FIELDS_DEFINITION = {
  Clients: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'mobile', label: 'Mobile Number', required: true },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'address', label: 'Current Address', required: false },
    { key: 'budgetMax', label: 'Budget Max (₹)', required: false },
    { key: 'priority', label: 'Priority (Hot/Warm/Cold)', required: false },
    { key: 'source', label: 'Lead Source', required: false }
  ],
  Properties: [
    { key: 'title', label: 'Property Title', required: true },
    { key: 'type', label: 'Type (Apartment/Villa)', required: true },
    { key: 'listingType', label: 'Listing (Sale/Rent)', required: true },
    { key: 'area', label: 'Locality/Area', required: true },
    { key: 'priceMin', label: 'Min Price (₹)', required: true },
    { key: 'priceMax', label: 'Max Price (₹)', required: true },
    { key: 'reraId', label: 'RERA ID', required: false }
  ],
  Visits: [
    { key: 'clientName', label: 'Client Name', required: true },
    { key: 'propertyName', label: 'Property Title', required: true },
    { key: 'scheduledAt', label: 'Date/Time (YYYY-MM-DD HH:MM)', required: true },
    { key: 'status', label: 'Status', required: false }
  ]
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
  
  // Custom Roles State
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('ef_custom_roles');
    if (saved) return JSON.parse(saved);

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

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('ef_wa_templates');
    return saved ? JSON.parse(saved) : [
      { id: '1', category: 'Clients', name: 'Intro Template', message: 'Hi {firstName}, I noticed you are interested in {locations}...' }
    ];
  });

  // CSV Import Workflow States
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importType, setImportType] = useState<'Clients' | 'Properties' | 'Visits'>('Clients');
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validatedData, setValidatedData] = useState<{data: any, errors: string[]}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const registryJson = localStorage.getItem('ef_user_registry');
    if (registryJson) setAllUsers(JSON.parse(registryJson));
  }, [pendingUsers]);

  const handleUpdateUserRole = (userId: string, newRoleId: string) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, role: newRoleId } : u);
    localStorage.setItem('ef_user_registry', JSON.stringify(updated));
    setAllUsers(updated);
  };

  const filteredDirectory = allUsers.filter(u => 
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
    u.approvalStatus !== 'Rejected'
  );

  const downloadTemplate = () => {
    const fields = APP_FIELDS_DEFINITION[importType];
    const headerRow = fields.map(f => f.label).join(',');
    const sampleRow = fields.map(f => {
      if (f.key === 'mobile') return '9876543210';
      if (f.key === 'firstName') return 'Rahul';
      if (f.key === 'lastName') return 'Singh';
      if (f.key === 'scheduledAt') return '2023-12-01 14:00';
      if (f.key === 'priceMin') return '5000000';
      return 'Sample Data';
    }).join(',');
    const csvContent = `${headerRow}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `EstateFlow_${importType}_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      if (rows.length < 1) return;
      const headers = rows[0].split(',').map(h => h.trim());
      const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, i) => {
          obj[header] = values[i]?.trim();
          return obj;
        }, {} as any);
      });
      setCsvHeaders(headers);
      setCsvRawData(data);
      
      // Auto-mapping attempt
      const initialMapping: Record<string, string> = {};
      APP_FIELDS_DEFINITION[importType].forEach(field => {
        const match = headers.find(h => h.toLowerCase() === field.label.toLowerCase() || h.toLowerCase() === field.key.toLowerCase());
        if (match) initialMapping[field.key] = match;
      });
      setMapping(initialMapping);
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const validateImport = () => {
    const results = csvRawData.map(row => {
      const errors: string[] = [];
      const mappedRecord: any = {};
      
      APP_FIELDS_DEFINITION[importType].forEach(field => {
        const csvValue = row[mapping[field.key]];
        if (field.required && (!csvValue || csvValue === '')) {
          errors.push(`Missing ${field.label}`);
        }
        mappedRecord[field.key] = csvValue;
      });

      return { data: mappedRecord, errors };
    });
    setValidatedData(results);
    setImportStep(3);
  };

  const finalizeImport = () => {
    const cleanData = validatedData.filter(v => v.errors.length === 0).map(v => ({
      ...v.data,
      id: `${importType === 'Clients' ? 'CL' : importType === 'Properties' ? 'P' : 'SV'}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      ...(importType === 'Clients' ? { nurturingScore: 50, priority: v.data.priority || 'Warm', agent: 'Rahul Singh', locations: [v.data.locations || 'Nagpur'] } : {}),
      ...(importType === 'Properties' ? { financials: { priceMin: Number(v.data.priceMin), priceMax: Number(v.data.priceMax) }, location: { area: v.data.area } } : {}),
    }));
    onBulkImport(importType, cleanData);
    setImportStep(1);
    setCsvRawData([]);
    setValidatedData([]);
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
          {canSeeImport && <button onClick={() => setActiveTab('csv')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Data Injection</button>}
          {canSeeTemplates && <button onClick={() => setActiveTab('templates')} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>WA Templates</button>}
        </div>
      </div>

      {activeTab === 'csv' && (
        <div className="max-w-4xl mx-auto space-y-8">
           <div className="card-neo rounded-[3.5rem] bg-white dark:bg-slate-800 transition-colors overflow-hidden">
              <div className="p-8 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-database"></i></div>
                   <div>
                     <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">ETL Injection Module</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Process Batch: {importType}</p>
                   </div>
                 </div>
                 <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${importStep >= s ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                    ))}
                 </div>
              </div>

              <div className="p-10 space-y-10">
                 {importStep === 1 && (
                   <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-3">
                         {['Clients', 'Properties', 'Visits'].map(t => (
                           <button key={t} onClick={() => setImportType(t as any)} className={`py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${importType === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}>{t}</button>
                         ))}
                      </div>
                      <div className="flex flex-col items-center gap-6">
                         <div onClick={() => fileInputRef.current?.click()} className="w-full py-16 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[3rem] hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer flex flex-col items-center gap-4 group">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-inner"><i className="fas fa-file-csv text-3xl"></i></div>
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Upload CSV Manifest</p>
                            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
                         </div>
                         <button onClick={downloadTemplate} className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                           <i className="fas fa-download"></i> Get {importType} Schema Template
                         </button>
                      </div>
                   </div>
                 )}

                 {importStep === 2 && (
                   <div className="space-y-8 animate-slide-up">
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-6 rounded-[2rem] flex items-center gap-4">
                         <i className="fas fa-info-circle text-amber-600 text-xl"></i>
                         <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight leading-relaxed">System identified {csvHeaders.length} headers. Please map them to application fields.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {APP_FIELDS_DEFINITION[importType].map(field => (
                           <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{field.label}</span>
                                {field.required && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded-md uppercase">Required</span>}
                              </div>
                              <select 
                                value={mapping[field.key] || ''} 
                                onChange={e => setMapping({...mapping, [field.key]: e.target.value})}
                                className="w-full sm:w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-indigo-600 transition-all"
                              >
                                 <option value="">-- Ignore Field --</option>
                                 {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                           </div>
                         ))}
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setImportStep(1)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase">Back</button>
                         <button onClick={validateImport} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase shadow-xl">Verify & Preview</button>
                      </div>
                   </div>
                 )}

                 {importStep === 3 && (
                   <div className="space-y-8 animate-slide-up">
                      <div className="flex justify-between items-center px-2">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Injection Readiness Preview ({validatedData.length} records)</h4>
                         <div className="flex gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black text-slate-500 uppercase">{validatedData.filter(v => v.errors.length === 0).length} Ready</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[9px] font-black text-slate-500 uppercase">{validatedData.filter(v => v.errors.length > 0).length} Blocked</span></div>
                         </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar border border-slate-100 dark:border-slate-700 rounded-[2rem] bg-white dark:bg-slate-900">
                         <table className="w-full text-left">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 z-10">
                               <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  <th className="px-6 py-4">Data Stream</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4">Integrity Flags</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                               {validatedData.slice(0, 10).map((record, i) => (
                                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                       <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">{record.data[Object.keys(record.data)[0]] || 'No Identifier'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                       {record.errors.length === 0 ? <i className="fas fa-check-circle text-emerald-500"></i> : <i className="fas fa-exclamation-circle text-red-500"></i>}
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-wrap gap-1">
                                          {record.errors.map((e, idx) => <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[7px] font-black uppercase">{e}</span>)}
                                          {record.errors.length === 0 && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Validated</span>}
                                       </div>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setImportStep(2)} className="flex-1 py-5 btn-3d btn-3d-white rounded-[1.5rem] font-black text-xs uppercase">Adjust Mapping</button>
                         <button onClick={finalizeImport} className="flex-[2] py-5 btn-3d btn-3d-indigo text-white rounded-[1.5rem] font-black text-xs uppercase shadow-xl shadow-indigo-100">Commit to Database</button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {(activeTab === 'approvals' && canSeeTeam) && (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-4">
              <div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase">Personnel Registry</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time team access control</p>
              </div>
              <div className="relative w-full sm:w-64">
                 <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                 <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Filter directory..." className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Authority Tier</th>
                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                       {filteredDirectory.map(user => (
                         <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-8 py-5">
                               <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-tight">{user.name}</p>
                               <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                            </td>
                            <td className="px-8 py-5">
                               <select disabled={!checkPermission('Admin: Team', 'Edit')} value={user.role} onChange={(e) => handleUpdateUserRole(user.id, e.target.value)} className="bg-indigo-50 dark:bg-indigo-900/30 border-none text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase outline-none cursor-pointer rounded-lg px-3 py-1.5 transition-colors">
                                  {customRoles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                               </select>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <button onClick={() => onApproveUser(user.id, 'Rejected')} className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {(activeTab === 'roles' && canSeeRoles) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {customRoles.map(role => (
             <div key={role.id} className="card-neo p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 transition-colors bg-white dark:bg-slate-800">
                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-tight">{role.name}</h4>
                <p className="text-[10px] font-medium text-slate-400 uppercase mt-1 tracking-tight">{role.description}</p>
                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-700 flex flex-wrap gap-1.5">
                   {RESOURCES.slice(0, 5).map(res => role.permissions[res]?.Read && (
                     <span key={res} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[7px] font-black uppercase">{res}</span>
                   ))}
                </div>
             </div>
           ))}
        </div>
      )}

      {(activeTab === 'templates' && canSeeTemplates) && (
        <div className="space-y-6">
           <div className="flex justify-between items-center px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Interaction Models</h4>
             <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">{templates.length} Active</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {templates.map(tpl => (
               <div key={tpl.id} className="card-neo p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800 mb-2 inline-block">{tpl.category}</span>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight mb-2">{tpl.name}</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic line-clamp-3 leading-relaxed">"{tpl.message}"</p>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
