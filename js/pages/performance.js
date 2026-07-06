// =======================================================================
// PERFORMANCE PAGE - مع Chart.js + Advanced Filters
// =======================================================================

function renderPerformancePage() {
    document.getElementById('pageTitle').textContent = 'Performance Analysis';

    // إزالة أي عبارة loading قبل عرض الصفحة
    const mainContent = document.getElementById('mainContent');
    if (mainContent.textContent.includes('Performance page is loading')) {
        mainContent.textContent = '';
    }

    // إضافة كلاس الأنميشن عند فتح الصفحة
    mainContent.classList.add('animate-fade-in');
    // إزالة كلاس الأنميشن بعد انتهاء الأنميشن حتى لا يتكرر عند كل تحديث
    mainContent.addEventListener('animationend', function handler() {
        mainContent.classList.remove('animate-fade-in');
        mainContent.removeEventListener('animationend', handler);
    });

    mainContent.innerHTML = `
        <div class="page-animated flex w-full h-full">

            <!-- ==================== ACTIVE FILTERS SECTION ==================== -->
            <div class="page-animated w-96 bg-gradient-to-b from-white via-blue-50 to-white border-r-2 border-blue-300 flex flex-col h-[calc(100vh-5rem)] overflow-hidden shadow-xl">
                
                <!-- Active Filters Display - Enhanced -->
                <div class="p-5 bg-gradient-to-br from-blue-500 to-blue-600 border-b-3 border-blue-700 shadow-md">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <i class="fas fa-sliders-h text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-white tracking-wide">Active Filters</h3>
                            <p class="text-xs text-blue-100">Customize your analysis</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2" id="activeFiltersTags">
                        <span class="text-xs text-blue-100 italic">No filters applied</span>
                    </div>
                </div>

                <!-- Filter Sections (Scrollable) -->
                <div class="flex-1 overflow-y-auto">
                    
                    <!-- Date Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-white text-gray-800 cursor-pointer hover:bg-gray-50 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-calendar-alt text-blue-600 text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide text-gray-800">Date Range</span>
                                </div>
                                <i class="fas fa-chevron-down text-gray-600 text-sm"></i>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden">
                            <div class="space-y-3">
                                <div class="mb-4">
                                    <label class="block text-xs text-gray-600 font-semibold mb-3">Select Year</label>
                                    <div class="grid grid-cols-2 gap-2 mb-4">
                                        <button class="quick-date-btn py-2 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('2024', this)">2024</button>
                                        <button class="quick-date-btn py-2 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('2025', this)">2025</button>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <label class="block text-xs text-gray-600 font-semibold mb-3">Select Quarter</label>
                                    <div class="grid grid-cols-4 gap-2 mb-4">
                                        <button class="quick-date-btn py-2 px-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('q1', this)">Q1</button>
                                        <button class="quick-date-btn py-2 px-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('q2', this)">Q2</button>
                                        <button class="quick-date-btn py-2 px-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('q3', this)">Q3</button>
                                        <button class="quick-date-btn py-2 px-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-blue-50 hover:border-blue-400 transition-all"
                                                onclick="setQuickDateFilter('q4', this)">Q4</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-semibold mb-2">From Date</label>
                                    <input type="date" id="advDateFrom" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                           onchange="clearQuickDateSelection(); applyAdvancedFilters()">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-semibold mb-2">To Date</label>
                                    <input type="date" id="advDateTo" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                           onchange="clearQuickDateSelection(); applyAdvancedFilters()">
                                </div>
                            </div>
                        </div>
                    </div>

                        <!-- Admin Areas Filter - Tree Structure Modal Button -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-white text-gray-800 cursor-pointer hover:bg-gray-50 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-map-marker-alt text-blue-600 text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide text-gray-800">Admin Areas</span>
                                </div>
                                <button class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-all"
                                        onclick="openAdminAreaTree(event)">
                                    <i class="fas fa-sitemap"></i> Tree
                                </button>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden" id="advAdminAreaFilter">
                            <!-- Checkboxes will be shown here -->
                        </div>
                    </div>

                    <!-- Departments Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-white text-gray-800 cursor-pointer hover:bg-gray-50 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-building text-blue-600 text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide text-gray-800">Departments</span>
                                </div>
                                <i class="fas fa-chevron-down text-gray-600 text-sm"></i>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden" id="advDepartmentFilter">
                            <!-- Checkboxes will be generated here -->
                        </div>
                    </div>

                    <!-- Facilities Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-white text-gray-800 cursor-pointer hover:bg-gray-50 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-warehouse text-blue-600 text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide text-gray-800">Facilities</span>
                                </div>
                                <i class="fas fa-chevron-down text-gray-600 text-sm"></i>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden" id="advFacilityFilter">
                            <!-- Checkboxes will be generated here -->
                        </div>
                    </div>

                    <!-- Equipment Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-white text-gray-800 cursor-pointer hover:bg-gray-50 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-cogs text-blue-600 text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide text-gray-800">Equipment</span>
                                </div>
                                <i class="fas fa-chevron-down text-gray-600 text-sm"></i>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden" id="advEquipmentFilter">
                            <!-- Checkboxes will be generated here -->
                        </div>
                    </div>

                    <!-- Operators Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-header-advanced p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                             onclick="toggleFilterSection(this)">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-users text-white text-sm"></i>
                                    </div>
                                    <span class="font-bold text-sm tracking-wide">Operators</span>
                                </div>
                                <i class="fas fa-chevron-down transition-transform text-sm"></i>
                            </div>
                        </div>
                        <div class="filter-content-advanced p-4 hidden" id="advOperatorFilter">
                            <!-- Checkboxes will be generated here -->
                        </div>
                    </div>

                    <!-- Admin Areas Filter -->
                    <div class="border-b-2 border-gray-300">
                        <div class="filter-content-advanced p-4 hidden" id="advAdminAreaFilter">
                            <!-- Checkboxes will be generated here -->
                        </div>
                    </div>

                </div>

                <!-- Reset Button -->
                <div class="p-4 border-t-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100">
                    <button class="w-full py-3 px-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                            onclick="resetAllAdvancedFilters()">
                        <i class="fas fa-refresh"></i>
                        <div class="text-left">
                            <div class="text-sm font-bold">Reset Filters</div>
                            <div class="text-xs opacity-90">Clear all selections</div>
                        </div>
                    </button>
                </div>

            </div>

            <!-- ==================== MAIN CONTENT AREA ==================== -->
            <div class="page-animated flex-1 bg-gray-50 overflow-y-auto">
                <div class="page-animated p-6 space-y-6">

                    <!-- Chart Section -->
                    <div class="page-animated bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <!-- Chart Header -->
                        <div class="mb-4">
                            <!-- Chart Type Buttons (Energy / Production / Temperature) -->
                            <div class="flex items-center justify-between mb-3">
                                <!-- Title -->
                                <h3 id="chartTitle" class="text-xl font-extrabold text-slate-800 tracking-tight">
                                    Energy Performance
                                </h3>

                                <!-- Chart Type Selector -->
                                <div class="flex gap-2 bg-slate-100 p-2 rounded-xl shadow-inner">
                                    <button onclick="switchChartType('energy')" 
                                            id="btn-energy"
                                            class="chart-type-btn active px-3 py-1.5 text-xs font-semibold rounded-md 
                                                   transition-all duration-300
                                                   bg-white text-blue-600 shadow-md hover:shadow-lg">
                                        Energy
                                    </button>
                                    <button onclick="switchChartType('production')" 
                                            id="btn-production"
                                            class="chart-type-btn px-3 py-1.5 text-xs font-semibold rounded-md
                                                   transition-all duration-300
                                                   bg-white text-slate-600 hover:text-blue-600 hover:shadow-lg">
                                        Production
                                    </button>
                                    <button onclick="switchChartType('temperature')" 
                                            id="btn-temperature"
                                            class="chart-type-btn px-3 py-1.5 text-xs font-semibold rounded-md
                                                   transition-all duration-300
                                                   bg-white text-slate-600 hover:text-blue-600 hover:shadow-lg">
                                        Temperature
                                    </button>
                                </div>
                            </div>

                            <!-- Monthly / Quarterly Toggle -->
                            <div class="flex justify-end">
                                <div class="flex gap-2 bg-white rounded-lg p-1 border border-gray-300">
                                    <button onclick="switchTableView('quarterly')" 
                                            id="view-quarterly" 
                                            class="table-view-btn active px-3 py-1 text-[10px] font-semibold rounded-md transition-all">
                                        Quarterly
                                    </button>
                                    <button onclick="switchTableView('monthly')" 
                                            id="view-monthly" 
                                            class="table-view-btn px-3 py-1 text-[10px] font-semibold rounded-md transition-all">                   
                                        Monthly
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Chart Canvas -->
                        <div class="w-full" style="height: 500px;">
                            <canvas id="mainChart"></canvas>
                        </div>

                        <!-- Stats Cards -->
                        <div class="grid grid-cols-4 gap-4 mt-6" id="statsCards">
                            <!-- Stats will be generated here -->
                        </div>
                    </div>

                    <!-- Data Table -->
                    <div class="page-animated bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        
                        <!-- Table Header -->
                        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="text-base font-bold text-gray-800">Detailed Records</h3>
                                <!-- Right side -->
                                <div class="flex flex-col items-end gap-2">
                                    <button onclick="exportData()" 
                                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all">
                                        <i class="fas fa-download mr-2"></i>Export CSV
                                    </button>
                                    <button onclick="toggleYearEndMode()"
                                            class="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium hover:bg-slate-300 transition">
                                        Toggle YE Mode
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Table -->
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 border-b border-gray-200" id="tableHead">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Date</th>
                                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Department</th>
                                        <th class="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Stream</th>
                                        <th class="px-3 py-2 text-right text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Energy Actual</th>
                                        <th class="px-3 py-2 text-right text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Energy Target</th>
                                        <th class="px-3 py-2 text-right text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Production</th>
                                        <th class="px-3 py-2 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="dataTableBody" class="divide-y divide-gray-100">
                                    <!-- Table rows will be generated here -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div class="text-sm text-gray-600" id="paginationInfo">
                                Showing 1 to 15 of 100 records
                            </div>
                            <div class="flex gap-2">
                                <button onclick="prevPage()" id="prevBtn" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Previous
                                </button>
                                <button onclick="nextPage()" id="nextBtn" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>

        <!-- ==================== ADMIN AREAS TREE MODAL ==================== -->
        <div id="adminAreaTreeModal" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
                    
                    <!-- Modal Header -->
                    <div class="bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-5 
                                flex items-center justify-between rounded-t-2xl shadow-lg">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-white bg-opacity-25 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-sitemap text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-white">Organization Tree</h3>
                                <p class="text-sm text-blue-50 mt-0.5">Select Admin Areas and Departments</p>
                            </div>
                        </div>
                        <button onclick="closeAdminAreaTree()" class="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center justify-center transition-all group">
                            <i class="fas fa-times text-white text-xl group-hover:rotate-90 transition-transform duration-300"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-8 max-h-[75vh] overflow-y-auto">
                        <div id="adminAreaTreeContainer" class="org-tree-container">
                            <!-- Tree will be generated here -->
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
                        <button onclick="closeAdminAreaTree()" class="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all">
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </div>
        <div id="viewModal" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all">
                    
                    <!-- Modal Header -->
                    <div class="bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-5 
                                flex items-center justify-between rounded-t-2xl shadow-lg">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-white bg-opacity-25 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-chart-line text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-white" id="modalTitle">Stream</h3>
                                <p class="text-sm text-blue-50 mt-0.5" id="modalSubtitle">Department</p>
                            </div>
                        </div>
                        <button onclick="closeViewModal()" class="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl flex items-center justify-center transition-all group">
                            <i class="fas fa-times text-white text-xl group-hover:rotate-90 transition-transform duration-300"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-8 max-h-[75vh] overflow-y-auto">
                        <!-- Stream Chart -->
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                            <div class="flex items-center justify-center gap-3 mb-6">
                                <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-chart-area text-blue-600 text-lg"></i>
                                </div>
                                <h4 class="text-lg font-bold text-gray-800">Performance Trend Analysis</h4>
                            </div>
                            <div style="display: flex; justify-content: center; width: 100%; position: relative; height: 400px;">
                                <canvas id="modalChart" style="width: 90%;"></canvas>
                            </div>
                            <div class="my-5"></div>
                            <!-- Stream Info Cards -->
                            <div class="grid grid-cols-4 gap-4 mb-8" id="modalStats">
                                <!-- Stats cards -->
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // Add Styles
    const style = document.createElement('style');
    style.textContent = `
        .filter-header-advanced {
            user-select: none;
        }

        .filter-content-advanced {
            transition: all 0.3s ease;
        }

        .filter-content-advanced.hidden {
            display: none;
        }

        .filter-item-advanced {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 8px;
        }

        .filter-item-advanced input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #3b82f6;
        }

        .filter-item-advanced label {
            cursor: pointer;
            font-size: 13px;
            color: #374151;
            flex: 1;
            padding: 8px 10px;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .filter-item-advanced label:hover {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f7ff 100%);
            color: #0284c7;
            font-weight: 600;
            transform: translateX(4px);
        }

        .active-filter-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
            padding: 8px 14px;
            border-radius: 25px;
            font-size: 12px;
            font-weight: 600;
            color: #0c4a6e;
            border: 2px solid #0284c7;
            box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);
            backdrop-filter: blur(10px);
        }

        .active-filter-tag .remove-filter {
            cursor: pointer;
            color: #dc2626;
            font-weight: bold;
            transition: all 0.2s ease;
            font-size: 14px;
        }

        .active-filter-tag .remove-filter:hover {
            color: #991b1b;
            transform: scale(1.2);
        }

        .quick-date-btn {
            background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
            border: 2px solid #cbd5e0;
            color: #374151;
            font-weight: 600;
        }

        .quick-date-btn:hover {
            border-color: #0284c7;
            background: linear-gradient(135deg, #e0f7ff 0%, #f0f9ff 100%);
            color: #0284c7;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
        }

        .quick-date-btn.active {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
            color: white !important;
            border-color: #0284c7 !important;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4) !important;
        }

        .chart-type-btn {
            background: white;
            border: 1px solid #e5e7eb;
            color: #6b7280;
        }
        
        .chart-type-btn:hover {
            background: #f9fafb;
            border-color: #d1d5db;
        }
        
        .chart-type-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }

        tbody tr:hover {
            background-color: #f9fafb;
        }

        .overflow-y-auto::-webkit-scrollbar {
            width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .view-btn {
            padding: 6px 14px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .view-btn:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }

        .table-view-btn {
            background: transparent;
            color: #6b7280;
        }
        
        .table-view-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }
        
        .table-view-btn.active {
            background: #3b82f6;
            color: white;
        }
    `;
    document.head.appendChild(style);

    // Initialize
    setTimeout(() => {
        initializeAdvancedFilters();
        currentFilteredDataAdvanced = [...metricsData];
        currentPage = 1;
        currentChartType = 'energy';
        renderChart();
        renderTable();
    }, 50);
}


// =======================================================================
// GLOBAL VARIABLES
// =======================================================================

let currentFilteredDataAdvanced = [];
let advancedFilters = {
    dateFrom: null,
    dateTo: null,
    departments: [],
    facilities: [],
    equipment: [],
    operators: [],
    adminAreas: []
};

let currentChartType = 'energy';
let currentPage = 1;
let tableViewMode = 'quarterly';
let chartInstance = null;
let modalChartInstance = null;
const rowsPerPage = 15;
let collapseOldYears = false;


// =======================================================================
// INITIALIZE ADVANCED FILTERS
// =======================================================================

function initializeAdvancedFilters() {
    populateAdvancedFilterOptions();
    updateActiveFiltersTags();
}

function populateAdvancedFilterOptions() {
    // Start with all data
    let availableData = metricsData;

    // If admin areas are filtered, limit data
    if (advancedFilters.adminAreas.length > 0) {
        availableData = availableData.filter(d => advancedFilters.adminAreas.includes(d.AdminArea));
    }

    // If departments are filtered, limit data
    if (advancedFilters.departments.length > 0) {
        availableData = availableData.filter(d => advancedFilters.departments.includes(d.Department));
    }

    // If facilities are filtered, limit data
    if (advancedFilters.facilities.length > 0) {
        availableData = availableData.filter(d => advancedFilters.facilities.includes(d.Facility_Name));
    }

    // If equipment are filtered, limit data
    if (advancedFilters.equipment.length > 0) {
        availableData = availableData.filter(d => advancedFilters.equipment.includes(d.Equipment_ID));
    }

    // Get available options from filtered data
    const departments = [...new Set(availableData.map(d => d.Department).filter(Boolean))].sort();
    const facilities = [...new Set(availableData.map(d => d.Facility_Name).filter(Boolean))].sort();
    const equipment = [...new Set(availableData.map(d => d.Equipment_ID).filter(Boolean))].sort();
    const operators = [...new Set(availableData.map(d => d.Operator_Name).filter(Boolean))].sort();
    const adminAreas = [...new Set(metricsData.map(d => d.AdminArea).filter(Boolean))].sort();

    // Show simple checkboxes for admin areas
    populateCheckboxFilterAdvanced('advAdminAreaFilter', adminAreas, 'adminAreas');

    populateCheckboxFilterAdvanced('advDepartmentFilter', departments, 'departments');
    populateCheckboxFilterAdvanced('advFacilityFilter', facilities, 'facilities');
    populateCheckboxFilterAdvanced('advEquipmentFilter', equipment, 'equipment');
    populateCheckboxFilterAdvanced('advOperatorFilter', operators, 'operators');
}

function openAdminAreaTree(event) {
    event.stopPropagation();
    
    const adminAreas = [...new Set(metricsData.map(d => d.AdminArea).filter(Boolean))].sort();
    buildAdminAreasTree(adminAreas);
    
    document.getElementById('adminAreaTreeModal').classList.remove('hidden');
}

function closeAdminAreaTree() {
    document.getElementById('adminAreaTreeModal').classList.add('hidden');
}

function buildAdminAreasTree(adminAreas) {
    const container = document.getElementById('adminAreaTreeContainer');
    if (!container) return;
    
    let html = '<div class="org-tree">';

    adminAreas.forEach(adminArea => {
        const areaId = `area-${adminArea.replace(/\s+/g, '-').replace(/–/g, '-')}`;
        const isSelected = advancedFilters.adminAreas.includes(adminArea);
        
        // Get departments for this admin area
        const deptInArea = [...new Set(metricsData
            .filter(r => r.AdminArea === adminArea)
            .map(r => r.Department)
            .filter(Boolean))].sort();

        html += `
            <div class="org-children">
                <div class="org-item ${isSelected ? 'selected' : ''}" onclick="toggleAdminAreaSelection('${adminArea.replace(/'/g, "\\'")}', event)">
                    <i class="fas fa-chevron-right org-expand-icon" id="${areaId}-icon"></i>
                    <span class="icon"><i class="fas fa-map-marker-alt"></i></span>
                    <span class="font-semibold">${adminArea}</span>
                </div>
                <div id="${areaId}" class="org-children" style="display: none;">
        `;

        // Add departments under this admin area
        deptInArea.forEach(dept => {
            const isFacilitySelected = advancedFilters.departments.includes(dept);
            
            html += `
                <div class="org-item ${isFacilitySelected ? 'selected' : ''}" onclick="toggleDepartmentSelection('${dept.replace(/'/g, "\\'")}', event)">
                    <span class="icon"><i class="fas fa-building"></i></span>
                    <span>${dept.replace(/^Upstream – |^Midstream – |^Downstream – /, '')}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function toggleAdminAreaSelection(adminArea, event) {
    event.stopPropagation();
    
    const areaId = `area-${adminArea.replace(/\s+/g, '-').replace(/–/g, '-')}`;
    const element = document.getElementById(areaId);
    const icon = document.getElementById(areaId + '-icon');
    
    if (element && element.style.display === 'none') {
        element.style.display = 'block';
        if (icon) icon.classList.add('expanded');
    } else if (element) {
        element.style.display = 'none';
        if (icon) icon.classList.remove('expanded');
    }

    // Toggle filter
    const isChecked = !advancedFilters.adminAreas.includes(adminArea);
    updateAdvancedFilter('adminAreas', adminArea, isChecked);
}

