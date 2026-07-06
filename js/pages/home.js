
let performanceCharts = {};     // الرسوم البيانية المفعلة

// =======================================================================
// 2. API CONFIGURATION
// =======================================================================
const API_CONFIG = {
    BASE_URL: 'http://localhost:8001/api',
    ENABLE_DATABASE_SAVE: true,
    
    async call(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Call failed:', error);
            throw error;
        }
    }
};

// =======================================================================
// 3. HELPER FUNCTIONS - GENERAL
// =======================================================================

/**
 * التنقل بين الصفحات
 */
function navigateTo(page) {
    console.log('Navigating to:', page);
    
    // تنظيف الرسوم البيانية
    destroyPerformanceCharts();
    
    // إخفاء أي modals مفتوحة
    closeEditModal();
    
    switch(page.toLowerCase()) {
        case 'home':
            renderHomePage();
            break;
        case 'reportnow':
        case 'report':
            renderReportNowPage();
            break;
        case 'archive':
            renderReportsArchivePage();
            break;
        case 'performance':
            renderPerformancePage();
            break;
        case 'settings':
            renderSettingsPage();
            break;
        default:
            console.warn('Unknown page:', page);
            renderHomePage();
    }
}

/**
 * الحصول على جميع الأقسام
 */
function getAllDepartments() {
    if (!metricsData || metricsData.length === 0) {
        return ['General', 'Drilling', 'Production', 'Maintenance', 'Engineering'];
    }
    
    const departments = [...new Set(metricsData.map(d => d.Department))].filter(d => d);
    
    if (departments.length === 0) {
        return ['General', 'Drilling', 'Production', 'Maintenance', 'Engineering'];
    }
    
    return departments;
}

/**
 * إغلاق modal التعديل
 */
function closeEditModal() {
    try {
        const modal = document.getElementById('editModalContainer');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = 'auto';
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

/**
 * تنظيف الرسوم البيانية
 */
function destroyPerformanceCharts() {
    try {
        Object.keys(performanceCharts).forEach(key => {
            if (performanceCharts[key]) {
                performanceCharts[key].destroy();
                delete performanceCharts[key];
            }
        });
        console.log('✅ Charts cleaned up');
    } catch (error) {
        console.error('Error destroying charts:', error);
    }
}

/**
 * التحقق من اتصال قاعدة البيانات
 */
async function checkDatabaseConnection() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
        const isConnected = response.ok;
        
        console.log('Database connection:', isConnected ? '✅ Connected' : '❌ Disconnected');
        return isConnected;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

/**
 * عرض إشعار
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-amber-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle'
            }"></i>
            <span class="font-bold">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * تنسيق الأرقام
 */
function formatNumber(num) {
    if (!num) return '0';
    return Math.round(num).toLocaleString();
}

/**
 * انتظار لمدة معينة
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تحويل البيانات إلى CSV
 */
function exportDataToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let row of rows) {
        const rowData = [];
        const cols = row.querySelectorAll('td, th');
        
        for (let col of cols) {
            let text = col.textContent || col.innerText;
            text = text.replace(/,/g, ' ').replace(/\n/g, ' ');
            rowData.push(`"${text}"`);
        }
        
        csv.push(rowData.join(','));
    }
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('CSV exported successfully', 'success');
}

// =======================================================================
// 4. HOME PAGE
// =======================================================================

