import React, { useState, useMemo } from 'react';
import { ProductionPreparationItem } from '../types';
import { Plus, Trash2, Edit2, X, ClipboardList, Download, Search, Filter } from 'lucide-react';
import { format, parseISO, getISOWeek, isValid } from 'date-fns';

interface Props {
  data: ProductionPreparationItem[];
  groups: string[];
  models: string[];
  updateData: (data: ProductionPreparationItem[]) => void;
  readOnly: boolean;
}

const ProductionPreparationBoard: React.FC<Props> = ({ data, groups, models, updateData, readOnly }) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const handleAdd = () => {
    if (readOnly) return;
    const newItem: ProductionPreparationItem = {
      id: Math.random().toString(36).substr(2, 9),
      moReceivedDate: '', moNo: '', rev: '', moDetails: '', specialRequest: '',
      noOfMoBomLines: null, noOfIssuesWithMoBomLines: null, cnIdActive: '',
      tcMoBomCreationDate: '', m3MoBomCreationDate: '', status: '',
      cnIdInactive: '', date: '', remarks1: '', revisedMoBom: '', statusIndicator: '',
      odAction: '', bomReview: '', drawingNumber: '', sameSpecMo: '', preMoNumber: '',
      businessUnit: '', manualsForMt65: '', enginePartNumber: '', concernPart: '',
      phantomPurchase: '', noOfLine: '', responsibleFunction: '', remarks2: '',
      group: '', model: '',
      noMoOfBomRelease: '', noOfTotalBomLines: null, noOfErrorReported: null, noOfActualErrorsBomLines: null, remarks3: ''
    };
    updateData([...data, newItem]);
    setEditingItemId(newItem.id);
  };

  const handleChange = (id: string, field: keyof ProductionPreparationItem, value: any) => {
    if (readOnly) return;
    const newData = data.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateData(newData);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (readOnly) return;
    if (confirm('Are you sure you want to delete this row?')) {
      updateData(data.filter(item => item.id !== id));
      if (editingItemId === id) setEditingItemId(null);
    }
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production_preparation_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getWeek = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return getISOWeek(date).toString();
    } catch {
      return '';
    }
  };

  const getDaysDiff = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) return '';
    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays.toString();
    } catch {
      return '';
    }
  };

  const getBomQuality = (lines: number | null, issues: number | null) => {
    if (lines === null || lines === 0) return '';
    const validIssues = issues || 0;
    const calc = ((lines - validIssues) / lines) * 100;
    return calc.toFixed(2) + '%';
  };

  const getNewBomQuality = (total: number | null, actualErrors: number | null) => {
    if (total === null || total === 0) return '';
    const validErrors = actualErrors || 0;
    const calc = (1 - (validErrors / total)) * 100;
    return calc.toFixed(2) + '%';
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = Object.values(item).some(val => 
          val && val.toString().toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      if (filterMonth !== 'All' || filterYear !== 'All') {
        if (!item.moReceivedDate) return false;
        const d = parseISO(item.moReceivedDate);
        if (isValid(d)) {
          if (filterYear !== 'All' && d.getFullYear().toString() !== filterYear) return false;
          if (filterMonth !== 'All' && (d.getMonth() + 1).toString() !== filterMonth) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [data, searchQuery, filterMonth, filterYear]);

  const thStyle = "px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-white border-r border-[#6B7280] bg-[#4B5563] min-w-[120px] whitespace-nowrap";
  const tdStyleText = "px-3 py-2 text-sm text-gray-800 border-b border-r border-gray-200 whitespace-nowrap truncate max-w-[200px]";

  const editingItem = data.find(t => t.id === editingItemId);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const y = [];
    for(let i = currentYear - 5; i <= currentYear + 5; i++) {
        y.push(i.toString());
    }
    return y;
  }, []);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center space-x-3 text-gray-900">
          <div className="p-3 bg-zinc-900 text-[#FDB913] rounded shadow-inner">
             <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">Production Preparation</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Master-Detail Overview</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search all columns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#FDB913] outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded px-2 py-1">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={filterMonth} 
              onChange={e => setFilterMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none w-24"
            >
              <option value="All">All Months</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span className="text-gray-300">|</span>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none w-20"
            >
              <option value="All">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button 
            onClick={handleExportBackup}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2 hover:bg-gray-200 transition"
          >
            <Download size={16} /> Backup
          </button>

          {!readOnly && (
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-black text-[#FDB913] text-xs uppercase tracking-widest font-black rounded flex items-center gap-2 hover:bg-[#222] transition shadow-lg shrink-0"
            >
              <Plus size={16} /> New Record
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-white border-r border-[#6B7280] bg-[#4B5563] w-12 text-center whitespace-nowrap">Sr.</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">MO Rcvd Date</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] text-center whitespace-nowrap">Week</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">Group</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">Model</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">MO No.</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">REV</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap min-w-[200px]">MO Details</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">Special Request</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] text-center whitespace-nowrap">MO BOM Lines</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] text-center whitespace-nowrap">Issues with Lines</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">CN ID (Active)</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">TC BOM Date</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">M3 BOM Date</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">CN ID-Inactive</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-black border-r border-[#E5A812] bg-[#FDB913] whitespace-nowrap">Date</th>
                
                <th className={thStyle}>Days for TC BOM</th>
                <th className={thStyle}>Days for M3 BOM</th>
                <th className={thStyle}>BOM Quality</th>
                <th className={thStyle}>Remarks</th>
                <th className={thStyle}>Revised MO BOM</th>
                <th className={thStyle}>Status indicator</th>
                <th className={thStyle}>OD Action</th>
                <th className={thStyle}>BOM Review</th>
                <th className={thStyle}>Drawing Number</th>
                <th className={thStyle}>Same Spec MO</th>
                <th className={thStyle}>Pre-MO Number</th>
                <th className={thStyle}>Business Unit</th>
                <th className={thStyle}>Manuals for MT65</th>
                <th className={thStyle}>Engine part added</th>
                <th className={thStyle}>Concern Part</th>
                <th className={thStyle}>Phantom/Purchase</th>
                <th className={thStyle}>NO OF Line</th>
                <th className={thStyle}>Resp. Function</th>
                <th className={thStyle}>Remarks 2</th>

                <th className={thStyle}>No MO of BOM Release</th>
                <th className={thStyle}>No of total BOM Lines</th>
                <th className={thStyle}>No of Error reported</th>
                <th className={thStyle}>No of Actual errors BOM Lines</th>
                <th className={thStyle}>Remarks 3</th>
                <th className={thStyle}>BOM Quality (%)</th>
                
                <th className="px-3 py-3 text-[10px] font-bold uppercase text-center w-16 bg-gray-700 border-l border-gray-400 sticky right-0 z-20 text-white whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-[#FDB913]/10 cursor-pointer transition ${editingItemId === item.id ? 'bg-[#FDB913]/20' : ''}`}
                  onClick={() => setEditingItemId(item.id)}
                >
                  <td className="px-3 py-2 text-sm text-center font-black text-gray-500 bg-gray-50 border-r border-b">{index + 1}</td>
                  
                  <td className={tdStyleText}>{item.moReceivedDate}</td>
                  <td className="px-3 py-2 text-center border-b border-r text-gray-600 font-bold text-sm bg-gray-50">
                    {getWeek(item.moReceivedDate)}
                  </td>
                  <td className={tdStyleText}>{item.group}</td>
                  <td className={tdStyleText}>{item.model}</td>
                  <td className={tdStyleText}>{item.moNo}</td>
                  <td className={tdStyleText}>{item.rev}</td>
                  <td className={tdStyleText}>{item.moDetails}</td>
                  <td className={tdStyleText}>{item.specialRequest}</td>
                  <td className={tdStyleText + " text-center"}>{item.noOfMoBomLines}</td>
                  <td className={tdStyleText + " text-center"}>{item.noOfIssuesWithMoBomLines}</td>
                  <td className={tdStyleText + " font-mono"}>{item.cnIdActive}</td>
                  <td className={tdStyleText}>{item.tcMoBomCreationDate}</td>
                  <td className={tdStyleText}>{item.m3MoBomCreationDate}</td>
                  <td className={tdStyleText}>
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className={tdStyleText + " font-mono"}>{item.cnIdInactive}</td>
                  <td className={tdStyleText}>{item.date}</td>

                  {/* Calculated Columns */}
                  <td className="px-3 py-2 text-center border-b border-r bg-gray-50 text-gray-800 font-black text-sm">
                    {getDaysDiff(item.moReceivedDate, item.tcMoBomCreationDate)}
                  </td>
                  <td className="px-3 py-2 text-center border-b border-r bg-gray-50 text-gray-800 font-black text-sm">
                    {getDaysDiff(item.moReceivedDate, item.m3MoBomCreationDate)}
                  </td>
                  <td className="px-3 py-2 text-center border-b border-r bg-green-50 text-green-700 font-black text-sm">
                    {getBomQuality(item.noOfMoBomLines, item.noOfIssuesWithMoBomLines)}
                  </td>
                  
                  <td className={tdStyleText + " bg-green-50/30"}>{item.remarks1}</td>
                  <td className={tdStyleText + " bg-green-50/30"}>{item.revisedMoBom}</td>
                  <td className={tdStyleText + " bg-green-50/30"}>{item.statusIndicator}</td>
                  <td className={tdStyleText}>{item.odAction}</td>
                  <td className={tdStyleText}>{item.bomReview}</td>
                  <td className={tdStyleText + " font-mono"}>{item.drawingNumber}</td>
                  <td className={tdStyleText}>{item.sameSpecMo}</td>
                  <td className={tdStyleText + " font-mono"}>{item.preMoNumber}</td>
                  <td className={tdStyleText}>{item.businessUnit}</td>
                  <td className={tdStyleText}>{item.manualsForMt65}</td>
                  <td className={tdStyleText + " font-mono"}>{item.enginePartNumber}</td>
                  <td className={tdStyleText}>{item.concernPart}</td>
                  <td className={tdStyleText}>{item.phantomPurchase}</td>
                  <td className={tdStyleText}>{item.noOfLine}</td>
                  <td className={tdStyleText}>{item.responsibleFunction}</td>
                  <td className={tdStyleText}>{item.remarks2}</td>

                  {/* New Columns */}
                  <td className={tdStyleText + " font-mono bg-blue-50/30"}>{item.noMoOfBomRelease}</td>
                  <td className={tdStyleText + " text-center bg-blue-50/30"}>{item.noOfTotalBomLines}</td>
                  <td className={tdStyleText + " text-center bg-blue-50/30"}>{item.noOfErrorReported}</td>
                  <td className={tdStyleText + " text-center bg-blue-50/30"}>{item.noOfActualErrorsBomLines}</td>
                  <td className={tdStyleText + " bg-blue-50/30"}>{item.remarks3}</td>
                  <td className="px-3 py-2 text-center border-b border-r bg-blue-100 text-blue-800 font-black text-sm">
                    {getNewBomQuality(item.noOfTotalBomLines, item.noOfActualErrorsBomLines)}
                  </td>

                  <td className="px-3 py-2 text-center border-b border-l bg-white sticky right-0 z-0 border-l-gray-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-center items-center space-x-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded transition">
                          <Edit2 size={16} />
                       </button>
                       {!readOnly && (
                         <button onClick={(e) => handleDelete(item.id, e)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition">
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={43} className="p-12 text-center text-gray-400 italic">No records found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right overflow-hidden">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center bg-[#FDB913] text-black px-6 py-4 border-b border-[#E5A812]">
              <div className="flex items-center space-x-3">
                <ClipboardList size={20} />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-tight">Edit Production Record</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">MO: {editingItem.moNo || 'Unsaved'}</p>
                </div>
              </div>
              <button onClick={() => setEditingItemId(null)} className="p-2 hover:bg-black/10 rounded-full transition"><X size={24} className="font-bold" /></button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100/50 custom-scrollbar">
              <div className="space-y-6">
                
                {/* Section 1: MO Details */}
                <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-[#FDB913] rounded-full"></span>
                    <span>MO Details</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">MO Received Date</label>
                      <input type="date" disabled={readOnly} value={editingItem.moReceivedDate} onChange={e => handleChange(editingItem.id, 'moReceivedDate', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:ring-1 focus:ring-[#FDB913] focus:border-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Group</label>
                      <select disabled={readOnly} value={editingItem.group} onChange={e => handleChange(editingItem.id, 'group', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:ring-1 focus:ring-[#FDB913] focus:border-[#FDB913] outline-none">
                        <option value=""></option>
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Model</label>
                      <select disabled={readOnly} value={editingItem.model} onChange={e => handleChange(editingItem.id, 'model', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:ring-1 focus:ring-[#FDB913] focus:border-[#FDB913] outline-none">
                        <option value=""></option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">MO No.</label>
                      <input type="text" disabled={readOnly} value={editingItem.moNo} onChange={e => handleChange(editingItem.id, 'moNo', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-bold font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">REV</label>
                      <input type="text" disabled={readOnly} value={editingItem.rev} onChange={e => handleChange(editingItem.id, 'rev', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Special Request</label>
                      <input type="text" disabled={readOnly} value={editingItem.specialRequest} onChange={e => handleChange(editingItem.id, 'specialRequest', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">MO Details</label>
                      <textarea disabled={readOnly} rows={2} value={editingItem.moDetails} onChange={e => handleChange(editingItem.id, 'moDetails', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

                {/* Section 2: BOM Metrics */}
                <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>BOM Metrics</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No. of MO BOM Lines</label>
                      <input type="number" disabled={readOnly} value={editingItem.noOfMoBomLines || ''} onChange={e => handleChange(editingItem.id, 'noOfMoBomLines', e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No. of Issues (MO BOM Lines)</label>
                      <input type="number" disabled={readOnly} value={editingItem.noOfIssuesWithMoBomLines || ''} onChange={e => handleChange(editingItem.id, 'noOfIssuesWithMoBomLines', e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No MO of BOM Release</label>
                      <input type="text" disabled={readOnly} value={editingItem.noMoOfBomRelease || ''} onChange={e => handleChange(editingItem.id, 'noMoOfBomRelease', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No of total BOM Lines</label>
                      <input type="number" disabled={readOnly} value={editingItem.noOfTotalBomLines || ''} onChange={e => handleChange(editingItem.id, 'noOfTotalBomLines', e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No of Error reported</label>
                      <input type="number" disabled={readOnly} value={editingItem.noOfErrorReported || ''} onChange={e => handleChange(editingItem.id, 'noOfErrorReported', e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No of Actual errors BOM Lines</label>
                      <input type="number" disabled={readOnly} value={editingItem.noOfActualErrorsBomLines || ''} onChange={e => handleChange(editingItem.id, 'noOfActualErrorsBomLines', e.target.value ? Number(e.target.value) : null)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">TC MO BOM Creation Date</label>
                      <input type="date" disabled={readOnly} value={editingItem.tcMoBomCreationDate} onChange={e => handleChange(editingItem.id, 'tcMoBomCreationDate', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">M3 MO BOM Creation Date</label>
                      <input type="date" disabled={readOnly} value={editingItem.m3MoBomCreationDate} onChange={e => handleChange(editingItem.id, 'm3MoBomCreationDate', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Remarks 3</label>
                      <textarea disabled={readOnly} rows={2} value={editingItem.remarks3 || ''} onChange={e => handleChange(editingItem.id, 'remarks3', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

                {/* Section 3: Status & Tracking */}
                <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Status & Tracking</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">CN ID (Active)</label>
                      <input type="text" disabled={readOnly} value={editingItem.cnIdActive} onChange={e => handleChange(editingItem.id, 'cnIdActive', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status</label>
                      <select disabled={readOnly} value={editingItem.status} onChange={e => handleChange(editingItem.id, 'status', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none">
                        <option value=""></option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">CN ID (Inactive)</label>
                      <input type="text" disabled={readOnly} value={editingItem.cnIdInactive} onChange={e => handleChange(editingItem.id, 'cnIdInactive', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Date</label>
                      <input type="date" disabled={readOnly} value={editingItem.date} onChange={e => handleChange(editingItem.id, 'date', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Remarks</label>
                      <textarea disabled={readOnly} rows={2} value={editingItem.remarks1} onChange={e => handleChange(editingItem.id, 'remarks1', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

                {/* Section 4: Engineering & Config */}
                <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Engineering & Configuration</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Revised MO BOM (Without Rev)</label>
                      <input type="text" disabled={readOnly} value={editingItem.revisedMoBom} onChange={e => handleChange(editingItem.id, 'revisedMoBom', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status Indicator</label>
                      <input type="text" disabled={readOnly} value={editingItem.statusIndicator} onChange={e => handleChange(editingItem.id, 'statusIndicator', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">OD Action</label>
                      <input type="text" disabled={readOnly} value={editingItem.odAction} onChange={e => handleChange(editingItem.id, 'odAction', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">BOM Review</label>
                      <input type="text" disabled={readOnly} value={editingItem.bomReview} onChange={e => handleChange(editingItem.id, 'bomReview', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Drawing Number</label>
                      <input type="text" disabled={readOnly} value={editingItem.drawingNumber} onChange={e => handleChange(editingItem.id, 'drawingNumber', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Same Spec MO added in M3</label>
                      <input type="text" disabled={readOnly} value={editingItem.sameSpecMo} onChange={e => handleChange(editingItem.id, 'sameSpecMo', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Pre-MO Number</label>
                      <input type="text" disabled={readOnly} value={editingItem.preMoNumber} onChange={e => handleChange(editingItem.id, 'preMoNumber', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Business Unit</label>
                      <input type="text" disabled={readOnly} value={editingItem.businessUnit} onChange={e => handleChange(editingItem.id, 'businessUnit', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                  </div>
                </div>

                {/* Section 5: Additional Info */}
                <div className="bg-white p-5 rounded border border-gray-200 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Additional Specifications</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Manuals for MT65 Added in Stage V</label>
                      <input type="text" disabled={readOnly} value={editingItem.manualsForMt65} onChange={e => handleChange(editingItem.id, 'manualsForMt65', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Engine Part Number Added</label>
                      <input type="text" disabled={readOnly} value={editingItem.enginePartNumber} onChange={e => handleChange(editingItem.id, 'enginePartNumber', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Concern Part</label>
                      <input type="text" disabled={readOnly} value={editingItem.concernPart} onChange={e => handleChange(editingItem.id, 'concernPart', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phantom / Purchase</label>
                      <input type="text" disabled={readOnly} value={editingItem.phantomPurchase} onChange={e => handleChange(editingItem.id, 'phantomPurchase', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">No. of Line</label>
                      <input type="text" disabled={readOnly} value={editingItem.noOfLine} onChange={e => handleChange(editingItem.id, 'noOfLine', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Responsible Function</label>
                      <input type="text" disabled={readOnly} value={editingItem.responsibleFunction} onChange={e => handleChange(editingItem.id, 'responsibleFunction', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Additional Remarks</label>
                      <textarea disabled={readOnly} rows={2} value={editingItem.remarks2} onChange={e => handleChange(editingItem.id, 'remarks2', e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#FDB913] outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
              <button 
                onClick={() => setEditingItemId(null)}
                className="px-6 py-3 bg-black text-[#FDB913] font-black text-xs uppercase tracking-widest rounded transition hover:bg-[#222]"
              >
                Okay, Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPreparationBoard;