function toggleDepartmentSelection(dept, event) {
    event.stopPropagation();
    
    const isChecked = !advancedFilters.departments.includes(dept);
    updateAdvancedFilter('departments', dept, isChecked);
}

function populateCheckboxFilterAdvanced(elementId, items, filterType) {
    const container = document.getElementById(elementId);
    
    // Keep previously selected items checked
    const currentSelected = advancedFilters[filterType] || [];
    
    const html = items.map(item => {
        const isChecked = currentSelected.includes(item);
        return `
        <div class="filter-item-advanced">
            <input type="checkbox" id="adv-${filterType}-${item}" value="${item}" ${isChecked ? 'checked' : ''}
                   onchange="updateAdvancedFilter('${filterType}', '${item}', this.checked)">
            <label for="adv-${filterType}-${item}">${item}</label>
        </div>
    `;
    }).join('');
    container.innerHTML = html;
}


// =======================================================================
// TOGGLE FILTER SECTIONS
// =======================================================================

function toggleFilterSection(header) {
    const content = header.nextElementSibling;
    header.classList.toggle('expanded');
    content.classList.toggle('hidden');
}


// =======================================================================
// UPDATE FILTERS
// =======================================================================

function updateAdvancedFilter(filterType, value, isChecked) {
    if (isChecked) {
        if (!advancedFilters[filterType].includes(value)) {
            advancedFilters[filterType].push(value);
        }
    } else {
        advancedFilters[filterType] = advancedFilters[filterType].filter(v => v !== value);
    }
    
    // Refresh filter options to show only available items
    populateAdvancedFilterOptions();
    applyAdvancedFilters();
}

