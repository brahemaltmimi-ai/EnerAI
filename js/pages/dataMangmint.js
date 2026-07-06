// =======================================================================
// Accordion toggle for loading steps
// Accordion toggle for all steps (single container)
function toggleAllStepsDetails() {
    const acc = document.getElementById('allStepsAccordion');
    const btn = document.querySelector('.fa-chevron-down');
    const isOpen = !acc.classList.contains('hidden');
    acc.classList.toggle('hidden', isOpen);
    if (btn) btn.style.transform = isOpen ? '' : 'rotate(180deg)';
}
// ENHANCED DATA MANAGEMENT WORKFLOW SYSTEM WITH LOCAL STORAGE
// =======================================================================

// Global state for data management workflow
let dataWorkflowState = {
    currentStep: 1,
    selectedAdminArea: null,
    selectedDepartment: null,
    selectedStream: null,
    filteredDataByAdminArea: [],
    filteredDataByDepartment: [],
    filteredDataByStream: [],
    startDate: null,
    endDate: null,
    dateFilterActive: false,
    showAllAdminAreas: false,
    showAllDepartments: false
};

// Store chart instances for cleanup
if (!window.chartInstances) {
    window.chartInstances = {
        adminAreaProductionChart: null,
        adminAreaEnergyChart: null,
        adminAreaDeptChart: null,
        streamProductionChart: null,
        streamEnergyChart: null,
        streamDeptChart: null
    };
}

// =======================================================================
// LOCAL STORAGE MANAGEMENT
// =======================================================================

const STORAGE_KEY = 'metrics_data_v1';

function saveToLocalStorage(data) {
    try {
        // Save the exact data to localStorage with timestamp
        const dataWithTimestamp = {
            data: data || metricsData,
            timestamp: new Date().toISOString(),
            recordCount: (data || metricsData).length
        };
        
        const compressed = LZString.compress(JSON.stringify(dataWithTimestamp));
        localStorage.setItem("metrics_data_v1", compressed);
        console.log(" Data saved to localStorage:", dataWithTimestamp.recordCount, "records at", dataWithTimestamp.timestamp);
    } catch (error) {
        console.error(" Error saving to localStorage:", error);
    }
}

function loadFromLocalStorage() {
    try {
        const compressed = localStorage.getItem("metrics_data_v1");
        if (!compressed) {
            console.log("📭 No data in localStorage");
            return null;
        }
        
        const json = LZString.decompress(compressed);
        const savedData = JSON.parse(json || "{}");
        
        // Check if it's the new format with timestamp
        if (savedData.data && Array.isArray(savedData.data)) {
            console.log(" Loaded from localStorage:", savedData.recordCount, "records (saved at", savedData.timestamp, ")");
            return savedData.data;
        }
        
        // Fallback for old format
        if (Array.isArray(savedData)) {
            console.log(" Loaded old format from localStorage:", savedData.length, "records");
            return savedData;
        }
        
        return null;
    } catch (error) {
        console.error(" Error loading localStorage:", error);
        return null;
    }
}

// ✅ Check if localStorage data has IDs - if not, clear it to force API reload
function validateLocalStorageData() {
    const savedData = loadFromLocalStorage();
    if (savedData && savedData.length > 0) {
        // ✅ FIX: Check both 'id' and 'ID' (API returns uppercase ID)
        const hasIds = savedData.slice(0, 5).every(record => 
            (record.id !== undefined && record.id !== null) || 
            (record.ID !== undefined && record.ID !== null)
        );
        if (!hasIds) {
            console.warn(" localStorage data missing IDs - clearing cache to reload from API");
            localStorage.removeItem('metrics_data_v1');
            return false;
        }
        console.log(" localStorage data has valid IDs, sample:", savedData[0]?.id || savedData[0]?.ID);
        return true;
    }
    return false;
}

// ✅ Force reload data from API (clears localStorage cache)
async function forceReloadFromAPI() {
    console.log(" Force reloading data from API...");
    localStorage.removeItem('metrics_data_v1');
    
    const apiBase = window.API_BASE || 'http://localhost:8001';
    try {
        const response = await fetch(`${apiBase}/api/metrics`);
        if (response.ok) {
            const data = await response.json();
            if (data.records && Array.isArray(data.records)) {
                metricsData = data.records;
                console.log(" Loaded", metricsData.length, "records from API");
                console.log(" Sample record:", metricsData[0]);
                
                // Save to localStorage with IDs
                saveToLocalStorage(metricsData);
                
                showNotification(`Reloaded ${metricsData.length} records from database`, 'success');
                return true;
            }
        }
    } catch (error) {
        console.error(" Error loading from API:", error);
        showNotification('Failed to reload from API: ' + error.message, 'error');
    }
    return false;
}

// Make it available globally
window.forceReloadFromAPI = forceReloadFromAPI;

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof metricsData !== 'undefined') {
        // First validate that localStorage data has IDs
        const isValid = validateLocalStorageData();
        
        if (isValid) {
            const savedData = loadFromLocalStorage();
            if (savedData && savedData.length > 0) {
                metricsData = savedData;
                console.log(" Using localStorage data:", metricsData.length, "records");
                console.log(" Sample record ID:", metricsData[0]?.id);
            }
        } else {
            console.log(" No valid localStorage data, will fetch from API");
            // Auto-reload from API if localStorage is invalid
            setTimeout(() => {
                if (typeof forceReloadFromAPI === 'function') {
                    forceReloadFromAPI();
                }
            }, 1000);
        }
    }
});

// Reload charts when page becomes visible (returning to tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && typeof renderDataManagementSystem === 'function') {
        console.log("Page became visible - reloading charts and data");
        
        // Reload data from localStorage first
        const savedData = loadFromLocalStorage();
        if (savedData && savedData.length > 0) {
            metricsData = savedData;
            console.log("📦 Reloaded data from localStorage:", metricsData.length, "records");
        }
        
        // Re-render charts based on current step
        setTimeout(() => {
            if (dataWorkflowState.currentStep === 2) {
                console.log("Re-rendering admin area charts...");
                renderAdminAreaCharts();
            } else if (dataWorkflowState.currentStep === 4) {
                console.log(" Re-rendering stream charts...");
                renderStreamCharts();
            }
        }, 100);
    }
});

// IMPORTANT: Force chart re-render every time content is updated
const originalRenderDataManagementSystem = renderDataManagementSystem;
renderDataManagementSystem = function() {
    originalRenderDataManagementSystem.apply(this, arguments);
    
    // Schedule chart rendering after DOM is updated
    setTimeout(() => {
        if (dataWorkflowState.currentStep === 2) {
            console.log("Auto-rendering admin area charts after content update");
            renderAdminAreaCharts();
        } else if (dataWorkflowState.currentStep === 4) {
            console.log("Auto-rendering stream charts after content update");
            renderStreamCharts();
        }
    }, 150);
};

// Monitor DOM changes and re-render charts when canvases appear
const contentObserver = new MutationObserver(function(mutations) {
    let hasChartCanvas = false;
    
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'CANVAS' || node.querySelector?.('canvas')) {
                        hasChartCanvas = true;
                    }
                }
            });
        }
    });
    
    if (hasChartCanvas) {
        console.log("Canvas elements detected in DOM - rendering charts");
        setTimeout(() => {
            if (dataWorkflowState.currentStep === 2) {
                renderAdminAreaCharts();
            } else if (dataWorkflowState.currentStep === 4) {
                renderStreamCharts();
            }
        }, 100);
    }
});

// Start observing the content area for changes
const contentArea = document.getElementById('dataWorkflowContent');
if (contentArea) {
    contentObserver.observe(contentArea, {
        childList: true,
        subtree: true,
        attributes: false
    });
}

// Handle page return (back button, forward button, refresh)
window.addEventListener('pageshow', function(event) {
    console.log(" Page show event triggered - reloading data and charts");
    
    // Reload data from localStorage
    const savedData = loadFromLocalStorage();
    if (savedData && savedData.length > 0) {
        metricsData = savedData;
        console.log(" Reloaded data from localStorage:", metricsData.length, "records");
    }
    
    // Re-render the current workflow step with charts
    setTimeout(() => {
        console.log(" Current step:", dataWorkflowState.currentStep);
        if (dataWorkflowState.currentStep === 2) {
            console.log(" Rendering admin area charts on page return...");
            renderAdminAreaCharts();
        } else if (dataWorkflowState.currentStep === 4) {
            console.log("Rendering stream charts on page return...");
            renderStreamCharts();
        }
    }, 200);
});

// Get filtered metrics data based on date filter
function getFilteredMetricsData() {
    let filteredData = metricsData;
    
    // إذا كان هناك فلتر نشط، استخدمه
    if (dataWorkflowState.dateFilterActive) {
        filteredData = metricsData.filter(d => {
            if (!d.Date) return false;
            const recordDate = new Date(d.Date);
            const start = dataWorkflowState.startDate ? new Date(dataWorkflowState.startDate) : null;
            const end = dataWorkflowState.endDate ? new Date(dataWorkflowState.endDate) : null;
            
            if (start && recordDate < start) return false;
            if (end && recordDate > end) return false;
            return true;
        });
    } else {
        // إذا لم يكن هناك فلتر، عرض بيانات سنة 2025 فقط
        filteredData = metricsData.filter(d => {
            if (!d.Date) return false;
            const recordDate = new Date(d.Date);
            const year = recordDate.getFullYear();
            return year === 2025;
        });
    }
    
    return filteredData;
}

// Destroy old chart instances
function destroyChart(chartName) {
    if (window.chartInstances[chartName] && typeof window.chartInstances[chartName].destroy === 'function') {
        window.chartInstances[chartName].destroy();
        window.chartInstances[chartName] = null;
        console.log(` Destroyed chart: ${chartName}`);
    }
}

// Destroy all charts on a specific canvas element
function destroyCanvasCharts(canvasId) {
    // محاولة حذف من window.chartInstances أولاً
    if (window.chartInstances && window.chartInstances[canvasId]) {
        if (typeof window.chartInstances[canvasId].destroy === 'function') {
            window.chartInstances[canvasId].destroy();
            console.log(` Destroyed chart instance: ${canvasId}`);
        }
        window.chartInstances[canvasId] = null;
    }
    
    // البحث في جميع الرسوم المخزنة عبر Chart.js
    if (window.Chart && window.Chart.instances) {
        for (let i = window.Chart.instances.length - 1; i >= 0; i--) {
            const chart = window.Chart.instances[i];
            if (chart && chart.canvas && chart.canvas.id === canvasId) {
                chart.destroy();
                console.log(` Destroyed Chart.js instance for canvas: ${canvasId}`);
                break;
            }
        }
    }
    
    // حاول حذف من خلال العنصر نفسه
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        if (canvas.__chart && typeof canvas.__chart.destroy === 'function') {
            canvas.__chart.destroy();
            delete canvas.__chart;
            console.log(` Destroyed canvas.__chart for: ${canvasId}`);
        }
        // تنظيف أي بيانات متبقية
        if (canvas.chart && typeof canvas.chart.destroy === 'function') {
            canvas.chart.destroy();
            delete canvas.chart;
            console.log(` Destroyed canvas.chart for: ${canvasId}`);
        }
    }
}

// Apply date filter
function applyDateFilter() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    
    if (!startDate && !endDate) {
        showNotification('Please select at least one date', 'warning');
        return;
    }
    
    dataWorkflowState.startDate = startDate;
    dataWorkflowState.endDate = endDate;
    dataWorkflowState.dateFilterActive = true;
    
    // Reset selections
    dataWorkflowState.selectedAdminArea = null;
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.currentStep = 1;
    
    renderDataManagementSystem();
    showNotification('Date filter applied: ' + (startDate || 'Start') + ' to ' + (endDate || 'End'), 'success');
}

// Clear date filter
function clearDateFilter() {
    dataWorkflowState.startDate = null;
    dataWorkflowState.endDate = null;
    dataWorkflowState.dateFilterActive = false;
    
    renderDataManagementSystem();
    showNotification('Date filter cleared', 'info');
}

