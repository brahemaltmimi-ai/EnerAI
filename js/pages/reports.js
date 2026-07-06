// REPORTS ARCHIVE PAGE - ULTIMATE PROFESSIONAL VERSION WITH DATA MANAGEMENT
// ========================================
let savedReports = [];

// Initialize savedReports from localStorage with error handling
// دالة تنظف الكائن من أي قيمة NaN
function cleanNaN(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'number' && isNaN(obj[key])) {
            obj[key] = 0; // يمكنك تغييرها إلى null إذا رغبت
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanNaN(obj[key]);
        }
    }
}
try {
    const storedReports = localStorage.getItem('savedReports');
    if (storedReports) {
        savedReports = JSON.parse(storedReports);
        // Limit to 50 reports to prevent quota issues
        if (savedReports.length > 50) {
            savedReports = savedReports.slice(0, 50);
            localStorage.setItem('savedReports', JSON.stringify(savedReports));
        }
    }
} catch (e) {
    console.warn('Error loading saved reports from localStorage:', e);
    savedReports = [];
    localStorage.removeItem('savedReports');
}

// Utility function to clear localStorage cache
function clearReportsCache() {
    localStorage.removeItem('savedReports');
    savedReports = [];
    console.log('Reports cache cleared');
    showNotification('📦 Local cache cleared. Reports will be loaded from database.', 'info');
}

// DATA MANAGEMENT PAGE - PROFESSIONAL EDITION
function renderDataManagementPage() {
    document.getElementById('pageTitle').textContent = 'Data Management';
    
    const adminAreas = getUniqueAdminAreas();
    const departments = getUniqueDepartments();
    const streams = getUniqueStreams();
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-8 max-w-7xl mx-auto">
            
            <!-- Professional Header -->
            <div class="bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                <div class="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                            <i class="fas fa-database text-4xl"></i>
                        </div>
                        <div>
                            <h2 class="text-4xl font-black tracking-tight mb-1">DATA MANAGEMENT SYSTEM</h2>
                            <p class="text-blue-100 text-lg font-semibold">Professional Data Control & Export Center</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="refreshAllData()" class="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-base transition-all backdrop-blur-sm border-2 border-white/30 hover:border-white/50 flex items-center gap-2">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <!-- Statistics Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-sm font-bold text-blue-100">ADMIN AREAS</p>
                            <i class="fas fa-map-marked-alt text-3xl text-white/30"></i>
                        </div>
                        <p class="text-5xl font-black mb-1">${adminAreas.length}</p>
                        <p class="text-sm text-blue-100">Total Areas</p>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-sm font-bold text-emerald-100">DEPARTMENTS</p>
                            <i class="fas fa-building text-3xl text-white/30"></i>
                        </div>
                        <p class="text-5xl font-black mb-1">${departments.length}</p>
                        <p class="text-sm text-emerald-100">Active Departments</p>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-3">
                            <p class="text-sm font-bold text-teal-100">STREAMS</p>
                            <i class="fas fa-sitemap text-3xl text-white/30"></i>
                        </div>
                        <p class="text-5xl font-black mb-1">${streams.length}</p>
                        <p class="text-sm text-teal-100">Active Streams</p>
                    </div>
                </div>
            </div>

            <!-- Admin Areas Table -->
            <div class="bg-white rounded-2xl shadow-xl border-t-4 border-blue-500 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-blue-200">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                <i class="fas fa-map-marked-alt text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-slate-800">Admin Areas</h3>
                                <p class="text-sm text-slate-600 font-semibold">${adminAreas.length} Areas • Manage geographical divisions</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="exportTableToCSV('adminAreasTable', 'admin_areas')" class="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-file-csv"></i>
                                Export CSV
                            </button>
                            <button onclick="addNewAdminArea()" class="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-plus"></i>
                                Add Area
                            </button>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table id="adminAreasTable" class="w-full">
                        <thead class="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">#</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Admin Area</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total Records</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Departments</th>
                                <th class="px-6 py-4 text-center text-sm font-black uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${renderAdminAreasRows(adminAreas)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Departments Table -->
            <div class="bg-white rounded-2xl shadow-xl border-t-4 border-emerald-500 overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-50 to-green-100 px-8 py-6 border-b border-emerald-200">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                <i class="fas fa-building text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-slate-800">Departments</h3>
                                <p class="text-sm text-slate-600 font-semibold">${departments.length} Departments • Organizational units</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="exportTableToCSV('departmentsTable', 'departments')" class="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-file-csv"></i>
                                Export CSV
                            </button>
                            <button onclick="addNewDepartment()" class="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-plus"></i>
                                Add Department
                            </button>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table id="departmentsTable" class="w-full">
                        <thead class="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">#</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Department</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Admin Area</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total Records</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Streams</th>
                                <th class="px-6 py-4 text-center text-sm font-black uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${renderDepartmentsRows(departments)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Streams Table -->
            <div class="bg-white rounded-2xl shadow-xl border-t-4 border-teal-500 overflow-hidden">
                <div class="bg-gradient-to-r from-teal-50 to-cyan-100 px-8 py-6 border-b border-teal-200">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                <i class="fas fa-sitemap text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-slate-800">Streams</h3>
                                <p class="text-sm text-slate-600 font-semibold">${streams.length} Streams • Production units</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="exportTableToCSV('streamsTable', 'streams')" class="px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-file-csv"></i>
                                Export CSV
                            </button>
                            <button onclick="addNewStream()" class="px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 font-bold flex items-center gap-2 shadow-lg transition-all">
                                <i class="fas fa-plus"></i>
                                Add Stream
                            </button>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table id="streamsTable" class="w-full">
                        <thead class="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">#</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Stream</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Department</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Admin Area</th>
                                <th class="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total Records</th>
                                <th class="px-6 py-4 text-center text-sm font-black uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${renderStreamsRows(streams)}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;
}