let selectedYear = null;
let selectedQuarter = null;

function clearQuickDateSelection() {
    document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('active'));
    selectedYear = null;
    selectedQuarter = null;
}

function setQuickDateFilter(period, button) {
    const dateFromInput = document.getElementById('advDateFrom');
    const dateToInput = document.getElementById('advDateTo');

    // Handle year selection
    if (period === '2024' || period === '2025') {
        selectedYear = period;
        selectedQuarter = null; // Reset quarter when selecting year
        
        // Update year button styling
        document.querySelectorAll('.quick-date-btn').forEach(btn => {
            if (btn.textContent === period) {
                btn.classList.add('active');
            } else if (btn.textContent === '2024' || btn.textContent === '2025') {
                btn.classList.remove('active');
            }
            // Remove active from quarter buttons
            if (btn.textContent.match(/^Q[1-4]$/)) {
                btn.classList.remove('active');
            }
        });

        // Show entire year
        tableViewMode = 'quarterly';
        document.querySelectorAll('.table-view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('view-quarterly').classList.add('active');

        dateFromInput.value = `${selectedYear}-01-01`;
        dateToInput.value = `${selectedYear}-12-31`;
        applyAdvancedFilters();
        return;
    }

    // Handle quarter selection
    if (period === 'q1' || period === 'q2' || period === 'q3' || period === 'q4') {
        selectedQuarter = period;

        // If no year selected, default to 2024
        if (!selectedYear) {
            selectedYear = '2024';
            document.querySelectorAll('.quick-date-btn').forEach(btn => {
                if (btn.textContent === '2024') {
                    btn.classList.add('active');
                }
            });
        }

        // Update quarter button styling
        const quarterLabel = `Q${period.slice(1).toUpperCase()}`;
        document.querySelectorAll('.quick-date-btn').forEach(btn => {
            if (btn.textContent.match(/^Q[1-4]$/)) {
                if (btn.textContent === quarterLabel) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        applyYearAndQuarter(selectedYear, selectedQuarter);
    }
}

function applyYearAndQuarter(year, quarter) {
    tableViewMode = 'monthly';
    document.querySelectorAll('.table-view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('view-monthly').classList.add('active');

    const quarterNum = parseInt(quarter.slice(1));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = startMonth + 2;

    document.getElementById('advDateFrom').value = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(year, endMonth, 0).getDate();
    document.getElementById('advDateTo').value = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;

    applyAdvancedFilters();
}


// =======================================================================
// APPLY ALL FILTERS
// =======================================================================

function applyAdvancedFilters() {
    const dateFrom = document.getElementById('advDateFrom').value;
    const dateTo = document.getElementById('advDateTo').value;

    advancedFilters.dateFrom = dateFrom;
    advancedFilters.dateTo = dateTo;

    currentFilteredDataAdvanced = metricsData.filter(record => {
        const recordDate = new Date(record.Date);
        const fromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const toDate = dateTo ? new Date(dateTo) : new Date('2999-12-31');

        const dateMatch = recordDate >= fromDate && recordDate <= toDate;
        
        // If departments selected, only show records from those departments
        const deptMatch = advancedFilters.departments.length === 0 || advancedFilters.departments.includes(record.Department);
        
        // If facilities selected, only show records from those facilities
        const facilityMatch = advancedFilters.facilities.length === 0 || advancedFilters.facilities.includes(record.Facility_Name);
        
        // If equipment selected, only show records from that equipment
        const equipMatch = advancedFilters.equipment.length === 0 || advancedFilters.equipment.includes(record.Equipment_ID);
        
        // If operators selected, only show records from those operators
        const operMatch = advancedFilters.operators.length === 0 || advancedFilters.operators.includes(record.Operator_Name);
        
        // If admin areas selected, only show records from those admin areas
        const adminMatch = advancedFilters.adminAreas.length === 0 || advancedFilters.adminAreas.includes(record.AdminArea);

        return dateMatch && deptMatch && facilityMatch && equipMatch && operMatch && adminMatch;
    });

    currentPage = 1;
    updateActiveFiltersTags();
    renderChart();
    renderTable();
}


// =======================================================================
// UPDATE ACTIVE FILTERS DISPLAY
// =======================================================================

function updateActiveFiltersTags() {
    const tags = [];

    if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        const from = advancedFilters.dateFrom || 'Start';
        const to = advancedFilters.dateTo || 'End';
        tags.push(`<div class="active-filter-tag"> ${from} to ${to} <span class="remove-filter" onclick="clearDateFilterAdvanced()">✕</span></div>`);
    }

    advancedFilters.departments.forEach(dept => {
        tags.push(`<div class="active-filter-tag"> ${dept} <span class="remove-filter" onclick="removeAdvancedFilter('departments', '${dept}')">✕</span></div>`);
    });

    advancedFilters.facilities.forEach(fac => {
        tags.push(`<div class="active-filter-tag"> ${fac} <span class="remove-filter" onclick="removeAdvancedFilter('facilities', '${fac}')">✕</span></div>`);
    });

    advancedFilters.equipment.forEach(eq => {
        tags.push(`<div class="active-filter-tag"> ${eq} <span class="remove-filter" onclick="removeAdvancedFilter('equipment', '${eq}')">✕</span></div>`);
    });

    advancedFilters.operators.forEach(op => {
        tags.push(`<div class="active-filter-tag"> ${op} <span class="remove-filter" onclick="removeAdvancedFilter('operators', '${op}')">✕</span></div>`);
    });

    advancedFilters.adminAreas.forEach(area => {
        tags.push(`<div class="active-filter-tag">${area} <span class="remove-filter" onclick="removeAdvancedFilter('adminAreas', '${area}')">✕</span></div>`);
    });

    const container = document.getElementById('activeFiltersTags');
    container.innerHTML = tags.length > 0 ? tags.join('') : '<span class="text-xs text-gray-200">No filters applied</span>';
}


// =======================================================================
// REMOVE FILTER
// =======================================================================

function removeAdvancedFilter(filterType, value) {
    advancedFilters[filterType] = advancedFilters[filterType].filter(v => v !== value);
    
    // Refresh filter options to show available items
    populateAdvancedFilterOptions();
    applyAdvancedFilters();
}

function clearDateFilterAdvanced() {
    document.getElementById('advDateFrom').value = '';
    document.getElementById('advDateTo').value = '';
    document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('active'));
    applyAdvancedFilters();
}


// =======================================================================
// RESET ALL FILTERS
// =======================================================================

function resetAllAdvancedFilters() {
    advancedFilters = {
        dateFrom: null,
        dateTo: null,
        departments: [],
        facilities: [],
        equipment: [],
        operators: [],
        adminAreas: []
    };

    document.getElementById('advDateFrom').value = '';
    document.getElementById('advDateTo').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.quick-date-btn').forEach(btn => btn.classList.remove('active'));

    // Refresh all filter options
    populateAdvancedFilterOptions();
    
    currentFilteredDataAdvanced = [...metricsData];
    currentPage = 1;
    updateActiveFiltersTags();
    renderChart();
    renderTable();
}


// =======================================================================
// UTILITY FUNCTIONS
// =======================================================================

function getMonthKey(dateString) {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getQuarterKey(dateString) {
    const date = new Date(dateString);
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
}


// =======================================================================
// CHART FUNCTIONS
// =======================================================================

function switchChartType(type) {
    currentChartType = type;
    
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${type}`).classList.add('active');
    
    const titles = {
        'energy': 'Energy Performance',
        'production': 'Production Performance',
        'temperature': 'Temperature Analysis'
    };
    document.getElementById('chartTitle').textContent = titles[type] || 'Performance';
    
    renderChart();
    renderTable();
}

function switchTableView(mode) {
    tableViewMode = mode;
    
    document.querySelectorAll('.table-view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`view-${mode}`).classList.add('active');
    currentPage = 1;
    renderChart();
    renderTable();
}

function renderChart() {
    const periodData = {};
    const periodType = tableViewMode === 'monthly' ? 'month' : 'quarter';
    
    currentFilteredDataAdvanced.forEach(record => {
        const key = periodType === 'month' ? getMonthKey(record.Date) : getQuarterKey(record.Date);
        
        if (!periodData[key]) {
            periodData[key] = {
                energyActual: 0,
                energyTarget: 0,
                production: 0,
                productionTarget: 0,
                temperature: [],
                count: 0
            };
        }
        
        periodData[key].energyActual += parseFloat(record.Energy_Actual) || 0;
        periodData[key].energyTarget += parseFloat(record.Energy_Target) || 0;
        periodData[key].production += parseFloat(record.Production_Actual) || 0;
        periodData[key].productionTarget += parseFloat(record.Production_Target) || 0;
        periodData[key].temperature.push(parseFloat(record.Temperature_C) || 0);
        periodData[key].count++;
    });
    
    const sortedPeriods = Object.keys(periodData).sort((a, b) => {
        if (periodType === 'month') {
            const monthOrder = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
            const [monthA, yearA] = a.split(" ");
            const [monthB, yearB] = b.split(" ");
            if (parseInt(yearA) !== parseInt(yearB)) {
                return parseInt(yearA) - parseInt(yearB);
            }
            return monthOrder[monthA] - monthOrder[monthB];
        } else {
            const [qa, ya] = a.split(" ");
            const [qb, yb] = b.split(" ");
            const quarterA = parseInt(qa.replace("Q", ""));
            const quarterB = parseInt(qb.replace("Q", ""));
            if (parseInt(ya) !== parseInt(yb)) {
                return parseInt(ya) - parseInt(yb);
            }
            return quarterA - quarterB;
        }
    });
    
    let datasets = [];
    let stats = [];
    
    const ctx = document.getElementById('mainChart');
    
    if (!ctx) return;
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    if (currentChartType === 'energy') {
        const actualData = sortedPeriods.map(p => periodData[p].energyActual);
        const targetData = sortedPeriods.map(p => periodData[p].energyTarget);
        
        datasets = [
            {
                label: 'Actual Energy (kWh)',
                data: actualData,
                borderWidth: 1,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return '#106ab9ff';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(16, 75, 185, 0.4)');
                    gradient.addColorStop(1, 'rgba(16, 55, 185, 1)');
                    return gradient;
                },
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16,185,129,0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(16, 72, 185, 0.15)');
                    gradient.addColorStop(1, 'rgba(16, 89, 185, 0.05)');
                    return gradient;
                }
            },
            {
                label: 'Target Energy (kWh)',
                data: targetData,
                borderColor: '#d3792b50',
                backgroundColor: 'rgba(59, 131, 246, 0)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointBackgroundColor: '#f68f3bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }
        ];
        
        const totalActual = actualData.reduce((a, b) => a + b, 0);
        const totalTarget = targetData.reduce((a, b) => a + b, 0);
        const variance = totalActual - totalTarget;
        const performance = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;
        
        stats = [
            { label: 'Total Actual', value: totalActual.toLocaleString() + ' kWh', color: 'red' },
            { label: 'Total Target', value: totalTarget.toLocaleString() + ' kWh', color: 'blue' },
            { label: 'Variance', value: variance.toLocaleString() + ' kWh', color: variance > 0 ? 'red' : 'green' },
            { label: 'Performance', value: performance + '%', color: performance >= 100 ? 'red' : 'green' }
        ];
    } else if (currentChartType === 'production') {
        const productionData = sortedPeriods.map(p => periodData[p].production);
        const productionTarget = sortedPeriods.map(p => periodData[p].productionTarget);
        
        datasets = [
            {
                label: 'Actual Production (bbl/day)',
                data: productionData,
                borderWidth: 1,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return '#10b981';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(16,185,129,0.4)');
                    gradient.addColorStop(1, 'rgba(16,185,129,1)');
                    return gradient;
                },
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16,185,129,0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(16,185,129,0.15)');
                    gradient.addColorStop(1, 'rgba(16,185,129,0.05)');
                    return gradient;
                }
            },
            {
                label: 'Target (bbl/day)',
                data: productionTarget,
                borderColor: '#d3792b50',
                backgroundColor: 'rgba(59, 130, 246, 0)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointBackgroundColor: '#f68f3bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }
        ];
        
        const total = productionData.reduce((a, b) => a + b, 0);
        const totalTarget = productionTarget.reduce((a, b) => a + b, 0);
        const avg = total / productionData.length;
        const variance = total - totalTarget;
        
        stats = [
            { label: 'Total Production', value: total.toLocaleString() + ' bbl', gradient: 'from-green-400 via-cyan-300 to-blue-400' },
            { label: 'Total Target', value: totalTarget.toLocaleString() + ' bbl', gradient: 'from-green-400 via-cyan-300 to-blue-400' },
            { label: 'Average', value: avg.toFixed(0).toLocaleString() + ' bbl/day', gradient: 'from-green-400 via-cyan-300 to-blue-400' },
            { label: 'Variance', value: variance.toLocaleString() + ' bbl', gradient: 'from-green-400 via-cyan-300 to-blue-400' }
        ];
    } else if (currentChartType === 'temperature') {
        const tempData = sortedPeriods.map(p => {
            const temps = periodData[p].temperature;
            return temps.reduce((a, b) => a + b, 0) / temps.length;
        });
        
        datasets = [
            {
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 109, 11, 0.1)',
                borderWidth: 1,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return '#b95c10ff';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(185, 64, 16, 0.4)');
                    gradient.addColorStop(1, 'rgba(185, 83, 16, 1)');
                    return gradient;
                },
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16,185,129,0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(172, 11, 11, 0.84)');
                    gradient.addColorStop(1, 'rgba(185, 134, 16, 0.05)');
                    return gradient;
                }
            }
        ];
        
        const avg = tempData.reduce((a, b) => a + b, 0) / tempData.length;
        const max = Math.max(...tempData);
        const min = Math.min(...tempData);
        
        stats = [
            { label: 'Average Temp', value: avg.toFixed(1) + '°C', color: 'orange' },
            { label: 'Maximum', value: max.toFixed(1) + '°C', color: 'red' },
            { label: 'Minimum', value: min.toFixed(1) + '°C', color: 'blue' },
            { label: 'Range', value: (max - min).toFixed(1) + '°C', color: 'purple' }
        ];
    }
    
    const canvasCtx = ctx.getContext('2d');
    
    chartInstance = new Chart(canvasCtx, {
        type: 'line',
        data: {
            labels: sortedPeriods,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12, weight: '600' },
                        padding: 15,
                        color: '#475569',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(51, 65, 85, 0.95)',
                    padding: 12,
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 11 },
                    borderColor: '#94a3b8',
                    borderWidth: 1,
                    borderRadius: 6,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#e2e8f0',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: '#e2e8f0',
                        drawBorder: true
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    renderStats(stats);
}

function renderStats(stats) {
    const container = document.getElementById("statsCards");
    container.innerHTML = "";

    stats.forEach(stat => {
        let numberPart = stat.value;
        let unitPart = "";

        if (stat.value.includes(" ")) {
            const idx = stat.value.indexOf(" ");
            numberPart = stat.value.substring(0, idx);
            unitPart = stat.value.substring(idx + 1);
        }

        container.innerHTML += `
            <div class="relative p-6 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                 style="background: linear-gradient(white, white) padding-box, linear-gradient(to right, #22c55e, #0ea5e9) border-box; border: 2px solid transparent; border-radius: 12px;">
                <div class="absolute right-4 top-6 text-slate-400 opacity-[0.08] text-8xl pointer-events-none">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    ${stat.label}
                </div>
                <div class="text-2xl font-bold text-slate-800 leading-tight">
                    ${numberPart}
                </div>
                <div class="text-sm font-medium text-slate-500 mb-2 -mt-1">
                    ${unitPart}
                </div>
                <div class="w-full h-2 rounded-full bg-slate-200 mt-3 overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500" style="width: 100%;"></div>
                </div>
            </div>
        `;
    });
}


// =======================================================================
// TABLE FUNCTIONS
// =======================================================================

function toggleYearEndMode() {
    collapseOldYears = !collapseOldYears;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('dataTableBody');
    const tableHead = document.getElementById('tableHead');

    if (currentFilteredDataAdvanced.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="50" class="px-4 py-8 text-center text-gray-500 text-sm">
                    No data found
                </td>
            </tr>`;
        return;
    }

    const streamData = {};

    currentFilteredDataAdvanced.forEach(record => {
        const stream = record.Stream || 'Unknown';
        const qKey = getQuarterKey(record.Date);
        const [quarter, year] = qKey.split(" ");

        if (!streamData[stream]) {
            streamData[stream] = {
                department: record.Department,
                periods: {}
            };
        }

        if (!streamData[stream].periods[year]) {
            streamData[stream].periods[year] = {};
        }

        if (!streamData[stream].periods[year][qKey]) {
            streamData[stream].periods[year][qKey] = {
                EA: 0, ET: 0, PA: 0, PT: 0, T: 0, TC: 0
            };
        }

        const p = streamData[stream].periods[year][qKey];
        p.EA += parseFloat(record.Energy_Actual) || 0;
        p.ET += parseFloat(record.Energy_Target) || 0;
        p.PA += parseFloat(record.Production_Actual) || 0;
        p.PT += parseFloat(record.Production_Target) || 0;
        p.T += parseFloat(record.Temperature_C) || 0;
        p.TC += 1;
    });

    const years = {};
    currentFilteredDataAdvanced.forEach(record => {
        const qKey = getQuarterKey(record.Date);
        const [q, y] = qKey.split(" ");
        if (!years[y]) years[y] = [];
        if (!years[y].includes(qKey)) years[y].push(qKey);
    });

    Object.keys(years).forEach(y => years[y].sort());
    const latestYear = Math.max(...Object.keys(years).map(Number)).toString();
    let colCount = (currentChartType === 'temperature') ? 1 : 2;

    let headerHTML = `
        <tr class="bg-slate-800 text-white">
            <th rowspan="2" class="px-4 py-3 text-left text-xs font-bold uppercase sticky left-0 bg-slate-800 z-20">Stream</th>
            <th rowspan="2" class="px-4 py-3 text-left text-xs font-bold uppercase">Department</th>
    `;

    Object.keys(years).forEach(year => {
        const isLatest = (year === latestYear);
        const isCollapsed = collapseOldYears && !isLatest;
        const qCount = years[year].length;
        const span = isCollapsed ? colCount : qCount * colCount;

        headerHTML += `<th colspan="${span}" class="px-4 py-3 text-center text-xs font-bold uppercase bg-blue-700 border-l border-white">
            ${isCollapsed ? `YE ${year}` : year}
        </th>`;
    });

    headerHTML += `<th rowspan="2" class="px-4 py-3 text-center text-xs font-bold uppercase sticky right-0 bg-slate-800 z-20">Actions</th></tr>`;
    headerHTML += `<tr class="bg-slate-700 text-white opacity-95">`;

    Object.keys(years).forEach(year => {
        const isLatest = (year === latestYear);
        const isCollapsed = collapseOldYears && !isLatest;

        if (isCollapsed) {
            if (currentChartType === 'energy') {
                headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Energy</th><th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Target</th>`;
            } else if (currentChartType === 'production') {
                headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Production</th><th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Target</th>`;
            } else if (currentChartType === 'temperature') {
                headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Avg Temp</th>`;
            }
        } else {
            years[year].forEach(qKey => {
                if (currentChartType === 'energy') {
                    headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">${qKey}</th><th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Target</th>`;
                } else if (currentChartType === 'production') {
                    headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">${qKey}</th><th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">Target</th>`;
                } else if (currentChartType === 'temperature') {
                    headerHTML += `<th class="px-2 py-2 text-center text-xs font-semibold border-l border-white">${qKey}</th>`;
                }
            });
        }
    });

    headerHTML += `</tr>`;
    tableHead.innerHTML = headerHTML;

    const streams = Object.keys(streamData).sort();
    let rows = "";

    streams.forEach(stream => {
        const d = streamData[stream];
        const deptName = d.department.replace(/^Upstream – |^Midstream – |^Downstream – /, '');

        rows += `<tr class="border-b bg-white hover:bg-blue-50">
            <td class="px-4 py-3 text-xs font-bold sticky left-0 bg-white z-10">${stream}</td>
            <td class="px-4 py-3 text-xs text-gray-700">${deptName}</td>`;

        Object.keys(years).forEach(year => {
            const isLatest = (year === latestYear);
            const isCollapsed = collapseOldYears && !isLatest;

            if (isCollapsed) {
                const qs = years[year];
                let agg = { EA: 0, ET: 0, PA: 0, PT: 0, T: 0, TC: 0 };
                qs.forEach(qKey => {
                    const p = d.periods[year]?.[qKey];
                    if (!p) return;
                    agg.EA += p.EA; agg.ET += p.ET; agg.PA += p.PA; agg.PT += p.PT; agg.T += p.T; agg.TC += p.TC;
                });

                if (currentChartType === 'energy') {
                    rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${agg.EA.toLocaleString()}</td><td class="px-2 py-3 text-right text-xs font-semibold">${agg.ET.toLocaleString()}</td>`;
                } else if (currentChartType === 'production') {
                    rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${agg.PA.toLocaleString()}</td><td class="px-2 py-3 text-right text-xs font-semibold">${agg.PT.toLocaleString()}</td>`;
                } else if (currentChartType === 'temperature') {
                    const avg = agg.TC ? (agg.T / agg.TC).toFixed(1) : "N/A";
                    rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${avg}°C</td>`;
                }
            } else {
                years[year].forEach(qKey => {
                    const p = d.periods[year]?.[qKey];
                    if (!p) {
                        rows += `<td colspan="${colCount}" class="px-2 py-3 text-center text-xs text-gray-400">–</td>`;
                        return;
                    }

                    if (currentChartType === 'energy') {
                        rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${p.EA.toLocaleString()}</td><td class="px-2 py-3 text-right text-xs font-semibold">${p.ET.toLocaleString()}</td>`;
                    } else if (currentChartType === 'production') {
                        rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${p.PA.toLocaleString()}</td><td class="px-2 py-3 text-right text-xs font-semibold">${p.PT.toLocaleString()}</td>`;
                    } else if (currentChartType === 'temperature') {
                        const avg = p.TC ? (p.T / p.TC).toFixed(1) : "N/A";
                        rows += `<td class="px-2 py-3 text-right text-xs font-semibold">${avg}°C</td>`;
                    }
                });
            }
        });

        rows += `<td class="px-4 py-3 text-center sticky right-0 bg-white z-10">
            <button class="px-3 py-1.5 bg-blue-600 text-white rounded-md shadow" onclick="openViewModal('${stream}', '${d.department}')">View</button>
        </td></tr>`;
    });

    tbody.innerHTML = rows;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(currentFilteredDataAdvanced.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}


// =======================================================================
// VIEW MODAL
// =======================================================================

function openViewModal(stream, department) {
    const streamData = metricsData.filter(d => d.Stream === stream && d.Department === department);
    if (streamData.length === 0) {
        alert('No data available for this stream');
        return;
    }

    document.getElementById('modalTitle').textContent = stream;
    document.getElementById('modalSubtitle').textContent = department.replace(/^Upstream – |^Midstream – |^Downstream – /, '');

    let stats = [];

    if (currentChartType === 'energy') {
        const totalEnergyActual = streamData.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0);
        const totalEnergyTarget = streamData.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0);
        const variance = totalEnergyActual - totalEnergyTarget;
        const performance = totalEnergyTarget > 0 ? ((totalEnergyActual / totalEnergyTarget) * 100).toFixed(1) : 0;
        
        stats = [
            { label: 'Total Actual', value: totalEnergyActual.toLocaleString() + ' kWh', color: 'blue' },
            { label: 'Total Target', value: totalEnergyTarget.toLocaleString() + ' kWh', color: 'green' },
            { label: 'Variance', value: variance.toLocaleString() + ' kWh', color: variance > 0 ? 'red' : 'green' },
            { label: 'Performance', value: performance + '%', color: performance >= 100 ? 'red' : 'green' }
        ];
    } else if (currentChartType === 'production') {
        const totalProdActual = streamData.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0);
        const totalProdTarget = streamData.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0);
        const variance = totalProdActual - totalProdTarget;
        const performance = totalProdTarget > 0 ? ((totalProdActual / totalProdTarget) * 100).toFixed(1) : 0;
        
        stats = [
            { label: 'Total Actual', value: totalProdActual.toLocaleString() + ' bbl', color: 'blue' },
            { label: 'Total Target', value: totalProdTarget.toLocaleString() + ' bbl', color: 'green' },
            { label: 'Variance', value: variance.toLocaleString() + ' bbl', color: variance >= 0 ? 'green' : 'red' },
            { label: 'Performance', value: performance + '%', color: performance >= 100 ? 'green' : 'red' }
        ];
    } else if (currentChartType === 'temperature') {
        const avgTemp = streamData.reduce((sum, d) => sum + (parseFloat(d.Temperature_C) || 0), 0) / streamData.length;
        const maxTemp = Math.max(...streamData.map(d => parseFloat(d.Temperature_C) || 0));
        const minTemp = Math.min(...streamData.map(d => parseFloat(d.Temperature_C) || 0));
        const totalDowntime = streamData.reduce((sum, d) => sum + (parseFloat(d.Downtime_Min) || 0), 0);
        
        stats = [
            { label: 'Average Temp', value: avgTemp.toFixed(1) + '°C', color: 'orange' },
            { label: 'Maximum', value: maxTemp.toFixed(1) + '°C', color: 'red' },
            { label: 'Minimum', value: minTemp.toFixed(1) + '°C', color: 'blue' },
            { label: 'Total Downtime', value: totalDowntime.toLocaleString() + ' min', color: 'purple' }
        ];
    }

    document.getElementById('modalStats').innerHTML = stats.map(stat => `
        <div class="relative p-4 rounded-xl bg-white shadow-[0_3px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.10)] border-[2px] border-transparent transition-all duration-300"
             style="border-image: linear-gradient(to right, #22c55e, #0ea5e9) 1;">
            <div class="absolute right-3 top-2 text-slate-300 opacity-[0.10] text-4xl pointer-events-none">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="text-xs font-semibold text-slate-600 tracking-wide mb-1">${stat.label}</div>
            <div class="text-xl font-bold text-slate-900 leading-tight">${stat.value}</div>
        </div>
    `).join('');

    const sortedData = streamData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const dates = sortedData.map(d => d.Date);
    const modalCtx = document.getElementById('modalChart');

    if (!modalCtx) return;
    if (modalChartInstance) modalChartInstance.destroy();

    let modalDatasets = [];

    if (currentChartType === 'energy') {
        const energyActual = sortedData.map(d => parseFloat(d.Energy_Actual) || 0);
        const energyTarget = sortedData.map(d => parseFloat(d.Energy_Target) || 0);
        
        modalDatasets = [
            {
                label: 'Actual Energy (kWh)',
                data: energyActual,
                borderWidth: 1,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return '#106ab9ff';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(16, 75, 185, 0.4)');
                    gradient.addColorStop(1, 'rgba(16, 55, 185, 1)');
                    return gradient;
                },
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(16,185,129,0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(16, 72, 185, 0.15)');
                    gradient.addColorStop(1, 'rgba(16, 89, 185, 0.05)');
                    return gradient;
                }
            },
            {
                label: 'Target Energy (kWh)',
                data: energyTarget,
                borderColor: '#d3792b50',
                backgroundColor: 'rgba(59, 131, 246, 0)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointBackgroundColor: '#f68f3bff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }
        ];
    } else if (currentChartType === 'production') {
        const prodActual = sortedData.map(d => parseFloat(d.Production_Actual) || 0);
        const prodTarget = sortedData.map(d => parseFloat(d.Production_Target) || 0);
        
        modalDatasets = [
            {
                label: 'Actual Production (bbl)',
                data: prodActual,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                pointRadius: 0,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            },
            {
                label: 'Target Production (bbl)',
                data: prodTarget,
                borderColor: '#f6c13b50',
                backgroundColor: 'rgba(246, 174, 59, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                pointBackgroundColor: '#f6ca3bff',
                pointBorderColor: '#f79a36ff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }
        ];
    } else if (currentChartType === 'temperature') {
        const temperature = sortedData.map(d => parseFloat(d.Temperature_C) || 0);
        
        modalDatasets = [
            {
                label: 'Temperature (°C)',
                data: temperature,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                pointRadius: 0,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }
        ];
    }

    const canvasCtx = modalCtx.getContext('2d');

    modalChartInstance = new Chart(canvasCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: modalDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        font: { size: 13, weight: '600' },
                        padding: 20,
                        color: '#1e293b',
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.92)',
                    borderColor: '#334155',
                    borderWidth: 1,
                    titleFont: { size: 13, weight: '700' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                x: {
                    border: { color: '#cbd5e1', width: 2 },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.45)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#475569',
                        font: { size: 12, weight: '500' },
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    border: { color: '#cbd5e1', width: 2 },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.45)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#475569',
                        font: { size: 12, weight: '500' },
                        callback: (value) => value.toLocaleString()
                    }
                }
            },
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            }
        }
    });

    document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.add('hidden');
}