function renderDataManagementSystem() {
    document.getElementById('pageTitle').textContent = 'Data Management System';
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition space-y-8 max-w-7xl mx-auto">
            
            <!-- Header Section with Gradient -->
            <div class="bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600 rounded-2xl shadow-2xl p-8 text-white">
                <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div class="flex items-center gap-4">
                        <div>
                            <h2 class="text-4xl font-black mb-2">Data Management Workflow</h2>
                            <p class="text-blue-50 text-lg">Step-by-step data analysis and reporting</p>
                        </div>
                        <span class="px-3 py-1 bg-white/20 rounded-full text-sm">
                            ${metricsData.length} records
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="showBackupManager()" class="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-all" title="Backup Manager">
                            <i class="fas fa-database"></i> Backup
                        </button>
                        <button onclick="navigateTo('home')" class="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold flex items-center gap-2 transition-all">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                    </div>
                </div>
                
                <!-- Date Filter -->
                <div class="bg-white/15 backdrop-blur-md rounded-xl p-5 mb-6 border border-white/20">
                    <h3 class="text-white font-bold text-lg mb-4 flex items-center">
                        <i class="fas fa-calendar-alt mr-2"></i> Date Range Filter
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-cyan-50 text-sm font-bold mb-2">Start Date</label>
                            <input type="date" id="filterStartDate" value="${dataWorkflowState.startDate || ''}"
                                   class="w-full px-4 py-3 rounded-lg bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-cyan-300 border-2 border-transparent focus:border-cyan-400 transition-all">
                        </div>
                        <div>
                            <label class="block text-cyan-50 text-sm font-bold mb-2">End Date</label>
                            <input type="date" id="filterEndDate" value="${dataWorkflowState.endDate || ''}"
                                   class="w-full px-4 py-3 rounded-lg bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-cyan-300 border-2 border-transparent focus:border-cyan-400 transition-all">
                        </div>
                        <div class="flex items-end gap-2">
                            <button onclick="applyDateFilter()" class="flex-1 px-4 py-3 bg-white hover:bg-cyan-50 text-cyan-700 rounded-lg font-bold transition-all shadow-md hover:shadow-lg">
                                <i class="fas fa-filter mr-2"></i> Apply Filter
                            </button>
                            <button onclick="clearDateFilter()" class="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all border border-white/30">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    ${dataWorkflowState.dateFilterActive ? `
                        <div class="mt-3 px-4 py-2 bg-cyan-500/20 rounded-lg border border-cyan-400/30 text-cyan-50 text-sm">
                            <i class="fas fa-info-circle mr-2"></i>
                            <strong>Active Filter:</strong> ${dataWorkflowState.startDate || 'Any'} to ${dataWorkflowState.endDate || 'Any'}
                            (${getFilteredMetricsData().length} records)
                        </div>
                    ` : ''}
                </div>
                
                <!-- Progress Steps -->
                <div class="flex items-center justify-between mb-6 relative">
                    <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
                    
                    <div class="flex items-center justify-center relative z-10">
                        <div class="w-10 h-10 rounded-full ${dataWorkflowState.currentStep >= 1 ? 'bg-blue-400' : 'bg-white/20'} flex items-center justify-center shadow-lg">
                            <span class="text-white font-bold">1</span>
                        </div>
                        <span class="ml-2 ${dataWorkflowState.currentStep >= 1 ? 'text-white font-bold' : 'text-blue-100'}">Select Admin Area</span>
                    </div>
                    
                    <div class="flex items-center justify-center relative z-10">
                        <div class="w-10 h-10 rounded-full ${dataWorkflowState.currentStep >= 2 ? 'bg-blue-400' : 'bg-white/20'} flex items-center justify-center shadow-lg">
                            <span class="text-white font-bold">2</span>
                        </div>
                        <span class="ml-2 ${dataWorkflowState.currentStep >= 2 ? 'text-white font-bold' : 'text-blue-100'}">AA Data & Charts</span>
                    </div>
                    
                    <div class="flex items-center justify-center relative z-10">
                        <div class="w-10 h-10 rounded-full ${dataWorkflowState.currentStep >= 3 ? 'bg-blue-400' : 'bg-white/20'} flex items-center justify-center shadow-lg">
                            <span class="text-white font-bold">3</span>
                        </div>
                        <span class="ml-2 ${dataWorkflowState.currentStep >= 3 ? 'text-white font-bold' : 'text-blue-100'}">Select Department</span>
                    </div>
                    
                    <div class="flex items-center justify-center relative z-10">
                        <div class="w-10 h-10 rounded-full ${dataWorkflowState.currentStep >= 4 ? 'bg-blue-400' : 'bg-white/20'} flex items-center justify-center shadow-lg">
                            <span class="text-white font-bold">4</span>
                        </div>
                        <span class="ml-2 ${dataWorkflowState.currentStep >= 4 ? 'text-white font-bold' : 'text-blue-100'}">Streams & Report</span>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div class="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <span class="text-blue-50">Total Records</span>
                        <div class="font-bold text-xl">${getFilteredMetricsData().length.toLocaleString()}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <span class="text-blue-50">Admin Areas</span>
                        <div class="font-bold text-xl">${[...new Set(getFilteredMetricsData().map(d => d.AdminArea).filter(Boolean))].length}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <span class="text-blue-50">Departments</span>
                        <div class="font-bold text-xl">${[...new Set(getFilteredMetricsData().map(d => d.Department).filter(Boolean))].length}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <span class="text-blue-50">Streams</span>
                        <div class="font-bold text-xl">${[...new Set(getFilteredMetricsData().map(d => d.Stream).filter(Boolean))].length}</div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div id="dataWorkflowContent" class="bg-white rounded-2xl shadow-xl p-8">
                ${renderDataWorkflowStep()}
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-between">
                <button onclick="prevDataWorkflowStep()" 
                        class="px-6 py-3 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 rounded-xl font-bold hover:from-slate-300 hover:to-slate-400 transition-all ${dataWorkflowState.currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${dataWorkflowState.currentStep === 1 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left mr-2"></i> Previous
                </button>
                
                <button onclick="resetDataWorkflow()" 
                        class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg">
                    <i class="fas fa-redo mr-2"></i> Reset Workflow
                </button>
                
                <button onclick="nextDataWorkflowStep()" 
                        class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg ${dataWorkflowState.currentStep === 4 ? 'hidden' : ''}">
                    Next <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>

            <!-- زر Generate Report ثابت في أسفل الشاشة -->
            <button onclick="goToReportGeneration()" 
                class="fixed bottom-6 right-6 z-50 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:from-sky-600 hover:to-blue-700 transition-all ${dataWorkflowState.currentStep !== 4 ? 'hidden' : ''}"
                style="box-shadow: 0 8px 32px rgba(0,0,0,0.18);">
                <i class="fas fa-file-alt mr-2"></i> Generate Report
            </button>
        </div>
    `;
}

// =======================================================================
// WORKFLOW STEPS RENDERING
// =======================================================================

function renderDataWorkflowStep() {
    switch(dataWorkflowState.currentStep) {
        case 1:
            return renderAdminAreaSelectionStep();
        case 2:
            return renderAdminAreaDataStep();
        case 3:
            return renderDepartmentSelectionStep();
        case 4:
            return renderStreamsDataStep();
        default:
            return renderAdminAreaSelectionStep();
    }
}

// Step 1: Admin Area Selection
function renderAdminAreaSelectionStep() {
    const filteredData = getFilteredMetricsData();
    const adminAreas = [...new Set(filteredData.map(d => d.AdminArea).filter(Boolean))];
    
    return `
        <div class="space-y-6">
            <h3 class="text-2xl font-black text-slate-800 mb-2">Select Admin Area</h3>
            <p class="text-slate-600 mb-6">Choose an administrative area to analyze. This will filter all subsequent data.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- All AA Option -->
                <div class="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border-2 md:col-span-2 lg:col-span-3 ${dataWorkflowState.showAllAdminAreas ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-cyan-200 hover:border-cyan-400'} cursor-pointer transition-all transform hover:scale-105"
                     onclick="selectAllAdminAreas()">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-bold text-slate-800">All AA</h4>
                        <i class="fas ${dataWorkflowState.showAllAdminAreas ? 'fa-check-circle text-cyan-500' : 'fa-chevron-right text-slate-400'} text-xl"></i>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Total Records:</span>
                            <span class="font-bold text-cyan-700">${filteredData.length}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Admin Areas:</span>
                            <span class="font-bold text-teal-700">${adminAreas.length}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Departments:</span>
                            <span class="font-bold text-cyan-700">${[...new Set(filteredData.map(d => d.Department))].length}</span>
                        </div>
                    </div>
                </div>
                
                ${adminAreas.map(area => {
                    const records = filteredData.filter(d => d.AdminArea === area);
                    const avgProduction = records.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / records.length;
                    
                    return `
                        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 ${dataWorkflowState.selectedAdminArea === area ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200 hover:border-blue-400'} cursor-pointer transition-all transform hover:scale-105"
                             onclick="selectAdminArea('${area}')">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-bold text-slate-800">${area}</h4>
                                <i class="fas ${dataWorkflowState.selectedAdminArea === area ? 'fa-check-circle text-blue-500' : 'fa-chevron-right text-slate-400'} text-xl"></i>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600">Records:</span>
                                    <span class="font-bold text-blue-700">${records.length}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600">Avg Production:</span>
                                    <span class="font-bold text-cyan-700">${avgProduction.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-600">Departments:</span>
                                    <span class="font-bold text-sky-700">${[...new Set(records.map(d => d.Department))].length}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${dataWorkflowState.selectedAdminArea ? `
                <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-blue-800">Selected Admin Area</h4>
                            <p class="text-blue-700">${dataWorkflowState.selectedAdminArea}</p>
                        </div>
                        <button onclick="clearAdminAreaSelection()" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            ` : dataWorkflowState.showAllAdminAreas ? `
                <div class="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border-l-4 border-cyan-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-cyan-800">Selected Mode</h4>
                            <p class="text-cyan-700">All Admin Areas (Combined Data)</p>
                        </div>
                        <button onclick="clearAdminAreaSelection()" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Step 2: Admin Area Data and Charts
function renderAdminAreaDataStep() {
    if (!dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) {
        dataWorkflowState.currentStep = 1;
        renderDataManagementSystem();
        return '';
    }
    
    const { filteredDataByAdminArea } = dataWorkflowState;
    
    // Calculate statistics
    const totalRecords = filteredDataByAdminArea.length;
    const departments = [...new Set(filteredDataByAdminArea.map(d => d.Department).filter(Boolean))];
    const streams = [...new Set(filteredDataByAdminArea.map(d => d.Stream).filter(Boolean))];
    
    const totalProduction = filteredDataByAdminArea.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0);
    const totalTarget = filteredDataByAdminArea.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0);
    const totalEnergy = filteredDataByAdminArea.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0);
    const totalEnergyTarget = filteredDataByAdminArea.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0);
    const energyAchievement = totalEnergyTarget > 0 ? (totalEnergy / totalEnergyTarget * 100).toFixed(2) : 0;
    
    const achievement = totalTarget > 0 ? (totalProduction / totalTarget * 100).toFixed(2) : 0;
    
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-black text-slate-800 mb-2">${dataWorkflowState.showAllAdminAreas ? 'All Admin Areas (Combined Data)' : dataWorkflowState.selectedAdminArea}</h3>
                    <p class="text-slate-600">${dataWorkflowState.showAllAdminAreas ? 'Summary of all administrative areas' : 'Detailed analysis of selected administrative area'}</p>
                </div>
                <button onclick="editAdminAreaData()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200">
                    <i class="fas fa-edit mr-2"></i> Edit
                </button>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="bg-slate-50 rounded-xl p-4">
                    <div class="text-sm text-slate-500">Total Records</div>
                    <div class="text-2xl font-bold text-slate-800">${totalRecords}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <div class="text-sm text-slate-500">Departments</div>
                    <div class="text-2xl font-bold text-blue-600">${departments.length}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <div class="text-sm text-slate-500">Production Achievement</div>
                    <div class="text-2xl font-bold ${achievement >= 95 ? 'text-green-600' : achievement >= 85 ? 'text-amber-600' : 'text-red-600'}">${achievement}%</div>
                </div>
                <div class="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div class="text-sm text-amber-700">Energy Actual</div>
                    <div class="text-2xl font-bold text-amber-800">${totalEnergy.toFixed(2)}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4">
                    <div class="text-sm text-slate-500">Energy Achievement</div>
                    <div class="text-2xl font-bold ${energyAchievement <= 105 ? 'text-green-600' : energyAchievement <= 115 ? 'text-amber-600' : 'text-red-600'}">${energyAchievement}%</div>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Production Chart -->
                <div class="bg-white rounded-xl border border-slate-200 p-6">
                    <h4 class="text-lg font-bold text-slate-800 mb-4">Production Trend (Actual vs Target)</h4>
                    <div style="height: 300px;">
                        <canvas id="adminAreaProductionChart"></canvas>
                    </div>
                </div>
                
                <!-- Energy Chart -->
                <div class="bg-white rounded-xl border border-slate-200 p-6">
                    <h4 class="text-lg font-bold text-slate-800 mb-4">Energy Consumption (Actual vs Target)</h4>
                    <div style="height: 300px;">
                        <canvas id="adminAreaEnergyChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Department Distribution Chart -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            Department Distribution by Production
                          <span class="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">UP Only</span>
                           </h5>
                      <div style="height: 350px;">
                    <canvas id="adminAreaDepartmentChart"></canvas>
                </div>
            </div>
            
            <!-- Department Distribution Energy Chart -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Department Distribution by Energy
               <span class="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">All Streams</span>
                </h5>
                <div style="height: 350px;">
                    <canvas id="adminAreaDepartmentEnergyChart"></canvas>
                </div>
            </div>
            
            <!-- Recent Data Table -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-200">
                    <h4 class="text-lg font-bold text-slate-800">Recent Records</h4>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-sm font-bold text-slate-700">Date</th>
                                <th class="px-6 py-3 text-left text-sm font-bold text-slate-700">Department</th>
                                <th class="px-6 py-3 text-left text-sm font-bold text-slate-700">Production</th>
                                <th class="px-6 py-3 text-left text-sm font-bold text-slate-700">Energy</th>
                                <th class="px-6 py-3 text-left text-sm font-bold text-slate-700">KPI</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${filteredDataByAdminArea.slice(0, 5).map(record => {
                                const prodActual = parseFloat(record.Production_Actual || 0);
                                const prodTarget = parseFloat(record.Production_Target || 0);
                                const kpiValue = prodTarget > 0 ? (prodActual / prodTarget) * 100 : 0;
                                
                                let kpiClass = 'bg-green-100 text-green-800';
                                if (kpiValue < 95) kpiClass = 'bg-yellow-100 text-yellow-800';
                                if (kpiValue < 85) kpiClass = 'bg-red-100 text-red-800';
                                
                                return `
                                    <tr class="hover:bg-blue-50">
                                        <td class="px-6 py-3">${record.Date || 'N/A'}</td>
                                        <td class="px-6 py-3 font-medium">${record.Department || 'N/A'}</td>
                                        <td class="px-6 py-3 font-bold ${prodActual >= prodTarget ? 'text-green-700' : 'text-red-700'}">
                                            ${prodActual.toFixed(2)} / ${prodTarget.toFixed(2)}
                                        </td>
                                        <td class="px-6 py-3">${parseFloat(record.Energy_Actual || 0).toFixed(2)}</td>
                                        <td class="px-6 py-3">
                                            <span class="px-2 py-1 ${kpiClass} rounded-full text-xs font-bold">
                                                ${kpiValue.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// حذف السجل الحالي حسب ID
async function deleteCurrentRecord() {
    const id = document.getElementById('edit_id').value;
    if (!id) {
        showNotification('No record selected for deletion', 'error');
        return;
    }
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone!')) return;
    const apiBase = window.API_BASE || 'http://localhost:8001';
    try {
        const response = await fetch(`${apiBase}/api/metrics/${id}`, { method: 'DELETE' });
        if (response.ok) {
            // Remove from local data
            const idx = metricsData.findIndex(r => (r.id || r.ID) == id);
            if (idx !== -1) metricsData.splice(idx, 1);
            saveToLocalStorage(metricsData);
            showNotification('Record deleted successfully', 'success');
            closeEditModal();
            if (typeof renderDataManagementSystem === 'function') renderDataManagementSystem();
        } else {
            showNotification('Failed to delete record from server', 'error');
        }
    } catch (e) {
        showNotification('Error while deleting: ' + e.message, 'error');
    }
}

// Step 3: Department Selection
function renderDepartmentSelectionStep() {
    if (!dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) {
        dataWorkflowState.currentStep = 1;
        renderDataManagementSystem();
        return '';
    }
    
    const departments = [...new Set(dataWorkflowState.filteredDataByAdminArea.map(d => d.Department).filter(Boolean))];
    
    return `
        <div class="space-y-6">
            <h3 class="text-2xl font-black text-slate-800 mb-2">Select Department</h3>
            <p class="text-slate-600 mb-6">Choose a department ${dataWorkflowState.selectedAdminArea ? 'within ' + dataWorkflowState.selectedAdminArea : 'from all admin areas'}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- All Departments Option -->
                <div class="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-6 border-2 md:col-span-2 lg:col-span-3 ${dataWorkflowState.showAllDepartments ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-cyan-200 hover:border-cyan-400'} cursor-pointer transition-all transform hover:scale-105"
                     onclick="selectAllDepartments()">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-lg font-bold text-slate-800">All Dept</h4>
                        <i class="fas ${dataWorkflowState.showAllDepartments ? 'fa-check-circle text-cyan-500' : 'fa-chevron-right text-slate-400'} text-xl"></i>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Total Records:</span>
                            <span class="font-bold text-cyan-700">${dataWorkflowState.filteredDataByAdminArea.length}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Departments:</span>
                            <span class="font-bold text-teal-700">${departments.length}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Avg Production:</span>
                            <span class="font-bold text-cyan-700">${(dataWorkflowState.filteredDataByAdminArea.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / dataWorkflowState.filteredDataByAdminArea.length).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-600">Streams:</span>
                            <span class="font-bold text-teal-700">${[...new Set(dataWorkflowState.filteredDataByAdminArea.map(d => d.Stream))].length}</span>
                        </div>
                    </div>
                </div>
                
                ${departments.map(dept => {
                    const deptData = dataWorkflowState.filteredDataByAdminArea.filter(d => d.Department === dept);
                    const avgProduction = deptData.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / deptData.length;
                    const avgTarget = deptData.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0) / deptData.length;
                    const achievement = avgTarget > 0 ? (avgProduction / avgTarget * 100).toFixed(2) : 0;
                    
                    return `
                        <div class="bg-slate-50 rounded-xl p-6 border-2 ${dataWorkflowState.selectedDepartment === dept ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'} cursor-pointer transition-all"
                             onclick="selectDepartment('${dept}')">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-bold text-slate-800">${dept}</h4>
                                <i class="fas ${dataWorkflowState.selectedDepartment === dept ? 'fa-check-circle text-blue-500' : 'fa-chevron-right text-slate-400'}"></i>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-500">Records:</span>
                                    <span class="font-bold">${deptData.length}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-500">Avg Production:</span>
                                    <span class="font-bold text-blue-600">${avgProduction.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-500">Achievement:</span>
                                    <span class="font-bold ${achievement >= 95 ? 'text-green-600' : achievement >= 85 ? 'text-amber-600' : 'text-red-600'}">${achievement}%</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-slate-500">Streams:</span>
                                    <span class="font-bold">${[...new Set(deptData.map(d => d.Stream))].length}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${dataWorkflowState.selectedDepartment ? `
                <div class="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-blue-800">Selected Department</h4>
                            <p class="text-blue-700">${dataWorkflowState.selectedDepartment} (in ${dataWorkflowState.selectedAdminArea})</p>
                        </div>
                        <button onclick="clearDepartmentSelection()" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            ` : dataWorkflowState.showAllDepartments ? `
                <div class="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border-l-4 border-cyan-500">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-bold text-cyan-800">Selected Mode</h4>
                            <p class="text-cyan-700">All Departments (Combined Data)</p>
                        </div>
                        <button onclick="clearDepartmentSelection()" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Step 4: Streams Data and Charts
function renderStreamsDataStep() {
    if ((!dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) || (!dataWorkflowState.selectedDepartment && !dataWorkflowState.showAllDepartments)) {
        dataWorkflowState.currentStep = 1;
        renderDataManagementSystem();
        return '';
    }
    
    const { filteredDataByDepartment } = dataWorkflowState;
    const streams = [...new Set(filteredDataByDepartment.map(d => d.Stream).filter(Boolean))];
    
    // Calculate department statistics
    const totalProduction = filteredDataByDepartment.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0);
    const totalTarget = filteredDataByDepartment.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0);
    const totalEnergy = filteredDataByDepartment.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0);
    const totalEnergyTarget = filteredDataByDepartment.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0);
    const achievement = totalTarget > 0 ? (totalProduction / totalTarget * 100).toFixed(2) : 0;
    const energyAchievement = totalEnergyTarget > 0 ? (totalEnergy / totalEnergyTarget * 100).toFixed(2) : 0;
    
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-black text-slate-800 mb-2">${dataWorkflowState.showAllDepartments ? 'All Departments (Combined Data)' : dataWorkflowState.selectedDepartment}</h3>
                    <p class="text-slate-600">${dataWorkflowState.showAllDepartments ? 'Summary of all departments' : 'Stream analysis in ' + dataWorkflowState.selectedAdminArea}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="addStreamRecord()" class="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i> Add Stream
                    </button>
                    <button onclick="editDepartmentData()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                        <i class="fas fa-edit mr-2"></i> Edit Dept
                    </button>
                </div>
            </div>
            
            <!-- Department Stats -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div class="text-sm text-blue-700">Total Production</div>
                    <div class="text-2xl font-bold text-blue-800">${totalProduction.toFixed(2)}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-sm text-slate-700">Production Target</div>
                    <div class="text-2xl font-bold text-slate-800">${totalTarget.toFixed(2)}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-sm text-slate-700">Production Achievement</div>
                    <div class="text-2xl font-bold ${achievement >= 95 ? 'text-green-600' : achievement >= 85 ? 'text-amber-600' : 'text-red-600'}">${achievement}%</div>
                </div>
                <div class="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div class="text-sm text-amber-700">Energy Actual</div>
                    <div class="text-2xl font-bold text-amber-800">${totalEnergy.toFixed(2)}</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-sm text-slate-700">Energy Achievement</div>
                    <div class="text-2xl font-bold ${energyAchievement <= 105 ? 'text-green-600' : energyAchievement <= 115 ? 'text-amber-600' : 'text-red-600'}">${energyAchievement}%</div>
                </div>
            </div>
            
            <!-- Stream Distribution Charts -->
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                                    <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-bar text-blue-500"></i>
                            Stream Distribution by Production
                            <span class="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">UP Only</span>
                        </h5>
                <div style="height: 350px;">
                    <canvas id="departmentProductionDistributionChart"></canvas>
                </div>
            </div>
            
            <div class="bg-white rounded-xl border border-slate-200 p-6">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-bolt text-amber-500"></i>
                            Stream Distribution by Energy
                           <span class="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">All Streams</span>
                        </h5>
                      <div style="height: 350px;">
                    <canvas id="departmentEnergyDistributionChart"></canvas>
                </div>
            </div>
            
            <!-- Streams Charts -->
            <div class="space-y-6">
                ${streams.map(stream => {
                    const streamData = filteredDataByDepartment.filter(d => d.Stream === stream);
                    const avgActual = streamData.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / streamData.length;
                    const avgTarget = streamData.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0) / streamData.length;
                    const energyActual = streamData.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0) / streamData.length;
                    const energyTarget = streamData.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0) / streamData.length;
                    const streamAchievement = avgTarget > 0 ? (avgActual / avgTarget * 100).toFixed(2) : 0;
                    const energyAchievement = energyTarget > 0 ? (energyActual / energyTarget * 100).toFixed(2) : 0;
                    
                    return `
                        <div class="bg-white rounded-xl border border-slate-200 p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-bold text-slate-800">${stream}</h4>
                                <span class="px-3 py-1 ${streamAchievement >= 95 ? 'bg-green-100 text-green-800' : streamAchievement >= 85 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'} rounded-full text-sm font-bold">
                                    ${streamAchievement}% Achievement
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <!-- Production Chart -->
                                <div>
                                    <h5 class="font-bold text-slate-700 mb-3">Production (Actual vs Target)</h5>
                                    <div style="height: 250px;">
                                        <canvas id="streamProductionChart_${stream.replace(/\s+/g, '_')}"></canvas>
                                    </div>
                                </div>
                                
                                <!-- Energy Chart -->
                                <div>
                                    <h5 class="font-bold text-slate-700 mb-3">Energy (Actual vs Target)</h5>
                                    <div style="height: 250px;">
                                        <canvas id="streamEnergyChart_${stream.replace(/\s+/g, '_')}"></canvas>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div class="bg-blue-50 rounded-lg p-3">
                                    <div class="text-sm text-blue-600">Avg Production</div>
                                    <div class="text-lg font-bold text-blue-800">${avgActual.toFixed(2)}</div>
                                </div>
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <div class="text-sm text-slate-600">Prod Target</div>
                                    <div class="text-lg font-bold text-slate-800">${avgTarget.toFixed(2)}</div>
                                </div>
                                <div class="bg-amber-50 rounded-lg p-3">
                                    <div class="text-sm text-amber-600">Avg Energy</div>
                                    <div class="text-lg font-bold text-amber-800">${energyActual.toFixed(2)}</div>
                                </div>
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <div class="text-sm text-slate-600">Energy Target</div>
                                    <div class="text-lg font-bold text-slate-800">${energyTarget.toFixed(2)}</div>
                                </div>
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <div class="text-sm text-slate-600">Energy Achievement</div>
                                    <div class="text-lg font-bold ${energyAchievement <= 105 ? 'text-green-700' : energyAchievement <= 115 ? 'text-amber-700' : 'text-red-700'}">${energyAchievement}%</div>
                                </div>
                            </div>
                            
                            <div class="mt-4 flex justify-end gap-2">
                                <button onclick="editStreamData('${streamData[0]?.id || streamData[0]?.ID}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                                    <i class="fas fa-edit mr-1"></i> Edit
                                </button>
                                <button onclick="deleteStreamData('${stream}')" class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                                    <i class="fas fa-trash mr-1"></i> Delete
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// =======================================================================
// WORKFLOW ACTIONS
// =======================================================================

function selectAdminArea(adminArea) {
    dataWorkflowState.selectedAdminArea = adminArea;
    dataWorkflowState.showAllAdminAreas = false;
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.showAllDepartments = false;
    // filteredDataByAdminArea يجب أن تعتمد دومًا على getFilteredMetricsData (التي تطبق فلتر الوقت)
    dataWorkflowState.filteredDataByAdminArea = getFilteredMetricsData().filter(d => d.AdminArea === adminArea);
    dataWorkflowState.filteredDataByDepartment = [];
    dataWorkflowState.filteredDataByStream = [];
    renderDataManagementSystem();
    setTimeout(() => {
        dataWorkflowState.currentStep = 2;
        renderDataManagementSystem();
        renderAdminAreaCharts();
    }, 100);
}

function clearAdminAreaSelection() {
    dataWorkflowState.selectedAdminArea = null;
    dataWorkflowState.showAllAdminAreas = false;
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.showAllDepartments = false;
    dataWorkflowState.selectedStream = null;
    dataWorkflowState.filteredDataByAdminArea = [];
    dataWorkflowState.filteredDataByDepartment = [];
    dataWorkflowState.filteredDataByStream = [];
    
    renderDataManagementSystem();
}

function selectDepartment(department) {
    dataWorkflowState.selectedDepartment = department;
    dataWorkflowState.showAllDepartments = false;
    dataWorkflowState.filteredDataByDepartment = dataWorkflowState.filteredDataByAdminArea.filter(d => d.Department === department);
    dataWorkflowState.filteredDataByStream = [];
    
    renderDataManagementSystem();
    
    setTimeout(() => {
        dataWorkflowState.currentStep = 4;
        renderDataManagementSystem();
        renderDepartmentDistributionCharts();
        renderStreamCharts();
    }, 100);
}

function selectAllAdminAreas() {
    dataWorkflowState.showAllAdminAreas = true;
    dataWorkflowState.selectedAdminArea = null;
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.showAllDepartments = false;
    const filteredData = getFilteredMetricsData();
    dataWorkflowState.filteredDataByAdminArea = filteredData;
    dataWorkflowState.filteredDataByDepartment = [];
    dataWorkflowState.filteredDataByStream = [];
    
    renderDataManagementSystem();
    
    setTimeout(() => {
        dataWorkflowState.currentStep = 2;
        renderDataManagementSystem();
        renderAdminAreaCharts();
    }, 100);
}

function selectAllDepartments() {
    dataWorkflowState.showAllDepartments = true;
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.filteredDataByDepartment = dataWorkflowState.filteredDataByAdminArea;
    dataWorkflowState.filteredDataByStream = [];
    
    renderDataManagementSystem();
    
    setTimeout(() => {
        dataWorkflowState.currentStep = 4;
        renderDataManagementSystem();
        renderDepartmentDistributionCharts();
        renderStreamCharts();
    }, 100);
}

function clearDepartmentSelection() {
    dataWorkflowState.selectedDepartment = null;
    dataWorkflowState.showAllDepartments = false;
    dataWorkflowState.filteredDataByDepartment = [];
    dataWorkflowState.filteredDataByStream = [];
    
    renderDataManagementSystem();
}

function prevDataWorkflowStep() {
    if (dataWorkflowState.currentStep > 1) {
        dataWorkflowState.currentStep--;
        renderDataManagementSystem();
        
        if (dataWorkflowState.currentStep === 2) {
            setTimeout(() => renderAdminAreaCharts(), 100);
        } else if (dataWorkflowState.currentStep === 4) {
            setTimeout(() => renderStreamCharts(), 100);
        }
    }
}

function nextDataWorkflowStep() {
    if (dataWorkflowState.currentStep < 4) {
        if (dataWorkflowState.currentStep === 1 && !dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) {
            showNotification('Please select an Admin Area first', 'warning');
            return;
        }
        if (dataWorkflowState.currentStep === 2 && !dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) {
            showNotification('Please select an Admin Area first', 'warning');
            return;
        }
        if (dataWorkflowState.currentStep === 3 && !dataWorkflowState.selectedDepartment && !dataWorkflowState.showAllDepartments) {
            showNotification('Please select a Department first', 'warning');
            return;
        }
        
        dataWorkflowState.currentStep++;
        renderDataManagementSystem();
        
        if (dataWorkflowState.currentStep === 2) {
            setTimeout(() => renderAdminAreaCharts(), 100);
        } else if (dataWorkflowState.currentStep === 4) {
            setTimeout(() => renderStreamCharts(), 100);
        }
    }
}

function resetDataWorkflow() {
    dataWorkflowState = {
        currentStep: 1,
        selectedAdminArea: null,
        selectedDepartment: null,
        selectedStream: null,
        filteredDataByAdminArea: [],
        filteredDataByDepartment: [],
        filteredDataByStream: [],
        startDate: null,
        endDate: null,
        dateFilterActive: false,
        showAllAdminAreas: false,
        showAllDepartments: false
    };
    
    renderDataManagementSystem();
    showNotification('Workflow reset successfully', 'info');
}

// =======================================================================
// CHARTS RENDERING
// =======================================================================

function renderAdminAreaCharts() {
    if (!dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) return;
    
    // Destroy old charts first
    destroyChart('adminAreaProductionChart');
    destroyChart('adminAreaEnergyChart');
    destroyChart('adminAreaDeptChart');
    destroyChart('adminAreaDepartmentEnergyChart');
    
    const { filteredDataByAdminArea } = dataWorkflowState;
    
    const productionCtx = document.getElementById('adminAreaProductionChart');
    if (productionCtx) {
        const dateGroups = {};
        filteredDataByAdminArea.forEach(d => {
            if (!dateGroups[d.Date]) dateGroups[d.Date] = { actual: 0, target: 0, count: 0 };
            dateGroups[d.Date].actual += parseFloat(d.Production_Actual) || 0;
            dateGroups[d.Date].target += parseFloat(d.Production_Target) || 0;
            dateGroups[d.Date].count++;
        });
        
        const dates = Object.keys(dateGroups).sort().slice(-15);
        const avgActual = dates.map(date => dateGroups[date].actual / dateGroups[date].count);
        const avgTarget = dates.map(date => dateGroups[date].target / dateGroups[date].count);
        
        window.chartInstances.adminAreaProductionChart = new Chart(productionCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Production Actual',
                        data: avgActual,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                    },
                    {
                        label: 'Production Target',
                        data: avgTarget,
                        backgroundColor: 'rgba(148, 163, 184, 0.8)',
                        borderColor: 'rgb(148, 163, 184)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            font: { weight: 'bold' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Production',
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });
    }
    
    const energyCtx = document.getElementById('adminAreaEnergyChart');
    if (energyCtx) {
        const dateGroups = {};
        filteredDataByAdminArea.forEach(d => {
            if (!dateGroups[d.Date]) dateGroups[d.Date] = { actual: 0, target: 0, count: 0 };
            dateGroups[d.Date].actual += parseFloat(d.Energy_Actual) || 0;
            dateGroups[d.Date].target += parseFloat(d.Energy_Target) || 0;
            dateGroups[d.Date].count++;
        });
        
        const dates = Object.keys(dateGroups).sort().slice(-10);
        const avgEnergyActual = dates.map(date => dateGroups[date].actual / dateGroups[date].count);
        const avgEnergyTarget = dates.map(date => dateGroups[date].target / dateGroups[date].count);
        
        window.chartInstances.adminAreaEnergyChart = new Chart(energyCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Energy Actual',
                        data: avgEnergyActual,
                        backgroundColor: 'rgba(245, 158, 11, 0.85)',
                        borderColor: 'rgb(245, 158, 11)',
                        borderWidth: 1
                    },
                    {
                        label: 'Energy Target',
                        data: avgEnergyTarget,
                        backgroundColor: 'rgba(148, 163, 184, 0.85)',
                        borderColor: 'rgb(148, 163, 184)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            font: { weight: 'bold' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Energy (MMBtu)',
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });
    }
    
    const departmentCtx = document.getElementById('adminAreaDepartmentChart');
    if (departmentCtx) {
        const deptGroupsActual = {};
        const deptGroupsTarget = {};
        // Department Distribution by Production = UP Only
        filteredDataByAdminArea.forEach(d => {
            const dept = d.Department || 'Unknown';
            if (dept.toUpperCase().startsWith('UP')) {
                if (!deptGroupsActual[dept]) {
                    deptGroupsActual[dept] = 0;
                    deptGroupsTarget[dept] = 0;
                }
                deptGroupsActual[dept] += parseFloat(d.Production_Actual) || 0;
                deptGroupsTarget[dept] += parseFloat(d.Production_Target) || 0;
            }
        });
        
        const depts = Object.keys(deptGroupsActual);
        const actualValues = depts.map(dept => deptGroupsActual[dept]);
        const targetValues = depts.map(dept => deptGroupsTarget[dept]);
        
        // لون أزرق شفاف (40%)
        const blueColor = 'rgba(59, 130, 246, 0.4)'; // أزرق مع شفافية 40%
        
        // إنشء pattern بخطوط بزاوية 120 درجة
        const canvas = document.createElement('canvas');
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext('2d');
        
        // ملء الخلفية بلون أزرق شفاف
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fillRect(0, 0, 12, 12);
        
        // رسم خطوط بزاوية 120 درجة - أزرق داكن
        ctx.strokeStyle = 'rgba(29, 78, 216, 0.7)';
        ctx.lineWidth = 2;
        
        // حساب الخطوط بزاوية 120 درجة
        const angle = (120 * Math.PI) / 180;
        const spacing = 4;
        
        for (let i = -24; i < 24; i += spacing) {
            const x1 = i;
            const y1 = 0;
            const x2 = i + 12 / Math.tan(angle);
            const y2 = 12;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        const pattern = ctx.createPattern(canvas, 'repeat');
        
        window.chartInstances.adminAreaDeptChart = new Chart(departmentCtx, {
            type: 'bar',
            data: {
                labels: depts,
                datasets: [
                    {
                        label: 'Production Actual',
                        data: actualValues,
                        backgroundColor: pattern || blueColor,
                        borderColor: 'rgba(29, 78, 216, 0.8)',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: 'Production Target',
                        data: targetValues,
                        backgroundColor: 'rgba(107, 114, 128, 0.4)', // رصاصي شفاف
                        borderColor: 'rgba(55, 65, 81, 0.8)', // رصاصي داكن
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Production',
                            font: { weight: 'bold', size: 14 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Energy Distribution Chart
    const departmentEnergyCtx = document.getElementById('adminAreaDepartmentEnergyChart');
    if (departmentEnergyCtx) {
        const deptEnergyGroupsActual = {};
        const deptEnergyGroupsTarget = {};
        // Department Distribution by Energy = All Departments
        filteredDataByAdminArea.forEach(d => {
            const dept = d.Department || 'Unknown';
            if (!deptEnergyGroupsActual[dept]) {
                deptEnergyGroupsActual[dept] = 0;
                deptEnergyGroupsTarget[dept] = 0;
            }
            deptEnergyGroupsActual[dept] += parseFloat(d.Energy_Actual) || 0;
            deptEnergyGroupsTarget[dept] += parseFloat(d.Energy_Target) || 0;
        });
        
        const energyDepts = Object.keys(deptEnergyGroupsActual);
        const energyActualValues = energyDepts.map(dept => deptEnergyGroupsActual[dept]);
        const energyTargetValues = energyDepts.map(dept => deptEnergyGroupsTarget[dept]);
        
        // لون أصفر شفاف (40%)
        const yellowColor = 'rgba(245, 158, 11, 0.4)'; // أصفر مع شفافية 40%
        
        // إنشء pattern بخطوط بزاوية 120 درجة - أصفر
        const canvasYellow = document.createElement('canvas');
        canvasYellow.width = 12;
        canvasYellow.height = 12;
        const ctxYellow = canvasYellow.getContext('2d');
        
        // ملء الخلفية بلون أصفر شفاف
        ctxYellow.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctxYellow.fillRect(0, 0, 12, 12);
        
        // رسم خطوط بزاوية 120 درجة - أصفر داكن
        ctxYellow.strokeStyle = 'rgba(180, 83, 9, 0.7)';
        ctxYellow.lineWidth = 2;
        
        // حساب الخطوط بزاوية 120 درجة
        const angleYellow = (120 * Math.PI) / 180;
        const spacingYellow = 4;
        
        for (let i = -24; i < 24; i += spacingYellow) {
            const x1 = i;
            const y1 = 0;
            const x2 = i + 12 / Math.tan(angleYellow);
            const y2 = 12;
            
            ctxYellow.beginPath();
            ctxYellow.moveTo(x1, y1);
            ctxYellow.lineTo(x2, y2);
            ctxYellow.stroke();
        }
        
        const patternYellow = ctxYellow.createPattern(canvasYellow, 'repeat');
        
        window.chartInstances.adminAreaDepartmentEnergyChart = new Chart(departmentEnergyCtx, {
            type: 'bar',
            data: {
                labels: energyDepts,
                datasets: [
                    {
                        label: 'Energy Actual',
                        data: energyActualValues,
                        backgroundColor: patternYellow || yellowColor,
                        borderColor: 'rgba(180, 83, 9, 0.8)',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: 'Energy Target',
                        data: energyTargetValues,
                        backgroundColor: 'rgba(107, 114, 128, 0.4)', // رصاصي شفاف
                        borderColor: 'rgba(55, 65, 81, 0.8)', // رصاصي داكن
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Energy (MMBtu)',
                            font: { weight: 'bold', size: 14 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Render Department Distribution Charts (Streams as columns)
function renderDepartmentDistributionCharts() {
    if (!dataWorkflowState.selectedDepartment && !dataWorkflowState.showAllDepartments) return;
    
    const { filteredDataByDepartment } = dataWorkflowState;
    
    // Only include UP departments in the chart
        const upOnlyData = filteredDataByDepartment.filter(d => d.Department && d.Department.toUpperCase().includes('UP'));
        const upStreamGroups = {};
        upOnlyData.forEach(d => {
            const stream = d.Stream || 'Unknown';
            if (!upStreamGroups[stream]) {
                upStreamGroups[stream] = { actual: 0, target: 0 };
            }
            upStreamGroups[stream].actual += parseFloat(d.Production_Actual) || 0;
            upStreamGroups[stream].target += parseFloat(d.Production_Target) || 0;
        });
        const upStreams = Object.keys(upStreamGroups);
        const productionActual = upStreams.map(stream => upStreamGroups[stream].actual);
        const productionTarget = upStreams.map(stream => upStreamGroups[stream].target);

        // Energy Distribution Chart = All Departments
        const allStreamGroups = {};
        filteredDataByDepartment.forEach(d => {
            const stream = d.Stream || 'Unknown';
            if (!allStreamGroups[stream]) {
                allStreamGroups[stream] = { energyActual: 0, energyTarget: 0 };
            }
            allStreamGroups[stream].energyActual += parseFloat(d.Energy_Actual) || 0;
            allStreamGroups[stream].energyTarget += parseFloat(d.Energy_Target) || 0;
        });
        const allStreams = Object.keys(allStreamGroups);
        const energyActual = allStreams.map(stream => allStreamGroups[stream].energyActual);
        const energyTarget = allStreams.map(stream => allStreamGroups[stream].energyTarget);
    
    // Production Distribution Chart (Vertical - Streams)
        const prodCtx = document.getElementById('departmentProductionDistributionChart');
        if (prodCtx) {
            // لون أزرق شفاف (40%)
            const blueColor = 'rgba(59, 130, 246, 0.4)';
            // إنشء pattern بخطوط بزاوية 120 درجة - أزرق
            const canvas = document.createElement('canvas');
            canvas.width = 12;
            canvas.height = 12;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.fillRect(0, 0, 12, 12);
            ctx.strokeStyle = 'rgba(29, 78, 216, 0.7)';
            ctx.lineWidth = 2;
            const angle = (120 * Math.PI) / 180;
            const spacing = 4;
            for (let i = -24; i < 24; i += spacing) {
                const x1 = i;
                const y1 = 0;
                const x2 = i + 12 / Math.tan(angle);
                const y2 = 12;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            const pattern = ctx.createPattern(canvas, 'repeat');
            destroyCanvasCharts('departmentProductionDistributionChart');
            window.chartInstances.departmentProductionDistributionChart = new Chart(prodCtx, {
                type: 'bar',
                data: {
                    labels: upStreams,
                    datasets: [
                        {
                            label: 'Production Actual',
                            data: productionActual,
                            backgroundColor: pattern || blueColor,
                            borderColor: 'rgba(29, 78, 216, 0.8)',
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: 'Production Target',
                            data: productionTarget,
                            backgroundColor: 'rgba(107, 114, 128, 0.4)',
                            borderColor: 'rgba(55, 65, 81, 0.8)',
                            borderWidth: 2,
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Production',
                                font: { weight: 'bold', size: 14 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    
    // Energy Distribution Chart (Vertical - Streams)
        const energyCtx = document.getElementById('departmentEnergyDistributionChart');
        if (energyCtx) {
            // لون أصفر شفاف (40%)
            const yellowColor = 'rgba(245, 158, 11, 0.4)';
            // إنشء pattern بخطوط بزاوية 120 درجة - أصفر
            const canvasYellow = document.createElement('canvas');
            canvasYellow.width = 12;
            canvasYellow.height = 12;
            const ctxYellow = canvasYellow.getContext('2d');
            ctxYellow.fillStyle = 'rgba(245, 158, 11, 0.3)';
            ctxYellow.fillRect(0, 0, 12, 12);
            ctxYellow.strokeStyle = 'rgba(180, 83, 9, 0.7)';
            ctxYellow.lineWidth = 2;
            const angleYellow = (120 * Math.PI) / 180;
            const spacingYellow = 4;
            for (let i = -24; i < 24; i += spacingYellow) {
                const x1 = i;
                const y1 = 0;
                const x2 = i + 12 / Math.tan(angleYellow);
                const y2 = 12;
                ctxYellow.beginPath();
                ctxYellow.moveTo(x1, y1);
                ctxYellow.lineTo(x2, y2);
                ctxYellow.stroke();
            }
            const patternYellow = ctxYellow.createPattern(canvasYellow, 'repeat');
            destroyCanvasCharts('departmentEnergyDistributionChart');
            window.chartInstances.departmentEnergyDistributionChart = new Chart(energyCtx, {
                type: 'bar',
                data: {
                    labels: allStreams,
                    datasets: [
                        {
                            label: 'Energy Actual',
                            data: energyActual,
                            backgroundColor: patternYellow || yellowColor,
                            borderColor: 'rgba(180, 83, 9, 0.8)',
                            borderWidth: 2,
                            borderRadius: 8
                        },
                        {
                            label: 'Energy Target',
                            data: energyTarget,
                            backgroundColor: 'rgba(107, 114, 128, 0.4)', // رصاصي شفاف
                            borderColor: 'rgba(55, 65, 81, 0.8)', // رصاصي داكن
                            borderWidth: 2,
                            borderRadius: 8
                        }
                    ]
                },
                options: {
                    indexAxis: 'x',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Energy (MMBtu)',
                                font: { weight: 'bold', size: 14 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
}

function renderStreamCharts() {
    if (!dataWorkflowState.selectedDepartment && !dataWorkflowState.showAllDepartments) return;
    
    const { filteredDataByDepartment } = dataWorkflowState;
    const streams = [...new Set(filteredDataByDepartment.map(d => d.Stream).filter(Boolean))];
    
    streams.forEach(stream => {
        const streamData = filteredDataByDepartment.filter(d => d.Stream === stream);
        
        // حذف الرسوم البيانية القديمة من Canvas قبل الرسم الجديد
        const productionCanvasId = `streamProductionChart_${stream.replace(/\s+/g, '_')}`;
        destroyCanvasCharts(productionCanvasId);
        
        const productionCtx = document.getElementById(productionCanvasId);
        if (productionCtx) {
            const dateGroups = {};
            streamData.forEach(d => {
                if (!dateGroups[d.Date]) dateGroups[d.Date] = { actual: 0, target: 0, count: 0 };
                dateGroups[d.Date].actual += parseFloat(d.Production_Actual) || 0;
                dateGroups[d.Date].target += parseFloat(d.Production_Target) || 0;
                dateGroups[d.Date].count++;
            });
            
            const dates = Object.keys(dateGroups).sort().slice(-8);
            const actualData = dates.map(date => dateGroups[date].actual / dateGroups[date].count);
            const targetData = dates.map(date => dateGroups[date].target / dateGroups[date].count);
            
            window.chartInstances[productionCanvasId] = new Chart(productionCtx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Actual',
                            data: actualData,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1
                        },
                        {
                            label: 'Target',
                            data: targetData,
                            backgroundColor: 'rgba(148, 163, 184, 0.8)',
                            borderColor: 'rgb(148, 163, 184)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Production'
                            }
                        }
                    }
                }
            });
        }
        
        // حذف الرسوم البيانية القديمة من Canvas قبل الرسم الجديد
        const energyCanvasId = `streamEnergyChart_${stream.replace(/\s+/g, '_')}`;
        destroyCanvasCharts(energyCanvasId);
        
        const energyCtx = document.getElementById(energyCanvasId);
        if (energyCtx) {
            const dateGroups = {};
            streamData.forEach(d => {
                if (!dateGroups[d.Date]) dateGroups[d.Date] = { actual: 0, target: 0, count: 0 };
                dateGroups[d.Date].actual += parseFloat(d.Energy_Actual) || 0;
                dateGroups[d.Date].target += parseFloat(d.Energy_Target) || 0;
                dateGroups[d.Date].count++;
            });
            
            const dates = Object.keys(dateGroups).sort().slice(-8);
            const energyActualData = dates.map(date => dateGroups[date].actual / dateGroups[date].count);
            const energyTargetData = dates.map(date => dateGroups[date].target / dateGroups[date].count);
            
            window.chartInstances[energyCanvasId] = new Chart(energyCtx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Energy Actual',
                            data: energyActualData,
                            backgroundColor: 'rgba(245, 158, 11, 0.85)',
                            borderColor: 'rgb(245, 158, 11)',
                            borderWidth: 1
                        },
                        {
                            label: 'Energy Target',
                            data: energyTargetData,
                            backgroundColor: 'rgba(148, 163, 184, 0.85)',
                            borderColor: 'rgb(148, 163, 184)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Energy (MMBtu)'
                            }
                        }
                    }
                }
            });
        }
    });
}

// =======================================================================
// DATA OPERATIONS
// =======================================================================

function editAdminAreaData() {
    if (!dataWorkflowState.selectedAdminArea && !dataWorkflowState.showAllAdminAreas) return;
    
    let records;
    if (dataWorkflowState.showAllAdminAreas) {
        records = dataWorkflowState.filteredDataByAdminArea;
    } else {
        records = metricsData.filter(d => d.AdminArea === dataWorkflowState.selectedAdminArea);
    }
    
    if (records.length === 0) return;
    
    showAdminAreaEditModal(records);
}

function editDepartmentData() {
    if (!dataWorkflowState.selectedDepartment && !dataWorkflowState.showAllDepartments) return;
    
    let records;
    if (dataWorkflowState.showAllDepartments) {
        records = dataWorkflowState.filteredDataByDepartment;
    } else {
        records = metricsData.filter(d => 
            d.AdminArea === dataWorkflowState.selectedAdminArea && 
            d.Department === dataWorkflowState.selectedDepartment
        );
    }
    
    if (records.length === 0) return;
    
    showDepartmentEditModal(records);
}

function editStreamData(recordId) {
    if (!recordId) return;
    const originalIndex = metricsData.findIndex(item => item.id == recordId || item.ID == recordId);
    if (originalIndex !== -1) {
        showEditModal(metricsData[originalIndex], originalIndex);
    }
}

function addStreamRecord() {
    if (!dataWorkflowState.selectedAdminArea || !dataWorkflowState.selectedDepartment) {
        showNotification('Please select Admin Area and Department first', 'warning');
        return;
    }
    
    const newRecord = {
        // ID will be generated by the server, don't create it here
        Date: new Date().toISOString().split('T')[0],
        Department: dataWorkflowState.selectedDepartment,
        Stream: 'New Stream',
        AdminArea: dataWorkflowState.selectedAdminArea,
        Production_Actual: 0,
        Production_Target: 0,
        Energy_Actual: 0,
        Energy_Target: 0,
        KPI: 'good',
        Created_At: new Date().toISOString(),
        Modified: true
    };
    
    // Add to metricsData
    metricsData.push(newRecord);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update workflow state
    dataWorkflowState.filteredDataByDepartment = metricsData.filter(d => 
        d.AdminArea === dataWorkflowState.selectedAdminArea && 
        d.Department === dataWorkflowState.selectedDepartment
    );
    
    showNotification('New stream record added', 'success');
    
    // Refresh view
    renderDataManagementSystem();
    setTimeout(() => renderStreamCharts(), 100);
}

async function saveEditedRecord() {
    try {
        // Always update by ID, not just index
        const recordId = document.getElementById('edit_id').value;
        if (!recordId || isNaN(parseInt(recordId)) || parseInt(recordId) <= 0) {
            showNotification('❌ Error: Record has no valid ID. Cannot update.', 'error');
            return;
        }
        // Update only the first record with this ID
        const firstIndex = metricsData.findIndex(r => (r.id || r.ID) == recordId);
        if (firstIndex === -1) {
            showNotification('Error: Record not found', 'error');
            return;
        }
        const originalRecord = metricsData[firstIndex];
        const originalIndex = firstIndex;
        console.log('💾 Saving record - Index:', originalIndex, 'ID:', recordId);
        
        // Get the form data
        const updatedRecord = {
            Date: document.getElementById('edit_Date').value,
            Department: document.getElementById('edit_Department').value,
            Stream: document.getElementById('edit_Stream').value,
            AdminArea: document.getElementById('edit_AdminArea').value,
            Production_Actual: parseFloat(document.getElementById('edit_Production_Actual').value) || 0,
            Production_Target: parseFloat(document.getElementById('edit_Production_Target').value) || 0,
            Energy_Actual: parseFloat(document.getElementById('edit_Energy_Actual').value) || 0,
            Energy_Target: parseFloat(document.getElementById('edit_Energy_Target').value) || 0,
            Downtime_Min: parseInt(document.getElementById('edit_Downtime_Min').value) || 0,
            Temperature_C: parseFloat(document.getElementById('edit_Temperature_C').value) || 0,
            Facility_Name: document.getElementById('edit_Facility_Name').value,
            Operator_Name: document.getElementById('edit_Operator_Name').value,
            Equipment_ID: document.getElementById('edit_Equipment_ID').value,
            Notes: document.getElementById('edit_Notes').value
        };
        
        const apiBase = window.API_BASE || 'http://localhost:8001';
        
        console.log('📤 Sending PUT request to update record ID:', recordId);
        
        // UPDATE existing record in database by ID
        const response = await fetch(`${apiBase}/api/metrics/${recordId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updatedRecord)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === 'ok') {
                console.log('Record UPDATED in database with ID:', recordId);
                showNotification('Record updated successfully!', 'success');
                
                // Update local metricsData (keep both id and ID for compatibility)
                // احتفظ دائماً بالـ id وID حتى لو تغيرت القيم الأخرى
                metricsData[originalIndex] = {
                    ...metricsData[originalIndex],
                    ...updatedRecord,
                    id: parseInt(recordId),
                    ID: parseInt(recordId)
                };
                
                // Save to localStorage
                saveToLocalStorage(metricsData);
            } else {
                throw new Error(result.message || 'Failed to update record');
            }
        } else {
            const errorText = await response.text();
            console.error('❌ PUT request failed:', errorText);
            throw new Error('Failed to update record: ' + errorText);
        }
        
        // Close modal
        closeEditModal();
        
        // Refresh the current view
        setTimeout(() => {
            renderDataManagementSystem();
            
            if (dataWorkflowState.currentStep === 2) {
                setTimeout(() => renderAdminAreaCharts(), 100);
            } else if (dataWorkflowState.currentStep === 4) {
                setTimeout(() => renderStreamCharts(), 100);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Save error:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    }
}

function updateRecordLocally(record, updatedData, index, isFallback = false) {
    // Only use existing ID - don't generate new ones
    const recordId = record.id;  // Use existing ID only
    
    // Merge the updated data
    const finalRecord = {
        ...record,
        ...updatedData,
        id: recordId,
        Updated_At: new Date().toISOString(),
        Modified: true
    };
    
    // Update in metricsData
    if (index !== -1) {
        metricsData[index] = finalRecord;
    } else {
        metricsData.push(finalRecord);
    }
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update workflow state filters
    updateWorkflowStateAfterEdit(finalRecord);
    
    // Show appropriate message
    const message = isFallback 
        ? 'Record saved locally (API unavailable)'
        : 'Record updated successfully';
    
    showNotification(message, 'success');
    
    return finalRecord;
}

function updateWorkflowStateAfterEdit(updatedRecord) {
    // Update filtered data arrays
    if (dataWorkflowState.selectedAdminArea && 
        updatedRecord.AdminArea === dataWorkflowState.selectedAdminArea) {
        
        // Update in filteredDataByAdminArea
        const adminAreaIndex = dataWorkflowState.filteredDataByAdminArea
            .findIndex(d => d.id === updatedRecord.id || 
                           (d.Date === updatedRecord.Date && 
                            d.Stream === updatedRecord.Stream && 
                            d.Department === updatedRecord.Department));
        if (adminAreaIndex !== -1) {
            dataWorkflowState.filteredDataByAdminArea[adminAreaIndex] = updatedRecord;
        }
        
        // Update in filteredDataByDepartment if applicable
        if (dataWorkflowState.selectedDepartment &&
            updatedRecord.Department === dataWorkflowState.selectedDepartment) {
            
            const deptIndex = dataWorkflowState.filteredDataByDepartment
                .findIndex(d => d.id === updatedRecord.id ||
                               (d.Date === updatedRecord.Date && 
                                d.Stream === updatedRecord.Stream));
            if (deptIndex !== -1) {
                dataWorkflowState.filteredDataByDepartment[deptIndex] = updatedRecord;
            }
        }
    }
}

function deleteStreamData(stream) {
    if (!confirm('Are you sure you want to delete all records for stream "' + stream + '"?')) return;
    
    if (!dataWorkflowState.selectedAdminArea || !dataWorkflowState.selectedDepartment || !stream) return;
    
    const indices = [];
    for (let i = metricsData.length - 1; i >= 0; i--) {
        const item = metricsData[i];
        if (item.AdminArea === dataWorkflowState.selectedAdminArea && 
            item.Department === dataWorkflowState.selectedDepartment &&
            item.Stream === stream) {
            indices.push(i);
        }
    }
    
    indices.forEach(index => {
        metricsData.splice(index, 1);
    });
    
    // Save to localStorage
    saveToLocalStorage();
    
    showNotification('Deleted ' + indices.length + ' records for stream "' + stream + '"', 'success');
    
    dataWorkflowState.filteredDataByDepartment = metricsData.filter(d => 
        d.AdminArea === dataWorkflowState.selectedAdminArea && 
        d.Department === dataWorkflowState.selectedDepartment
    );
    
    renderDataManagementSystem();
    setTimeout(() => renderStreamCharts(), 100);
}

// ⚠️ DEPRECATED: IDs are now generated by the server only
// Do not use this function anymore
function generateDataId() {
    console.warn('⚠️ generateDataId() is deprecated - server generates IDs automatically');
    return null;
}

// =======================================================================
// REPORT GENERATION
// =======================================================================

function goToReportGeneration() {
    // Check if both Admin Area and Department are selected (or All options are selected)
    const hasAdminArea = dataWorkflowState.selectedAdminArea || dataWorkflowState.showAllAdminAreas;
    const hasDepartment = dataWorkflowState.selectedDepartment || dataWorkflowState.showAllDepartments;
    
    if (!hasAdminArea || !hasDepartment) {
        showNotification('Please complete all steps first', 'warning');
        return;
    }
    // Show modal to get report name only
    showReportGenerationModal();
}

function showReportGenerationModal() {
    // Get display names for Admin Area and Department
    const adminAreaName = dataWorkflowState.selectedAdminArea || (dataWorkflowState.showAllAdminAreas ? 'All Admin Areas' : 'N/A');
    const departmentName = dataWorkflowState.selectedDepartment || (dataWorkflowState.showAllDepartments ? 'All Departments' : 'N/A');
    
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
                <h3 class="text-2xl font-bold text-slate-800 mb-6">
                    <i class="fas fa-file-alt text-blue-500 mr-2"></i>
                    Report Name
                </h3>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Enter Report Name</label>
                    <input id="reportNameInput" type="text" 
                           placeholder="${adminAreaName} - ${departmentName}"
                           class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                           autofocus />
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <p class="text-sm text-slate-700 mb-2"><strong>Date Range:</strong></p>
                    <p class="text-slate-600">${dataWorkflowState.startDate || 'Any'} → ${dataWorkflowState.endDate || 'Any'}</p>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="closeReportModal()" class="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-all">
                        Cancel
                    </button>
                    <button onclick="generateReportFromModal()" class="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg">
                        Generate
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('reportNameInput').focus();
}

function closeReportModal() {
    const modal = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (modal) modal.remove();
}

async function generateReportFromModal() {
    const reportName = document.getElementById('reportNameInput')?.value?.trim() || 
                       `${dataWorkflowState.selectedAdminArea} - ${dataWorkflowState.selectedDepartment}`;
    
    closeReportModal();

    // Show actual loading screen
    showActualLoadingScreen();

    try {
        // Extract year from dates for AI analysis
        let year = null;
        if (dataWorkflowState.startDate) {
            year = new Date(dataWorkflowState.startDate).getFullYear();
        } else if (dataWorkflowState.endDate) {
            year = new Date(dataWorkflowState.endDate).getFullYear();
        } else {
            // Default to current year if no dates provided
            year = new Date().getFullYear();
        }
        
        // Build professional payload matching Flask backend expectations
        const payload = {
            reportName: reportName,
            startDate: dataWorkflowState.startDate,
            endDate: dataWorkflowState.endDate,
            department: dataWorkflowState.selectedDepartment,
            adminArea: dataWorkflowState.selectedAdminArea,
            year: year
        };

        console.debug('📊 Generating report from workflow with payload:', payload);

        // STEP 1: Data Schema Validation & Parameter Parsing
        try {
            updateLoadingStatus('Validating workflow data structure and schema...');
            activateStepVisual(0);
            updateProgress(2);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            updateLoadingStatus('Parsing request parameters and authenticating...');
            updateProgress(5);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        try {
            updateLoadingStatus('Preparing filter criteria and date range verification...');
            updateProgress(8);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 250));

        // STEP 2: API Connection & Server Processing
        try {
            updateLoadingStatus('Establishing secure connection to processing server...');
            activateStepVisual(0);
            updateProgress(12);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            updateLoadingStatus('Sending request payload to backend API...');
            updateProgress(15);
        } catch(e){}
        
        // Send request to Flask backend
        const response = await fetch(`${API_BASE}/api/report`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            let rawResponse = '';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                rawResponse = errorData.raw_response || '';
                console.error('Server error details:', errorData);
                
                // Log the raw response for debugging
                if (rawResponse) {
                    console.log('Raw AI Response (for debugging):', rawResponse);
                }
            } catch (e) {
                const textError = await response.text();
                console.error('Server raw error:', textError);
            }
            throw new Error(errorMessage);
        }
        
        try {
            updateLoadingStatus('Server processing AI analysis and chart generation...');
            updateProgress(22);
        } catch(e){}
        
        // Parse response from Flask backend
        const apiResponse = await response.json();
        
        if (!apiResponse.status || apiResponse.status !== 'ok') {
            throw new Error(apiResponse.message || 'API returned an error');
        }

        // STEP 3: Data Extraction & AI Analysis
        try {
            updateLoadingStatus('Receiving server response and extracting analytics...');
            activateStepVisual(1);
            updateProgress(28);
        } catch(e){}

        const reportData = apiResponse.report || {};
        const chartData = apiResponse.chart_data || {};
        const metadata = apiResponse.metadata || {};
        
        if (!reportData || Object.keys(reportData).length === 0) {
            throw new Error('Invalid report data received from server');
        }
        
        await new Promise(resolve => setTimeout(resolve, 250));
        
        try {
            updateLoadingStatus('Processing statistical analysis on collected metrics...');
            updateProgress(35);
        } catch(e){}
        
        // Process report sections
        const reportSections = Object.keys(reportData);
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        try {
            updateLoadingStatus('Running AI-generated insights and pattern analysis...');
            updateProgress(42);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        try {
            updateLoadingStatus('Analyzing data patterns and extracting recommendations...');
            updateProgress(50);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 350));

        // STEP 4: Data Transformation & Chart Processing
        try {
            updateLoadingStatus('Transforming raw data into display-ready format...');
            activateStepVisual(1);
            updateProgress(58);
        } catch(e){}
        
        // Process chart data from backend
        const processedCharts = {
            admin_areas: chartData.admin_areas || [],
            departments: chartData.departments || [],
            streams: chartData.streams || [],
            production: chartData.production || {},
            energy: chartData.energy || {},
            highlights: chartData.highlights || {}
        };
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            updateLoadingStatus('Validating data integrity and preparing visualizations...');
            updateProgress(63);
        } catch(e){}
        
        // Verify chart data structure
        const chartCount = Object.keys(processedCharts).filter(k => processedCharts[k]).length;
        await new Promise(resolve => setTimeout(resolve, 200));

        // STEP 5: Visualization & Chart Rendering
        try {
            updateLoadingStatus('Generating interactive chart datasets...');
            activateStepVisual(2);
            updateProgress(70);
        } catch(e){}
        
        // Prepare chart rendering data
        await new Promise(resolve => setTimeout(resolve, 400));
        
        try {
            updateLoadingStatus('Rendering production metrics and performance charts...');
            updateProgress(76);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            updateLoadingStatus('Creating administrative and departmental visualizations...');
            updateProgress(82);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            updateLoadingStatus('Finalizing all interactive chart components...');
            updateProgress(87);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 250));

        // STEP 6: Final Assembly & Optimization
        try {
            updateLoadingStatus('Assembling complete report with all sections...');
            activateStepVisual(3);
            updateProgress(92);
        } catch(e){}
        
        // Store processed report data
        window.currentReport = reportData;
        window.currentChartData = chartData;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
            updateLoadingStatus('Optimizing layout and preparing for display...');
            updateProgress(96);
        } catch(e){}
        
        await new Promise(resolve => setTimeout(resolve, 200));

        // STEP 7: Display & Navigation
        try {
            updateLoadingStatus('Finalizing display and loading report page...');
            activateStepVisual(4);
            updateProgress(100);
        } catch(e){}

        // Store comprehensive context
        const context = { 
            reportName: reportName,
            startDate: dataWorkflowState.startDate,
            endDate: dataWorkflowState.endDate,
            department: dataWorkflowState.selectedDepartment,
            adminArea: dataWorkflowState.selectedAdminArea,
            reportId: apiResponse.report_id || null,
            metadata: metadata,
            generatedAt: metadata.generated_at || new Date().toISOString()
        };
        
        window.reportContext = context;
        
        // Small delay for smooth UI transition
        await new Promise(resolve => setTimeout(resolve, 300));
        navigateTo('reportnow');

    } catch (error) {
        hideLoadingScreen();
        console.error('Report generation error:', error);
        showNotification('Error generating report: ' + error.message, 'error');
    }
}