// Helper Functions for Data Management
function getUniqueAdminAreas() {
    const areas = [...new Set(metricsData.map(d => d.Admin_Area))].filter(a => a);
    return areas.map(area => {
        const records = metricsData.filter(d => d.Admin_Area === area);
        const departments = [...new Set(records.map(d => d.Department))].filter(d => d).length;
        return { name: area, count: records.length, departments };
    }).sort((a, b) => a.name.localeCompare(b.name));
}

function getUniqueDepartments() {
    const depts = [...new Set(metricsData.map(d => d.Department))].filter(d => d);
    return depts.map(dept => {
        const records = metricsData.filter(d => d.Department === dept);
        const adminArea = records[0]?.Admin_Area || 'N/A';
        const streams = [...new Set(records.map(d => d.Stream))].filter(s => s).length;
        return { name: dept, adminArea, count: records.length, streams };
    }).sort((a, b) => a.name.localeCompare(b.name));
}

function getUniqueStreams() {
    const streams = [...new Set(metricsData.map(d => d.Stream))].filter(s => s);
    return streams.map(stream => {
        const records = metricsData.filter(d => d.Stream === stream);
        const dept = records[0]?.Department || 'N/A';
        const adminArea = records[0]?.Admin_Area || 'N/A';
        return { name: stream, department: dept, adminArea, count: records.length };
    }).sort((a, b) => a.name.localeCompare(b.name));
}