function renderHomePage() {
    document.getElementById('pageTitle').textContent = 'Home Dashboard';

    const stats = calculatePerformanceStats();

    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-6">

            <!-- Header Section -->
            <div class="home-animated animate-fade-in bg-gradient-to-r from-[#003A70] via-[#0059B3] to-[#4DA3FF] rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden" style="animation-delay:0.1s;">
                <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>

                <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <i class="fas fa-home text-lg"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-black">Home Dashboard</h1>
                            <p class="text-white/80 mt-1">Comprehensive performance metrics and trends</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- KPI CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${[
                    {
                        title: "Production",
                        icon: "fa-oil-can",
                        badge: "Actual vs Target",
                        badgeColor: "bg-blue-100 text-blue-700",
                        bgIconColor: "text-blue-700",
                        value: formatNumber(stats.production.actual),
                        unit: "barrels/day",
                        target: stats.production.target,
                        percent: stats.production.percent,
                        diff: stats.production.diff
                    },
                    {
                        title: "Energy Consumption",
                        icon: "fa-bolt",
                        badge: "Actual vs Target",
                        badgeColor: "bg-amber-100 text-amber-700",
                        bgIconColor: "text-amber-700",
                        value: formatNumber(stats.energy.actual),
                        unit: "kilowatt-hours",
                        target: stats.energy.target,
                        percent: stats.energy.percent,
                        diff: stats.energy.diff
                    },
                    {
                        title: "Gas Production",
                        icon: "fa-fire",
                        badge: "Compression / Processing",
                        badgeColor: "bg-emerald-100 text-emerald-700",
                        bgIconColor: "text-emerald-700",
                        value: formatNumber(stats.gas.actual),
                        unit: "MMSCFD",
                        target: stats.gas.target,
                        percent: stats.gas.percent,
                        diff: stats.gas.diff
                    }
                ].map((kpi, idx) => `
                    <div class="home-animated animate-fade-in bg-gradient-to-r from-blue-500 to-green-400 p-[2px] rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.01]" style="animation-delay: ${0.2 + idx * 0.3}s;">
                        <div class="bg-white rounded-2xl p-6 relative overflow-hidden">
                            <div class="absolute right-0 top-0 opacity-10 text-7xl pr-4 pt-2">
                                <i class="fas ${kpi.icon}"></i>
                            </div>
                            <div class="flex items-center justify-between mb-3 relative z-10">
                                <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    ${kpi.title}
                                </span>
                                <span class="text-[11px] px-2 py-1 rounded-full ${kpi.badgeColor} font-medium">
                                    ${kpi.badge}
                                </span>
                            </div>
                            <div class="text-4xl font-bold text-slate-900 relative z-10">
                                ${kpi.value}
                            </div>
                            <div class="text-xs text-slate-500 mt-1 mb-3 relative z-10">
                                <span class="font-semibold">${kpi.unit}</span> • Target: ${formatNumber(kpi.target)}
                            </div>
                            <div class="mt-4 flex items-center justify-between relative z-10">
                                <div class="${kpi.diff >= 0 ? 'text-green-600' : 'text-red-600'} text-base font-bold flex items-center">
                                    <i class="fas ${kpi.diff >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-2"></i>
                                    ${kpi.percent.toFixed(1)}%
                                </div>
                                <div class="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
                                        style="width: ${Math.min(kpi.percent, 130).toFixed(0)}%">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>

            <!-- Charts Grid -->
            <div class="home-animated animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6" style="animation-delay:1.1s">

                <!-- Production vs Target Trend -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Production vs Target</h3>
                            <p class="text-xs text-slate-500">Monthly comparison</p>
                        </div>
                        <button onclick="resetPerformanceChart('productionTrendChart')" class="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-lg text-xs hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-100">
                            <i class="fas fa-redo mr-1"></i> Reset
                        </button>
                    </div>
                    <div style="height: 320px;">
                        <canvas id="productionTrendChart"></canvas>
                    </div>
                </div>

                <!-- Energy Consumption Trend -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Energy Consumption</h3>
                            <p class="text-xs text-slate-500">Monthly energy usage</p>
                        </div>
                        <button onclick="resetPerformanceChart('energyTrendChart')" class="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-600 rounded-lg text-xs hover:from-purple-100 hover:to-violet-100 transition-all border border-purple-100">
                            <i class="fas fa-redo mr-1"></i> Reset
                        </button>
                    </div>
                    <div style="height: 320px;">
                        <canvas id="energyTrendChart"></canvas>
                    </div>
                </div>

                <!-- Department Performance -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Department Performance</h3>
                            <p class="text-xs text-slate-500">Production by department</p>
                        </div>
                        <button onclick="resetPerformanceChart('deptPerformanceChart')" class="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-lg text-xs hover:from-indigo-100 hover:to-blue-100 transition-all border border-indigo-100">
                            <i class="fas fa-redo mr-1"></i> Reset
                        </button>
                    </div>
                    <div style="height: 320px;">
                        <canvas id="deptPerformanceChart"></canvas>
                    </div>
                </div>

                <!-- Downtime Analysis -->
                <div class="bg-white rounded-xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Downtime by Department</h3>
                            <p class="text-xs text-slate-500">Minutes of downtime</p>
                        </div>
                        <button onclick="resetPerformanceChart('downtimeChart')" class="px-3 py-1.5 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-600 rounded-lg text-xs hover:from-violet-100 hover:to-purple-100 transition-all border border-violet-100">
                            <i class="fas fa-redo mr-1"></i> Reset
                        </button>
                    </div>
                    <div style="height: 320px;">
                        <canvas id="downtimeChart"></canvas>
                    </div>
                </div>

            </div>

    `;

    // إضافة كود لجعل العناصر تظهر تدريجياً بعد التحميل
    setTimeout(() => {
        document.querySelectorAll('.home-animated').forEach((el, i) => {
            el.classList.add('animate-fade-in');
            el.style.animationDelay = (0.1 + i * 0.3) + 's';
        });
        renderPerformanceCharts(stats);
    }, 100);
}

// =======================================================================
// 5. PERFORMANCE STATISTICS CALCULATION
// =======================================================================

function calculatePerformanceStats() {
    const data = metricsData;

    let prodActual = 0, prodTarget = 0;
    let gasActual = 0, gasTarget = 0;
    let energyActual = 0, energyTarget = 0;

    let totalDowntime = 0;
    let temps = [];

    const yearlyData = {};
    const deptData = {};
    const deptDowntime = {};

    data.forEach(d => {
        prodActual += parseFloat(d.Production_Actual) || 0;
        prodTarget += parseFloat(d.Production_Target) || 0;

        const gActual = parseFloat(d.Compression_Actual ?? d.Processing_Actual ?? d.Throughput_Actual ?? 0);
        const gTarget = parseFloat(d.Compression_Target ?? d.Processing_Target ?? d.Throughput_Target ?? 0);
        gasActual += gActual;
        gasTarget += gTarget;

        energyActual += parseFloat(d.Energy_Actual) || 0;
        energyTarget += parseFloat(d.Energy_Target) || 0;

        totalDowntime += parseFloat(d.Downtime_Min) || 0;

        if (d.Temperature_C) temps.push(parseFloat(d.Temperature_C));

        if (d.Date) {
            const yearKey = d.Date.substring(0, 4);
            if (!yearlyData[yearKey]) {
                yearlyData[yearKey] = {
                    prodActual: 0, prodTarget: 0,
                    energyActual: 0, energyTarget: 0,
                    temps: [], count: 0
                };
            }

            yearlyData[yearKey].prodActual += parseFloat(d.Production_Actual) || 0;
            yearlyData[yearKey].prodTarget += parseFloat(d.Production_Target) || 0;
            yearlyData[yearKey].energyActual += parseFloat(d.Energy_Actual) || 0;
            yearlyData[yearKey].energyTarget += parseFloat(d.Energy_Target) || 0;

            if (d.Temperature_C) yearlyData[yearKey].temps.push(parseFloat(d.Temperature_C));
            yearlyData[yearKey].count++;
        }

        const dept = d.Department || "Unknown";
        if (!deptData[dept]) deptData[dept] = { actual: 0, target: 0, count: 0 };

        deptData[dept].actual += parseFloat(d.Production_Actual) || 0;
        deptData[dept].target += parseFloat(d.Production_Target) || 0;
        deptData[dept].count++;

        if (!deptDowntime[dept]) deptDowntime[dept] = 0;
        deptDowntime[dept] += parseFloat(d.Downtime_Min) || 0;
    });

    const years = Object.keys(yearlyData).sort();

    return {
        production: {
            actual: prodActual,
            target: prodTarget,
            percent: prodTarget > 0 ? (prodActual / prodTarget) * 100 : 0,
            diff: prodActual - prodTarget
        },
        energy: {
            actual: energyActual,
            target: energyTarget,
            percent: energyTarget > 0 ? (energyActual / energyTarget) * 100 : 0,
            diff: energyActual - energyTarget
        },
        gas: {
            actual: gasActual,
            target: gasTarget,
            percent: gasTarget > 0 ? (gasActual / gasTarget) * 100 : 0,
            diff: gasActual - gasTarget
        },

        totalDowntime,
        avgTemperature: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
        minTemp: temps.length ? Math.min(...temps) : 0,
        maxTemp: temps.length ? Math.max(...temps) : 0,

        yearlyData,
        years,
        deptData,
        deptDowntime
    };
}

// =======================================================================
// 6. CHART FUNCTIONS
// =======================================================================

function resetPerformanceChart(chartId) {
    if (performanceCharts[chartId]) {
        performanceCharts[chartId].resetZoom && performanceCharts[chartId].resetZoom();
    }
}

function renderPerformanceCharts(stats) {
    destroyPerformanceCharts();

    const tooltipConfig = {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(100, 116, 139, 0.3)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12, weight: '500' }
    };

    const gradientPalette = [
        '#0f307dff',
        '#113a92ff',
        '#153b8c',
        '#1a4aab',
        '#2058c8',
        '#3a6fde',
        '#5788ee',
        '#78a3f4',
        '#9bbcf7',
        '#b8d0f9'
    ];

    // Production Trend Chart
    const prodCtx = document.getElementById('productionTrendChart');
    if (prodCtx) {
        const ctx = prodCtx.getContext('2d');
        const blueGradient = ctx.createLinearGradient(0, 0, 0, 320);
        blueGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        blueGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

        const indigoGradient = ctx.createLinearGradient(0, 0, 0, 320);
        indigoGradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
        indigoGradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

        performanceCharts['productionTrendChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.years,
                datasets: [
                    {
                        label: 'Actual',
                        data: stats.years.map(y => Math.round(stats.yearlyData[y].prodActual)),
                        borderColor: '#3b82f6',
                        backgroundColor: blueGradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 1,
                        pointRadius: 0,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 0
                    },
                    {
                        label: 'Target',
                        data: stats.years.map(y => Math.round(stats.yearlyData[y].prodTarget)),
                        borderColor: '#6366f1',
                        backgroundColor: indigoGradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        borderDash: [6, 4],
                        pointRadius: 4,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointStyle: 'rectRot'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { font: { size: 11, weight: '500' }, color: '#475569', usePointStyle: true, boxWidth: 8, padding: 15 }
                    },
                    tooltip: tooltipConfig
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { font: { size: 11 }, color: '#64748b', callback: v => v.toLocaleString() },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        border: { display: false }
                    },
                    x: {
                        ticks: { font: { size: 10 }, color: '#64748b', maxRotation: 0, minRotation: 0 },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    }

    // Energy Trend Chart
    const energyCtx = document.getElementById('energyTrendChart');
    if (energyCtx) {
        const ctx = energyCtx.getContext('2d');
        const purpleGradient = ctx.createLinearGradient(0, 0, 0, 320);
        purpleGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        purpleGradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');

        performanceCharts['energyTrendChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.years,
                datasets: [
                    {
                        label: 'Energy Actual',
                        data: stats.years.map(y => Math.round(stats.yearlyData[y].energyActual)),
                        borderColor: '#8b5cf6',
                        backgroundColor: purpleGradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 1,
                        pointRadius: 0,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 5
                    },
                    {
                        label: 'Energy Target',
                        data: stats.years.map(y => Math.round(stats.yearlyData[y].energyTarget)),
                        borderColor: '#a855f7',
                        borderWidth: 2.5,
                        borderDash: [6, 4],
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#a855f7',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointStyle: 'rectRot',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { font: { size: 11, weight: '500' }, color: '#475569', usePointStyle: true, boxWidth: 8, padding: 15 }
                    },
                    tooltip: tooltipConfig
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { font: { size: 11 }, color: '#64748b', callback: v => v.toLocaleString() },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        border: { display: false }
                    },
                    x: {
                        ticks: { font: { size: 10 }, color: '#64748b', maxRotation: 0, minRotation: 0 },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    }

    // Department Performance Chart
    const deptCtx = document.getElementById('deptPerformanceChart');
    if (deptCtx) {
        const depts = Object.keys(stats.deptData)
            .filter(d => {
                const item = stats.deptData[d];
                return item && item.actual != null && item.count != null 
                    && !isNaN(item.actual) && !isNaN(item.count) 
                    && item.actual > 0 && item.count > 0;
            }); // عرض جميع الأقسام بدون اقتصاص

        // مجموع الإنتاج لكل الأقسام
        const totalDeptProduction = depts.reduce((sum, d) => sum + stats.deptData[d].actual, 0);

        // متوسط الإنتاج لكل قسم
        const values = depts.map(d => 
            Math.round(stats.deptData[d].actual / stats.deptData[d].count)
        );

        // عرض مجموع الإنتاج للمقارنة
        console.log('totalDeptProduction:', totalDeptProduction);
        console.log('totalDeptProduction:', stats.production.actual);

        performanceCharts['deptPerformanceChart'] = new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: depts.map(d => d.length > 14 ? d.substring(0, 11) + '...' : d),
                datasets: [{
                    label: 'Avg Production',
                    data: values,
                    backgroundColor: depts.map((_, i) => gradientPalette[i % gradientPalette.length]),
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: tooltipConfig,
                    filler: { propagate: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { 
                            font: { size: 10 }, 
                            color: '#64748b', 
                            callback: v => v.toLocaleString(),
                            padding: 8
                        },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        border: { display: false }
                    },
                    y: {
                        ticks: { 
                            font: { size: 10 }, 
                            color: '#475569',
                            padding: 8
                        },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    }

    // Downtime Chart
    const downCtx = document.getElementById('downtimeChart');
    if (downCtx) {
        const depts = Object.keys(stats.deptDowntime); // عرض جميع الأقسام بدون اقتصاص
        const values = depts.map(d => Math.round(stats.deptDowntime[d]));

        performanceCharts['downtimeChart'] = new Chart(downCtx, {
            type: 'bar',
            data: {
                labels: depts.map(d => d.length > 14 ? d.substring(0, 11) + '...' : d),
                datasets: [{
                    label: 'Downtime (min)',
                    data: values,
                    backgroundColor: depts.map((_, i) => gradientPalette[i % gradientPalette.length]),
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...tooltipConfig,
                        callbacks: {
                            label: ctx => 'Downtime: ' + ctx.parsed.y.toLocaleString() + ' min'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            font: { size: 10 }, 
                            color: '#64748b',
                            padding: 8
                        },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        border: { display: false }
                    },
                    x: {
                        ticks: { 
                            font: { size: 9 }, 
                            color: '#475569', 
                            maxRotation: 45,
                            minRotation: 45,
                            padding: 5
                        },
                        grid: { display: false },
                        border: { display: false }
                    }
                }
            }
        });
    }

  
}