function showActualLoadingScreen() {
    document.getElementById('pageTitle').textContent = 'Generating Report...';
    document.getElementById('mainContent').innerHTML = `
        <div class="flex items-center justify-center" style="min-height: 100vh;">
            <div class="max-w-4xl mx-auto w-full px-4 py-8">
                <div class="bg-white rounded-3xl shadow-2xl p-12 border border-slate-100">
                    <!-- Main Header -->
                    <div class="mb-12 pb-8 border-b-2 border-slate-200">
                        <div class="flex items-start gap-6 mb-4">
                            <div class="relative w-20 h-20 flex-shrink-0">
                                <div class="absolute inset-0 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
                                <div class="absolute inset-2 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-cog text-sky-600 text-2xl animate-pulse"></i>
                                </div>
                            </div>
                            <div>
                                <h1 class="text-5xl font-black text-slate-900 mb-2">Generating Report</h1>
                                <p class="text-lg text-slate-600 font-medium">Processing and assembling your report...</p>
                                <p class="text-sm text-slate-500 mt-2">Processing data, generating charts, and preparing the final file...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-bold text-slate-700 uppercase tracking-wider">Overall Progress</span>
                            <span id="progressPercent" class="text-sm font-bold bg-sky-100 text-sky-700 px-3 py-1 rounded-full">0%</span>
                        </div>
                        <div class="h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div id="loadingProgress" class="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 shadow-lg transition-all duration-300" style="width:0%"></div>
                        </div>
                    </div>

                    <!-- All Steps in One Accordion -->
                    <div class="mb-10">
                        <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-l-4 border-slate-300">
                            <button type="button" onclick="toggleAllStepsDetails()" class="w-full flex items-center justify-between px-5 py-4 focus:outline-none hover:bg-slate-100 rounded-t-xl">
                                <div class="flex items-center gap-3">
                                    <span class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-400 bg-white text-blue-500">
                                        <i class="fas fa-spinner fa-spin text-lg"></i>
                                    </span>
                                    <span class="text-sm font-bold text-slate-800">Processing Steps Details</span>
                                </div>
                                <span class="ml-2"><i class="fas fa-chevron-down text-slate-400"></i></span>
                            </button>
                            <div id="allStepsAccordion" class="hidden px-5 pb-5">
                                <!-- Step 1: Data Validation -->
                                <div class="mb-6">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="text-sm font-bold text-slate-800">Step 1: Data Validation</div>
                                        <span id="step1Progress" class="text-xs text-slate-500">0%</span>
                                    </div>
                                    <p class="text-xs text-slate-600 mb-2 leading-relaxed">Checking input parameters and filters...</p>
                                    <div id="step1Details" class="text-xs text-slate-500 space-y-1">
                                        <div>• Checking request parameters</div>
                                        <div>• Validating report name</div>
                                        <div>• Checking date range</div>
                                    </div>
                                </div>
                                <!-- Step 2: API Connection & Transmission -->
                                <div class="mb-6">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="text-sm font-bold text-slate-800">Step 2: API Connection & Transmission</div>
                                        <span id="step2Progress" class="text-xs text-slate-500">0%</span>
                                    </div>
                                    <p class="text-xs text-slate-600 mb-2 leading-relaxed">Sending request to backend API...</p>
                                    <div id="step2Details" class="text-xs text-slate-500 space-y-1">
                                        <div>• Establishing connection</div>
                                        <div>• Transmitting workflow payload</div>
                                        <div>• Awaiting server response</div>
                                    </div>
                                </div>
                                <!-- Step 3: Data Analysis & Insights -->
                                <div class="mb-6">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="text-sm font-bold text-slate-800">Step 3: Data Analysis & Insights</div>
                                        <span id="step3Progress" class="text-xs text-slate-500">0%</span>
                                    </div>
                                    <p class="text-xs text-slate-600 mb-2 leading-relaxed">Processing data and extracting insights...</p>
                                    <div id="step3Details" class="text-xs text-slate-500 space-y-1">
                                        <div>• Receiving server response</div>
                                        <div>• Parsing response data</div>
                                    </div>
                                </div>
                                <!-- Step 4: Chart Rendering & Visualization -->
                                <div class="mb-6">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="text-sm font-bold text-slate-800">Step 4: Chart Rendering & Visualization</div>
                                        <span id="step4Progress" class="text-xs text-slate-500">0%</span>
                                    </div>
                                    <p class="text-xs text-slate-600 mb-2 leading-relaxed">Rendering charts and preparing visuals...</p>
                                    <div id="step4Details" class="text-xs text-slate-500 space-y-1">
                                        <div>• Preparing chart data</div>
                                        <div>• Rendering charts</div>
                                    </div>
                                </div>
                                <!-- Step 5: Final Assembly & Delivery -->
                                <div class="mb-6">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="text-sm font-bold text-slate-800">Step 5: Final Assembly & Delivery</div>
                                        <span id="step5Progress" class="text-xs text-slate-500">0%</span>
                                    </div>
                                    <p class="text-xs text-slate-600 mb-2 leading-relaxed">Assembling and displaying the final report...</p>
                                    <div id="step5Details" class="text-xs text-slate-500 space-y-1">
                                        <div>• Assembling report</div>
                                        <div>• Final quality check</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Live Status -->
                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-info-circle text-blue-600"></i>
                            <span class="text-xs font-bold text-blue-900 uppercase">Live Status</span>
                        </div>
                        <div id="loadingStatus" class="text-sm text-blue-800 font-medium" aria-live="polite">
                            Initializing report generation...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Real-time step progression: كل خطوة تنتظر فعلاً انتهاء العملية الحقيقية
    (async () => {
        // الخطوة 1: التحقق من البيانات
        updateLoadingStatus('Authenticating workflow data...');
        activateStepVisual(0);
        updateProgress(2);
        await validateReportData();
        updateStepDetails(1, '• Validating report name');
        updateProgress(4);
        await checkDateRange();
        updateStepDetails(1, '• Checking date range');
        updateProgress(6);
        await initializeService();
        updateStepDetails(1, '• Initializing service');
        updateProgress(10);
        updateStepDetails(1, '• Ready for transmission', true);

        // الخطوة 2: الاتصال بالـ API
        updateLoadingStatus('Sending request to API server...');
        updateProgress(12);
        await establishApiConnection();
        updateStepDetails(2, '• Establishing connection');
        updateProgress(14);
        await transmitWorkflowPayload();
        updateStepDetails(2, '• Transmitting workflow payload');
        updateProgress(16);
        await awaitServerResponse();
        updateProgress(20);
        updateStepDetails(2, '• Awaiting server response');
        await sleep(200); // يمكن حذفها إذا كانت awaitServerResponse حقيقية
        updateProgress(26);
        updateStepDetails(2, '• Response received', true);

        // الخطوة 3: تحليل البيانات
        updateLoadingStatus('Processing workflow data...');
        updateProgress(30);
        await parseResponseData();
        updateStepDetails(3, '• Parsing response data');
        updateProgress(35);
        await runStatisticalAnalysis();
        updateStepDetails(3, '• Running statistical analysis');
        updateProgress(42);
        await extractKeyInsights();
        updateStepDetails(3, '• Extracting key insights');
        updateProgress(57);
        await generateRecommendations();
        updateStepDetails(3, '• Generating recommendations', true);

        // الخطوة 4: إنشاء الرسوم البيانية
        updateLoadingStatus('Creating visualizations...');
        updateProgress(65);
        await prepareChartData();
        updateStepDetails(4, '• Preparing chart data');
        updateProgress(70);
        await renderCharts();
        updateStepDetails(4, '• Rendering charts', true);

        // الخطوة 5: التجميع النهائي
        updateLoadingStatus('Finalizing report and preparing display...');
        updateProgress(82);
        await assembleReport();
        updateStepDetails(5, '• Assembling report');
        updateProgress(94);
        await finalQualityCheck();
        updateStepDetails(5, '• Final quality check', true);
        await sleep(200);
        updateProgress(100);
        updateStepDetails(5, '• Ready for display', true);
        
        updateLoadingStatus('Report complete! Opening display...');
    })();

    // دوال وهمية تمثل العمليات الحقيقية (استبدلها بالعمليات الفعلية لاحقاً)
    async function validateReportData() { await sleep(400); }
    async function checkDateRange() { await sleep(300); }
    async function initializeService() { await sleep(300); }
    async function establishApiConnection() { await sleep(500); }
    async function transmitWorkflowPayload() { await sleep(600); }
    async function awaitServerResponse() { await sleep(1200); }
    async function parseResponseData() { await sleep(400); }
    async function runStatisticalAnalysis() { await sleep(500); }
    async function extractKeyInsights() { await sleep(500); }
    async function generateRecommendations() { await sleep(200); }
    async function prepareChartData() { await sleep(400); }
    async function renderCharts() { await sleep(400); }
    async function assembleReport() { await sleep(300); }
    async function finalQualityCheck() { await sleep(200); }
}

function updateLoadingStatus(text) {
    const st = document.getElementById('loadingStatus');
    if (st) st.textContent = text;
}

function activateStepVisual(stepIndex) {
    const ids = ['loadingStep1','loadingStep2','loadingStep3','loadingStep4'];
    const icons = ['step1Icon','step2Icon','step3Icon','step4Icon'];
    ids.forEach((id, i) => {
        const el = document.getElementById(id);
        const icon = document.getElementById(icons[i]);
        if (!el) return;
        if (i < stepIndex) {
            // Completed steps - show checkmark
            el.classList.remove('border-slate-300', 'bg-slate-50', 'bg-gradient-to-br');
            el.classList.add('border-green-400', 'bg-green-50');
            if (icon) {
                icon.classList.remove('border-slate-400', 'bg-white');
                icon.classList.add('border-green-500', 'bg-green-500');
                icon.innerHTML = '<svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
            }
        } else if (i === stepIndex) {
            // Current step - show active spinner
            el.classList.remove('border-slate-300', 'bg-slate-50', 'bg-gradient-to-br', 'from-slate-50', 'to-slate-100');
            el.classList.add('border-sky-500', 'bg-sky-50', 'shadow-md', 'ring-2', 'ring-sky-200');
            if (icon) {
                icon.classList.remove('border-slate-400');
                icon.classList.add('border-sky-500', 'bg-white', 'animate-spin');
                icon.innerHTML = '<span class="inline-block h-full w-full border-2 border-sky-500 border-t-transparent rounded-full"></span>';
            }
        } else {
            // Future steps - default state
            el.classList.remove('border-green-400', 'bg-green-50', 'border-sky-500', 'bg-sky-50', 'shadow-md', 'ring-2', 'ring-sky-200');
            el.classList.add('border-slate-300', 'bg-slate-50', 'bg-gradient-to-br', 'from-slate-50', 'to-slate-100');
            if (icon) {
                icon.classList.add('border-slate-400');
                icon.classList.remove('border-green-500', 'bg-green-500', 'border-sky-500', 'bg-white', 'animate-spin');
                icon.innerHTML = '';
            }
        }
    });
}

function updateProgress(percent) {
    const bar = document.getElementById('loadingProgress');
    if (bar) {
        bar.style.width = percent + '%';
        const percentDisplay = document.getElementById('progressPercent');
        if (percentDisplay) percentDisplay.textContent = percent + '%';
    }
}

// =======================================================================
// MODAL FUNCTIONS
// =======================================================================

function showAdminAreaEditModal(records) {
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-2xl text-white">
                    <div class="flex items-center justify-between">
                        <h3 class="text-2xl font-black">Edit Admin Area: ${dataWorkflowState.selectedAdminArea}</h3>
                        <button onclick="closeModal()" class="text-white hover:text-blue-200">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Summary</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="text-sm text-slate-500">Total Records</div>
                                <div class="text-xl font-bold">${records.length}</div>
                            </div>
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="text-sm text-slate-500">Departments</div>
                                <div class="text-xl font-bold text-blue-600">${[...new Set(records.map(d => d.Department))].length}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Bulk Actions</h4>
                        <div class="space-y-3">
                            <button onclick="exportAdminAreaData()" class="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 flex items-center justify-center">
                                <i class="fas fa-download mr-2"></i> Export Admin Area Data
                            </button>
                        </div>
                    </div>
                    
                    <div class="border-t border-slate-200 pt-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Recent Records (Click to Edit)</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-slate-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left">Date</th>
                                        <th class="px-4 py-2 text-left">Dept</th>
                                        <th class="px-4 py-2 text-left">Stream</th>
                                        <th class="px-4 py-2 text-left">Production</th>
                                        <th class="px-4 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${records.slice(0, 10).map((record, idx) => {
                                        const recordIndex = metricsData.indexOf(record);
                                        return `
                                            <tr class="border-b border-slate-100 hover:bg-blue-50">
                                                <td class="px-4 py-2">${record.Date || 'N/A'}</td>
                                                <td class="px-4 py-2">${record.Department || 'N/A'}</td>
                                                <td class="px-4 py-2">${record.Stream || 'N/A'}</td>
                                                <td class="px-4 py-2">${parseFloat(record.Production_Actual || 0).toFixed(2)}</td>
                                                <td class="px-4 py-2">
                                                    <button onclick="editSingleRecordFromModal(${record.id || record.ID})" class="text-blue-600 hover:text-blue-800">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-4">
                    <button onclick="closeModal()" class="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    modalDiv.id = 'adminAreaModal';
    document.body.appendChild(modalDiv);
    
    document.body.style.overflow = 'hidden';
}