function renderAdminAreasRows(areas) {
    return areas.map((area, index) => `
        <tr class="hover:bg-blue-50 transition-colors">
            <td class="px-6 py-4 text-sm font-bold text-slate-700">${index + 1}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-map-marker-alt text-blue-600"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-800">${area.name}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">${area.count} records</span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">${area.departments} depts</span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="viewAreaDetails('${area.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button onclick="editAreaName('${area.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderDepartmentsRows(departments) {
    return departments.map((dept, index) => `
        <tr class="hover:bg-emerald-50 transition-colors">
            <td class="px-6 py-4 text-sm font-bold text-slate-700">${index + 1}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-building text-emerald-600"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-800">${dept.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-slate-600">${dept.adminArea}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">${dept.count} records</span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-bold">${dept.streams} streams</span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="viewDeptDetails('${dept.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button onclick="editDeptName('${dept.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderStreamsRows(streams) {
    return streams.map((stream, index) => `
        <tr class="hover:bg-teal-50 transition-colors">
            <td class="px-6 py-4 text-sm font-bold text-slate-700">${index + 1}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-stream text-teal-600"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-800">${stream.name}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-slate-600">${stream.department}</td>
            <td class="px-6 py-4 text-sm font-semibold text-slate-600">${stream.adminArea}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-bold">${stream.count} records</span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="viewStreamDetails('${stream.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button onclick="editStreamName('${stream.name.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Export to CSV Function
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach((col, index) => {
            // Skip actions column (last column)
            if (index < cols.length - 1) {
                rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
            }
        });
        if (rowData.length > 0) {
            csv.push(rowData.join(','));
        }
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV exported successfully!', 'success');
}

// View Details Functions
function viewAreaDetails(areaName) {
    const records = metricsData.filter(d => d.Admin_Area === areaName);
    alert(`Admin Area: ${areaName}\n\nTotal Records: ${records.length}\n\nThis feature will show detailed analytics in future updates.`);
}

function viewDeptDetails(deptName) {
    const records = metricsData.filter(d => d.Department === deptName);
    alert(`Department: ${deptName}\n\nTotal Records: ${records.length}\n\nThis feature will show detailed analytics in future updates.`);
}

function viewStreamDetails(streamName) {
    const records = metricsData.filter(d => d.Stream === streamName);
    alert(`Stream: ${streamName}\n\nTotal Records: ${records.length}\n\nThis feature will show detailed analytics in future updates.`);
}

// Edit Functions
function editAreaName(oldName) {
    const newName = prompt('Enter new Admin Area name:', oldName);
    if (newName && newName !== oldName) {
        metricsData.forEach(d => {
            if (d.Admin_Area === oldName) {
                d.Admin_Area = newName;
            }
        });
        showNotification('Admin Area updated successfully!', 'success');
        renderDataManagementPage();
    }
}

function editDeptName(oldName) {
    const newName = prompt('Enter new Department name:', oldName);
    if (newName && newName !== oldName) {
        metricsData.forEach(d => {
            if (d.Department === oldName) {
                d.Department = newName;
            }
        });
        showNotification('Department updated successfully!', 'success');
        renderDataManagementPage();
    }
}

function editStreamName(oldName) {
    const newName = prompt('Enter new Stream name:', oldName);
    if (newName && newName !== oldName) {
        metricsData.forEach(d => {
            if (d.Stream === oldName) {
                d.Stream = newName;
            }
        });
        showNotification('Stream updated successfully!', 'success');
        renderDataManagementPage();
    }
}

// Add New Functions
function addNewAdminArea() {
    const name = prompt('Enter new Admin Area name:');
    if (name) {
        showNotification('New Admin Area functionality will be available in future updates!', 'info');
    }
}

function addNewDepartment() {
    const name = prompt('Enter new Department name:');
    if (name) {
        showNotification('New Department functionality will be available in future updates!', 'info');
    }
}

function addNewStream() {
    const name = prompt('Enter new Stream name:');
    if (name) {
        showNotification('New Stream functionality will be available in future updates!', 'info');
    }
}

function refreshAllData() {
    showNotification('Data refreshed successfully!', 'success');
    renderDataManagementPage();
}


// ==========================================
// ORIGINAL REPORTS ARCHIVE FUNCTIONS
// ==========================================

async function renderReportsArchivePage() {
    document.getElementById('pageTitle').textContent = 'Reports Archive';
    
    // Show loading state
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
            <div class="bg-white rounded-3xl shadow-2xl text-center py-24 px-8">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-spinner fa-spin text-3xl text-slate-400"></i>
                </div>
                <p class="text-slate-600 text-xl">Loading reports from database...</p>
            </div>
        </div>
    `;
    
    try {
        // Load reports from database
        const response = await fetch(`${API_BASE}/api/reports`);
        if (!response.ok) {
            throw new Error('Failed to load reports');
        }
        const resultText = await response.text();
        // معالجة NaN في JSON قبل التحويل
        const safeText = resultText.replace(/:NaN([,}\]])/g, ':0$1');
        const result = JSON.parse(safeText);
        if (Array.isArray(result.reports)) {
            result.reports.forEach(r => cleanNaN(r));
        }
        savedReports = result.reports || [];
        // Render the page
        renderReportsArchiveContent();
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-transition space-y-6 max-w-7xl mx-auto">
                <div class="bg-red-50 rounded-3xl shadow-2xl text-center py-24 px-8 border-2 border-red-200">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <p class="text-red-800 text-xl font-bold">Error Loading Reports</p>
                    <p class="text-red-600 mt-2">${error.message}</p>
                    <button onclick="location.reload()" class="px-6 py-3 bg-red-500 text-white rounded-lg mt-4 font-bold hover:bg-red-600">
                        <i class="fas fa-redo mr-2"></i>Retry
                    </button>
                </div>
            </div>
        `;
    }
}

function renderReportsArchiveContent() {
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-7xl mx-auto">
            
            <!-- Corporate Reports Archive Header -->
            <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                <div class="absolute -right-8 -bottom-8 text-[10rem] text-white/5 pointer-events-none">
                    <i class="fas fa-archive"></i>
                </div>
                <div class="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                            <i class="fas fa-archive text-white text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-blue-200 text-xs font-semibold tracking-widest mb-1">DOCUMENT MANAGEMENT SYSTEM</p>
                            <h2 class="text-3xl font-bold text-white">Reports Archive</h2>
                            <p class="text-blue-200 mt-1 text-sm">${savedReports.length} Reports Stored in Enterprise Database</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="refreshReportsList()" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-sm transition-all border border-white/20 text-white backdrop-blur-sm">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                        <button onclick="navigateTo('reportnow')" class="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg font-semibold text-sm transition-all shadow-md">
                            <i class="fas fa-plus mr-2"></i>
                            New Report
                        </button>
                    </div>
                </div>
            </div>

            ${savedReports.length === 0 ? renderEmptyState() : `

                <!-- Search & Filter Bar - Clean Design -->

                <!-- Reports List -->
                <div id="reportsList" class="space-y-4">
                    ${renderReportsList()}
                </div>
            `}
        </div>
    `;
}

async function refreshReportsList() {
    try {
        const response = await fetch(`${API_BASE}/api/reports`);
        const result = await response.json();
        savedReports = result.reports || [];
        renderReportsArchiveContent();
        showNotification('Reports list refreshed successfully', 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

function renderEmptyState() {
    return `
        <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-md text-center py-12 px-8" style="border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #60a5fa); background-origin: border-box; background-clip: padding-box, border-box;">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-5">
                <i class="fas fa-folder-open text-3xl text-blue-500"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">No Reports Available</h3>
            <p class="text-slate-500 mb-6 text-sm max-w-md mx-auto">Your reports archive is empty. Generate your first AI-powered analysis report to get started.</p>
            <button onclick="navigateTo('reportnow')" class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all">
                <i class="fas fa-plus mr-2"></i>
                Create New Report
            </button>
        </div>
    `;
}

function renderReportsList() {
    return savedReports.map((report, index) => `
        <div class="report-card bg-white/80 backdrop-blur-sm rounded-xl p-5 transition-all hover:shadow-lg" style="border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #60a5fa); background-origin: border-box; background-clip: padding-box, border-box;">
            <div class="flex items-start justify-between gap-5 flex-wrap">
                <div class="flex-1 min-w-[300px]">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <i class="fas fa-file-alt text-white"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-slate-800">${report.name || report.context?.reportName || report.data?.context?.reportName || 'Untitled Report'}</h4>
                            <div class="flex items-center gap-2 text-xs text-slate-500">
                                <span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
                                    ${report.quarter || 'Full Year'}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-clock text-slate-400"></i>
                                    ${
                                        (() => {
                                            const dateStr = report.created_at || report.timestamp;
                                            const dateObj = dateStr && !isNaN(Date.parse(dateStr)) ? new Date(dateStr) : null;
                                            return dateObj ? dateObj.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'Invalid date';
                                        })()
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                        <i class="fas fa-quote-left text-blue-300 mr-2"></i>
                        ${(report.preview || report.data?.textContent?.executive_summary || report.data?.executive_summary || 'No summary available').substring(0, 180)}...
                    </div>
                </div>
                
                <div class="flex flex-col gap-2 min-w-[130px]">
                    <button onclick="viewReport(${index})" class="px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm border-2 border-blue-400">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    
                    <div class="relative group">
                        <button class="w-full px-4 py-2 bg-white hover:bg-green-50 text-green-600 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm border-2 border-green-400">
                            <i class="fas fa-download"></i>
                            Export
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                            <button onclick="downloadReportAs(${index}, 'doc')" class="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-3 text-sm font-medium text-slate-700 border-b border-slate-100">
                                <i class="fas fa-file-word text-blue-600"></i>
                                Word Document
                            </button>
                            <button onclick="downloadReportAs(${index}, 'txt')" class="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 border-b border-slate-100">
                                <i class="fas fa-file-alt text-slate-500"></i>
                                Text File
                            </button>
                            <button onclick="downloadReportAs(${index}, 'json')" class="w-full px-4 py-2.5 text-left hover:bg-green-50 flex items-center gap-3 text-sm font-medium text-slate-700 rounded-b-lg">
                                <i class="fas fa-file-code text-green-500"></i>
                                JSON Data
                            </button>
                        </div>
                    </div>
                    <button onclick="deleteReport(${index})" class="px-4 py-2 bg-white hover:bg-red-50 text-red-500 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm border-2 border-red-300">
                        <i class="fas fa-trash-alt"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function viewReport(index) {
    const report = savedReports[index];
    
    // If report ID exists (from database), load full report from database
    if (report.id && typeof report.id === 'number') {
        try {
            const response = await fetch(`${API_BASE}/api/reports/${report.id}`);
            const result = await response.json();
            
            if (result.status === 'ok') {
                const dbReport = result.report;
                
                // Prepare report data for displayReport function (from reportnow.js)
                const reportData = {
                    executive_summary: dbReport.textContent?.executive_summary || '',
                    key_insights: dbReport.textContent?.key_insights || '',
                    anomalies: dbReport.textContent?.anomalies || '',
                    recommendations: dbReport.textContent?.recommendations || ''
                };
                
                // Prepare context
                const context = {
                    reportName: dbReport.context?.reportName || dbReport.name || report.name || 'Energy Report',
                    reportType: dbReport.context?.reportType || 'Operational Report',
                    department: dbReport.context?.department || dbReport.metadata?.department || 'All Departments',
                    quarter: dbReport.quarter || report.quarter,
                    startDate: dbReport.context?.startDate,
                    endDate: dbReport.context?.endDate,
                    year: dbReport.context?.year,
                    viewOnly: true  // Flag to hide edit buttons
                };
                
                // Use displayReport from reportnow.js
                if (typeof displayReport === 'function') {
                    displayReport(reportData, context);
                } else {
                    showNotification('Display function not available', 'error');
                }
                return;
            }
        } catch (error) {
            console.error('Error loading report from database:', error);
            showNotification('Error loading report from database', 'error');
            return;
        }
    }
    
    // Fallback to local data - also use displayReport
    const reportData = {
        executive_summary: report.textContent?.executive_summary || report.data?.textContent?.executive_summary || '',
        key_insights: report.textContent?.key_insights || report.data?.textContent?.key_insights || '',
        anomalies: report.textContent?.anomalies || report.data?.textContent?.anomalies || '',
        recommendations: report.textContent?.recommendations || report.data?.textContent?.recommendations || ''
    };
    
    const context = {
        reportName: report.context?.reportName || report.name || 'Energy Report',
        reportType: report.context?.reportType || 'Operational Report',
        department: report.context?.department || report.department || 'All Departments',
        quarter: report.quarter,
        viewOnly: true
    };
    
    if (typeof displayReport === 'function') {
        displayReport(reportData, context);
    } else {
        showNotification('Display function not available', 'error');
    }
}

function calculateViewReportStats(quarter) {
    let filteredData = metricsData;
    
    if (quarter) {
        filteredData = metricsData.filter(d => {
            if (d.Quarter == quarter) return true;
            if (d.Date) {
                const month = new Date(d.Date).getMonth() + 1;
                if (quarter === 'Q1') return month >= 1 && month <= 3;
                if (quarter === 'Q2') return month >= 4 && month <= 6;
                if (quarter === 'Q3') return month >= 7 && month <= 9;
                if (quarter === 'Q4') return month >= 10 && month <= 12;
            }
            return false;
        });
    }
    
    if (filteredData.length === 0) filteredData = metricsData;
    
    const productionActual = filteredData.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / (filteredData.length || 1);
    const productionTarget = filteredData.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0) / (filteredData.length || 1);
    const energyActual = filteredData.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0) / (filteredData.length || 1);
    const energyTarget = filteredData.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0) / (filteredData.length || 1);
    const productionAchievement = productionTarget > 0 ? (productionActual / productionTarget * 100) : 0;
    const energyAchievement = energyTarget > 0 ? (energyActual / energyTarget * 100) : 0;
    
    const deptStats = {};
    filteredData.forEach(d => {
        const dept = d.Department || 'Unknown';
        if (!deptStats[dept]) deptStats[dept] = { actual: 0, count: 0 };
        deptStats[dept].actual += parseFloat(d.Production_Actual) || 0;
        deptStats[dept].count++;
    });
    
    const dateMap = {};
    filteredData.forEach(d => {
        if (d.Date) {
            if (!dateMap[d.Date]) dateMap[d.Date] = { sum: 0, count: 0 };
            dateMap[d.Date].sum += parseFloat(d.Production_Actual) || 0;
            dateMap[d.Date].count++;
        }
    });
    
    const dates = Object.keys(dateMap).sort().slice(-12);
    const trendData = dates.map(date => dateMap[date].sum / dateMap[date].count);
    
    return { productionActual, productionTarget, productionAchievement, energyActual, energyTarget, energyAchievement, deptStats, dates, trendData };
}

function createViewCharts(stats) {
    ['viewProductionChart', 'viewEnergyChart', 'viewAchievementChart', 'viewDepartmentChart', 'viewTrendChart'].forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            delete chartInstances[id];
        }
    });
    
    // Production Chart
    const prodCtx = document.getElementById('viewProductionChart');
    if (prodCtx) {
        chartInstances['viewProductionChart'] = new Chart(prodCtx, {
            type: 'bar',
            data: {
                labels: ['Actual', 'Target'],
                datasets: [{
                    data: [Math.round(stats.productionActual), Math.round(stats.productionTarget)],
                    backgroundColor: ['rgba(59, 130, 246, 0.9)', 'rgba(16, 185, 129, 0.9)'],
                    borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
                    borderWidth: 3,
                    borderRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 12 } } }
                }
            }
        });
    }
    
    // Energy Chart
    const energyCtx = document.getElementById('viewEnergyChart');
    if (energyCtx) {
        chartInstances['viewEnergyChart'] = new Chart(energyCtx, {
            type: 'bar',
            data: {
                labels: ['Actual', 'Target'],
                datasets: [{
                    data: [Math.round(stats.energyActual), Math.round(stats.energyTarget)],
                    backgroundColor: ['rgba(245, 158, 11, 0.9)', 'rgba(234, 179, 8, 0.9)'],
                    borderColor: ['rgb(245, 158, 11)', 'rgb(234, 179, 8)'],
                    borderWidth: 3,
                    borderRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 12 } } }
                }
            }
        });
    }
    
    // Achievement Chart
    const achieveCtx = document.getElementById('viewAchievementChart');
    if (achieveCtx) {
        chartInstances['viewAchievementChart'] = new Chart(achieveCtx, {
            type: 'doughnut',
            data: {
                labels: ['Production', 'Energy'],
                datasets: [{
                    data: [Math.round(stats.productionAchievement * 10) / 10, Math.round(stats.energyAchievement * 10) / 10],
                    backgroundColor: ['rgba(16, 185, 129, 0.9)', 'rgba(245, 158, 11, 0.9)'],
                    borderWidth: 4,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 15 } }
                }
            }
        });
    }
    
    // Department Chart
    const deptCtx = document.getElementById('viewDepartmentChart');
    if (deptCtx) {
        const depts = Object.keys(stats.deptStats).slice(0, 6);
        const values = depts.map(d => Math.round(stats.deptStats[d].actual / stats.deptStats[d].count));
        chartInstances['viewDepartmentChart'] = new Chart(deptCtx, {
            type: 'doughnut',
            data: {
                labels: depts.map(d => d.length > 25 ? d.substring(0, 25) + '...' : d),
                datasets: [{
                    data: values,
                    backgroundColor: ['rgba(59, 130, 246, 0.9)', 'rgba(16, 185, 129, 0.9)', 'rgba(245, 158, 11, 0.9)', 'rgba(239, 68, 68, 0.9)', 'rgba(168, 85, 247, 0.9)', 'rgba(236, 72, 153, 0.9)'],
                    borderWidth: 4,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 10 }, padding: 12 } }
                }
            }
        });
    }
    
    // Trend Chart
    const trendCtx = document.getElementById('viewTrendChart');
    if (trendCtx) {
        chartInstances['viewTrendChart'] = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: stats.dates,
                datasets: [{
                    label: 'Production',
                    data: stats.trendData.map(d => Math.round(d)),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 4,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
                    x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
                }
            }
        });
    }
}

async function saveReport(reportData, quarter = null, department = null) {
    try {
        // Save to database via API
        const response = await fetch(`${API_BASE}/api/save-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                textContent: reportData.textContent || reportData,
                stats: reportData.stats || {},
                context: reportData.context || {},
                quarter: quarter,
                department: department
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save report');
        }
        
        const result = await response.json();
        
        if (result.status === 'ok') {
            // Store only minimal metadata in localStorage (full data is in database)
            const reportMetadata = {
                id: result.report_id,
                timestamp: new Date().toISOString(),
                quarter: quarter,
                department: department,
                name: reportData.context?.reportName || reportData.name || 'Energy Report',
                // Store only essential context, not full report data
                context: {
                    reportName: reportData.context?.reportName,
                    reportType: reportData.context?.reportType,
                    department: reportData.context?.department
                }
            };
            
            savedReports.unshift(reportMetadata);
            
            // Limit localStorage cache to 50 reports to prevent quota issues
            if (savedReports.length > 50) {
                savedReports = savedReports.slice(0, 50);
            }
            
            try {
                localStorage.setItem('savedReports', JSON.stringify(savedReports));
            } catch (storageError) {
                // If localStorage is full, clear old entries and try again
                console.warn('localStorage quota exceeded, clearing old reports cache');
                savedReports = savedReports.slice(0, 10); // Keep only 10 most recent
                try {
                    localStorage.setItem('savedReports', JSON.stringify(savedReports));
                } catch (e) {
                    // If still failing, clear localStorage cache entirely
                    localStorage.removeItem('savedReports');
                    savedReports = [reportMetadata];
                    localStorage.setItem('savedReports', JSON.stringify(savedReports));
                }
            }
            
            showNotification('✅ Report saved successfully to database!', 'success');
            return reportMetadata;
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error saving report:', error);
        showNotification(`Error: ${error.message}`, 'error');
        return null;
    }
}

async function downloadReportAs(index, format) {
    const report = savedReports[index];
    const quarter = report.quarter || 'full';
    let date = 'Invalid date';
    if (report.timestamp && !isNaN(Date.parse(report.timestamp))) {
        date = new Date(report.timestamp).toISOString().split('T')[0];
    }
    
    // Extract text content from new format or fallback to old format
    let textContent = {};
    if (report.data) {
        if (report.data.textContent) {
            textContent = report.data.textContent;
        } else {
            textContent = report.data;
        }
    }
    let reportStats = (report.data && report.data.stats) ? report.data.stats : {};

    if (format === 'pdf') {
        // Check if we're in view mode with charts
        const reportElement = document.querySelector('.page-transition');
        if (reportElement && document.getElementById('viewProductionChart')) {
            const button = event.target.closest('button');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const canvas = await html2canvas(reportElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    backgroundColor: '#f8fafc'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save(`report_${quarter}_${date}.pdf`);
                showNotification('PDF downloaded!', 'success');
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error generating PDF', 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>PDF';
            }
            return;
        }
    }
    
    const content = `
UPSTREAM OPERATIONS REPORT
Generated: ${
        report.timestamp && !isNaN(Date.parse(report.timestamp))
            ? new Date(report.timestamp).toLocaleString()
            : 'Invalid date'
    }
Quarter: ${report.quarter || 'Full Year'}

═══════════════════════════════════════════

EXECUTIVE SUMMARY
${textContent?.executive_summary || textContent.executive_summary}

KEY INSIGHTS
${textContent?.key_insights || textContent.key_insights}

ANOMALIES
${textContent?.anomalies || textContent.anomalies}

RECOMMENDATIONS
${textContent?.recommendations || textContent.recommendations}
    `.trim();
    
    let blob, filename;
    
    switch(format) {
        case 'txt':
            blob = new Blob([content], { type: 'text/plain' });
            filename = `report_${quarter}_${date}.txt`;
            break;
        case 'doc':
            blob = new Blob([content], { type: 'application/msword' });
            filename = `report_${quarter}_${date}.doc`;
            break;
        case 'json':
              // تنظيف التقرير من NaN قبل التحويل إلى JSON
              const reportCopy = JSON.parse(JSON.stringify(report));
              cleanNaN(reportCopy);
              blob = new Blob([JSON.stringify(reportCopy, null, 2)], { type: 'application/json' });
              filename = `report_${quarter}_${date}.json`;
              break;
        default:
            return;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`${format.toUpperCase()} downloaded!`, 'success');
}

function copyReportFromArchive(index) {
    const report = savedReports[index];
    
    // Extract text content from new format or fallback to old format
    const textContent = report.data.textContent || report.data;
    
    const text = `
UPSTREAM OPERATIONS REPORT
Generated: ${
        report.timestamp && !isNaN(Date.parse(report.timestamp))
            ? new Date(report.timestamp).toLocaleString()
            : 'Invalid date'
    }

EXECUTIVE SUMMARY
${textContent?.executive_summary || textContent.executive_summary}

KEY INSIGHTS
${textContent?.key_insights || textContent.key_insights}

ANOMALIES
${textContent?.anomalies || textContent.anomalies}

RECOMMENDATIONS
${textContent?.recommendations || textContent.recommendations}
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Report copied!', 'success');
    });
}

function deleteReport(index) {
    if (confirm('Delete this report?')) {
        const report = savedReports[index];
        // إذا كان التقرير من قاعدة البيانات (له id)
        if (report.id && typeof report.id === 'number') {
            fetch(`${API_BASE}/api/reports/${report.id}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete from database');
                // حذف من المصفوفة المحلية
                savedReports.splice(index, 1);
                localStorage.setItem('savedReports', JSON.stringify(savedReports));
                showNotification('Report deleted from database!', 'success');
                renderReportsArchivePage();
            })
            .catch(error => {
                showNotification('Error deleting report: ' + error.message, 'error');
            });
        } else {
            // حذف محلي فقط
            savedReports.splice(index, 1);
            localStorage.setItem('savedReports', JSON.stringify(savedReports));
            showNotification('Report deleted!', 'success');
            renderReportsArchivePage();
        }
    }
}

function clearAllReports() {
    if (confirm('⚠️ Delete ALL reports? Cannot be undone!')) {
        savedReports = [];
        localStorage.setItem('savedReports', JSON.stringify(savedReports));
        showNotification('All reports cleared!', 'success');
        renderReportsArchivePage();
    }
}

function filterReports() {
    const searchTerm = document.getElementById('searchReports').value.toLowerCase();
    const quarterFilter = document.getElementById('filterQuarter').value;
    
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach((card, index) => {
        const report = savedReports[index];
        const matchesSearch = !searchTerm || JSON.stringify(report.data).toLowerCase().includes(searchTerm);
        const matchesQuarter = !quarterFilter || report.quarter === quarterFilter;
        card.style.display = (matchesSearch && matchesQuarter) ? 'block' : 'none';
    });
}

function getThisMonthReports() {
    const now = new Date();
    return savedReports.filter(r => {
        const date = new Date(r.timestamp);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
}

function getLastWeekReports() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return savedReports.filter(r => {
        if (!r.timestamp || isNaN(Date.parse(r.timestamp))) return false;
        return new Date(r.timestamp) >= weekAgo;
    }).length;
}

function getStorageSize() {
    const size = new Blob([JSON.stringify(savedReports)]).size;
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

// SETTINGS PAGE
function renderSettingsPage() {
    document.getElementById('pageTitle').textContent = 'Settings';
    
    const departments = [...new Set(metricsData.map(d => d.Department))].length;
    const streams = [...new Set(metricsData.map(d => d.Stream))].length;
    const dates = [...new Set(metricsData.map(d => d.Date))].length;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6 max-w-6xl">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-info-circle text-blue-500"></i>
                    System Information
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p class="text-sm text-blue-600 mb-1">Total Records</p>
                        <p class="text-2xl font-bold text-blue-900">${metricsData.length}</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p class="text-sm text-green-600 mb-1">Departments</p>
                        <p class="text-2xl font-bold text-green-900">${departments}</p>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <p class="text-sm text-purple-600 mb-1">Streams</p>
                        <p class="text-2xl font-bold text-purple-900">${streams}</p>
                    </div>
                    <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p class="text-sm text-amber-600 mb-1">Date Range</p>
                        <p class="text-2xl font-bold text-amber-900">${dates} days</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <i class="fas fa-tasks text-indigo-500"></i>
                    System Setup Progress
                </h2>
                
                <div class="space-y-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="flex-1 bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                            <div class="font-bold text-slate-800">Data Import Complete</div>
                            <div class="text-sm text-slate-600">${metricsData.length} records loaded</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="flex-1 bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                            <div class="font-bold text-slate-800">Dashboard Configured</div>
                            <div class="text-sm text-slate-600">All visualizations ready</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="flex-1 bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                            <div class="font-bold text-slate-800">Analytics Engine Active</div>
                            <div class="text-sm text-slate-600">Real-time calculations enabled</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <i class="fas fa-rocket"></i>
                        </div>
                        <div class="flex-1 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border-l-4 border-emerald-500">
                            <div class="font-bold text-slate-800">System Ready 🎉</div>
                            <div class="text-sm text-slate-600">All systems operational</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-cog text-slate-500"></i>
                    API Configuration
                </h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Backend URL</label>
                        <input type="text" value="${API_BASE}" readonly class="w-full px-4 py-3 border-2 border-slate-200 rounded-lg bg-slate-50 font-mono text-sm" />
                    </div>
                    
                    <div class="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                        <div>
                            <div class="font-bold text-green-900">Connected</div>
                            <div class="text-sm text-green-700">API working properly</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