// =======================================================================
// EXPORT FUNCTION
// =======================================================================

function exportData() {
    let headers = [];
    
    if (currentChartType === 'energy') {
        headers = ['Date', 'Department', 'Stream', 'Energy_Actual', 'Energy_Target', 'Variance', 'Admin_Area'];
    } else if (currentChartType === 'production') {
        headers = ['Date', 'Department', 'Stream', 'Production_Actual', 'Production_Target', 'Efficiency', 'Admin_Area'];
    } else if (currentChartType === 'temperature') {
        headers = ['Date', 'Department', 'Stream', 'Temperature_C', 'Downtime_Min', 'Admin_Area'];
    }
    
    const csvData = currentFilteredDataAdvanced.map(r => {
        let row = [];
        
        if (currentChartType === 'energy') {
            const variance = (parseFloat(r.Energy_Actual) || 0) - (parseFloat(r.Energy_Target) || 0);
            row = [r.Date, escapeCSV(r.Department || ''), r.Stream, parseFloat(r.Energy_Actual) || 0, parseFloat(r.Energy_Target) || 0, variance.toFixed(2), `"${r.AdminArea || ''}"`];
        } else if (currentChartType === 'production') {
            const efficiency = (parseFloat(r.Production_Target) || 0) > 0 ? (((parseFloat(r.Production_Actual) || 0) / (parseFloat(r.Production_Target) || 0)) * 100).toFixed(1) : 0;
            row = [r.Date, escapeCSV(r.Department || ''), r.Stream, parseFloat(r.Production_Actual) || 0, parseFloat(r.Production_Target) || 0, efficiency + '%', `"${r.AdminArea || ''}"`];
        } else if (currentChartType === 'temperature') {
            row = [r.Date, escapeCSV(r.Department || ''), r.Stream, parseFloat(r.Temperature_C) || 0, parseFloat(r.Downtime_Min) || 0, `"${r.AdminArea || ''}"`];
        }
        
        return row.join(',');
    });
    
    const csv = [headers.join(','), ...csvData].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    let fileName = '';
    const today = new Date().toISOString().split('T')[0];
    
    if (currentChartType === 'energy') {
        fileName = `Energy_Performance_${today}.csv`;
    } else if (currentChartType === 'production') {
        fileName = `Production_Performance_${today}.csv`;
    } else if (currentChartType === 'temperature') {
        fileName = `Temperature_Analysis_${today}.csv`;
    }
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showExportNotification(fileName, currentFilteredDataAdvanced.length);
}

function showExportNotification(fileName, recordCount) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300';
    notification.innerHTML = `
        <div class="flex-shrink-0">
            <i class="fas fa-download text-xl"></i>
        </div>
        <div class="flex-1">
            <div class="font-bold text-base">Download Successful!</div>
            <div class="text-sm text-blue-100 mt-1">
                <span class="font-semibold">${recordCount}</span> records exported to <span class="font-semibold">${fileName}</span>
            </div>
        </div>
        <button onclick="this.parentElement.remove()" class="text-blue-100 hover:text-white transition-colors">
            <i class="fas fa-times text-lg"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInFromBottom {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-in {
            animation: slideInFromBottom 0.3s ease-out;
        }
    `;
    if (!document.head.querySelector('style[data-export-anim]')) {
        style.setAttribute('data-export-anim', 'true');
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideInFromBottom 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}