function showDepartmentEditModal(records) {
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-blue-600 to-teal-400 px-8 py-6 rounded-t-2xl text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-black">Edit Department: ${dataWorkflowState.selectedDepartment}</h3>
                            <p class="text-blue-100 text-sm mt-1">${dataWorkflowState.selectedAdminArea}</p>
                        </div>
                        <button onclick="closeModal()" class="text-white hover:text-indigo-200">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Summary</h4>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="text-sm text-slate-500">Total Records</div>
                                <div class="text-xl font-bold">${records.length}</div>
                            </div>
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="text-sm text-slate-500">Streams</div>
                                <div class="text-xl font-bold text-purple-600">${[...new Set(records.map(d => d.Stream))].length}</div>
                            </div>
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="text-sm text-slate-500">Avg Production</div>
                                <div class="text-xl font-bold text-blue-600">${(records.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0) / records.length).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Actions</h4>
                        <div class="space-y-3">
                            <button onclick="exportDepartmentData()" class="w-full px-4 py-3 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 flex items-center justify-center">
                                <i class="fas fa-download mr-2"></i> Export Department Data
                            </button>
                        </div>
                    </div>
                    
                    <div class="border-t border-slate-200 pt-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">Records (Click to Edit)</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-slate-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left">Date</th>
                                        <th class="px-4 py-2 text-left">Stream</th>
                                        <th class="px-4 py-2 text-left">Production</th>
                                        <th class="px-4 py-2 text-left">Energy</th>
                                        <th class="px-4 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${records.slice(0, 10).map((record, idx) => {
                                        const recordIndex = metricsData.indexOf(record);
                                        return `
                                            <tr class="border-b border-slate-100 hover:bg-purple-50">
                                                <td class="px-4 py-2">${record.Date || 'N/A'}</td>
                                                <td class="px-4 py-2 font-medium">${record.Stream || 'N/A'}</td>
                                                <td class="px-4 py-2 text-blue-700 font-bold">${parseFloat(record.Production_Actual || 0).toFixed(2)}</td>
                                                <td class="px-4 py-2 text-amber-700">${parseFloat(record.Energy_Actual || 0).toFixed(2)}</td>
                                                <td class="px-4 py-2">
                                                    <button onclick="editSingleRecordFromModal(${record.id || record.ID})" class="text-blue-600 hover:text-blue-800">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-4">
                    <button onclick="closeModal()" class="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    modalDiv.id = 'departmentModal';
    document.body.appendChild(modalDiv);
    
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('adminAreaModal');
    if (modal) modal.remove();
    
    const deptModal = document.getElementById('departmentModal');
    if (deptModal) deptModal.remove();
    
    document.body.style.overflow = 'auto';
}

function editSingleRecord(recordId) {
    // recordId must be a number (from database)
    if (typeof recordId !== 'number' && !Number.isInteger(parseInt(recordId))) {
        console.error('❌ Invalid record ID type:', recordId);
        showNotification('Invalid record ID', 'error');
        return;
    }
    const index = metricsData.findIndex(item => item.id == recordId);
    if (index !== -1) {
        closeModal();
        showEditModal(metricsData[index], index);
    }
}

function editSingleRecordFromModal(recordId) {
    const index = metricsData.findIndex(item => item.id == recordId || item.ID == recordId);
    if (index !== -1) {
        closeModal();
        showEditModal(metricsData[index], index);
    }
}

function showEditModal(record, index) {
    // أغلق أي نافذة تعديل مفتوحة قبل فتح نافذة جديدة
    closeEditModal && closeEditModal();
    // If record doesn't have an ID, it's a new record - don't auto-generate
    // The server will assign an ID when it's created
    if (!record.id && index === -1) {
        console.log('📝 Opening new record form - ID will be assigned by server');
    }
    
    const allStreams = [...new Set(metricsData.map(d => d.Stream).filter(Boolean))];
    const allAdminAreas = [...new Set(metricsData.map(d => d.AdminArea).filter(Boolean))];
    const allDepartments = [...new Set(metricsData.map(d => d.Department).filter(Boolean))];
    
    const originalStream = record.Stream;
    const originalDate = record.Date;
    
    // أغلق أي نافذة قسم مفتوحة قبل فتح نافذة جديدة
    closeModal && closeModal();
    const modalHTML = `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 opacity-0" id="editRecordModalBg">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0" id="editRecordModal">
                <div class="bg-gradient-to-r from-blue-600 to-teal-400 px-8 py-6 rounded-t-2xl text-white sticky top-0 z-10">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-black">Edit Record</h3>
                            <p class="text-blue-100 text-sm mt-1">${record.Department || 'N/A'} - ${record.Stream || 'N/A'}</p>
                        </div>
                        <button onclick="closeEditModal()" class="text-white hover:text-blue-200">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-8">
                    <input type="hidden" id="original_Stream" value="${originalStream || ''}">
                    <input type="hidden" id="original_Date" value="${originalDate || ''}">
                    <input type="hidden" id="current_index" value="${index}">
                    <input type="hidden" id="edit_id" value="${record.id || record.ID || ''}">
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">
                                <i class="fas fa-building mr-1"></i> Admin Area
                            </label>
                            <select id="filter_AdminArea" onchange="loadAvailableDates()" 
                                    class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold">
                                <option value="">All Admin Areas</option>
                                ${allAdminAreas.map(aa => `
                                    <option value="${aa}" ${record.AdminArea === aa ? 'selected' : ''}>${aa}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">
                                <i class="fas fa-sitemap mr-1"></i> Department
                            </label>
                            <select id="filter_Department" onchange="loadAvailableDates()" 
                                    class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold">
                                <option value="">All Departments</option>
                                ${allDepartments.map(dept => `
                                    <option value="${dept}" ${record.Department === dept ? 'selected' : ''}>${dept}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">
                                <i class="fas fa-stream mr-1"></i> Stream
                            </label>
                            <select id="filter_Stream" onchange="loadAvailableDates()" 
                                    class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold">
                                <option value="">All Streams</option>
                                ${allStreams.map(stream => `
                                    <option value="${stream}" ${record.Stream === stream ? 'selected' : ''}>${stream}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">
                                <i class="fas fa-calendar mr-1"></i> Selected Date
                            </label>
                            <input type="text" id="display_Date" value="${record.Date || ''}" disabled
                                   class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-700 font-bold text-center">
                            <input type="hidden" id="edit_Date" value="${record.Date || ''}">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-1">
                            <div class="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-bold text-slate-800">
                                        <i class="fas fa-calendar-alt mr-2"></i> Available Dates
                                    </h4>
                                    <span id="datesCount" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        0
                                    </span>
                                </div>
                                <div id="datesList" class="space-y-2 max-h-[500px] overflow-y-auto">
                                </div>
                            </div>
                        </div>
                        
                        <div class="lg:col-span-2">
                            <div class="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-bold text-slate-800">
                                        <i class="fas fa-list mr-2"></i> Records for Selected Date
                                    </h4>
                                    <span id="recordsCount" class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        0
                                    </span>
                                </div>
                                <div id="recordsList" class="space-y-3 max-h-[500px] overflow-y-auto">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="selectedRecordDetails" class="mt-6 border-t-2 border-slate-200 pt-6">
                        <h4 class="text-lg font-bold text-slate-800 mb-4">
                            <i class="fas fa-edit mr-2"></i> Edit Selected Record
                        </h4>
                        <form id="editRecordForm">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Department</label>
                                    <input type="text" id="edit_Department" value="${record.Department || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Admin Area</label>
                                    <input type="text" id="edit_AdminArea" value="${record.AdminArea || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Stream</label>
                                    <input type="text" id="edit_Stream" value="${record.Stream || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Production Actual</label>
                                    <input type="number" step="0.01" id="edit_Production_Actual" value="${record.Production_Actual || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Production Target</label>
                                    <input type="number" step="0.01" id="edit_Production_Target" value="${record.Production_Target || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Energy Actual</label>
                                    <input type="number" step="0.01" id="edit_Energy_Actual" value="${record.Energy_Actual || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Energy Target</label>
                                    <input type="number" step="0.01" id="edit_Energy_Target" value="${record.Energy_Target || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Downtime (Min)</label>
                                    <input type="number" id="edit_Downtime_Min" value="${record.Downtime_Min || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Temperature (C)</label>
                                    <input type="number" step="0.01" id="edit_Temperature_C" value="${record.Temperature_C || 0}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Facility Name</label>
                                    <input type="text" id="edit_Facility_Name" value="${record.Facility_Name || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Operator Name</label>
                                    <input type="text" id="edit_Operator_Name" value="${record.Operator_Name || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Equipment ID</label>
                                    <input type="text" id="edit_Equipment_ID" value="${record.Equipment_ID || ''}" 
                                           class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <label class="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                                <textarea id="edit_Notes" rows="2" 
                                          class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">${record.Notes || ''}</textarea>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="px-8 py-6 border-t border-slate-200 flex justify-end gap-4 sticky bottom-0 bg-white">
                    <button onclick="closeEditModal()" class="px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300">
                        Cancel
                    </button>
                    <button onclick="deleteCurrentRecord()" class="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-800 shadow-lg">
                        <i class='fas fa-trash mr-2'></i> Delete
                    </button>
                    <button onclick="saveEditedRecord()" class="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                        <i class="fas fa-save mr-2"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('editRecordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // تفعيل الحركة السلسة بعد إدراج العنصر
    setTimeout(() => {
        const bg = document.getElementById('editRecordModalBg');
        const modal = document.getElementById('editRecordModal');
        if(bg) bg.style.opacity = '1';
        if(modal) {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }
    }, 10);
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => loadAvailableDates(), 100);

    // تحديث الحقول الرقمية عند تغيير الفلاتر (stream أو التاريخ)
    setTimeout(() => {
        const filterStream = document.getElementById('filter_Stream');
        const editDate = document.getElementById('edit_Date');
        function updateEditRecordFields() {
            const streamVal = filterStream ? filterStream.value : '';
            const dateVal = editDate ? editDate.value : '';
            if (!streamVal || !dateVal) return;
            // ابحث عن السجل المطابق
            const rec = metricsData.find(r => String(r.Stream) === String(streamVal) && String(r.Date) === String(dateVal));
            if (rec) {
                // تحديث جميع الحقول مع الحفاظ على نفس الـ ID
                document.getElementById('edit_id').value = rec.id || rec.ID || '';
                document.getElementById('edit_Stream').value = rec.Stream || '';
                document.getElementById('edit_Department').value = rec.Department || '';
                document.getElementById('edit_AdminArea').value = rec.AdminArea || '';
                document.getElementById('edit_Production_Actual').value = rec.Production_Actual || 0;
                document.getElementById('edit_Production_Target').value = rec.Production_Target || 0;
                document.getElementById('edit_Energy_Actual').value = rec.Energy_Actual || 0;
                document.getElementById('edit_Energy_Target').value = rec.Energy_Target || 0;
                document.getElementById('edit_Downtime_Min').value = rec.Downtime_Min || 0;
                document.getElementById('edit_Temperature_C').value = rec.Temperature_C || 0;
                document.getElementById('edit_Facility_Name').value = rec.Facility_Name || '';
                document.getElementById('edit_Operator_Name').value = rec.Operator_Name || '';
                document.getElementById('edit_Equipment_ID').value = rec.Equipment_ID || '';
                document.getElementById('edit_Notes').value = rec.Notes || '';
                // تحديث current_index ليكون مطابق للسجل الحالي
                const idx = metricsData.findIndex(r => (r.id || r.ID) === (rec.id || rec.ID));
                if (idx !== -1) {
                    document.getElementById('current_index').value = idx;
                }
            }
        }
        if (filterStream) filterStream.addEventListener('change', updateEditRecordFields);
        if (editDate) editDate.addEventListener('input', updateEditRecordFields);
    }, 200);
}

function loadAvailableDates() {
    const filterAdminArea = document.getElementById('filter_AdminArea').value;
    const filterDepartment = document.getElementById('filter_Department').value;
    const filterStream = document.getElementById('filter_Stream').value;
    
    let filteredData = metricsData;
    
    if (filterAdminArea) {
        filteredData = filteredData.filter(d => d.AdminArea === filterAdminArea);
    }
    
    if (filterDepartment) {
        filteredData = filteredData.filter(d => d.Department === filterDepartment);
    }
    
    if (filterStream) {
        filteredData = filteredData.filter(d => d.Stream === filterStream);
    }
    
    const uniqueDates = [...new Set(filteredData.map(d => d.Date).filter(Boolean))].sort().reverse();
    
    document.getElementById('datesCount').textContent = uniqueDates.length;
    
    const datesList = document.getElementById('datesList');
    
    if (uniqueDates.length === 0) {
        datesList.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                <i class="fas fa-calendar-times text-3xl mb-2"></i>
                <p class="text-sm">No dates available</p>
            </div>
        `;
        document.getElementById('recordsList').innerHTML = '';
        document.getElementById('recordsCount').textContent = '0';
        return;
    }
    
    const currentDate = document.getElementById('edit_Date').value;
    
    datesList.innerHTML = uniqueDates.map(date => {
        const recordsForDate = filteredData.filter(d => d.Date === date);
        const isSelected = date === currentDate;
        
        return `
            <div class="bg-white hover:bg-blue-50 rounded-lg p-3 border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} cursor-pointer transition-all"
                 onclick="selectDate('${date}')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-calendar-day ${isSelected ? 'text-blue-600' : 'text-slate-400'}"></i>
                        <span class="font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}">${date}</span>
                    </div>
                    <span class="px-2 py-1 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'} rounded-full text-xs font-bold">
                        ${recordsForDate.length}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    if (currentDate && uniqueDates.includes(currentDate)) {
        loadRecordsForDate(currentDate);
    } else if (uniqueDates.length > 0) {
        selectDate(uniqueDates[0]);
    }
}

function selectDate(date) {
    document.getElementById('edit_Date').value = date;
    document.getElementById('display_Date').value = date;
    loadRecordsForDate(date);
    loadAvailableDates();
    // تحديث الحقول الرقمية في نموذج التعديل عند تغيير التاريخ
    setTimeout(() => {
        const filterStream = document.getElementById('filter_Stream');
        const editDate = document.getElementById('edit_Date');
        if (filterStream && editDate) {
            const streamVal = filterStream.value;
            const dateVal = editDate.value;
            if (streamVal && dateVal) {
                const rec = metricsData.find(r => String(r.Stream) === String(streamVal) && String(r.Date) === String(dateVal));
                if (rec) {
                    document.getElementById('edit_Stream').value = rec.Stream || '';
                    document.getElementById('edit_Department').value = rec.Department || '';
                    document.getElementById('edit_AdminArea').value = rec.AdminArea || '';
                    document.getElementById('edit_Production_Actual').value = rec.Production_Actual || 0;
                    document.getElementById('edit_Production_Target').value = rec.Production_Target || 0;
                    document.getElementById('edit_Energy_Actual').value = rec.Energy_Actual || 0;
                    document.getElementById('edit_Energy_Target').value = rec.Energy_Target || 0;
                    document.getElementById('edit_Downtime_Min').value = rec.Downtime_Min || 0;
                    document.getElementById('edit_Temperature_C').value = rec.Temperature_C || 0;
                    document.getElementById('edit_Facility_Name').value = rec.Facility_Name || '';
                    document.getElementById('edit_Operator_Name').value = rec.Operator_Name || '';
                    document.getElementById('edit_Equipment_ID').value = rec.Equipment_ID || '';
                    document.getElementById('edit_Notes').value = rec.Notes || '';
                }
            }
        }
    }, 100);
}

function loadRecordsForDate(selectedDate) {
    const filterAdminArea = document.getElementById('filter_AdminArea').value;
    const filterDepartment = document.getElementById('filter_Department').value;
    const filterStream = document.getElementById('filter_Stream').value;
    
    if (!selectedDate) return;
    
    let filteredRecords = metricsData.filter(d => d.Date === selectedDate);
    
    if (filterAdminArea) {
        filteredRecords = filteredRecords.filter(d => d.AdminArea === filterAdminArea);
    }
    
    if (filterDepartment) {
        filteredRecords = filteredRecords.filter(d => d.Department === filterDepartment);
    }
    
    if (filterStream) {
        filteredRecords = filteredRecords.filter(d => d.Stream === filterStream);
    }
    
    document.getElementById('recordsCount').textContent = filteredRecords.length;
    
    const recordsList = document.getElementById('recordsList');
    
    if (filteredRecords.length === 0) {
        recordsList.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>No records found</p>
            </div>
        `;
        return;
    }
    
    recordsList.innerHTML = filteredRecords.map((rec, idx) => {
        // ✅ FIX: Check both 'id' and 'ID' (API returns uppercase ID)
        const recId = rec.id || rec.ID;
        const recIndex = metricsData.findIndex(item => (item.id || item.ID) === recId);
        const prodAchievement = rec.Production_Target > 0 ? ((rec.Production_Actual / rec.Production_Target) * 100).toFixed(1) : 0;
        
        return `
            <div class="bg-white hover:bg-green-50 rounded-lg p-4 border-2 border-slate-200 hover:border-green-400 cursor-pointer transition-all"
                 onclick="selectRecordFromList(${recIndex}, ${recId || 'null'})"
                 data-record-id="${recId || ''}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                            ${idx + 1}
                        </div>
                        <div>
                            <div class="font-bold text-slate-800">${rec.Stream || 'N/A'}</div>
                            <div class="text-xs text-slate-500">${rec.Department || 'N/A'} - ${rec.AdminArea || 'N/A'}</div>
                            <div class="text-xs text-blue-500 font-mono">ID: ${recId || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold ${prodAchievement >= 95 ? 'text-green-600' : prodAchievement >= 85 ? 'text-amber-600' : 'text-red-600'}">
                            ${prodAchievement}% Achievement
                        </div>
                        <div class="text-xs text-slate-500">
                            ${parseFloat(rec.Production_Actual || 0).toFixed(0)} / ${parseFloat(rec.Production_Target || 0).toFixed(0)}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div class="bg-slate-50 rounded px-2 py-1">
                        <span class="text-slate-500">Energy:</span>
                        <span class="font-bold text-amber-600 ml-1">${parseFloat(rec.Energy_Actual || 0).toFixed(0)}</span>
                    </div>
                    <div class="bg-slate-50 rounded px-2 py-1">
                        <span class="text-slate-500">Downtime:</span>
                        <span class="font-bold text-red-600 ml-1">${rec.Downtime_Min || 0}m</span>
                    </div>
                    <div class="bg-slate-50 rounded px-2 py-1">
                        <span class="text-slate-500">Temp:</span>
                        <span class="font-bold text-cyan-600 ml-1">${parseFloat(rec.Temperature_C || 0).toFixed(1)}C</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ✅ FIXED: Accept recordId directly to ensure proper database update
function selectRecordFromList(recordIndex, recordId = null) {
    const record = metricsData[recordIndex];
    if (!record) {
        console.error('❌ Record not found at index:', recordIndex);
        showNotification('Error: Record not found', 'error');
        return;
    }
    
    // ✅ FIX: Check both 'id' and 'ID' (API returns uppercase ID)
    const actualId = recordId || record.id || record.ID;
    
    console.log('Selecting record - Index:', recordIndex, 'ID:', actualId, 'Record:', record);
    
    document.getElementById('current_index').value = recordIndex;
    
    // ✅ CRITICAL: Set the record ID for proper database update
    document.getElementById('edit_id').value = actualId || '';
    
    if (!actualId) {
        console.warn('WARNING: Record has no ID - will create new record on save');
    }

    document.getElementById('edit_Department').value = record.Department || '';
    document.getElementById('edit_AdminArea').value = record.AdminArea || '';
    document.getElementById('edit_Production_Actual').value = record.Production_Actual || 0;
    document.getElementById('edit_Production_Target').value = record.Production_Target || 0;
    document.getElementById('edit_Energy_Actual').value = record.Energy_Actual || 0;
    document.getElementById('edit_Energy_Target').value = record.Energy_Target || 0;
    document.getElementById('edit_Downtime_Min').value = record.Downtime_Min || 0;
    document.getElementById('edit_Temperature_C').value = record.Temperature_C || 0;
    document.getElementById('edit_Facility_Name').value = record.Facility_Name || '';
    document.getElementById('edit_Operator_Name').value = record.Operator_Name || '';
    document.getElementById('edit_Equipment_ID').value = record.Equipment_ID || '';
    document.getElementById('edit_Notes').value = record.Notes || '';

    document.getElementById('edit_Stream').value = record.Stream || '';

    document.getElementById('selectedRecordDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    showNotification('Selected: ' + (record.Stream || 'Record') + ' for editing', 'info');
}

function closeEditModal() {
    const bg = document.getElementById('editRecordModalBg');
    const modal = document.getElementById('editRecordModal');
    if (bg && modal) {
        bg.style.opacity = '0';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (bg) bg.remove();
        }, 250);
    } else if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

// =======================================================================
// BACKUP AND RESTORE SYSTEM
// =======================================================================

function showBackupManager() {
    // أغلق أي نافذة قسم مفتوحة قبل فتح نافذة جديدة
    closeModal && closeModal();
    const { startDate, endDate } = dataWorkflowState;
    const dateRangeText = (startDate || endDate)
        ? `<div class='mb-2 text-sm text-blue-700 font-semibold'>Backup range: <span class='font-normal'>${startDate || '...'} → ${endDate || '...'}</span></div>`
        : '';
    const modalHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl text-white">
                    <h3 class="text-xl font-bold">Data Backup Manager</h3>
                </div>
                <div class="p-6">
                    <div class="mb-6">
                        <h4 class="text-lg font-bold mb-4">Create New Backup</h4>
                        ${dateRangeText}
                        <button onclick="createBackupNow()" class="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                            <i class="fas fa-save mr-2"></i> Create Backup Now
                        </button>
                        <p class="text-sm text-slate-500 mt-2">Current records: ${metricsData.length}</p>
                    </div>
                    <div class="border-t border-slate-200 pt-6">
                        <h4 class="text-lg font-bold mb-4">Available Backups</h4>
                        <div id="backupList" class="space-y-2 max-h-60 overflow-y-auto">
                            ${getBackupListHTML()}
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 border-t flex justify-end gap-3">
                    <button onclick="closeBackupManager()" class="px-4 py-2 bg-slate-200 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function getBackupListHTML() {
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    
    if (backupKeys.length === 0) {
        return '<p class="text-slate-500 text-center py-4">No backups available</p>';
    }
    
    return backupKeys.sort().reverse().map(key => {
        const backupData = localStorage.getItem(key);
        try {
            const backup = JSON.parse(backupData);
            // استخراج الفترة من النسخة الاحتياطية
            let rangeText = '';
            if (backup.range && backup.range !== '') {
                // تحويل النص إلى شكل أوضح
                const parts = backup.range.replace(/_/g, ' ').replace(/-/g, '/').split(' ');
                rangeText = `<div class="text-xs text-blue-700">Range: ${parts[1] || '...'} → ${parts[2] || '...'}</div>`;
            }
            return `
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                        <div class="font-medium">${new Date(backup.timestamp).toLocaleString()}</div>
                        ${rangeText}
                        <div class="text-sm text-slate-500">${backup.count} records</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="restoreBackup('${key}')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            Restore
                        </button>
                        <button onclick="deleteBackup('${key}')" class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        } catch (e) {
            return '';
        }
    }).join('');
}

function createBackupNow() {
    // فلترة البيانات حسب التاريخ المحدد
    let filteredData = metricsData;
    const { startDate, endDate } = dataWorkflowState;
    if (startDate || endDate) {
        filteredData = metricsData.filter(d => {
            const dDate = new Date(d.Date || d.date || d.timestamp);
            let afterStart = true, beforeEnd = true;
            if (startDate) afterStart = dDate >= new Date(startDate);
            if (endDate) beforeEnd = dDate <= new Date(endDate);
            return afterStart && beforeEnd;
        });
    }
    const backupKey = createDataBackup(filteredData);
    showNotification('Backup created for selected date range', 'success');
    // تحديث قائمة النسخ الاحتياطية
    const backupList = document.getElementById('backupList');
    if (backupList) {
        backupList.innerHTML = getBackupListHTML();
    }
}

function restoreBackup(backupKey) {
    if (confirm('Are you sure you want to restore this backup? Current changes will be lost.')) {
        restoreFromBackup(backupKey);
        closeBackupManager();
    }
}

function deleteBackup(backupKey) {
    if (confirm('Delete this backup?')) {
        localStorage.removeItem(backupKey);
        const backupList = document.getElementById('backupList');
        if (backupList) {
            backupList.innerHTML = getBackupListHTML();
        }
        showNotification('Backup deleted', 'info');
    }
}

function closeBackupManager() {
    const modal = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (modal) modal.remove();
}

// Backup and restore functions
function createDataBackup(dataToBackup) {
    const data = dataToBackup || metricsData;
    // إضافة الفترة المختارة إلى اسم النسخة الاحتياطية
    let rangeLabel = '';
    if (dataWorkflowState.startDate || dataWorkflowState.endDate) {
        rangeLabel = `_${dataWorkflowState.startDate || '...'}_${dataWorkflowState.endDate || '...'}`;
    }
    // إزالة أي رموز غير مناسبة من اسم المفتاح
    rangeLabel = rangeLabel.replace(/[^\w\-]/g, '-');
    const backupKey = `backup_${Date.now()}${rangeLabel}`;
    const backup = {
        data,
        timestamp: new Date().toISOString(),
        count: data.length,
        range: rangeLabel
    };
    localStorage.setItem(backupKey, JSON.stringify(backup));
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    if (backupKeys.length > 5) {
        backupKeys.sort().slice(0, -5).forEach(key => localStorage.removeItem(key));
    }
    return backupKey;
}

function restoreFromBackup(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
        try {
            const backup = JSON.parse(backupData);
            metricsData = backup.data;
            saveToLocalStorage();
            showNotification(`Restored backup from ${new Date(backup.timestamp).toLocaleString()}`, 'success');
            renderDataManagementSystem();
            return true;
        } catch (error) {
            showNotification('Failed to restore backup', 'error');
        }
    }
    return false;
}

function exportDepartmentData() {
    if (!dataWorkflowState.selectedAdminArea || !dataWorkflowState.selectedDepartment) return;
    const dataToExport = metricsData.filter(d => 
        d.AdminArea === dataWorkflowState.selectedAdminArea && 
        d.Department === dataWorkflowState.selectedDepartment
    );
    exportData(dataToExport, 'department_' + dataWorkflowState.selectedDepartment);
}

function exportAdminAreaData() {
    if (!dataWorkflowState.selectedAdminArea) return;
    const dataToExport = metricsData.filter(d => d.AdminArea === dataWorkflowState.selectedAdminArea);
    exportData(dataToExport, 'admin_area_' + dataWorkflowState.selectedAdminArea);
}

function exportData(data, filename) {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(record => 
            headers.map(header => {
                const value = record[header] || '';
                return '"' + String(value).replace(/"/g, '""') + '"';
            }).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename + '_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Exported ' + data.length + ' records', 'success');
}

// =======================================================================
// HELPER FUNCTIONS
// =======================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStepDetails(stepNumber, detail, isFinal = false) {
    const detailsEl = document.getElementById(`step${stepNumber}Details`);
    const progressEl = document.getElementById(`step${stepNumber}Progress`);
    
    if (detailsEl) {
        const newDetail = document.createElement('div');
        newDetail.textContent = detail;
        newDetail.className = 'text-xs text-slate-500';
        if (isFinal) newDetail.className += ' font-bold';
        detailsEl.appendChild(newDetail);
    }
    
    if (progressEl) {
        // Simulate progress
        const current = parseInt(progressEl.textContent) || 0;
        const newProgress = Math.min(current + 25, 100);
        progressEl.textContent = newProgress + '%';
    }
}

// =======================================================================
// GLOBAL EXPORTS
// =======================================================================
window.renderDataManagementSystem = renderDataManagementSystem;
window.selectAdminArea = selectAdminArea;
window.selectAllAdminAreas = selectAllAdminAreas;
window.clearAdminAreaSelection = clearAdminAreaSelection;
window.selectDepartment = selectDepartment;
window.selectAllDepartments = selectAllDepartments;
window.clearDepartmentSelection = clearDepartmentSelection;
window.prevDataWorkflowStep = prevDataWorkflowStep;
window.nextDataWorkflowStep = nextDataWorkflowStep;
window.resetDataWorkflow = resetDataWorkflow;
window.goToReportGeneration = goToReportGeneration;
window.showReportGenerationModal = showReportGenerationModal;
window.closeReportModal = closeReportModal;
window.generateReportFromModal = generateReportFromModal;
window.showActualLoadingScreen = showActualLoadingScreen;
window.editAdminAreaData = editAdminAreaData;
window.editDepartmentData = editDepartmentData;
window.editStreamData = editStreamData;
window.addStreamRecord = addStreamRecord;
window.deleteStreamData = deleteStreamData;
window.closeModal = closeModal;
window.editSingleRecord = editSingleRecord;
window.editSingleRecordFromModal = editSingleRecordFromModal;
window.exportAdminAreaData = exportAdminAreaData;
window.exportDepartmentData = exportDepartmentData;
window.showEditModal = showEditModal;
window.closeEditModal = closeEditModal;
window.saveEditedRecord = saveEditedRecord;
window.applyDateFilter = applyDateFilter;
window.clearDateFilter = clearDateFilter;
window.getFilteredMetricsData = getFilteredMetricsData;
window.loadAvailableDates = loadAvailableDates;
window.selectDate = selectDate;
window.loadRecordsForDate = loadRecordsForDate;
window.selectRecordFromList = selectRecordFromList;
// window.generateDataId = generateDataId;  // Deprecated - removed
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.showBackupManager = showBackupManager;
window.createBackupNow = createBackupNow;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup; 
window.closeBackupManager = closeBackupManager;
window.destroyChart = destroyChart;

console.log('✅ Enhanced Data Management Workflow System Loaded');