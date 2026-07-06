// REPORT NOW PAGE - ULTIMATE PROFESSIONAL VERSION
// Global flag to control view mode (hide edit/AI buttons)
window.isViewMode = false;
// ========================================
function renderReportNowPage() {
    // If report data already loaded from goToReportGeneration, display directly
    if (window.currentReport && window.reportContext) {
        document.getElementById('pageTitle').textContent = window.reportContext.reportName || 'Report';
        displayReport(window.currentReport, window.reportContext);
        return;
    }
    
    document.getElementById('pageTitle').textContent = 'Generate AI Report';
    
    const departments = [...new Set(metricsData.map(d => d.Department))];
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page-transition max-w-6xl mx-auto">
            <div class="bg-white rounded-2xl shadow-xl p-8">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <i class="fas fa-bolt text-white text-3xl"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold text-slate-800">Generate AI Report</h2>
                        <p class="text-slate-600">Create instant insights powered by AI</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Report Name</label>
                        <input id="reportName" type="text" placeholder="Enter report name" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Department (Optional)</label>
                        <select id="reportDepartment" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                            <option value="">All Departments</option>
                            ${departments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">From</label>
                        <input id="reportStartDate" type="date" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">To</label>
                        <input id="reportEndDate" type="date" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                
                <button onclick="generateAIReport()" id="generateBtn" class="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all">
                    <i class="fas fa-robot mr-2"></i>
                    Generate Report
                </button>
            </div>
        </div>
    `;
    
    // Prefill fields from window.reportContext if provided
    try {
        const ctx = window.reportContext;
        if (ctx) {
            if (ctx.reportName) document.getElementById('reportName').value = ctx.reportName;
            if (ctx.startDate) document.getElementById('reportStartDate').value = ctx.startDate.split(' ')[0];
            if (ctx.endDate) document.getElementById('reportEndDate').value = ctx.endDate.split(' ')[0];
            if (ctx.department) {
                const depEl = document.getElementById('reportDepartment');
                if (depEl) depEl.value = ctx.department;
            }
        }
    } catch (e) {
        console.debug('prefill report fields error', e);
    }
}

let loadingTimeout = null;

async function generateAIReport() {
    const reportName = (document.getElementById('reportName')?.value || '').trim() || null;
    const startDate = document.getElementById('reportStartDate')?.value || null;
    const endDate = document.getElementById('reportEndDate')?.value || null;
    const department = document.getElementById('reportDepartment')?.value || null;
    
    // Extract year from dates for AI analysis
    let year = null;
    if (startDate) {
        year = new Date(startDate).getFullYear();
    } else if (endDate) {
        year = new Date(endDate).getFullYear();
    } else {
        // Default to current year if no dates provided
        year = new Date().getFullYear();
    }

    showLoadingScreen();
    // Disable Generate button to avoid double submissions
    try { document.getElementById('generateBtn')?.setAttribute('disabled', 'true'); } catch(e){}
    try { updateLoadingStatus && updateLoadingStatus('Initializing report generation...'); updateProgress && updateProgress(5); } catch (e){}
    
    loadingTimeout = setTimeout(() => {
        hideLoadingScreen();
        showNotification('Request timeout. Please try again.', 'error');
        renderReportNowPage();
    }, 30000);
    
    try {
        const payload = { year };
        if (reportName) payload.reportName = reportName;
        if (startDate) payload.startDate = startDate;
        if (endDate) payload.endDate = endDate;
        if (department) payload.department = department;
        console.debug('generateAIReport payload', payload);
        // Sending request
        try { updateLoadingStatus && updateLoadingStatus('Connecting to report service and validating request...'); activateStepVisual && activateStepVisual(1); updateProgress && updateProgress(25); } catch (e){}
        const response = await fetch(`${API_BASE}/api/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        clearTimeout(loadingTimeout);
        
        if (!response.ok) {
            let serverDetails = '';
            try {
                const raw = await response.text();
                if (raw) {
                    try {
                        const j = JSON.parse(raw);
                        serverDetails = j.error || j.message || raw;
                    } catch (_) {
                        serverDetails = raw;
                    }
                }
            } catch (_) {}
            const statusInfo = `${response.status}${response.statusText ? ' ' + response.statusText : ''}`;
            throw new Error(`Server error ${statusInfo}${serverDetails ? ` — ${serverDetails.substring(0, 400)}` : ''}`);
        }
        
        const data = await response.json();
        try { updateLoadingStatus && updateLoadingStatus('Processing response — running AI analysis and extracting insights...'); activateStepVisual && activateStepVisual(2); updateProgress && updateProgress(55); } catch (e){}
        
        if (!data || !data.report) {
            throw new Error('Invalid response format');
        }
        
        const cleanedReport = {
            executive_summary: cleanText(data.report.executive_summary),
            key_insights: cleanText(data.report.key_insights),
            anomalies: cleanText(data.report.anomalies),
            recommendations: cleanText(data.report.recommendations)
        };
        
        currentReport = cleanedReport;

        const context = { reportName, startDate, endDate, department };
        window.reportContext = context;
        try { updateLoadingStatus && updateLoadingStatus('Preparing charts and final page...'); activateStepVisual && activateStepVisual(3); updateProgress && updateProgress(85); } catch (e){}

        setTimeout(() => {
            try { updateLoadingStatus && updateLoadingStatus('Finishing up and opening the report...'); activateStepVisual && activateStepVisual(4); updateProgress && updateProgress(100); } catch (e){}
            hideLoadingScreen();
            displayReport(currentReport, context);
        }, 500);

        showNotification('Report generated successfully!', 'success');
    } catch (error) {
        clearTimeout(loadingTimeout);
        hideLoadingScreen();
        console.error('Error generating report:', error);
        showNotification('Error: ' + (error?.message || 'Unknown error'), 'error');
        // Re-enable Generate button on error
        try { document.getElementById('generateBtn')?.removeAttribute('disabled'); } catch(e){}
        renderReportNowPage();
    }
}

function showLoadingScreen() {
    document.getElementById('pageTitle').textContent = 'Generating Report...';
    document.getElementById('mainContent').innerHTML = `
        <div class="flex items-center justify-center" style="min-height: 100vh;">
            <div class="max-w-4xl mx-auto w-full px-4 py-8">
                <div class="bg-white rounded-3xl shadow-2xl p-12 border border-slate-100">
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
                    <div class="mb-8">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-bold text-slate-700 uppercase tracking-wider">Overall Progress</span>
                            <span id="progressPercent" class="text-sm font-bold bg-sky-100 text-sky-700 px-3 py-1 rounded-full">0%</span>
                        </div>
                        <div class="h-4 bg-slate-200 rounded-full overflow-hidden">
                            <div id="loadingProgress" class="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 shadow-lg transition-all duration-300" style="width:0%"></div>
                        </div>
                    </div>
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

    (async () => {
        updateLoadingStatus('Authenticating workflow data...');
        activateStepVisual(0);
        updateProgress(2);
        await sleep(400);
        updateStepDetails(1, '• Validating report name');
        updateProgress(4);
        await sleep(300);
        updateStepDetails(1, '• Checking date range');
        updateProgress(6);
        await sleep(300);
        updateStepDetails(1, '• Initializing service');
        updateProgress(10);
        await sleep(200);
        updateStepDetails(1, '• Ready for transmission', true);

        updateLoadingStatus('Sending request to API server...');
        updateProgress(12);
        updateStepDetails(2, '• Establishing connection');
        await sleep(500);
        updateProgress(14);
        updateStepDetails(2, '• Transmitting workflow payload');
        updateProgress(16);
        await sleep(600);
        updateProgress(20);
        updateStepDetails(2, '• Awaiting server response');
        await sleep(1200);
        updateProgress(26);
        updateStepDetails(2, '• Response received', true);

        updateLoadingStatus('Processing workflow data...');
        updateProgress(30);
        updateStepDetails(3, '• Parsing response data');
        await sleep(400);
        updateProgress(35);
        updateStepDetails(3, '• Running statistical analysis');
        await sleep(500);
        updateProgress(42);
        updateStepDetails(3, '• Extracting key insights');
        await sleep(500);
        updateProgress(57);
        updateStepDetails(3, '• Generating recommendations', true);

        updateLoadingStatus('Creating visualizations...');
        updateProgress(65);
        updateStepDetails(4, '• Preparing chart data');
        await sleep(400);
        updateProgress(70);
        updateStepDetails(4, '• Rendering charts', true);

        updateLoadingStatus('Finalizing report and preparing display...');
        updateProgress(82);
        updateStepDetails(5, '• Assembling report');
        await sleep(300);
        updateProgress(94);
        updateStepDetails(5, '• Final quality check', true);
        await sleep(200);
        updateProgress(100);
        updateStepDetails(5, '• Ready for display', true);
        updateLoadingStatus('Report complete! Opening display...');
    })();
    function updateLoadingStatus(text) {
        const st = document.getElementById('loadingStatus');
        if (st) st.textContent = text;
    }
    function updateStepDetails(stepNumber, detail, isFinal = false) {
        const detailsId = `step${stepNumber}Details`;
        const details = document.getElementById(detailsId);
        if (details) {
            if (isFinal) {
                details.innerHTML += `<div style='color:green;font-weight:bold'>${detail}</div>`;
            } else {
                details.innerHTML += `<div>${detail}</div>`;
            }
        }
        const progressId = `step${stepNumber}Progress`;
        const progress = document.getElementById(progressId);
        if (progress) {
            let percent = 0;
            switch (stepNumber) {
                case 1: percent = 10; break;
                case 2: percent = 26; break;
                case 3: percent = 57; break;
                case 4: percent = 70; break;
                case 5: percent = 100; break;
            }
            progress.textContent = percent + '%';
        }
    }
    function activateStepVisual(stepIndex) {
        const ids = ['step1Progress','step2Progress','step3Progress','step4Progress','step5Progress'];
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.fontWeight = (i === stepIndex) ? 'bold' : 'normal';
                el.style.color = (i === stepIndex) ? '#2563eb' : '#64748b';
            }
        });
    }
    function updateProgress(percent) {
        const bar = document.getElementById('loadingProgress');
        const txt = document.getElementById('progressPercent');
        if (bar) bar.style.width = percent + '%';
        if (txt) txt.textContent = percent + '%';
    }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function toggleAllStepsDetails() {
        const acc = document.getElementById('allStepsAccordion');
        const btn = document.querySelector('.fa-chevron-down');
        const isOpen = !acc.classList.contains('hidden');
        acc.classList.toggle('hidden', isOpen);
        if (btn) btn.style.transform = isOpen ? '' : 'rotate(180deg)';
    }
}

function activateStepVisual(stepIndex) {
    const ids = ['loadingStep1','loadingStep2','loadingStep3','loadingStep4'];
    const icons = ['step1Icon','step2Icon','step3Icon','step4Icon'];
    ids.forEach((id, i) => {
        const el = document.getElementById(id);
        const icon = document.getElementById(icons[i]);
        if (!el) return;
        if (i < stepIndex) {
            el.classList.remove('border-slate-200');
            el.classList.add('border-sky-500', 'bg-sky-50');
            const title = el.querySelector('div');
            if (title) title.classList.add('text-slate-800');
            if (icon) {
                icon.classList.remove('border-slate-300');
                icon.classList.add('border-sky-500', 'bg-sky-500');
                icon.innerHTML = '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
            }
        } else if (i === stepIndex) {
            el.classList.remove('border-slate-200');
            el.classList.add('border-amber-500', 'bg-amber-50');
            const title = el.querySelector('div');
            if (title) title.classList.add('text-slate-800');
            if (icon) {
                icon.classList.remove('border-slate-300');
                icon.classList.add('border-amber-500', 'bg-white', 'animate-spin');
                icon.innerHTML = '<span class="block h-full w-full border-2 border-amber-500 border-t-transparent rounded-full"></span>';
            }
        } else {
            el.classList.remove('border-sky-500', 'bg-sky-50', 'border-amber-500', 'bg-amber-50');
            el.classList.add('border-slate-200');
            if (icon) {
                icon.classList.add('border-slate-300');
                icon.classList.remove('border-sky-500', 'bg-sky-500', 'border-amber-500', 'bg-white', 'animate-spin');
                icon.innerHTML = '';
            }
        }
    });
}

function updateProgress(percent) {
    const bar = document.getElementById('loadingProgress');
    if (bar) bar.style.width = percent + '%';
}

function updateLoadingStatus(text) {
    const st = document.getElementById('loadingStatus');
    if (st) st.textContent = text;
}

function activateStep(current, next) {
    const steps = ['loadingStep1', 'loadingStep2', 'loadingStep3', 'loadingStep4'];
    const colors = ['blue', 'purple', 'green', 'amber'];
    
    if (current > 0 && current <= steps.length) {
        const el = document.getElementById(steps[current - 1]);
        if (el) {
            el.className = 'p-4 bg-slate-50 rounded-lg text-slate-400';
        }
    }
    
    if (next > 0 && next <= steps.length) {
        const el = document.getElementById(steps[next - 1]);
        if (el) {
            const color = colors[next - 1];
            el.className = `p-4 bg-${color}-50 rounded-lg border-l-4 border-${color}-500`;
            el.querySelector('i').className = `fas ${el.querySelector('i').className.split(' ')[1]} text-${color}-500 mr-2`;
        }
    }
}

function hideLoadingScreen() {
    const content = document.getElementById('mainContent');
    content.style.opacity = '0';
    setTimeout(() => { content.style.opacity = '1'; }, 100);
}

function cleanText(text) {
    if (!text) return 'N/A';
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '').trim();
}

function displayReport(report, context) {
    // Store the report globally for PDF download
    currentReport = report;
    
    // Store context and stats globally for PDF download
    window.reportContext = context;
    const stats = calculateReportStats(context);
    window.reportStats = stats;  // Store stats globally so PDF uses same data
    
    document.getElementById('pageTitle').textContent = (context && context.reportName) ? context.reportName : 'AI Report Generated';
    
    // Extract quarter and year from context or dates
    let quarter = context && context.quarter ? context.quarter : '';
    let year = context && context.year ? context.year : '';
    
    // If no quarter/year, try to extract from dates
    if (!year && context && context.startDate) {
        year = new Date(context.startDate).getFullYear();
    }
    if (!year && context && context.endDate) {
        year = new Date(context.endDate).getFullYear();
    }
    if (!year) {
        year = new Date().getFullYear();
    }
    
    // Format date range for display
    let dateRangeLabel = '';
    if (context && context.startDate && context.endDate) {
        const startDate = new Date(context.startDate);
        const endDate = new Date(context.endDate);
        dateRangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (quarter) {
        dateRangeLabel = `Q${quarter} ${year}`;
    } else {
        dateRangeLabel = `${year}`;
    }
    
    const headerLabel = (typeof context === 'string')
        ? (context || 'Full Year')
        : (context && context.reportName)
            ? context.reportName
            : (context && context.startDate && context.endDate)
                ? `${context.startDate} → ${context.endDate}`
                : 'Custom Range';
    
    // Get Admin Areas, Departments, and Streams from filtered data
    const adminAreas = [...new Set((stats.filteredData || metricsData).map(d => d.AdminArea).filter(Boolean))];
    const departments = [...new Set((stats.filteredData || metricsData).map(d => d.Department).filter(Boolean))];
    const streams = [...new Set((stats.filteredData || metricsData).map(d => d.Stream).filter(Boolean))];
    
    document.getElementById('mainContent').innerHTML = `
        <div id="reportContent" class="page-transition max-w-7xl mx-auto space-y-8">
            
            <!-- Premium Header with Gradient Theme -->
            <div class="bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-600 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                <div class="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 class="text-4xl font-black mb-3 tracking-tight">
                            <i class="fas fa-robot mr-3"></i>AI GENERATED REPORT
                        </h3>
                        <div class="flex items-center gap-4 text-lg flex-wrap">
                            <span class="px-4 py-2 bg-white/20 rounded-full font-bold backdrop-blur-sm">${headerLabel}</span>
                            <span class="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                                <i class="fas fa-calendar mr-2"></i>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            ${context && context.year ? `<span class="px-4 py-2 bg-cyan-500/30 rounded-full font-bold"><i class="fas fa-chart-line mr-2"></i>Year: ${context.year}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex gap-3 flex-wrap">
                        <button onclick="downloadPDF()" class="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 transform">
                            <i class="fas fa-file-pdf"></i>
                            PDF
                        </button>
                        <button onclick="exportReportWord()" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 transform">
                            <i class="fas fa-file-word"></i>
                            Word
                        </button>
                        <button onclick="saveCurrentReport()" class="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 transform">
                            <i class="fas fa-save"></i>
                            Save
                        </button>
                    </div>
                </div>
                
                <!-- Quick Stats Bar -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div class="text-cyan-100 text-sm">Admin Areas</div>
                        <div class="text-2xl font-black">${adminAreas.length}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div class="text-cyan-100 text-sm">Departments</div>
                        <div class="text-2xl font-black">${departments.length}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div class="text-cyan-100 text-sm">Streams</div>
                        <div class="text-2xl font-black">${streams.length}</div>
                    </div>
                    <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div class="text-cyan-100 text-sm">Records Analyzed</div>
                        <div class="text-2xl font-black">${(stats.filteredData || metricsData).length}</div>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 1: CORPORATE ENERGY PERFORMANCE OVERVIEW -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 relative overflow-hidden" style="border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #10b981, #3b82f6); background-origin: border-box; background-clip: padding-box, border-box;">
                <!-- Background Icon -->
                <div class="absolute -right-8 -bottom-8 text-[12rem] text-emerald-500/10 pointer-events-none">
                    <i class="fas fa-industry"></i>
                </div>
                
                <h4 class="text-2xl font-bold text-slate-800 mb-3 relative z-10">
                    Corporate Energy Performance Overview
                    <span class="ml-4 text-sm font-medium text-slate-500">Q${quarter} ${year}</span>
                </h4>
                <div class="flex justify-end gap-2 mb-3 relative z-10" id="execSummaryActions" style="${window.isViewMode ? 'display:none;' : ''}">
                    <button class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" onclick="startEditSection('executive_summary')">
                        <i class="fas fa-pen mr-1"></i> Edit
                    </button>
                    <button id="btnAiRewrite-executive_summary" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200" onclick="aiRewriteSection('executive_summary')">
                        <i class="fas fa-robot mr-1"></i> AI Rewrite
                    </button>
                </div>
                <div id="execSummaryView" class="text-slate-700 whitespace-pre-wrap leading-relaxed text-base font-normal relative z-10">${report.executive_summary}</div>
                <div id="execSummaryEditor" class="relative z-10 mt-2 hidden">
                    <textarea id="execSummaryTextarea" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800" rows="8">${report.executive_summary}</textarea>
                    <div class="mt-2 flex items-center gap-2">
                        <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onclick="saveSection('executive_summary')"><i class="fas fa-save mr-1"></i>Save</button>
                        <button class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold" onclick="cancelEditSection('executive_summary')"><i class="fas fa-times mr-1"></i>Cancel</button>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 2: SECTOR ENERGY PERFORMANCE -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-10 border-2 border-blue-200 relative overflow-hidden">
                <!-- Background Icon -->
                <div class="absolute -right-8 -top-8 text-blue-200/30 text-9xl"><i class="fas fa-building"></i></div>
                
                <h4 class="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                    <div class="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <i class="fas fa-layer-group text-white text-2xl"></i>
                    </div>
                    <div>
                        <span class="text-blue-600 text-sm font-medium tracking-wider">SECTOR ANALYSIS</span>
                        <div class="text-slate-800">Admin Area Energy Performance</div>
                    </div>
                    <span class="ml-auto text-lg font-bold text-blue-700 bg-blue-200 px-4 py-2 rounded-full shadow-sm">
                        <i class="fas fa-map-marker-alt mr-2"></i>${adminAreas.length} Areas
                    </span>
                </h4>
                
                <!-- Admin Area Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- AA Production Chart -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-bar text-blue-500"></i>
                            Production by Admin Area
                            <span class="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">UP Only</span>
                        </h5>
                        <div style="height: 300px;">
                            <canvas id="aaProductionChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- AA Energy Chart -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-bolt text-amber-500"></i>
                            Energy by Admin Area
                        </h5>
                        <div style="height: 300px;">
                            <canvas id="aaEnergyChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 3: OPERATIONAL UNIT PERFORMANCE -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 rounded-3xl shadow-2xl p-10 border-2 border-slate-300 relative overflow-hidden">
                <!-- Background Icon -->
                <div class="absolute -right-8 -bottom-8 text-slate-200/50 text-9xl"><i class="fas fa-sitemap"></i></div>
                
                <h4 class="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                    <div class="w-14 h-14 bg-gradient-to-br from-slate-700 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
                        <i class="fas fa-cogs text-white text-2xl"></i>
                    </div>
                    <div>
                        <span class="text-slate-600 text-sm font-medium tracking-wider">OPERATIONAL UNITS</span>
                        <div class="text-slate-800">Department Production & Energy</div>
                    </div>
                    <span class="ml-auto text-lg font-bold text-slate-700 bg-slate-200 px-4 py-2 rounded-full shadow-sm">
                        <i class="fas fa-users mr-2"></i>${departments.length} Departments
                    </span>
                </h4>
                
                <!-- Department Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Dept Production Chart - All Departments -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-bar text-blue-500"></i>
                            Production by Department
                            <span class="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">UP Only</span>
                        </h5>
                        <div style="height: 350px;">
                            <canvas id="deptProductionChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Dept Energy Chart -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-fire text-amber-500"></i>
                            Energy by Department
                            <span class="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">All Departments</span>
                        </h5>
                        <div style="height: 350px;">
                            <canvas id="deptEnergyChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Performance Insights & Trends Section -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mt-6 relative overflow-hidden" style="border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #10b981, #3b82f6); background-origin: border-box; background-clip: padding-box, border-box;">
                    <!-- Background Icon -->
                    <div class="absolute -right-6 -bottom-6 text-[10rem] text-blue-500/10 pointer-events-none">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    
                    <h5 class="text-xl font-bold text-slate-800 mb-2 relative z-10">
                        Performance Insights & Trends
                    </h5>
                    <div class="flex justify-end gap-2 mb-3 relative z-10">
                        <button class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" onclick="startEditSection('key_insights')">
                            <i class="fas fa-pen mr-1"></i> Edit
                        </button>
                        <button id="btnAiRewrite-key_insights" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200" onclick="aiRewriteSection('key_insights')">
                            <i class="fas fa-robot mr-1"></i> AI Rewrite
                        </button>
                    </div>
                    <div id="keyInsightsView" class="text-slate-700 whitespace-pre-wrap leading-relaxed font-normal relative z-10">${report.key_insights}</div>
                    <div id="keyInsightsEditor" class="relative z-10 mt-2 hidden">
                        <textarea id="keyInsightsTextarea" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800" rows="8">${report.key_insights}</textarea>
                        <div class="mt-2 flex items-center gap-2">
                            <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onclick="saveSection('key_insights')"><i class="fas fa-save mr-1"></i>Save</button>
                            <button class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold" onclick="cancelEditSection('key_insights')"><i class="fas fa-times mr-1"></i>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 4: PRODUCTION STREAM METRICS -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 rounded-3xl shadow-2xl p-10 border-2 border-teal-200 relative overflow-hidden">
                <!-- Background Icon -->
                <div class="absolute -right-8 -top-8 text-teal-200/40 text-9xl"><i class="fas fa-water"></i></div>
                
                <h4 class="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                    <div class="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <i class="fas fa-stream text-white text-2xl"></i>
                    </div>
                    <div>
                        <span class="text-teal-600 text-sm font-medium tracking-wider">STREAM METRICS</span>
                        <div class="text-slate-800">Production Flow Analysis</div>
                    </div>
                    <span class="ml-auto text-lg font-bold text-teal-700 bg-teal-200 px-4 py-2 rounded-full shadow-sm">
                        <i class="fas fa-code-branch mr-2"></i>${streams.length} Streams
                    </span>
                </h4>
                
                <!-- Stream Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Stream Production Chart -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-teal-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-area text-teal-500"></i>
                            Production by Stream
                            <span class="ml-auto text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-full">UP Only</span>
                        </h5>
                        <div style="height: 350px;">
                            <canvas id="streamProductionChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Stream Energy Chart -->
                    <div class="bg-white rounded-2xl shadow-xl p-6 border border-amber-100">
                        <h5 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-fire text-amber-500"></i>
                            Energy by Stream
                            <span class="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">All Departments</span>
                        </h5>
                        <div style="height: 350px;">
                            <canvas id="streamEnergyChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 5: PERFORMANCE METRICS -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Production Gauge -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
                    <h4 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-tachometer-alt text-blue-500"></i>
                        Production Achievement
                    </h4>
                    <div style="height: 220px;">
                        <canvas id="productionGaugeChart"></canvas>
                    </div>
                    <div class="text-center mt-4">
                        <span class="text-3xl font-black ${stats.productionAchievement >= 95 ? 'text-green-600' : stats.productionAchievement >= 85 ? 'text-amber-600' : 'text-red-600'}">${stats.productionAchievement.toFixed(1)}%</span>
                    </div>
                </div>
                
                <!-- Energy Gauge -->
                <div class="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-amber-500">
                    <h4 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-bolt text-amber-500"></i>
                        Energy Achievement
                    </h4>
                    <div style="height: 220px;">
                        <canvas id="energyGaugeChart"></canvas>
                    </div>
                    <div class="text-center mt-4">
                        <span class="text-3xl font-black ${stats.energyAchievement <= 105 ? 'text-green-600' : stats.energyAchievement <= 115 ? 'text-amber-600' : 'text-red-600'}">${stats.energyAchievement.toFixed(1)}%</span>
                    </div>
                </div>
                
                <!-- KPI Summary Card -->
                <div class="bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border-2 border-emerald-400/50">
                    <!-- Background Icon -->
                    <div class="absolute -right-6 -bottom-6 text-white/10 text-9xl">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="absolute top-4 right-4 text-white/20 text-4xl">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    
                    <h4 class="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
                        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <i class="fas fa-clipboard-check text-lg"></i>
                        </div>
                        KPI Summary
                    </h4>
                    <div class="space-y-4 relative z-10">
                        <div class="bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all">
                            <div class="flex justify-between items-center">
                                <span class="text-emerald-100 flex items-center gap-2">
                                    <i class="fas fa-industry text-sm"></i>
                                    Avg Production
                                </span>
                                <span class="text-2xl font-black">${Math.round(stats.productionActual).toLocaleString()}</span>
                            </div>
                            <div class="text-xs text-emerald-200 mt-1">Target: ${Math.round(stats.productionTarget).toLocaleString()}</div>
                        </div>
                        <div class="bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all">
                            <div class="flex justify-between items-center">
                                <span class="text-emerald-100 flex items-center gap-2">
                                    <i class="fas fa-bolt text-sm"></i>
                                    Avg Energy
                                </span>
                                <span class="text-2xl font-black">${Math.round(stats.energyActual).toLocaleString()}</span>
                            </div>
                            <div class="text-xs text-emerald-200 mt-1">Target: ${Math.round(stats.energyTarget).toLocaleString()}</div>
                        </div>
                        <div class="bg-white/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all">
                            <div class="flex justify-between items-center">
                                <span class="text-emerald-100 flex items-center gap-2">
                                    <i class="fas fa-database text-sm"></i>
                                    Records
                                </span>
                                <span class="text-2xl font-black">${(stats.filteredData || metricsData).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ═══════════════════════════════════════════════════════════════ -->
            <!-- SECTION 6: VARIANCE & OPTIMIZATION -->
            <!-- ═══════════════════════════════════════════════════════════════ -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Variance & Risk Alerts -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 relative overflow-hidden" style="border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #10b981, #3b82f6); background-origin: border-box; background-clip: padding-box, border-box;">
                    <!-- Background Icon -->
                    <div class="absolute -right-6 -bottom-6 text-[10rem] text-rose-500/10 pointer-events-none">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    
                    <h4 class="text-xl font-bold text-slate-800 mb-2 relative z-10">
                        Variance & Performance Alerts
                    </h4>
                    <div class="flex justify-end gap-2 mb-3 relative z-10">
                        <button class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" onclick="startEditSection('anomalies')">
                            <i class="fas fa-pen mr-1"></i> Edit
                        </button>
                        <button id="btnAiRewrite-anomalies" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200" onclick="aiRewriteSection('anomalies')">
                            <i class="fas fa-robot mr-1"></i> AI Rewrite
                        </button>
                    </div>
                    <div id="anomaliesView" class="text-slate-700 whitespace-pre-wrap leading-relaxed font-normal relative z-10">${report.anomalies}</div>
                    <div id="anomaliesEditor" class="relative z-10 mt-2 hidden">
                        <textarea id="anomaliesTextarea" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800" rows="8">${report.anomalies}</textarea>
                        <div class="mt-2 flex items-center gap-2">
                            <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onclick="saveSection('anomalies')"><i class="fas fa-save mr-1"></i>Save</button>
                            <button class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold" onclick="cancelEditSection('anomalies')"><i class="fas fa-times mr-1"></i>Cancel</button>
                        </div>
                    </div>
                </div>
                
                <!-- Optimization Recommendations -->
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 relative overflow-hidden" style="border: 3px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #10b981, #3b82f6); background-origin: border-box; background-clip: padding-box, border-box;">
                    <!-- Background Icon -->
                    <div class="absolute -right-6 -bottom-6 text-[10rem] text-emerald-500/10 pointer-events-none">
                        <i class="fas fa-rocket"></i>
                    </div>
                    
                    <h4 class="text-xl font-bold text-slate-800 mb-2 relative z-10">
                        Optimization Recommendations
                    </h4>
                    <div class="flex justify-end gap-2 mb-3 relative z-10">
                        <button class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" onclick="startEditSection('recommendations')">
                            <i class="fas fa-pen mr-1"></i> Edit
                        </button>
                        <button id="btnAiRewrite-recommendations" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200" onclick="aiRewriteSection('recommendations')">
                            <i class="fas fa-robot mr-1"></i> AI Rewrite
                        </button>
                    </div>
                    <div id="recommendationsView" class="text-slate-700 whitespace-pre-wrap leading-relaxed font-normal relative z-10">${report.recommendations}</div>
                    <div id="recommendationsEditor" class="relative z-10 mt-2 hidden">
                        <textarea id="recommendationsTextarea" class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-800" rows="8">${report.recommendations}</textarea>
                        <div class="mt-2 flex items-center gap-2">
                            <button class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onclick="saveSection('recommendations')"><i class="fas fa-save mr-1"></i>Save</button>
                            <button class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold" onclick="cancelEditSection('recommendations')"><i class="fas fa-times mr-1"></i>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Back Button -->
            <div class="text-center pb-8">
                <button onclick="renderReportNowPage()" class="px-10 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl hover:scale-105 transform">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Generate New Report
                </button>
            </div>
        </div>
    `;
    
    // Destroy old charts
    const chartIds = ['productionChart', 'energyChart', 'achievementChart', 'departmentChart', 'trendChart',
                      'aaProductionChart', 'aaEnergyChart', 'deptProductionChart', 'deptEnergyChart',
                      'streamProductionChart', 'streamEnergyChart', 'productionGaugeChart', 'energyGaugeChart', 
                      'overallPieChart', 'upSummaryChart'];
    chartIds.forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            delete chartInstances[id];
        }
    });
    
    setTimeout(() => {
        try {
            createAAProductionChart(stats);
            createAAEnergyChart(stats);
            createDeptProductionChart(stats);
            createDeptEnergyChart(stats);
            createStreamProductionChart(stats);
            createStreamEnergyChart(stats);
            createNewTrendChart(stats);
            createProductionGaugeChart(stats);
            createEnergyGaugeChart(stats);
        } catch (error) {
            console.error('Error creating charts:', error);
        }
    }, 200);
}

// ===== Inline Editing & AI Rewrite for Report Text Sections =====
// Supported keys: 'executive_summary', 'key_insights', 'anomalies', 'recommendations'
function getSectionDomIds(key) {
    const map = {
        executive_summary: { view: 'execSummaryView', editor: 'execSummaryEditor', textarea: 'execSummaryTextarea', btn: 'btnAiRewrite-executive_summary' },
        key_insights: { view: 'keyInsightsView', editor: 'keyInsightsEditor', textarea: 'keyInsightsTextarea', btn: 'btnAiRewrite-key_insights' },
        anomalies: { view: 'anomaliesView', editor: 'anomaliesEditor', textarea: 'anomaliesTextarea', btn: 'btnAiRewrite-anomalies' },
        recommendations: { view: 'recommendationsView', editor: 'recommendationsEditor', textarea: 'recommendationsTextarea', btn: 'btnAiRewrite-recommendations' }
    };
    return map[key];
}

function startEditSection(key) {
    const ids = getSectionDomIds(key);
    if (!ids) return;
    const viewEl = document.getElementById(ids.view);
    const editorEl = document.getElementById(ids.editor);
    const textareaEl = document.getElementById(ids.textarea);
    if (!viewEl || !editorEl || !textareaEl) return;
    textareaEl.value = (window.currentReport && window.currentReport[key]) ? window.currentReport[key] : (viewEl.textContent || '');
    viewEl.classList.add('hidden');
    editorEl.classList.remove('hidden');
}

function cancelEditSection(key) {
    const ids = getSectionDomIds(key);
    if (!ids) return;
    const viewEl = document.getElementById(ids.view);
    const editorEl = document.getElementById(ids.editor);
    if (viewEl) viewEl.classList.remove('hidden');
    if (editorEl) editorEl.classList.add('hidden');
}

function saveSection(key) {
    const ids = getSectionDomIds(key);
    if (!ids) return;
    const viewEl = document.getElementById(ids.view);
    const editorEl = document.getElementById(ids.editor);
    const textareaEl = document.getElementById(ids.textarea);
    if (!viewEl || !editorEl || !textareaEl) return;
    const newText = (textareaEl.value || '').trim();
    setSectionText(key, newText);
}

function setSectionText(key, text) {
    const ids = getSectionDomIds(key);
    if (!ids) return;
    // Update global report so PDF exports reflect changes
    window.currentReport = window.currentReport || {};
    window.currentReport[key] = text;
    console.log(`✅ Section "${key}" updated. Total changes will be included in PDF.`);
    const viewEl = document.getElementById(ids.view);
    const editorEl = document.getElementById(ids.editor);
    if (viewEl) {
        // Keep whitespace via CSS pre-wrap; use textContent for safety
        viewEl.textContent = text || '';
        viewEl.classList.remove('hidden');
    }
    if (editorEl) editorEl.classList.add('hidden');
}

async function aiRewriteSection(key) {
    const ids = getSectionDomIds(key);
    if (!ids) return;
    const btn = document.getElementById(ids.btn);
    const viewEl = document.getElementById(ids.view);
    // Get text from current report or from DOM element
    const original = (window.currentReport && window.currentReport[key]) || (viewEl && viewEl.textContent) || '';
    
    if (!original || original.trim().length === 0) {
        alert('No content to rewrite.');
        return;
    }
    
    // Show AI Rewrite Dialog with the text
    showAIRewriteDialog(key, original, btn);
}

function showAIRewriteDialog(key, originalText, btn) {
    const modal = document.createElement('div');
    modal.id = 'aiRewriteModal_' + key;
    // Store original text in data attribute
    modal.dataset.originalText = originalText;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <!-- Header -->
            <div style="padding: 24px 24px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 20px; font-weight: bold; color: #1f2937;">
                    <i class="fas fa-magic" style="color: #6366f1; margin-right: 8px;"></i> AI Rewrite Request
                </h3>
                <button onclick="document.getElementById('aiRewriteModal_${key}').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">×</button>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
                <!-- Instructions Input -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                        How would you like the AI to rewrite this?
                    </label>
                    <textarea id="aiInstructions_${key}" 
                        placeholder="Examples:&#10;• Make it more concise&#10;• Add more detail&#10;• Use professional tone&#10;• Simplify language&#10;• Add bullet points"
                        style="width: 100%; padding: 12px; border: 2px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; min-height: 80px; box-sizing: border-box; focus-visible: outline none;">
                    </textarea>
                </div>
                
                <!-- Original Preview -->
                <div style="margin-bottom: 20px; background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Original Text</h4>
                    <div style="max-height: 150px; overflow-y: auto; font-size: 13px; color: #374151; line-height: 1.6;">
                        ${escapeHtml(originalText)}
                    </div>
                </div>
                
                <!-- Rewritten Preview (Will be populated) -->
                <div id="aiRewriteResult_${key}" style="display: none; margin-bottom: 20px; background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase;">AI Rewrite Preview</h4>
                    <div id="aiRewriteResultText_${key}" style="max-height: 150px; overflow-y: auto; font-size: 13px; color: #374151; line-height: 1.6;">
                    </div>
                </div>
                
                <!-- Status/Error Messages -->
                <div id="aiRewriteStatus_${key}" style="display: none; margin-bottom: 20px; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.5;">
                </div>
            </div>
            
            <!-- Footer (Action Buttons) -->
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="document.getElementById('aiRewriteModal_${key}').remove()" 
                    style="padding: 10px 20px; border: 2px solid #e5e7eb; background: white; color: #374151; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    Cancel
                </button>
                <button id="btnGenerateRewrite_${key}"
                    onclick="performAIRewrite('${key}')"
                    style="padding: 10px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-wand-magic-sparkles"></i> Generate Rewrite
                </button>
                <button id="btnAcceptRewrite_${key}"
                    onclick="acceptAIRewrite('${key}')"
                    style="display: none; padding: 10px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    <i class="fas fa-check mr-2"></i> Accept & Apply
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function performAIRewrite(key) {
    const modal = document.getElementById('aiRewriteModal_' + key);
    const instructions = document.getElementById('aiInstructions_' + key)?.value?.trim() || 'Rewrite clearly and professionally.';
    // Get original text from modal's data attribute
    const originalText = (modal && modal.dataset.originalText) || window.currentReport?.[key] || '';
    
    // Validate we have text
    if (!originalText || originalText.trim().length === 0) {
        alert('No text content found to rewrite.');
        return;
    }
    
    const btn = document.getElementById('btnGenerateRewrite_' + key);
    const statusDiv = document.getElementById('aiRewriteStatus_' + key);
    const resultDiv = document.getElementById('aiRewriteResult_' + key);
    const resultText = document.getElementById('aiRewriteResultText_' + key);
    
    if (!btn) return;
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Generating...';
    if (statusDiv) { statusDiv.style.display = 'block'; statusDiv.style.background = '#fef3c7'; statusDiv.style.color = '#92400e'; statusDiv.innerHTML = '<i class="fas fa-hourglass-half mr-2"></i> Processing your request...'; }
    
    try {
        const rewritten = await rewriteTextWithAI(originalText, instructions);
        
        // Store in global cache for potential use
        window.lastAIRewrite = { key, original: originalText, rewritten };
        
        // Show result
        if (resultText) { resultText.innerHTML = escapeHtml(rewritten); }
        if (resultDiv) { resultDiv.style.display = 'block'; }
        
        // Hide status, show accept button
        if (statusDiv) { statusDiv.style.display = 'none'; }
        const acceptBtn = document.getElementById('btnAcceptRewrite_' + key);
        if (acceptBtn) { acceptBtn.style.display = 'inline-flex'; }
        
        btn.style.display = 'none';
        
    } catch (error) {
        console.error('AI rewrite error:', error);
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> <strong>Error:</strong> ${escapeHtml(error.message || 'Failed to generate rewrite. Please try again.')}`;
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-1"></i> Try Again';
    }
}

function acceptAIRewrite(key) {
    if (window.lastAIRewrite && window.lastAIRewrite.key === key) {
        setSectionText(key, window.lastAIRewrite.rewritten);
        document.getElementById('aiRewriteModal_' + key).remove();
    }
}

async function rewriteTextWithAI(originalText, instructions) {
    // Pluggable: prefer custom hook if provided by host app
    try {
        if (typeof window.aiRewrite === 'function') {
            const out = await window.aiRewrite({ text: originalText, instructions });
            if (out && typeof out === 'string') return out.trim();
        }
    } catch (e) {
        console.warn('aiRewrite hook error, falling back:', e);
    }

    // Use Flask Ollama API (local backend)
    const apiBase = window.AI_API_BASE || 'http://localhost:8001';
    try {
        const resp = await fetch(`${apiBase}/api/rewrite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: originalText,
                instructions: instructions
            })
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.message || `API Error ${resp.status}`);
        }

        const data = await resp.json();
        if (data.status === 'ok' && data.rewritten) {
            return String(data.rewritten).trim();
        }
        throw new Error(data.message || 'Invalid API response');
    } catch (e) {
        console.error('Flask API error:', e);
        throw new Error(`AI service unavailable: ${e.message}`);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function calculateReportStats(filterObj) {
    // Extract filter criteria from object
    let filteredData = metricsData;
    
    if (filterObj && typeof filterObj === 'object') {
        // Get date range
        const startDate = filterObj.startDate ? new Date(filterObj.startDate) : null;
        const endDate = filterObj.endDate ? new Date(filterObj.endDate + 'T23:59:59') : null;
        
        // Filter by all criteria
        filteredData = metricsData.filter(d => {
            // Date filtering
            if (!d.Date) return false;
            const dt = new Date(d.Date);
            if (isNaN(dt)) return false;
            if (startDate && dt < startDate) return false;
            if (endDate && dt > endDate) return false;
            
            // Quarter filtering
            if (filterObj.quarter && filterObj.quarter !== 'all') {
                const month = dt.getMonth() + 1;
                const quarter = `Q${Math.ceil(month / 3)}`;
                if (quarter !== filterObj.quarter) return false;
            }
            
            // Year filtering
            if (filterObj.year) {
                if (dt.getFullYear() !== parseInt(filterObj.year)) return false;
            }
            
            // Admin Area filtering
            if (filterObj.adminArea && filterObj.adminArea !== 'all') {
                if (d.AdminArea !== filterObj.adminArea) return false;
            }
            
            // Department filtering
            if (filterObj.department && filterObj.department !== 'all') {
                if (d.Department !== filterObj.department) return false;
            }
            
            // Stream filtering
            if (filterObj.stream && filterObj.stream !== 'all') {
                if (d.Stream !== filterObj.stream) return false;
            }
            
            // Status filtering
            if (filterObj.status && filterObj.status !== 'all') {
                if (d.Status !== filterObj.status) return false;
            }
            
            return true;
        });
        
        // Alternative: if workflowData is provided (pre-filtered), use it instead
        if (Array.isArray(filterObj.workflowData) && filterObj.workflowData.length > 0) {
            filteredData = filterObj.workflowData.slice();
        }
    }
    
    if (!filteredData || filteredData.length === 0) filteredData = metricsData;
    
    // Production stats - Using SUM (Total) instead of Average
    const productionActual = filteredData.reduce((sum, d) => sum + (parseFloat(d.Production_Actual) || 0), 0);
    const productionTarget = filteredData.reduce((sum, d) => sum + (parseFloat(d.Production_Target) || 0), 0);
    
    // Energy stats - Using SUM (Total) instead of Average
    const energyActual = filteredData.reduce((sum, d) => sum + (parseFloat(d.Energy_Actual) || 0), 0);
    const energyTarget = filteredData.reduce((sum, d) => sum + (parseFloat(d.Energy_Target) || 0), 0);
    
    // Achievement percentages
    const productionAchievement = productionTarget > 0 ? (productionActual / productionTarget * 100) : 0;
    const energyAchievement = energyTarget > 0 ? (energyActual / energyTarget * 100) : 0;
    
    // Admin Area stats
    const aaStats = {};
    filteredData.forEach(d => {
        const aa = d.AdminArea || 'Unknown';
        if (!aaStats[aa]) aaStats[aa] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0, count: 0 };
        aaStats[aa].prodActual += parseFloat(d.Production_Actual) || 0;
        aaStats[aa].prodTarget += parseFloat(d.Production_Target) || 0;
        aaStats[aa].energyActual += parseFloat(d.Energy_Actual) || 0;
        aaStats[aa].energyTarget += parseFloat(d.Energy_Target) || 0;
        aaStats[aa].count++;
    });
    
    // Department stats
    const deptStats = {};
    filteredData.forEach(d => {
        const dept = d.Department || 'Unknown';
        if (!deptStats[dept]) deptStats[dept] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0, count: 0 };
        deptStats[dept].prodActual += parseFloat(d.Production_Actual) || 0;
        deptStats[dept].prodTarget += parseFloat(d.Production_Target) || 0;
        deptStats[dept].energyActual += parseFloat(d.Energy_Actual) || 0;
        deptStats[dept].energyTarget += parseFloat(d.Energy_Target) || 0;
        deptStats[dept].count++;
    });
    
    // Stream stats
    const streamStats = {};
    filteredData.forEach(d => {
        const stream = d.Stream || 'Unknown';
        if (!streamStats[stream]) streamStats[stream] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0, count: 0 };
        streamStats[stream].prodActual += parseFloat(d.Production_Actual) || 0;
        streamStats[stream].prodTarget += parseFloat(d.Production_Target) || 0;
        streamStats[stream].energyActual += parseFloat(d.Energy_Actual) || 0;
        streamStats[stream].energyTarget += parseFloat(d.Energy_Target) || 0;
        streamStats[stream].count++;
    });
    
    // UP Stream stats - Streams from UP AdminAreas only
    const upStreamStats = {};
    const upAdminAreas = ['SOUTHERN AREA OIL OPERATIONS DEPT', 'SOUTH GHAWAR PRODUCING DEPT', 
                          'UTHMANIYAH PRODUCING DEPT', 'KHURAIS PRODUCING DEPT', 'HAWIYAH GAS PLANT',
                          'NORTHERN AREA OIL OPERATIONS', 'BERRI GAS PLANT'];
    filteredData.forEach(d => {
        const adminArea = (d.AdminArea || '').toUpperCase();
        const stream = d.Stream || 'Unknown';
        
        // Check if this AdminArea belongs to UP
        const isUP = upAdminAreas.some(ua => adminArea.includes(ua.toUpperCase()) || ua.toUpperCase().includes(adminArea));
        
        if (isUP && stream !== 'Unknown') {
            if (!upStreamStats[stream]) upStreamStats[stream] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0, count: 0 };
            upStreamStats[stream].prodActual += parseFloat(d.Production_Actual) || 0;
            upStreamStats[stream].prodTarget += parseFloat(d.Production_Target) || 0;
            upStreamStats[stream].energyActual += parseFloat(d.Energy_Actual) || 0;
            upStreamStats[stream].energyTarget += parseFloat(d.Energy_Target) || 0;
            upStreamStats[stream].count++;
        }
    });
    
    // Trend data
    const dateMap = {};
    filteredData.forEach(d => {
        if (d.Date) {
            if (!dateMap[d.Date]) dateMap[d.Date] = { prodSum: 0, energySum: 0, count: 0 };
            dateMap[d.Date].prodSum += parseFloat(d.Production_Actual) || 0;
            dateMap[d.Date].energySum += parseFloat(d.Energy_Actual) || 0;
            dateMap[d.Date].count++;
        }
    });
    
    const dates = Object.keys(dateMap).sort().slice(-12);
    const trendData = dates.map(date => dateMap[date].prodSum / dateMap[date].count);
    const energyTrendData = dates.map(date => dateMap[date].energySum / dateMap[date].count);
    
    return {
        filteredData,
        productionActual,
        productionTarget,
        productionAchievement,
        energyActual,
        energyTarget,
        energyAchievement,
        aaStats,
        deptStats,
        streamStats,
        upStreamStats,
        dates,
        trendData,
        energyTrendData
    };
}

function createProductionChart(stats) {
    const ctx = document.getElementById('productionChart');
    if (!ctx) return;
    
    chartInstances['productionChart'] = new Chart(ctx, {
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
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(ctx) {
                            return ctx.parsed.y.toLocaleString() + ' units';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11, weight: 'bold' },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    ticks: { font: { size: 12, weight: 'bold' } },
                    grid: { display: false }
                }
            }
        }
    });
}

function createEnergyChart(stats) {
    const ctx = document.getElementById('energyChart');
    if (!ctx) return;
    
    chartInstances['energyChart'] = new Chart(ctx, {
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
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    callbacks: {
                        label: function(ctx) {
                            return ctx.parsed.y.toLocaleString() + ' MMBtu';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11, weight: 'bold' },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    ticks: { font: { size: 12, weight: 'bold' } },
                    grid: { display: false }
                }
            }
        }
    });
}

function createAchievementChart(stats) {
    const ctx = document.getElementById('achievementChart');
    if (!ctx) return;
    
    chartInstances['achievementChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Production', 'Energy'],
            datasets: [{
                data: [
                    Math.round(stats.productionAchievement * 10) / 10,
                    Math.round(stats.energyAchievement * 10) / 10
                ],
                backgroundColor: ['rgba(16, 185, 129, 0.9)', 'rgba(245, 158, 11, 0.9)'],
                borderWidth: 4,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11, weight: 'bold' },
                        padding: 15,
                        boxWidth: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    callbacks: {
                        label: function(ctx) {
                            return ctx.label + ': ' + ctx.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function createDepartmentChart(stats) {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    
    const depts = Object.keys(stats.deptStats).slice(0, 6);
    const values = depts.map(d => Math.round(stats.deptStats[d].actual / stats.deptStats[d].count));
    
    chartInstances['departmentChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: depts.map(d => d.length > 25 ? d.substring(0, 25) + '...' : d),
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.9)',
                    'rgba(16, 185, 129, 0.9)',
                    'rgba(245, 158, 11, 0.9)',
                    'rgba(239, 68, 68, 0.9)',
                    'rgba(168, 85, 247, 0.9)',
                    'rgba(236, 72, 153, 0.9)'
                ],
                borderWidth: 4,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 10, weight: 'bold' },
                        padding: 12,
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

function createTrendChart(stats) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    chartInstances['trendChart'] = new Chart(ctx, {
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
            plugins: {
                legend: { labels: { font: { size: 13, weight: 'bold' } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW PROFESSIONAL CHART FUNCTIONS - MATCHING DATA MANAGEMENT DESIGN
// ═══════════════════════════════════════════════════════════════════════════

// Admin Area Production Chart - Upstream (UP) Admin Areas only
function createAAProductionChart(stats) {
    const ctx = document.getElementById('aaProductionChart');
    if (!ctx) return;
    
    // Filter Upstream Admin Areas only - match common UP patterns
    const upPatterns = ['UPSTREAM', 'UP ', 'U/S', 'SOUTHERN', 'GHAWAR', 'UTHMANIYAH', 'KHURAIS', 
                        'HAWIYAH', 'BERRI', 'NORTHERN', 'PRODUCING', 'OIL OPERATIONS'];
    
    const allAAs = Object.keys(stats.aaStats || {});
    const upAAs = allAAs.filter(aa => {
        const aaUpper = aa.toUpperCase();
        return upPatterns.some(pattern => aaUpper.includes(pattern));
    });
    
    // Use filtered UP or fallback to all if none found
    const aas = upAAs.length > 0 ? upAAs : allAAs.slice(0, 10);
    const actualValues = aas.map(aa => stats.aaStats[aa].prodActual);
    const targetValues = aas.map(aa => stats.aaStats[aa].prodTarget);
    
    // Create pattern for actual values
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(29, 78, 216, 0.7)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['aaProductionChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aas,
            datasets: [
                {
                    label: 'Production Actual',
                    data: actualValues,
                    backgroundColor: pattern || 'rgba(59, 130, 246, 0.4)',
                    borderColor: 'rgba(29, 78, 216, 0.8)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Production Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.4)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
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
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Production', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

// Admin Area Energy Chart
function createAAEnergyChart(stats) {
    const ctx = document.getElementById('aaEnergyChart');
    if (!ctx) return;
    
    const aas = Object.keys(stats.aaStats || {});
    const actualValues = aas.map(aa => stats.aaStats[aa].energyActual);
    const targetValues = aas.map(aa => stats.aaStats[aa].energyTarget);
    
    // Create yellow pattern for energy
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(180, 83, 9, 0.7)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['aaEnergyChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aas,
            datasets: [
                {
                    label: 'Energy Actual',
                    data: actualValues,
                    backgroundColor: pattern || 'rgba(245, 158, 11, 0.4)',
                    borderColor: 'rgba(180, 83, 9, 0.8)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Energy Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.4)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
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
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Energy (MMBtu)', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

// Department Production Chart - Show departments starting with UP only
function createDeptProductionChart(stats) {
    const ctx = document.getElementById('deptProductionChart');
    if (!ctx) return;
    
    // Filter departments that start with "UP" only
    const allDepts = Object.keys(stats.deptStats || {});
    const upDepts = allDepts.filter(d => {
        const dUpper = d.toUpperCase().trim();
        return dUpper.startsWith('UP');
    });
    
    // Use filtered UP or fallback to all if none found
    const depts = upDepts.length > 0 ? upDepts.slice(0, 12) : allDepts.slice(0, 12);
    const actualValues = depts.map(d => stats.deptStats[d].prodActual);
    const targetValues = depts.map(d => stats.deptStats[d].prodTarget);
    
    // Create blue stripe pattern
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(29, 78, 216, 0.8)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['deptProductionChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depts,
            datasets: [
                {
                    label: 'Production Actual',
                    data: actualValues,
                    backgroundColor: pattern || 'rgba(59, 130, 246, 0.4)',
                    borderColor: 'rgba(29, 78, 216, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Production Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.4)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
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
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Production', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

// UP Summary Chart - Two bars for UP total production vs target
function createUPSummaryChart(stats) {
    const ctx = document.getElementById('upSummaryChart');
    if (!ctx) return;
    
    // Calculate UP totals from aaStats
    let upProdActual = 0;
    let upProdTarget = 0;
    
    const upAdminAreas = ['SOUTHERN AREA OIL OPERATIONS DEPT', 'SOUTH GHAWAR PRODUCING DEPT', 
                          'UTHMANIYAH PRODUCING DEPT', 'KHURAIS PRODUCING DEPT', 'HAWIYAH GAS PLANT',
                          'NORTHERN AREA OIL OPERATIONS', 'BERRI GAS PLANT'];
    
    Object.keys(stats.aaStats || {}).forEach(aa => {
        const aaUpper = aa.toUpperCase();
        const isUP = upAdminAreas.some(ua => aaUpper.includes(ua.toUpperCase()) || ua.toUpperCase().includes(aaUpper));
        if (isUP) {
            upProdActual += stats.aaStats[aa].prodActual || 0;
            upProdTarget += stats.aaStats[aa].prodTarget || 0;
        }
    });
    
    // If no UP data found, use total
    if (upProdActual === 0) {
        upProdActual = stats.productionActual || 0;
        upProdTarget = stats.productionTarget || 0;
    }
    
    // Create blue stripe pattern
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(29, 78, 216, 0.8)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['upSummaryChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['UP Production'],
            datasets: [
                {
                    label: 'Actual',
                    data: [upProdActual],
                    backgroundColor: pattern || 'rgba(59, 130, 246, 0.4)',
                    borderColor: 'rgba(29, 78, 216, 1)',
                    borderWidth: 2,
                    borderRadius: 12,
                    barThickness: 80
                },
                {
                    label: 'Target',
                    data: [upProdTarget],
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
                    borderWidth: 2,
                    borderRadius: 12,
                    barThickness: 80
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + Math.round(context.raw).toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Production', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// Department Energy Chart - Show all departments
function createDeptEnergyChart(stats) {
    const ctx = document.getElementById('deptEnergyChart');
    if (!ctx) return;
    
    // Prefer ALL data from global metricsData; fall back to computed stats if unavailable
    const allData = Array.isArray(typeof metricsData !== 'undefined' ? metricsData : undefined)
        ? metricsData
        : (Array.isArray(window.metricsData) ? window.metricsData : null);
    
    let depts = [];
    let actualValues = [];
    let targetValues = [];
    
    if (allData && allData.length) {
        const deptAgg = {};
        allData.forEach(d => {
            const dept = d.Department || 'Unknown';
            if (!deptAgg[dept]) deptAgg[dept] = { energyActual: 0, energyTarget: 0 };
            deptAgg[dept].energyActual += parseFloat(d.Energy_Actual) || 0;
            deptAgg[dept].energyTarget += parseFloat(d.Energy_Target) || 0;
        });
        depts = Object.keys(deptAgg);
        actualValues = depts.map(d => deptAgg[d].energyActual);
        targetValues = depts.map(d => deptAgg[d].energyTarget);
    }
    
    // Fallback to filtered stats if global data missing or empty
    if (!depts.length && stats && stats.deptStats) {
        depts = Object.keys(stats.deptStats);
        actualValues = depts.map(d => stats.deptStats[d].energyActual || 0);
        targetValues = depts.map(d => stats.deptStats[d].energyTarget || 0);
    }
    
    // Create yellow pattern
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(180, 83, 9, 0.7)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['deptEnergyChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depts,
            datasets: [
                {
                    label: 'Energy Actual',
                    data: actualValues,
                    backgroundColor: pattern || 'rgba(245, 158, 11, 0.4)',
                    borderColor: 'rgba(180, 83, 9, 0.8)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Energy Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.4)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
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
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Energy (MMBtu)', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

// Stream Production Chart - Show UP streams only
function createStreamProductionChart(stats) {
    const ctx = document.getElementById('streamProductionChart');
    if (!ctx) return;
    
    // Use upStreamStats for UP-related streams
    let streams = [];
    let actualValues = [];
    let targetValues = [];
    
    // Check if we have upStreamStats with data
    if (stats.upStreamStats && Object.keys(stats.upStreamStats).length > 0) {
        streams = Object.keys(stats.upStreamStats).slice(0, 10);
        actualValues = streams.map(s => stats.upStreamStats[s].prodActual || 0);
        targetValues = streams.map(s => stats.upStreamStats[s].prodTarget || 0);
    }
    
    // If no upStreamStats data, fallback to streamStats
    if (streams.length === 0 && stats.streamStats) {
        streams = Object.keys(stats.streamStats).slice(0, 10);
        actualValues = streams.map(s => stats.streamStats[s].prodActual || 0);
        targetValues = streams.map(s => stats.streamStats[s].prodTarget || 0);
    }
    
    // If still no data, show message
    if (streams.length === 0) {
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500"><i class="fas fa-info-circle mr-2"></i>No UP stream data available</div>';
        return;
    }
    
    // Create blue stripe pattern
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const patternCtx = canvas.getContext('2d');
    patternCtx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    patternCtx.fillRect(0, 0, 12, 12);
    patternCtx.strokeStyle = 'rgba(29, 78, 216, 0.8)';
    patternCtx.lineWidth = 2;
    for (let i = -24; i < 24; i += 4) {
        patternCtx.beginPath();
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i + 12, 12);
        patternCtx.stroke();
    }
    const pattern = patternCtx.createPattern(canvas, 'repeat');
    
    chartInstances['streamProductionChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: streams,
            datasets: [
                {
                    label: 'Production Actual',
                    data: actualValues,
                    backgroundColor: pattern || 'rgba(59, 130, 246, 0.4)',
                    borderColor: 'rgba(29, 78, 216, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Production Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Production', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// Stream Energy Chart - Show all streams
function createStreamEnergyChart(stats) {
    const ctx = document.getElementById('streamEnergyChart');
    if (!ctx) return;
    
    // Prefer ALL data from global metricsData; fall back to computed stats if unavailable
    const allData = Array.isArray(typeof metricsData !== 'undefined' ? metricsData : undefined)
        ? metricsData
        : (Array.isArray(window.metricsData) ? window.metricsData : null);
    
    let streams = [];
    let actualValues = [];
    let targetValues = [];
    
    if (allData && allData.length) {
        const streamAgg = {};
        allData.forEach(d => {
            const stream = d.Stream || 'Unknown';
            if (!streamAgg[stream]) streamAgg[stream] = { energyActual: 0, energyTarget: 0 };
            streamAgg[stream].energyActual += parseFloat(d.Energy_Actual) || 0;
            streamAgg[stream].energyTarget += parseFloat(d.Energy_Target) || 0;
        });
        streams = Object.keys(streamAgg);
        actualValues = streams.map(s => streamAgg[s].energyActual);
        targetValues = streams.map(s => streamAgg[s].energyTarget);
    }
    
    // Fallback to filtered stats if global data missing or empty
    if (!streams.length && stats && stats.streamStats) {
        streams = Object.keys(stats.streamStats);
        actualValues = streams.map(s => stats.streamStats[s].energyActual || 0);
        targetValues = streams.map(s => stats.streamStats[s].energyTarget || 0);
    }
    
    chartInstances['streamEnergyChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: streams,
            datasets: [
                {
                    label: 'Energy Actual',
                    data: actualValues,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(180, 83, 9, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Energy Target',
                    data: targetValues,
                    backgroundColor: 'rgba(107, 114, 128, 0.5)',
                    borderColor: 'rgba(55, 65, 81, 0.8)',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Energy (MMBtu)', font: { weight: 'bold', size: 12 } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// New Trend Chart with Production and Energy
function createNewTrendChart(stats) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    chartInstances['trendChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.dates,
            datasets: [
                {
                    label: 'Production',
                    data: stats.trendData.map(d => Math.round(d)),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Energy',
                    data: (stats.energyTrendData || []).map(d => Math.round(d)),
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(245, 158, 11)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 12, weight: 'bold' } } }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Production', font: { weight: 'bold' }, color: 'rgb(59, 130, 246)' },
                    ticks: { color: 'rgb(59, 130, 246)' },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: { display: true, text: 'Energy (MMBtu)', font: { weight: 'bold' }, color: 'rgb(245, 158, 11)' },
                    ticks: { color: 'rgb(245, 158, 11)' },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

// Production Gauge Chart
function createProductionGaugeChart(stats) {
    const ctx = document.getElementById('productionGaugeChart');
    if (!ctx) return;
    
    const achievement = Math.min(stats.productionAchievement, 120);
    const remaining = Math.max(0, 100 - achievement);
    
    chartInstances['productionGaugeChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
                data: [achievement, remaining > 0 ? remaining : 0],
                backgroundColor: [
                    stats.productionAchievement >= 95 ? 'rgba(16, 185, 129, 0.9)' : 
                    stats.productionAchievement >= 85 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    'rgba(226, 232, 240, 0.5)'
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.label + ': ' + ctx.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Energy Gauge Chart
function createEnergyGaugeChart(stats) {
    const ctx = document.getElementById('energyGaugeChart');
    if (!ctx) return;
    
    const achievement = Math.min(stats.energyAchievement, 150);
    const remaining = Math.max(0, 100 - achievement);
    
    chartInstances['energyGaugeChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Consumption', 'Under Target'],
            datasets: [{
                data: [achievement, remaining > 0 ? remaining : 0],
                backgroundColor: [
                    stats.energyAchievement <= 105 ? 'rgba(16, 185, 129, 0.9)' : 
                    stats.energyAchievement <= 115 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    'rgba(226, 232, 240, 0.5)'
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.label + ': ' + ctx.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Overall Performance Pie Chart
function createOverallPieChart(stats) {
    const ctx = document.getElementById('overallPieChart');
    if (!ctx) return;
    
    chartInstances['overallPieChart'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Production Achievement', 'Energy Efficiency', 'Target Gap'],
            datasets: [{
                data: [
                    Math.min(stats.productionAchievement, 100),
                    Math.max(0, 100 - Math.min(stats.energyAchievement, 100)),
                    Math.max(0, 100 - stats.productionAchievement)
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(107, 114, 128, 0.5)'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 10, weight: 'bold' }, padding: 10, boxWidth: 12 }
                }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// END OF NEW CHART FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
 

async function downloadPDF() {
    const button = event.target.closest('button');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating PDF...';
    
    try {
        // Use window.currentReport (which has all edits) instead of currentReport
        const reportData = window.currentReport || currentReport;
        if (!reportData) {
            throw new Error('No report data available. Please generate a report first.');
        }
        
        // Use the same stats that were used in displayReport
        const stats = window.reportStats || calculateReportStats(window.reportContext);
        
        // Build ALL-department and ALL-stream aggregates for PDF energy charts
        try {
            const allData = Array.isArray(typeof metricsData !== 'undefined' ? metricsData : undefined)
                ? metricsData
                : (Array.isArray(window.metricsData) ? window.metricsData : []);
            const deptStatsAll = {};
            const streamStatsAll = {};
            allData.forEach(d => {
                const dept = d.Department || 'Unknown';
                if (!deptStatsAll[dept]) deptStatsAll[dept] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0 };
                deptStatsAll[dept].prodActual += parseFloat(d.Production_Actual) || 0;
                deptStatsAll[dept].prodTarget += parseFloat(d.Production_Target) || 0;
                deptStatsAll[dept].energyActual += parseFloat(d.Energy_Actual) || 0;
                deptStatsAll[dept].energyTarget += parseFloat(d.Energy_Target) || 0;
                
                const stream = d.Stream || 'Unknown';
                if (!streamStatsAll[stream]) streamStatsAll[stream] = { prodActual: 0, prodTarget: 0, energyActual: 0, energyTarget: 0 };
                streamStatsAll[stream].prodActual += parseFloat(d.Production_Actual) || 0;
                streamStatsAll[stream].prodTarget += parseFloat(d.Production_Target) || 0;
                streamStatsAll[stream].energyActual += parseFloat(d.Energy_Actual) || 0;
                streamStatsAll[stream].energyTarget += parseFloat(d.Energy_Target) || 0;
            });
            stats.deptStatsAll = deptStatsAll;
            stats.streamStatsAll = streamStatsAll;
        } catch (e) {
            console.debug('PDF all-agg build failed; will use filtered stats as fallback', e);
        }
        const context = window.reportContext || {};
        
        // Get filter criteria from UI or context
        const adminAreaFilter = document.getElementById('adminAreaFilter')?.value;
        const deptFilter = document.getElementById('deptFilter')?.value;
        const streamFilter = document.getElementById('streamFilter')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;
        
        // Get date range
        const quarter = context.quarter || document.getElementById('reportQuarter')?.value || '';
        let year = context.year || new Date().getFullYear();
        const startDate = context.startDate || document.getElementById('startDate')?.value;
        const endDate = context.endDate || document.getElementById('endDate')?.value;
        
        // Format date range for PDF display
        let dateRangeLabel = quarter ? `Q${quarter} ${year}` : `Year ${year}`;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            dateRangeLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        
        // Add filter info to date label if filters are active
        const filterLabels = [];
        if (adminAreaFilter && adminAreaFilter !== 'all') filterLabels.push(`Area: ${adminAreaFilter}`);
        if (deptFilter && deptFilter !== 'all') filterLabels.push(`Dept: ${deptFilter}`);
        if (streamFilter && streamFilter !== 'all') filterLabels.push(`Stream: ${streamFilter}`);
        if (statusFilter && statusFilter !== 'all') filterLabels.push(`Status: ${statusFilter}`);
        
        if (filterLabels.length > 0) {
            dateRangeLabel += ` [${filterLabels.join(' | ')}]`;
        }
        
        // Format stats for display
        const formatNumber = (num) => {
            if (num === undefined || num === null || isNaN(num)) return 'N/A';
            if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return Math.round(num).toLocaleString();
        };
        
        const displayStats = {
            totalProduction: formatNumber(stats.productionActual),
            totalEnergy: formatNumber(stats.energyActual),
            avgEfficiency: stats.productionAchievement ? stats.productionAchievement.toFixed(1) + '%' : 'N/A',
            departments: Object.keys(stats.deptStats || {}).length || 0,
            dataPoints: stats.filteredData?.length || 0,
            period: dateRangeLabel
        };
        
        // جلب النص الحالي لكل قسم من الـ DOM (حتى لو تم تعديله أو إعادة كتابته بالذكاء الاصطناعي)
        function getSectionTextFromDOM(key) {
            const domIds = getSectionDomIds(key);
            // إذا كان في وضع التحرير، نأخذ من textarea
            const editEl = document.getElementById(domIds.editId);
            if (editEl && editEl.style.display !== 'none') {
                return editEl.value;
            }
            // إذا كان في وضع العرض، نأخذ من div
            const el = document.getElementById(domIds.textId);
            if (el) {
                return el.textContent || '';
            }
            return '';
        }

        const report = {
            executive_summary: getSectionTextFromDOM('executive_summary') || reportData.executive_summary || 'No executive summary available.',
            key_insights: getSectionTextFromDOM('key_insights') || reportData.key_insights || 'No key insights available.',
            anomalies: getSectionTextFromDOM('anomalies') || reportData.anomalies || 'No anomalies detected.',
            recommendations: getSectionTextFromDOM('recommendations') || reportData.recommendations || 'No recommendations available.'
        };
        
        // Create PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const W = 297, H = 210, M = 15;
        
        // Calculate total pages
        const totalPages = 9; // Cover + Summary + Insights + Metrics + 3 Chart Pages + Anomalies + Recommendations
        
        // ========== PAGE 1: COVER ==========
        // Gradient top bar
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 0, W/2, 6, 'F');
        pdf.setFillColor(59, 130, 246);
        pdf.rect(W/2, 0, W/2, 6, 'F');
        
        // Background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 6, W, H-6, 'F');
        
        // Left accent stripe
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 50, 8, 110, 'F');
        
        // Title
        pdf.setTextColor(30, 58, 95);
        pdf.setFontSize(44);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AI ENERGY REPORT', M + 10, 85);
        
        pdf.setFontSize(22);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Upstream Operations Performance Analysis', M + 10, 105);
        
        // Period badge
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(M + 10, 120, 140, 28, 4, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(dateRangeLabel, M + 20, 138);
        
        // Bottom decorative elements
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, H - 20, W, 20, 'F');
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, H - 20, W/3, 20, 'F');
        
        // Footer text
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Generated: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), M + 10, H - 7);
        pdf.text('Page 1 of ' + totalPages, W - M - 30, H - 7);
        
        // ========== PAGE 2: EXECUTIVE SUMMARY ==========
        pdf.addPage();
        addProfessionalTextSlide(pdf, W, H, M, 'Corporate Energy Performance Overview', report.executive_summary, 2, totalPages);
        
        // ========== PAGE 3: KEY INSIGHTS ==========
        pdf.addPage();
        addProfessionalTextSlide(pdf, W, H, M, 'Performance Insights & Trends', report.key_insights, 3, totalPages);
        
        // ========== PAGE 4: METRICS ==========
        pdf.addPage();
        addProfessionalMetricsSlide(pdf, W, H, M, displayStats, 4, totalPages);
        
        // ========== PAGE 5: ADMIN AREA CHARTS ==========
        pdf.addPage();
        drawAdminAreaChartsPage(pdf, W, H, M, stats, 5, totalPages);
        
        // ========== PAGE 6: DEPARTMENT CHARTS ==========
        pdf.addPage();
        drawDepartmentChartsPage(pdf, W, H, M, stats, 6, totalPages);
        
        // ========== PAGE 7: STREAM & TREND CHARTS ==========
        pdf.addPage();
        drawStreamTrendChartsPage(pdf, W, H, M, stats, 7, totalPages);
        
        // ========== ANOMALIES ==========
        pdf.addPage();
        addProfessionalTextSlide(pdf, W, H, M, 'Variance & Performance Alerts', report.anomalies, 8, totalPages);
        
        // ========== RECOMMENDATIONS ==========
        pdf.addPage();
        addProfessionalTextSlide(pdf, W, H, M, 'Optimization Recommendations', report.recommendations, 9, totalPages);
        
        // Save
        const fileName = `Upstream_Report_${dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        pdf.save(fileName);
        
        showNotification('PDF generated successfully!', 'success');
        
    } catch (error) {
        console.error('PDF Error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>Download PDF';
    }
}

// ========== PROFESSIONAL CHART DRAWING FUNCTIONS ==========

// PAGE 5: ADMIN AREA CHARTS (Production by Admin Area - UP Only + Energy by Admin Area)
function drawAdminAreaChartsPage(pdf, W, H, M, stats, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    pdf.setFillColor(30, 58, 95);
    pdf.rect(M, 12, 4, 16, 'F');
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Admin Area Performance', M + 10, 24);
    
    // Filter UP Admin Areas
    const upPatterns = ['UPSTREAM', 'UP ', 'U/S', 'SOUTHERN', 'GHAWAR', 'UTHMANIYAH', 'KHURAIS', 'HAWIYAH', 'BERRI', 'NORTHERN'];
    const allAAs = Object.keys(stats.aaStats || {});
    const upAAs = allAAs.filter(aa => {
        const aaUpper = aa.toUpperCase();
        return upPatterns.some(pattern => aaUpper.includes(pattern));
    });
    const displayUPAAs = upAAs.length > 0 ? upAAs.slice(0, 8) : allAAs.slice(0, 8);
    
    // For Energy: show ALL admin areas
    const displayAllAAs = allAAs.slice(0, 8);
    
    const chartY = 35;
    const chartH = 82;
    
    // Chart 1: Production by Admin Area - UP Only (Horizontal Bar with Target)
    drawProAdminAreaChart(pdf, M, chartY, W - 2*M, chartH, displayUPAAs, stats.aaStats, 'prod');
    
    const energyChartY = chartY + chartH + 8;
    
    // Chart 2: Energy by Admin Area - ALL (Horizontal Bar with Target)
    drawProAdminAreaChart(pdf, M, energyChartY, W - 2*M, chartH - 10, displayAllAAs, stats.aaStats, 'energy');
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 8);
}

// PAGE 6: DEPARTMENT CHARTS (Production + Energy by Department)
function drawDepartmentChartsPage(pdf, W, H, M, stats, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    pdf.setFillColor(30, 58, 95);
    pdf.rect(M, 12, 4, 16, 'F');
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Department Performance', M + 10, 24);
    
    // Filter UP Departments (for Production only)
    const allDepts = Object.keys(stats.deptStats || {});
    const upDepts = allDepts.filter(d => d.toUpperCase().trim().startsWith('UP'));
    const displayUPDepts = upDepts.length > 0 ? upDepts.slice(0, 8) : allDepts.slice(0, 8);
    
    // For Energy: use ALL departments aggregate from stats if available (built in downloadPDF)
    const energyDeptsStats = (stats && stats.deptStatsAll && Object.keys(stats.deptStatsAll).length)
        ? stats.deptStatsAll
        : (stats.deptStats || {});
    const displayAllDepts = Object.keys(energyDeptsStats);
    
    const chartY = 35;
    const chartH = 82;
    
    // Chart 3: Production by Department - UP Only (Horizontal Bar with Target)
    drawProDepartmentChart(pdf, M, chartY, W - 2*M, chartH, displayUPDepts, stats.deptStats, 'prod');
    
    const energyChartY = chartY + chartH + 8;
    
    // Chart 4: Energy by Department - ALL (Horizontal Bar with Target)
    drawProDepartmentChart(pdf, M, energyChartY, W - 2*M, chartH - 10, displayAllDepts, energyDeptsStats, 'energy');
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 8);
}

// PAGE 7: STREAM CHARTS (Production by Stream + Energy by Stream)
function drawStreamTrendChartsPage(pdf, W, H, M, stats, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    pdf.setFillColor(30, 58, 95);
    pdf.rect(M, 12, 4, 16, 'F');
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Stream Performance Analysis', M + 10, 24);
    
    // Streams for Production: from filtered stats; for Energy: use ALL aggregate from stats if available
    const allStreamsFiltered = Object.keys(stats.streamStats || {});
    const displayStreams = allStreamsFiltered.slice(0, 6);
    const energyStreamsStats = (stats && stats.streamStatsAll && Object.keys(stats.streamStatsAll).length)
        ? stats.streamStatsAll
        : (stats.streamStats || {});
    const displayEnergyStreams = Object.keys(energyStreamsStats); // show ALL streams for Energy
    
    const chartY = 35;
    const chartH = 75;
    const chartWFull = W - 2*M;
    
    // Chart 5: Production by Stream (Full-width)
    drawProStreamChart(pdf, M, chartY, chartWFull, chartH, displayStreams, stats.streamStats, 'prod');
    
    // Chart 6: Energy by Stream (Full-width)
    const energyChartY = chartY + chartH + 10;
    drawProStreamChart(pdf, M, energyChartY, chartWFull, chartH, displayEnergyStreams, energyStreamsStats, 'energy');
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 8);
}

// ========== DETAILED CHART DRAWING FUNCTIONS ==========

// Chart 1 & 2: Admin Area Charts - Vertical Bar Chart (Actual vs Target)
function drawProAdminAreaChart(pdf, x, y, w, h, labels, stats, type) {
    const title = type === 'prod' ? 'Production by Admin Area' : 'Energy by Admin Area';
    const color = type === 'prod' ? [59, 130, 246] : [245, 158, 11];
    const unit = type === 'prod' ? 'MMBTU' : 'MWh';
    
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 3, 3, 'F');
    
    // Border
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, w, h, 3, 3, 'S');
    
    // Title with UP badge
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x + 10, y + 12);
    
    // UP Only badge
    if (type === 'prod') {
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(w - 35, y + 5, 28, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('UP Only', w - 33, y + 10);
    }
    
    // Get values and targets
    const values = labels.map(l => type === 'prod' ? stats[l].prodActual : stats[l].energyActual);
    const targets = labels.map(l => type === 'prod' ? stats[l].prodTarget : stats[l].energyTarget);
    const maxVal = Math.max(...values, ...targets, 1) * 1.15;
    
    // Chart area with axes
    const chartX = x + 38;
    const chartY = y + 18;
    const chartW = w - 48;
    const chartH = h - 28;
    
    // Draw axes
    pdf.setDrawColor(100, 110, 120);
    pdf.setLineWidth(0.8);
    pdf.line(chartX, chartY, chartX, chartY + chartH);  // Y axis
    pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);  // X axis
    
    // Grid lines (light)
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    for (let i = 1; i <= 3; i++) {
        const gridY = chartY + (chartH / 4) * i;
        pdf.line(chartX, gridY, chartX + chartW, gridY);
    }
    
    // Y-axis labels
    pdf.setTextColor(120, 130, 140);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i <= 4; i++) {
        const val = (maxVal / 4) * i;
        const valText = val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : 
                       val >= 1000 ? (val/1000).toFixed(0) + 'K' : 
                       Math.round(val).toString();
        const gridY = chartY + chartH - (chartH / 4) * i;
        pdf.text(valText, chartX - 12, gridY + 2);
    }
    
    // Bar width and spacing
    const barWidth = (chartW / labels.length) * 0.35;
    const groupWidth = chartW / labels.length;
    const gap = (groupWidth - barWidth * 2) / 3;
    
    // Plot bars
    labels.forEach((label, i) => {
        const groupX = chartX + i * groupWidth + gap;
        
        // Target bar (light gray)
        const targetH = (targets[i] / maxVal) * chartH;
        const targetY = chartY + chartH - targetH;
        pdf.setFillColor(200, 205, 210);
        pdf.roundedRect(groupX, targetY, barWidth, Math.max(targetH, 1), 1.5, 1.5, 'F');
        
        // Actual bar (colored)
        const actualH = (values[i] / maxVal) * chartH;
        const actualY = chartY + chartH - actualH;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(groupX + barWidth + gap, actualY, barWidth, Math.max(actualH, 1), 1.5, 1.5, 'F');
        
        // Value labels on bars
        const targetText = targets[i] >= 1000000 ? (targets[i]/1000000).toFixed(1) + 'M' : 
                          targets[i] >= 1000 ? (targets[i]/1000).toFixed(0) + 'K' : 
                          Math.round(targets[i]).toString();
        const valText = values[i] >= 1000000 ? (values[i]/1000000).toFixed(1) + 'M' : 
                       values[i] >= 1000 ? (values[i]/1000).toFixed(0) + 'K' : 
                       Math.round(values[i]).toString();
        
        // Target label
        pdf.setTextColor(120, 130, 140);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        const targetW = pdf.getTextWidth(targetText);
        pdf.text(targetText, groupX + barWidth/2 - targetW/2, Math.max(targetY - 2, chartY + 2));
        
        // Actual label
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFontSize(6);
        const valW = pdf.getTextWidth(valText);
        pdf.text(valText, groupX + barWidth + gap + barWidth/2 - valW/2, Math.max(actualY - 2, chartY + 2));
        
        // X-axis label
        pdf.setTextColor(100, 110, 120);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const displayLabel = label.length > 8 ? label.substring(0, 8) : label;
        const labelW = pdf.getTextWidth(displayLabel);
        pdf.text(displayLabel, groupX + (barWidth * 2 + gap) / 2 - labelW/2, chartY + chartH + 6);
    });
    
    // Legend
    pdf.setFontSize(7);
    pdf.setTextColor(120, 130, 140);
    
    // Target legend
    pdf.setFillColor(200, 205, 210);
    pdf.rect(chartX, chartY + chartH + 12, 3, 3, 'F');
    pdf.setTextColor(120, 130, 140);
    pdf.text('Target', chartX + 5, chartY + chartH + 14);
    
    // Actual legend
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(chartX + 30, chartY + chartH + 12, 3, 3, 'F');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text('Actual', chartX + 35, chartY + chartH + 14);
}

// Chart 3 & 4: Department Charts - Vertical Bar Chart (Actual vs Target)
function drawProDepartmentChart(pdf, x, y, w, h, labels, stats, type) {
    const title = type === 'prod' ? 'Production by Department ' : 'Energy by Department';
    const color = type === 'prod' ? [59, 130, 246] : [245, 158, 11];
    
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 3, 3, 'F');
    
    // Border
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, w, h, 3, 3, 'S');
    
    // Title with UP badge
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x + 10, y + 12);
    
    // UP Only badge
    if (type === 'prod') {
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(w - 35, y + 5, 28, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.text('UP Only', w - 33, y + 10);
    }
    
    // Get values and targets
    const values = labels.map(l => type === 'prod' ? stats[l].prodActual : stats[l].energyActual);
    const targets = labels.map(l => type === 'prod' ? stats[l].prodTarget : stats[l].energyTarget);
    const maxVal = Math.max(...values, ...targets, 1) * 1.15;
    
    // Chart area with axes
    const chartX = x + 38;
    const chartY = y + 18;
    const chartW = w - 48;
    const chartH = h - 28;
    
    // Draw axes
    pdf.setDrawColor(100, 110, 120);
    pdf.setLineWidth(0.8);
    pdf.line(chartX, chartY, chartX, chartY + chartH);  // Y axis
    pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);  // X axis
    
    // Grid lines (light)
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    for (let i = 1; i <= 3; i++) {
        const gridY = chartY + (chartH / 4) * i;
        pdf.line(chartX, gridY, chartX + chartW, gridY);
    }
    
    // Y-axis labels
    pdf.setTextColor(120, 130, 140);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i <= 4; i++) {
        const val = (maxVal / 4) * i;
        const valText = val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : 
                       val >= 1000 ? (val/1000).toFixed(0) + 'K' : 
                       Math.round(val).toString();
        const gridY = chartY + chartH - (chartH / 4) * i;
        pdf.text(valText, chartX - 12, gridY + 2);
    }
    
    // Bar width and spacing
    const barWidth = (chartW / labels.length) * 0.35;
    const groupWidth = chartW / labels.length;
    const gap = (groupWidth - barWidth * 2) / 3;
    
    // Plot bars
    labels.forEach((label, i) => {
        const groupX = chartX + i * groupWidth + gap;
        
        // Target bar (light gray)
        const targetH = (targets[i] / maxVal) * chartH;
        const targetY = chartY + chartH - targetH;
        pdf.setFillColor(200, 205, 210);
        pdf.roundedRect(groupX, targetY, barWidth, Math.max(targetH, 1), 1.5, 1.5, 'F');
        
        // Actual bar (colored)
        const actualH = (values[i] / maxVal) * chartH;
        const actualY = chartY + chartH - actualH;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(groupX + barWidth + gap, actualY, barWidth, Math.max(actualH, 1), 1.5, 1.5, 'F');
        
        // Value labels on bars
        const targetText = targets[i] >= 1000000 ? (targets[i]/1000000).toFixed(1) + 'M' : 
                          targets[i] >= 1000 ? (targets[i]/1000).toFixed(0) + 'K' : 
                          Math.round(targets[i]).toString();
        const valText = values[i] >= 1000000 ? (values[i]/1000000).toFixed(1) + 'M' : 
                       values[i] >= 1000 ? (values[i]/1000).toFixed(0) + 'K' : 
                       Math.round(values[i]).toString();
        
        // Target label
        pdf.setTextColor(120, 130, 140);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        const targetW = pdf.getTextWidth(targetText);
        pdf.text(targetText, groupX + barWidth/2 - targetW/2, Math.max(targetY - 2, chartY + 2));
        
        // Actual label
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFontSize(6);
        const valW = pdf.getTextWidth(valText);
        pdf.text(valText, groupX + barWidth + gap + barWidth/2 - valW/2, Math.max(actualY - 2, chartY + 2));
        
        // X-axis label
        pdf.setTextColor(100, 110, 120);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const displayLabel = label.length > 8 ? label.substring(0, 8) : label;
        const labelW = pdf.getTextWidth(displayLabel);
        pdf.text(displayLabel, groupX + (barWidth * 2 + gap) / 2 - labelW/2, chartY + chartH + 6);
    });
    
    // Legend
    pdf.setFontSize(7);
    pdf.setTextColor(120, 130, 140);
    
    // Target legend
    pdf.setFillColor(200, 205, 210);
    pdf.rect(chartX, chartY + chartH + 12, 3, 3, 'F');
    pdf.setTextColor(120, 130, 140);
    pdf.text('Target', chartX + 5, chartY + chartH + 14);
    
    // Actual legend
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(chartX + 30, chartY + chartH + 12, 3, 3, 'F');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text('Actual', chartX + 35, chartY + chartH + 14);
}

// Chart 5 & 6: Stream Charts - Vertical Bar Chart (Actual vs Target)
function drawProStreamChart(pdf, x, y, w, h, labels, stats, type) {
    const title = type === 'prod' ? 'Production by Stream' : 'Energy by Stream';
    const color = type === 'prod' ? [59, 130, 246] : [245, 158, 11];
    
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 3, 3, 'F');
    
    // Border
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, w, h, 3, 3, 'S');
    
    // Title with UP badge
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x + 8, y + 11);
    
    // UP Only badge
    if (type === 'prod') {
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(w - 30, y + 4, 26, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text('UP Only', w - 28, y + 9);
    }
    
    // Get values and targets
    const values = labels.map(l => type === 'prod' ? stats[l].prodActual : stats[l].energyActual);
    const targets = labels.map(l => type === 'prod' ? stats[l].prodTarget : stats[l].energyTarget);
    const maxVal = Math.max(...values, ...targets, 1) * 1.15;
    
    // Chart area with axes
    const chartX = x + 30;
    const chartY = y + 14;
    const chartW = w - 45;
    const chartH = h - 24;
    
    // Draw axes
    pdf.setDrawColor(100, 110, 120);
    pdf.setLineWidth(0.8);
    pdf.line(chartX, chartY, chartX, chartY + chartH);  // Y axis
    pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);  // X axis
    
    // Grid lines (light)
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);
    for (let i = 1; i <= 3; i++) {
        const gridY = chartY + (chartH / 4) * i;
        pdf.line(chartX, gridY, chartX + chartW, gridY);
    }
    
    // Y-axis labels
    pdf.setTextColor(120, 130, 140);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i <= 4; i++) {
        const val = (maxVal / 4) * i;
        const valText = val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : 
                       val >= 1000 ? (val/1000).toFixed(0) + 'K' : 
                       Math.round(val).toString();
        const gridY = chartY + chartH - (chartH / 4) * i;
        pdf.text(valText, chartX - 11, gridY + 2);
    }
    
    // Bar width and spacing
    const barWidth = (chartW / labels.length) * 0.30;
    const groupWidth = chartW / labels.length;
    const gap = (groupWidth - barWidth * 2) / 3;
    
    // Plot bars
    labels.forEach((label, i) => {
        const groupX = chartX + i * groupWidth + gap;
        
        // Target bar (light gray)
        const targetH = (targets[i] / maxVal) * chartH;
        const targetY = chartY + chartH - targetH;
        pdf.setFillColor(200, 205, 210);
        pdf.roundedRect(groupX, targetY, barWidth, Math.max(targetH, 1), 1.2, 1.2, 'F');
        
        // Actual bar (colored)
        const actualH = (values[i] / maxVal) * chartH;
        const actualY = chartY + chartH - actualH;
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(groupX + barWidth + gap, actualY, barWidth, Math.max(actualH, 1), 1.2, 1.2, 'F');
        
        // Value labels on bars
        const targetText = targets[i] >= 1000000 ? (targets[i]/1000000).toFixed(1) + 'M' : 
                          targets[i] >= 1000 ? (targets[i]/1000).toFixed(0) + 'K' : 
                          Math.round(targets[i]).toString();
        const valText = values[i] >= 1000000 ? (values[i]/1000000).toFixed(1) + 'M' : 
                       values[i] >= 1000 ? (values[i]/1000).toFixed(0) + 'K' : 
                       Math.round(values[i]).toString();
        
        // Target label
        pdf.setTextColor(120, 130, 140);
        pdf.setFontSize(5);
        pdf.setFont('helvetica', 'bold');
        const targetW = pdf.getTextWidth(targetText);
        pdf.text(targetText, groupX + barWidth/2 - targetW/2, Math.max(targetY - 2, chartY + 1));
        
        // Actual label
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFontSize(5);
        const valW = pdf.getTextWidth(valText);
        pdf.text(valText, groupX + barWidth + gap + barWidth/2 - valW/2, Math.max(actualY - 2, chartY + 1));
        
        // X-axis label
        pdf.setTextColor(100, 110, 120);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        const displayLabel = label.length > 7 ? label.substring(0, 7) : label;
        const labelW = pdf.getTextWidth(displayLabel);
        pdf.text(displayLabel, groupX + (barWidth * 2 + gap) / 2 - labelW/2, chartY + chartH + 5);
    });
    
    // Legend
    pdf.setFontSize(6);
    pdf.setTextColor(120, 130, 140);
    
    // Target legend
    pdf.setFillColor(200, 205, 210);
    pdf.rect(chartX, chartY + chartH + 9, 2.5, 2.5, 'F');
    pdf.setTextColor(120, 130, 140);
    pdf.text('Target', chartX + 4, chartY + chartH + 11);
    
    // Actual legend
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(chartX + 22, chartY + chartH + 9, 2.5, 2.5, 'F');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text('Actual', chartX + 26, chartY + chartH + 11);
}

// Chart 7 & 8: Production & Energy Trend Over Time - Enhanced Line Chart with Dates and Targets
function drawProTrendChart(pdf, x, y, w, h, stats, type) {
    const color = type === 'prod' ? [59, 130, 246] : [245, 158, 11];
    const data = type === 'prod' ? (stats.trendData || []) : (stats.energyTrendData || []);
    const dates = stats.dates || [];
    
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, w, h, 3, 3, 'F');
    
    // Border
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, w, h, 3, 3, 'S');
    
    const chartX = x + 32;
    const chartY = y + 14;
    const chartW = w - 42;
    const chartH = h - 22;
    
    if (data.length === 0) {
        pdf.setTextColor(148, 163, 184);
        pdf.setFontSize(8);
        pdf.text('No trend data available', x + w/2 - 20, y + h/2);
        return;
    }
    
    // Calculate trend target (assuming consistent target throughout)
    const avgTarget = (type === 'prod' ? stats.productionTarget : stats.energyTarget) || 0;
    const maxVal = Math.max(Math.max(...data, 1), avgTarget) * 1.1;
    const minVal = Math.max(0, Math.min(...data) * 0.85);
    const range = maxVal - minVal || 1;
    
    // Draw axes
    pdf.setDrawColor(100, 110, 120);
    pdf.setLineWidth(0.7);
    pdf.line(chartX, chartY, chartX, chartY + chartH);  // Y axis
    pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);  // X axis
    
    // Grid lines (light)
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.2);
    for (let i = 1; i <= 3; i++) {
        const gridY = chartY + (chartH / 4) * i;
        pdf.line(chartX, gridY, chartX + chartW, gridY);
    }
    
    // Y-axis labels
    pdf.setTextColor(120, 130, 140);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    for (let i = 0; i <= 4; i++) {
        const val = minVal + (range / 4) * i;
        const valText = val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : 
                       val >= 1000 ? (val/1000).toFixed(0) + 'K' : 
                       Math.round(val).toString();
        const gridY = chartY + chartH - (chartH / 4) * i;
        pdf.text(valText, chartX - 12, gridY + 1);
    }
    
    // Calculate actual data points
    const points = data.map((v, i) => ({
        x: chartX + (i / (data.length - 1 || 1)) * chartW,
        y: chartY + chartH - ((v - minVal) / range) * chartH,
        value: v,
        index: i
    }));
    
    // Calculate target line points
    const targetPoints = data.map((v, i) => ({
        x: chartX + (i / (data.length - 1 || 1)) * chartW,
        y: chartY + chartH - ((avgTarget - minVal) / range) * chartH,
        value: avgTarget,
        index: i
    }));
    
    // Draw area under actual line (semi-transparent)
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.setGState(new pdf.GState({opacity: 0.06}));
    
    pdf.moveTo(points[0].x, chartY + chartH);
    points.forEach(p => pdf.lineTo(p.x, p.y));
    pdf.lineTo(points[points.length-1].x, chartY + chartH);
    pdf.fill();
    
    // Draw target line (dashed)
    pdf.setGState(new pdf.GState({opacity: 1}));
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.setLineDash([2, 2]);
    for (let i = 1; i < targetPoints.length; i++) {
        pdf.line(targetPoints[i-1].x, targetPoints[i-1].y, targetPoints[i].x, targetPoints[i].y);
    }
    pdf.setLineDash([]);
    
    // Draw actual line
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(1.8);
    
    for (let i = 1; i < points.length; i++) {
        pdf.line(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }
    
    // Draw points with values (every 2-3 points)
    const step = Math.max(1, Math.ceil(data.length / 5));
    points.forEach((p, i) => {
        if (i % step === 0 || i === data.length - 1) {
            // Circle point
            pdf.setFillColor(color[0], color[1], color[2]);
            pdf.setDrawColor(255, 255, 255);
            pdf.setLineWidth(1.2);
            pdf.circle(p.x, p.y, 1.8, 'FD');
            
            // Value label above point
            const valText = p.value >= 1000000 ? (p.value/1000000).toFixed(1) + 'M' : 
                           p.value >= 1000 ? (p.value/1000).toFixed(0) + 'K' : 
                           Math.round(p.value).toString();
            pdf.setTextColor(color[0], color[1], color[2]);
            pdf.setFontSize(5);
            pdf.setFont('helvetica', 'bold');
            const valW = pdf.getTextWidth(valText);
            pdf.text(valText, p.x - valW/2, p.y - 3);
        }
    });
    
    // X-axis date/time labels
    pdf.setTextColor(100, 110, 120);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    for (let i = 0; i < data.length; i += step) {
        const p = points[i];
        const dateStr = dates[i] || '';
        // Format date: extract month/year or quarter
        let displayDate = '';
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            displayDate = parts[1] + '/' + parts[0].slice(-2);  // MM/YY format
        } else {
            displayDate = dateStr;
        }
        const labelW = pdf.getTextWidth(displayDate);
        pdf.text(displayDate, p.x - labelW/2, chartY + chartH + 5);
    }
    
    // Legend
    pdf.setFontSize(6);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    // Actual legend
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(1.5);
    pdf.line(chartX, chartY + chartH + 9, chartX + 6, chartY + chartH + 9);
    pdf.text('Actual', chartX + 8, chartY + chartH + 10);
    
    // Target legend
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineDash([1.5, 1.5]);
    pdf.line(chartX + 25, chartY + chartH + 9, chartX + 31, chartY + chartH + 9);
    pdf.setLineDash([]);
    pdf.setTextColor(180, 180, 180);
    pdf.text('Target', chartX + 33, chartY + chartH + 10);
}

// Professional text slide helper
function addProfessionalTextSlide(pdf, W, H, M, title, content, pageNum, totalPages) {
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Gradient top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    // Title with left accent
    pdf.setFillColor(16, 185, 129);
    pdf.rect(M, 18, 4, 20, 'F');
    
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M + 12, 33);
    
    // Content box with border
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(1);
    pdf.roundedRect(M, 48, W - 2*M, H - 70, 4, 4, 'S');
    
    // Content text
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const maxWidth = W - 2*M - 20;
    const lines = pdf.splitTextToSize(content, maxWidth);
    const lineHeight = 6;
    let y = 60;
    
    for (let i = 0; i < lines.length && y < H - 30; i++) {
        pdf.text(lines[i], M + 10, y);
        y += lineHeight;
    }
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 10);
}

// Professional metrics slide helper
function addProfessionalMetricsSlide(pdf, W, H, M, stats, pageNum, totalPages) {
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Gradient top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    // Title
    pdf.setFillColor(16, 185, 129);
    pdf.rect(M, 18, 4, 20, 'F');
    
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Performance Metrics', M + 12, 33);
    
    // Metrics cards - 3x2 grid
    const metrics = [
        { label: 'Total Production', value: stats.totalProduction, color: [16, 185, 129] },
        { label: 'Total Energy', value: stats.totalEnergy, color: [59, 130, 246] },
        { label: 'Avg Efficiency', value: stats.avgEfficiency, color: [139, 92, 246] },
        { label: 'Departments', value: stats.departments?.toString() || 'N/A', color: [245, 158, 11] },
        { label: 'Data Points', value: stats.dataPoints?.toString() || 'N/A', color: [239, 68, 68] },
        { label: 'Period', value: stats.period || 'N/A', color: [100, 116, 139] }
    ];
    
    const cardW = (W - 2*M - 30) / 3;
    const cardH = 55;
    const startY = 55;
    
    metrics.forEach((m, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = M + col * (cardW + 15);
        const y = startY + row * (cardH + 15);
        
        // Card background
        pdf.setFillColor(250, 250, 250);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
        
        // Left accent
        pdf.setFillColor(m.color[0], m.color[1], m.color[2]);
        pdf.rect(x, y + 10, 4, cardH - 20, 'F');
        
        // Border
        pdf.setDrawColor(m.color[0], m.color[1], m.color[2]);
        pdf.setLineWidth(1);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'S');
        
        // Label
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(m.label, x + 12, y + 18);
        
        // Value
        pdf.setTextColor(30, 58, 95);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(m.value), x + 12, y + 40);
    });
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 10);
}

// Professional charts page helper
function addProfessionalChartsPage(pdf, W, H, M, charts, pageNum, totalPages) {
    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Gradient top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 4, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 4, 'F');
    
    // Title with accent
    pdf.setFillColor(59, 130, 246);
    pdf.rect(M, 12, 4, 16, 'F');
    
    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Charts', M + 10, 24);
    
    // Chart area - optimized for 2 charts side by side
    const chartY = 35;
    const chartH = H - 50;
    const gap = 10;
    const chartW = charts.length === 1 ? W - 2*M : (W - 2*M - gap) / 2;
    
    charts.forEach((chart, i) => {
        const x = M + i * (chartW + gap);
        
        try {
            // Light gray background for chart area
            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(x, chartY, chartW, chartH, 3, 3, 'F');
            
            // Gradient border effect
            pdf.setDrawColor(16, 185, 129);
            pdf.setLineWidth(1.5);
            pdf.line(x, chartY, x, chartY + chartH);
            
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(1.5);
            pdf.line(x + chartW, chartY, x + chartW, chartY + chartH);
            
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(x, chartY, x + chartW, chartY);
            pdf.line(x, chartY + chartH, x + chartW, chartY + chartH);
            
            // Chart title bar
            if (chart.title) {
                pdf.setFillColor(30, 58, 95);
                pdf.rect(x, chartY, chartW, 18, 'F');
                
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                const titleText = chart.title.length > 40 ? chart.title.substring(0, 40) + '...' : chart.title;
                pdf.text(titleText, x + 8, chartY + 12);
            }
            
            // Calculate image dimensions - fill the available space
            const titleOffset = chart.title ? 20 : 5;
            const availableH = chartH - titleOffset - 10;
            const availableW = chartW - 10;
            
            let imgW = availableW;
            let imgH = imgW / (chart.ratio || 1.5);
            
            // If too tall, scale by height instead
            if (imgH > availableH) {
                imgH = availableH;
                imgW = imgH * (chart.ratio || 1.5);
            }
            
            // Center the image
            const offsetX = x + (chartW - imgW) / 2;
            const offsetY = chartY + titleOffset + (availableH - imgH) / 2 + 5;
            
            pdf.addImage(chart.data, 'PNG', offsetX, offsetY, imgW, imgH);
        } catch (e) {
            console.log('Error adding chart to PDF:', e);
            // Draw placeholder
            pdf.setFillColor(240, 240, 240);
            pdf.roundedRect(x, chartY, chartW, chartH, 3, 3, 'F');
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(12);
            pdf.text('Chart not available', x + chartW/2 - 25, chartY + chartH/2);
        }
    });
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Page ' + pageNum + ' of ' + totalPages, W - M - 25, H - 10);
}

// Helper: Add text slide
function addTextSlide(pdf, W, H, M, title, content, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 25);
    
    // Content box
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(1);
    pdf.roundedRect(M, 35, W - 2*M, H - 70, 4, 4, 'S');
    
    // Content text
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const cleanText = (content || '').replace(/[^\x00-\x7F]/g, '');
    const lines = pdf.splitTextToSize(cleanText, W - 2*M - 20);
    const maxLines = Math.floor((H - 90) / 6);
    
    lines.slice(0, maxLines).forEach((line, i) => {
        pdf.text(line, M + 10, 48 + (i * 6));
    });
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text(`Page ${pageNum} of ${totalPages}`, W - M - 30, H - 10);
}

// Helper: Add metrics slide
function addMetricsSlide(pdf, W, H, M, stats, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Metrics', M, 25);
    
    // Metrics cards
    const metrics = [
        {label: 'Production Actual', value: Math.round(stats.productionActual || 0).toLocaleString(), color: [16, 185, 129]},
        {label: 'Production Target', value: Math.round(stats.productionTarget || 0).toLocaleString(), color: [100, 116, 139]},
        {label: 'Energy Actual', value: Math.round(stats.energyActual || 0).toLocaleString(), color: [59, 130, 246]},
        {label: 'Energy Target', value: Math.round(stats.energyTarget || 0).toLocaleString(), color: [100, 116, 139]},
        {label: 'Production %', value: (stats.productionAchievement || 0).toFixed(1) + '%', color: [16, 185, 129]},
        {label: 'Energy %', value: (stats.energyAchievement || 0).toFixed(1) + '%', color: [59, 130, 246]}
    ];
    
    const cardW = 80, cardH = 50, gap = 10;
    
    metrics.forEach((m, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + col * (cardW + gap);
        const y = 40 + row * (cardH + gap);
        
        pdf.setFillColor(250, 250, 250);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
        
        pdf.setDrawColor(m.color[0], m.color[1], m.color[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'S');
        
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.text(m.label, x + 8, y + 18);
        
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(m.value, x + 8, y + 38);
        pdf.setFont('helvetica', 'normal');
    });
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text(`Page ${pageNum} of ${totalPages}`, W - M - 30, H - 10);
}

// Helper: Add charts page
function addChartsPage(pdf, W, H, M, charts, pageNum, totalPages) {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Charts', M, 25);
    
    const chartY = 35;
    const chartH = H - 60;
    const chartW = charts.length === 1 ? W - 2*M : (W - 3*M) / 2;
    
    charts.forEach((chart, i) => {
        const x = M + i * (chartW + M);
        
        try {
            // Maintain aspect ratio
            let w = chartW;
            let h = w / (chart.ratio || 1.5);
            if (h > chartH) {
                h = chartH;
                w = h * (chart.ratio || 1.5);
            }
            
            const offsetX = x + (chartW - w) / 2;
            const offsetY = chartY + (chartH - h) / 2;
            
            pdf.addImage(chart.data, 'PNG', offsetX, offsetY, w, h);
        } catch (e) {
            console.log('Error adding chart image:', e);
        }
    });
    
    // Footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text(`Page ${pageNum} of ${totalPages}`, W - M - 30, H - 10);
}

// Professional Cover Slide
function makeProfessionalCover(pdf, W, H, M, quarter, year, dateRangeLabel, logoDataUrl) {
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Gradient border effect (top and bottom)
    pdf.setFillColor(16, 185, 129); // Emerald
    pdf.rect(0, 0, W, 4, 'F');
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(0, H - 4, W, 4, 'F');
    
    // Left accent bar
    const gradient = [[16, 185, 129], [34, 197, 94], [59, 130, 246]];
    gradient.forEach((c, i) => {
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.rect(0, 50 + (i * 40), 6, 40, 'F');
    });
    
    // Logo (top right corner)
    if (logoDataUrl) {
        try {
            pdf.addImage(logoDataUrl, 'PNG', W - 80, 15, 60, 20);
        } catch (e) {
            console.log('Could not add logo to PDF:', e);
        }
    }
    
    // Main Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(52);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', M + 15, 85);
    
    // Subtitle
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Upstream Operations Analysis', M + 15, 105);
    
    // Period Badge with Date Range
    if (quarter) {
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(M + 15, 125, 100, 30, 4, 4, 'F');
        pdf.setFillColor(59, 130, 246);
        pdf.roundedRect(M + 120, 125, 80, 30, 4, 4, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Q${quarter}`, M + 45, 145);
        pdf.text(`${year}`, M + 145, 145);
    } else {
        // Use date range label as single badge
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(M + 15, 125, 180, 30, 4, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(dateRangeLabel || `Year ${year}`, M + 50, 145);
    }
    
    // Report Period (show date range instead of today's date)
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Report Period: ${dateRangeLabel}`, M + 15, 175);
    
    // Generated date (smaller, less prominent)
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}`, M + 15, 185);
    
    // Footer
    pdf.setTextColor(203, 213, 225);
    pdf.setFontSize(11);
    pdf.text('Confidential | AI Generated Report', M + 15, H - 15);
}

// Professional Content Slide with transparent box and gradient border
function makeProfessionalSlide(pdf, W, H, M, title, content, icon, pageNum, totalPages, dateRangeLabel) {
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top gradient bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 30);
    
    // Date range label (top right)
    if (dateRangeLabel) {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dateRangeLabel, W - M - pdf.getTextWidth(dateRangeLabel), 30);
    }
    
    // Content box with gradient border effect
    const boxY = 45;
    const boxH = H - 80;
    const boxW = W - (2 * M);
    
    // Draw border (gradient effect - left side green, right side blue)
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(2);
    pdf.line(M, boxY, M, boxY + boxH); // Left
    pdf.line(M, boxY, M + boxW/2, boxY); // Top left
    
    pdf.setDrawColor(59, 130, 246);
    pdf.line(M + boxW/2, boxY, M + boxW, boxY); // Top right
    pdf.line(M + boxW, boxY, M + boxW, boxY + boxH); // Right
    
    pdf.setDrawColor(100, 116, 139);
    pdf.setLineWidth(0.5);
    pdf.line(M, boxY + boxH, M + boxW, boxY + boxH); // Bottom
    
    // Light background for content
    pdf.setFillColor(250, 251, 252);
    pdf.rect(M + 1, boxY + 1, boxW - 2, boxH - 2, 'F');
    
    // Content text
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const clean = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[^\x00-\x7F]/g, '');
    const lines = pdf.splitTextToSize(clean, boxW - 20);
    const lineHeight = 7;
    const maxLines = Math.floor((boxH - 20) / lineHeight);
    
    lines.slice(0, maxLines).forEach((line, i) => {
        pdf.text(line, M + 10, boxY + 18 + (i * lineHeight));
    });
    
    // Footer
    makeProfessionalFooter(pdf, W, H, M, pageNum, totalPages);
}

// Professional Metrics Slide
function makeProfessionalMetricsSlide(pdf, W, H, M, stats, pageNum, totalPages, dateRangeLabel) {
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top gradient bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Metrics', M, 30);
    
    // Date range label (top right)
    if (dateRangeLabel) {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dateRangeLabel, W - M - pdf.getTextWidth(dateRangeLabel), 30);
    }
    
    // Metrics cards
    const metrics = [
        {label: 'Production Actual', value: Math.round(stats.productionActual).toLocaleString(), color: [16, 185, 129]},
        {label: 'Production Target', value: Math.round(stats.productionTarget).toLocaleString(), color: [100, 116, 139]},
        {label: 'Energy Actual', value: Math.round(stats.energyActual).toLocaleString(), color: [59, 130, 246]},
        {label: 'Energy Target', value: Math.round(stats.energyTarget).toLocaleString(), color: [100, 116, 139]},
        {label: 'Production Achievement', value: stats.productionAchievement.toFixed(1) + '%', color: [16, 185, 129]},
        {label: 'Energy Achievement', value: stats.energyAchievement.toFixed(1) + '%', color: [59, 130, 246]}
    ];
    
    const cardW = 85;
    const cardH = 55;
    const gap = 8;
    const startY = 50;
    
    metrics.forEach((m, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + (col * (cardW + gap));
        const y = startY + (row * (cardH + gap));
        
        // Card with gradient border
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'F');
        
        pdf.setDrawColor(m.color[0], m.color[1], m.color[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cardW, cardH, 4, 4, 'S');
        
        // Left accent
        pdf.setFillColor(m.color[0], m.color[1], m.color[2]);
        pdf.rect(x, y + 4, 4, cardH - 8, 'F');
        
        // Label
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(m.label, x + 12, y + 18);
        
        // Value
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text(m.value, x + 12, y + 40);
    });
    
    // Footer
    makeProfessionalFooter(pdf, W, H, M, pageNum, totalPages);
}

// Professional Footer
function makeProfessionalFooter(pdf, W, H, M, pageNum, totalPages) {
    // Bottom line
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(1);
    pdf.line(M, H - 20, M + 50, H - 20);
    pdf.setDrawColor(59, 130, 246);
    pdf.line(M + 50, H - 20, W - M, H - 20);
    
    // Footer text
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', M, H - 10);
    
    // Page number
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${pageNum}`, W - M - 20, H - 10);
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text(` / ${totalPages}`, W - M - 14, H - 10);
}

// Charts Slide - displays 2 charts side by side with proper layout
function makeChartsSlide(pdf, W, H, M, chartImages, pageNum, totalPages, dateRangeLabel) {
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
    
    // Top gradient bar
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, W/2, 3, 'F');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(W/2, 0, W/2, 3, 'F');
    
    // Title
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Charts', M, 25);
    
    // Date range label (top right)
    if (dateRangeLabel) {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dateRangeLabel, W - M - pdf.getTextWidth(dateRangeLabel), 25);
    }
    
    // Chart area
    const chartY = 35;
    const availableH = H - 60; // Space for header and footer
    const gap = 8;
    
    if (chartImages.length === 1) {
        // Single chart - center it and make it larger
        const chartObj = chartImages[0];
        const imgData = chartObj.data || chartObj;
        const aspectRatio = chartObj.aspectRatio || 1.5;
        
        const availableW = W - (2 * M);
        let chartW = availableW * 0.85;
        let chartH = chartW / aspectRatio;
        
        if (chartH > availableH * 0.9) {
            chartH = availableH * 0.9;
            chartW = chartH * aspectRatio;
        }
        
        const x = M + (availableW - chartW) / 2;
        const y = chartY + (availableH - chartH) / 2;
        
        // Border
        pdf.setDrawColor(16, 185, 129);
        pdf.setLineWidth(1.5);
        pdf.roundedRect(x - 2, y - 2, chartW + 4, chartH + 4, 4, 4, 'S');
        
        // Background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x - 1, y - 1, chartW + 2, chartH + 2, 3, 3, 'F');
        
        try {
            pdf.addImage(imgData, 'PNG', x, y, chartW, chartH);
        } catch (e) {
            console.log('Could not add chart:', e);
        }
        
    } else if (chartImages.length >= 2) {
        // Two charts side by side
        const singleChartW = (W - (3 * M) - gap) / 2;
        
        chartImages.slice(0, 2).forEach((chartObj, i) => {
            const imgData = chartObj.data || chartObj;
            const aspectRatio = chartObj.aspectRatio || 1.4;
            const title = chartObj.title || '';
            
            // Calculate chart dimensions maintaining aspect ratio
            let chartW = singleChartW;
            let chartH = chartW / aspectRatio;
            
            // Limit height
            if (chartH > availableH - 15) {
                chartH = availableH - 15;
                chartW = chartH * aspectRatio;
                if (chartW > singleChartW) chartW = singleChartW;
            }
            
            // Position
            const x = M + (i * (singleChartW + gap + M));
            const y = chartY + (availableH - chartH) / 2;
            
            // Border with gradient color based on position
            if (i === 0) {
                pdf.setDrawColor(16, 185, 129); // Green for left
            } else {
                pdf.setDrawColor(59, 130, 246); // Blue for right
            }
            pdf.setLineWidth(1.5);
            pdf.roundedRect(x - 2, y - 2, chartW + 4, chartH + 4, 4, 4, 'S');
            
            // White background
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(x - 1, y - 1, chartW + 2, chartH + 2, 3, 3, 'F');
            
            // Add chart image
            try {
                pdf.addImage(imgData, 'PNG', x, y, chartW, chartH);
            } catch (e) {
                console.log('Could not add chart:', e);
                pdf.setTextColor(148, 163, 184);
                pdf.setFontSize(12);
                pdf.text('Chart unavailable', x + chartW/2 - 20, y + chartH/2);
            }
        });
    }
    
    // Footer
    makeProfessionalFooter(pdf, W, H, M, pageNum, totalPages);
}

function makeHeader(pdf, title, W, H, M, color) {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, W, 58, 'F');
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(0, 53, W, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 38);
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.2);
    pdf.line(M, 46, M + 90, 46);
}

function makeInsights(pdf, M, startY, W) {
    const texts = [
        'Production rate exceeded target by 1.06%',
        'Throughput utilization at 91.67%',
        'Refining yields decreased by 1.71%',
        'Average downtime: 41 minutes daily',
        'Top performers: UP-J83 and UP-K74',
        'Bottlenecks in midstream processing'
    ];
    
    const colors = [[16,185,129], [245,158,11], [239,68,68], [239,68,68], [59,130,246], [245,158,11]];
    
    const cw = 86;
    const ch = 26;
    const sp = 8;
    
    texts.forEach((txt, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + (col * (cw + sp));
        const y = startY + (row * (ch + sp));
        
        pdf.setFillColor(252, 252, 252);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'F');
        
        pdf.setDrawColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'S');
        
        pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.circle(x + 11, y + 4.5, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 10, y + 6.5);
        
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        
        const lines = pdf.splitTextToSize(txt, cw - 12);
        lines.slice(0, 2).forEach((line, li) => {
            pdf.text(line, x + 7, y + 15 + (li * 5.5));
        });
    });
}

async function makeCharts(pdf, M, W, H) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const cw = 85;
    const ch = 75;
    const sp = 7;
    const sy = 60;
    
    for (let i = 0; i < charts.length; i++) {
        const elem = document.getElementById(charts[i]);
        if (elem) {
            try {
                const canvas = await html2canvas(elem, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const img = canvas.toDataURL('image/png', 0.98);
                const x = M + (i * (cw + sp));
                
                pdf.setFillColor(248, 248, 248);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'F');
                
                pdf.setDrawColor(210, 210, 210);
                pdf.setLineWidth(1.5);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'S');
                
                pdf.addImage(img, 'PNG', x + 2.5, sy + 2.5, cw - 5, ch - 5);
            } catch (e) {
                console.error('Chart error:', e);
            }
        }
    }
}

function makeMetrics(pdf, stats, M, W, H) {
    const my = 144;
    const cw = 85;
    const ch = 38;
    const sp = 7;
    
    const data = [
        {t: 'PRODUCTION', v: Math.round(stats.productionActual).toLocaleString(), 
         tg: Math.round(stats.productionTarget).toLocaleString(), c: [59,130,246]},
        {t: 'ENERGY', v: Math.round(stats.energyActual).toLocaleString(), 
         tg: Math.round(stats.energyTarget).toLocaleString(), c: [245,158,11]},
        {t: 'ACHIEVEMENT', v: Math.round(stats.productionAchievement) + '%', 
         tg: Math.round(stats.energyAchievement) + '%', c: [16,185,129]}
    ];
    
    data.forEach((d, i) => {
        const x = M + (i * (cw + sp));
        
        pdf.setFillColor(d.c[0], d.c[1], d.c[2]);
        pdf.roundedRect(x, my, cw, ch, 6, 6, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(d.t, x + 9, my + 10);
        
        pdf.setFontSize(24);
        pdf.text(d.v, x + 9, my + 25);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Target: ' + d.tg, x + 9, my + 33);
    });
}

async function makeDeptCharts(pdf, M, W, H) {
    try {
        const dept = document.getElementById('departmentChart');
        if (dept) {
            const c1 = await html2canvas(dept, {scale: 3, backgroundColor: '#fff', logging: false});
            const img1 = c1.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img1, 'PNG', M + 3, 67, 126, 112);
        }
        
        const trend = document.getElementById('trendChart');
        if (trend) {
            const c2 = await html2canvas(trend, {scale: 3, backgroundColor: '#fff', logging: false});
            const img2 = c2.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img2, 'PNG', M + 142, 67, 126, 112);
        }
    } catch (e) {
        console.error('Dept charts error:', e);
    }
}

function makeWarning(pdf, txt, x, y, w) {
    const h = 110;
    
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, w, h, 6, 6, 'F');
    
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(3);
    pdf.roundedRect(x, y, w, h, 6, 6, 'S');
    
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y + 3, 7, h - 6, 'F');
    
    pdf.setFontSize(32);
    pdf.text('⚠️', x + 18, y + 28);
    
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, w - 40);
    
    lines.slice(0, 13).forEach((line, i) => {
        pdf.text(line, x + 40, y + 18 + (i * 6.8));
    });
}

function makeRecs(pdf, txt, M, sy, W, H) {
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recs = clean.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cw = (W - 3*M) / 2;
    const ch = 52;
    const sp = 12;
    const colors = [[59,130,246], [16,185,129], [245,158,11], [139,92,246], [236,72,153]];
    
    recs.forEach((rec, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = M + (col * (cw + sp));
        const y = sy + (row * (ch + sp));
        
        if (y + ch > H - 25) return;
        
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'F');
        
        const c = colors[i % colors.length];
        pdf.setDrawColor(c[0], c[1], c[2]);
        pdf.setLineWidth(2.5);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'S');
        
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.circle(x + 12, y + 7, 5.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 11, y + 10);
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(rec.trim(), cw - 18);
        lines.slice(0, 6).forEach((line, li) => {
            pdf.text(line, x + 10, y + 24 + (li * 6.5));
        });
    });
}

function makeFooter(pdf, num, total, W, H, M) {
    const fy = H - 18;
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, fy, W, 18, 'F');
    
    pdf.setDrawColor(215, 215, 215);
    pdf.setLineWidth(1);
    pdf.line(M, fy, W - M, fy);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', M, H - 7);
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(num.toString(), W - M - 26, H - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text('/ ' + total, W - M - 19, H - 6.5);
}

function makeText(pdf, txt, x, y, mw, mh) {
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, mw);
    const lh = 8;
    const max = Math.floor(mh / lh);
    
    lines.slice(0, max).forEach((line, i) => {
        pdf.text(line, x, y + (i * lh));
    });
    
    if (lines.length > max) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('...', x, y + (max * lh) + 4);
    }
}

function makeCover(pdf, W, H, M, quarter) {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2.5);
    pdf.line(M, 55, M + 130, 55);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(70);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', M, 88);
    
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', M, 120);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(M, 138, 115, 26, 6, 6, 'F');
    
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, M + 12, 154);
    
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text(new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}), M, 176);
    
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI Generated Report | Confidential', M, H - 15);
}

function makeHeader(pdf, title, W, H, M, color) {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, W, 58, 'F');
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(0, 53, W, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 38);
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.2);
    pdf.line(M, 46, M + 90, 46);
}

function makeInsights(pdf, M, startY, W) {
    const texts = [
        'Production rate exceeded target by 1.06%',
        'Throughput utilization at 91.67%',
        'Refining yields decreased by 1.71%',
        'Average downtime: 41 minutes daily',
        'Top performers: UP-J83 and UP-K74',
        'Bottlenecks in midstream processing'
    ];
    
    const colors = [[16,185,129], [245,158,11], [239,68,68], [239,68,68], [59,130,246], [245,158,11]];
    
    const cw = 86;
    const ch = 26;
    const sp = 8;
    
    texts.forEach((txt, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + (col * (cw + sp));
        const y = startY + (row * (ch + sp));
        
        pdf.setFillColor(252, 252, 252);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'F');
        
        pdf.setDrawColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'S');
        
        pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.circle(x + 11, y + 4.5, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 10, y + 6.5);
        
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        
        const lines = pdf.splitTextToSize(txt, cw - 12);
        lines.slice(0, 2).forEach((line, li) => {
            pdf.text(line, x + 7, y + 15 + (li * 5.5));
        });
    });
}

async function makeCharts(pdf, M, W, H) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const cw = 85;
    const ch = 75;
    const sp = 7;
    const sy = 60;
    
    for (let i = 0; i < charts.length; i++) {
        const elem = document.getElementById(charts[i]);
        if (elem) {
            try {
                const canvas = await html2canvas(elem, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const img = canvas.toDataURL('image/png', 0.98);
                const x = M + (i * (cw + sp));
                
                pdf.setFillColor(248, 248, 248);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'F');
                
                pdf.setDrawColor(210, 210, 210);
                pdf.setLineWidth(1.5);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'S');
                
                pdf.addImage(img, 'PNG', x + 2.5, sy + 2.5, cw - 5, ch - 5);
            } catch (e) {
                console.error('Chart error:', e);
            }
        }
    }
}

function makeMetrics(pdf, stats, M, W, H) {
    const my = 144;
    const cw = 85;
    const ch = 38;
    const sp = 7;
    
    const data = [
        {t: 'PRODUCTION', v: Math.round(stats.productionActual).toLocaleString(), 
         tg: Math.round(stats.productionTarget).toLocaleString(), c: [59,130,246]},
        {t: 'ENERGY', v: Math.round(stats.energyActual).toLocaleString(), 
         tg: Math.round(stats.energyTarget).toLocaleString(), c: [245,158,11]},
        {t: 'ACHIEVEMENT', v: Math.round(stats.productionAchievement) + '%', 
         tg: Math.round(stats.energyAchievement) + '%', c: [16,185,129]}
    ];
    
    data.forEach((d, i) => {
        const x = M + (i * (cw + sp));
        
        pdf.setFillColor(d.c[0], d.c[1], d.c[2]);
        pdf.roundedRect(x, my, cw, ch, 6, 6, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(d.t, x + 9, my + 10);
        
        pdf.setFontSize(24);
        pdf.text(d.v, x + 9, my + 25);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Target: ' + d.tg, x + 9, my + 33);
    });
}

async function makeDeptCharts(pdf, M, W, H) {
    try {
        const dept = document.getElementById('departmentChart');
        if (dept) {
            const c1 = await html2canvas(dept, {scale: 3, backgroundColor: '#fff', logging: false});
            const img1 = c1.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img1, 'PNG', M + 3, 67, 126, 112);
        }
        
        const trend = document.getElementById('trendChart');
        if (trend) {
            const c2 = await html2canvas(trend, {scale: 3, backgroundColor: '#fff', logging: false});
            const img2 = c2.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img2, 'PNG', M + 142, 67, 126, 112);
        }
    } catch (e) {
        console.error('Dept charts error:', e);
    }
}

function makeWarning(pdf, txt, x, y, w) {
    const h = 110;
    
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, w, h, 6, 6, 'F');
    
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(3);
    pdf.roundedRect(x, y, w, h, 6, 6, 'S');
    
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y + 3, 7, h - 6, 'F');
    
    pdf.setFontSize(32);
    pdf.text('⚠️', x + 18, y + 28);
    
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, w - 40);
    
    lines.slice(0, 13).forEach((line, i) => {
        pdf.text(line, x + 40, y + 18 + (i * 6.8));
    });
}

function makeRecs(pdf, txt, M, sy, W, H) {
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recs = clean.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cw = (W - 3*M) / 2;
    const ch = 52;
    const sp = 12;
    const colors = [[59,130,246], [16,185,129], [245,158,11], [139,92,246], [236,72,153]];
    
    recs.forEach((rec, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = M + (col * (cw + sp));
        const y = sy + (row * (ch + sp));
        
        if (y + ch > H - 25) return;
        
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'F');
        
        const c = colors[i % colors.length];
        pdf.setDrawColor(c[0], c[1], c[2]);
        pdf.setLineWidth(2.5);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'S');
        
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.circle(x + 12, y + 7, 5.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 11, y + 10);
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(rec.trim(), cw - 18);
        lines.slice(0, 6).forEach((line, li) => {
            pdf.text(line, x + 10, y + 24 + (li * 6.5));
        });
    });
}

function makeFooter(pdf, num, total, W, H, M) {
    const fy = H - 18;
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, fy, W, 18, 'F');
    
    pdf.setDrawColor(215, 215, 215);
    pdf.setLineWidth(1);
    pdf.line(M, fy, W - M, fy);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', M, H - 7);
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(num.toString(), W - M - 26, H - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text('/ ' + total, W - M - 19, H - 6.5);
}

function makeText(pdf, txt, x, y, mw, mh) {
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, mw);
    const lh = 8;
    const max = Math.floor(mh / lh);
    
    lines.slice(0, max).forEach((line, i) => {
        pdf.text(line, x, y + (i * lh));
    });
    
    if (lines.length > max) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('...', x, y + (max * lh) + 4);
    }
}

function makeCover(pdf, W, H, M, quarter) {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2.5);
    pdf.line(M, 55, M + 130, 55);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(70);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', M, 88);
    
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', M, 120);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(M, 138, 115, 26, 6, 6, 'F');
    
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, M + 12, 154);
    
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text(new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}), M, 176);
    
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI Generated Report | Confidential', M, H - 15);
}

function makeHeader(pdf, title, W, H, M, color) {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, W, 58, 'F');
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(0, 53, W, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 38);
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.2);
    pdf.line(M, 46, M + 90, 46);
}

function makeInsights(pdf, M, startY, W) {
    const texts = [
        'Production rate exceeded target by 1.06%',
        'Throughput utilization at 91.67%',
        'Refining yields decreased by 1.71%',
        'Average downtime: 41 minutes daily',
        'Top performers: UP-J83 and UP-K74',
        'Bottlenecks in midstream processing'
    ];
    
    const colors = [[16,185,129], [245,158,11], [239,68,68], [239,68,68], [59,130,246], [245,158,11]];
    
    const cw = 86;
    const ch = 26;
    const sp = 8;
    
    texts.forEach((txt, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + (col * (cw + sp));
        const y = startY + (row * (ch + sp));
        
        pdf.setFillColor(252, 252, 252);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'F');
        
        pdf.setDrawColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'S');
        
        pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.circle(x + 11, y + 4.5, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 10, y + 6.5);
        
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        
        const lines = pdf.splitTextToSize(txt, cw - 12);
        lines.slice(0, 2).forEach((line, li) => {
            pdf.text(line, x + 7, y + 15 + (li * 5.5));
        });
    });
}

async function makeCharts(pdf, M, W, H) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const cw = 85;
    const ch = 75;
    const sp = 7;
    const sy = 60;
    
    for (let i = 0; i < charts.length; i++) {
        const elem = document.getElementById(charts[i]);
        if (elem) {
            try {
                const canvas = await html2canvas(elem, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const img = canvas.toDataURL('image/png', 0.98);
                const x = M + (i * (cw + sp));
                
                pdf.setFillColor(248, 248, 248);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'F');
                
                pdf.setDrawColor(210, 210, 210);
                pdf.setLineWidth(1.5);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'S');
                
                pdf.addImage(img, 'PNG', x + 2.5, sy + 2.5, cw - 5, ch - 5);
            } catch (e) {
                console.error('Chart error:', e);
            }
        }
    }
}

function makeMetrics(pdf, stats, M, W, H) {
    const my = 144;
    const cw = 85;
    const ch = 38;
    const sp = 7;
    
    const data = [
        {t: 'PRODUCTION', v: Math.round(stats.productionActual).toLocaleString(), 
         tg: Math.round(stats.productionTarget).toLocaleString(), c: [59,130,246]},
        {t: 'ENERGY', v: Math.round(stats.energyActual).toLocaleString(), 
         tg: Math.round(stats.energyTarget).toLocaleString(), c: [245,158,11]},
        {t: 'ACHIEVEMENT', v: Math.round(stats.productionAchievement) + '%', 
         tg: Math.round(stats.energyAchievement) + '%', c: [16,185,129]}
    ];
    
    data.forEach((d, i) => {
        const x = M + (i * (cw + sp));
        
        pdf.setFillColor(d.c[0], d.c[1], d.c[2]);
        pdf.roundedRect(x, my, cw, ch, 6, 6, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(d.t, x + 9, my + 10);
        
        pdf.setFontSize(24);
        pdf.text(d.v, x + 9, my + 25);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Target: ' + d.tg, x + 9, my + 33);
    });
}

async function makeDeptCharts(pdf, M, W, H) {
    try {
        const dept = document.getElementById('departmentChart');
        if (dept) {
            const c1 = await html2canvas(dept, {scale: 3, backgroundColor: '#fff', logging: false});
            const img1 = c1.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img1, 'PNG', M + 3, 67, 126, 112);
        }
        
        const trend = document.getElementById('trendChart');
        if (trend) {
            const c2 = await html2canvas(trend, {scale: 3, backgroundColor: '#fff', logging: false});
            const img2 = c2.toDataURL('image/png', 0.98);
            
            pdf.setFillColor(248, 248, 248);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'F');
            
            pdf.setDrawColor(210, 210, 210);
            pdf.setLineWidth(1.5);
            pdf.roundedRect(M + 139, 64, 132, 118, 5, 5, 'S');
            
            pdf.addImage(img2, 'PNG', M + 142, 67, 126, 112);
        }
    } catch (e) {
        console.error('Dept charts error:', e);
    }
}

function makeWarning(pdf, txt, x, y, w) {
    const h = 112;
    
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, w, h, 6, 6, 'F');
    
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(3);
    pdf.roundedRect(x, y, w, h, 6, 6, 'S');
    
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 7, h, 'F');
    
    pdf.setFontSize(34);
    pdf.text('⚠️', x + 18, y + 30);
    
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, w - 40);
    
    lines.slice(0, 11).forEach((line, i) => {
        pdf.text(line, x + 40, y + 20 + (i * 7.5));
    });
}

function makeRecs(pdf, txt, M, sy, W, H) {
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recs = clean.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cw = (W - 3*M) / 2;
    const ch = 48;
    const sp = 12;
    const colors = [[59,130,246], [16,185,129], [245,158,11], [139,92,246], [236,72,153]];
    
    recs.forEach((rec, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = M + (col * (cw + sp));
        const y = sy + (row * (ch + sp));
        
        if (y + ch > H - 30) return;
        
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'F');
        
        const c = colors[i % colors.length];
        pdf.setDrawColor(c[0], c[1], c[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cw, ch, 6, 6, 'S');
        
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.circle(x + 12, y + 6.5, 5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 11, y + 9);
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(12.5);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(rec.trim(), cw - 16);
        lines.slice(0, 5).forEach((line, li) => {
            pdf.text(line, x + 9, y + 23 + (li * 7));
        });
    });
}

function makeFooter(pdf, num, total, W, H, M) {
    const fy = H - 18;
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, fy, W, 18, 'F');
    
    pdf.setDrawColor(215, 215, 215);
    pdf.setLineWidth(1);
    pdf.line(M, fy, W - M, fy);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', M, H - 7);
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(num.toString(), W - M - 26, H - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text('/ ' + total, W - M - 19, H - 6.5);
}

function makeText(pdf, txt, x, y, mw, mh) {
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, mw);
    const lh = 8;
    const max = Math.floor(mh / lh);
    
    lines.slice(0, max).forEach((line, i) => {
        pdf.text(line, x, y + (i * lh));
    });
    
    if (lines.length > max) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('...', x, y + (max * lh) + 4);
    }
}

function makeCover(pdf, W, H, M, quarter) {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, W, H, 'F');
    
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2);
    pdf.line(M, 55, M + 120, 55);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(64);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', M, 85);
    
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', M, 115);
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(M, 135, 110, 24, 5, 5, 'F');
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, M + 10, 150);
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text(new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}), M, 172);
    
    pdf.setFontSize(13);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI Generated Report | Confidential', M, H - 15);
}

function makeHeader(pdf, title, W, H, M, color) {
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, W, 55, 'F');
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.rect(0, 50, W, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(38);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, M, 36);
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1);
    pdf.line(M, 43, M + 80, 43);
}

function makeInsights(pdf, M, startY, W) {
    const texts = [
        'Production rate exceeded target by 1.06%',
        'Throughput utilization at 91.67%',
        'Refining yields decreased by 1.71%',
        'Average downtime: 41 minutes daily',
        'Top performers: UP-J83 and UP-K74',
        'Bottlenecks in midstream processing'
    ];
    
    const colors = [[16,185,129], [245,158,11], [239,68,68], [239,68,68], [59,130,246], [245,158,11]];
    
    const cw = 83;
    const ch = 24;
    const sp = 9;
    
    texts.forEach((txt, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = M + (col * (cw + sp));
        const y = startY + (row * (ch + sp));
        
        pdf.setFillColor(250, 250, 250);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'F');
        
        pdf.setDrawColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.setLineWidth(1.5);
        pdf.roundedRect(x, y, cw, ch, 4, 4, 'S');
        
        pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
        pdf.circle(x + 10, y + 4, 4, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 9, y + 6);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        
        const lines = pdf.splitTextToSize(txt, cw - 10);
        lines.slice(0, 2).forEach((line, li) => {
            pdf.text(line, x + 6, y + 14 + (li * 5));
        });
    });
}

async function makeCharts(pdf, M, W, H) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const cw = 82;
    const ch = 68;
    const sp = 8;
    const sy = 58;
    
    for (let i = 0; i < charts.length; i++) {
        const elem = document.getElementById(charts[i]);
        if (elem) {
            try {
                const canvas = await html2canvas(elem, {
                    scale: 2.5,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                
                const img = canvas.toDataURL('image/png', 0.95);
                const x = M + (i * (cw + sp));
                
                pdf.setFillColor(245, 245, 245);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'F');
                
                pdf.setDrawColor(220, 220, 220);
                pdf.setLineWidth(1);
                pdf.roundedRect(x, sy, cw, ch, 5, 5, 'S');
                
                pdf.addImage(img, 'PNG', x + 2, sy + 2, cw - 4, ch - 4);
            } catch (e) {
                console.error('Chart error:', e);
            }
        }
    }
}

function makeMetrics(pdf, stats, M, W, H) {
    const my = 135;
    const cw = 82;
    const ch = 36;
    const sp = 8;
    
    const data = [
        {t: 'PRODUCTION', v: Math.round(stats.productionActual).toLocaleString(), 
         tg: Math.round(stats.productionTarget).toLocaleString(), c: [59,130,246]},
        {t: 'ENERGY', v: Math.round(stats.energyActual).toLocaleString(), 
         tg: Math.round(stats.energyTarget).toLocaleString(), c: [245,158,11]},
        {t: 'ACHIEVEMENT', v: Math.round(stats.productionAchievement) + '%', 
         tg: Math.round(stats.energyAchievement) + '%', c: [16,185,129]}
    ];
    
    data.forEach((d, i) => {
        const x = M + (i * (cw + sp));
        
        pdf.setFillColor(d.c[0], d.c[1], d.c[2]);
        pdf.roundedRect(x, my, cw, ch, 5, 5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(d.t, x + 8, my + 9);
        
        pdf.setFontSize(22);
        pdf.text(d.v, x + 8, my + 23);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Target: ' + d.tg, x + 8, my + 31);
    });
}

async function makeDeptCharts(pdf, M, W, H) {
    try {
        const dept = document.getElementById('departmentChart');
        if (dept) {
            const c1 = await html2canvas(dept, {scale: 2.5, backgroundColor: '#fff', logging: false});
            const img1 = c1.toDataURL('image/png', 0.95);
            
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(M, 62, 128, 115, 5, 5, 'F');
            pdf.addImage(img1, 'PNG', M + 3, 65, 122, 109);
        }
        
        const trend = document.getElementById('trendChart');
        if (trend) {
            const c2 = await html2canvas(trend, {scale: 2.5, backgroundColor: '#fff', logging: false});
            const img2 = c2.toDataURL('image/png', 0.95);
            
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(M + 135, 62, 128, 115, 5, 5, 'F');
            pdf.addImage(img2, 'PNG', M + 138, 65, 122, 109);
        }
    } catch (e) {
        console.error('Dept charts error:', e);
    }
}

function makeWarning(pdf, txt, x, y, w) {
    const h = 110;
    
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, w, h, 5, 5, 'F');
    
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(2.5);
    pdf.roundedRect(x, y, w, h, 5, 5, 'S');
    
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 6, h, 'F');
    
    pdf.setFontSize(32);
    pdf.text('⚠️', x + 16, y + 28);
    
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, w - 38);
    
    lines.slice(0, 12).forEach((line, i) => {
        pdf.text(line, x + 38, y + 18 + (i * 7));
    });
}

function makeRecs(pdf, txt, M, sy, W, H) {
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recs = clean.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cw = (W - 3*M) / 2;
    const ch = 43;
    const sp = 12;
    const colors = [[59,130,246], [16,185,129], [245,158,11], [139,92,246], [236,72,153]];
    
    recs.forEach((rec, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = M + (col * (cw + sp));
        const y = sy + (row * (ch + sp));
        
        if (y + ch > H - 30) return;
        
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cw, ch, 5, 5, 'F');
        
        const c = colors[i % colors.length];
        pdf.setDrawColor(c[0], c[1], c[2]);
        pdf.setLineWidth(1.8);
        pdf.roundedRect(x, y, cw, ch, 5, 5, 'S');
        
        pdf.setFillColor(c[0], c[1], c[2]);
        pdf.circle(x + 11, y + 6, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text((i+1).toString(), x + 10, y + 8);
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(rec.trim(), cw - 14);
        lines.slice(0, 5).forEach((line, li) => {
            pdf.text(line, x + 8, y + 20 + (li * 6.5));
        });
    });
}

function makeFooter(pdf, num, total, W, H, M) {
    const fy = H - 18;
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, fy, W, 18, 'F');
    
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.8);
    pdf.line(M, fy, W - M, fy);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', M, H - 7);
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(num.toString(), W - M - 25, H - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text('/ ' + total, W - M - 18, H - 6.5);
}

function makeText(pdf, txt, x, y, mw, mh) {
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const clean = txt.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(clean, mw);
    const lh = 7.5;
    const max = Math.floor(mh / lh);
    
    lines.slice(0, max).forEach((line, i) => {
        pdf.text(line, x, y + (i * lh));
    });
    
    if (lines.length > max) {
        pdf.setTextColor(150, 150, 150);
        pdf.text('...', x, y + (max * lh) + 4);
    }
}


// ========== COVER SLIDE ==========
function createCoverSlide(pdf, pageWidth, pageHeight, margin, quarter) {
    // Dark background
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative circles with opacity
    pdf.setFillColor(59, 130, 246);
    pdf.setDrawColor(59, 130, 246);
    pdf.circle(pageWidth - 50, 50, 100, 'FD');
    
    pdf.setFillColor(139, 92, 246);
    pdf.circle(pageWidth - 120, pageHeight - 30, 80, 'F');
    
    pdf.setFillColor(16, 185, 129);
    pdf.circle(70, pageHeight - 40, 75, 'F');
    
    // Decorative line
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2.5);
    pdf.line(margin, 58, margin + 130, 58);
    
    // Main title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(68);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', margin, 88);
    
    // Subtitle
    pdf.setFontSize(38);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', margin, 118);
    
    // Quarter badge with shadow
    pdf.setFillColor(30, 30, 30);
    pdf.roundedRect(margin + 3, 138, 120, 26, 6, 6, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin, 135, 120, 26, 6, 6, 'F');
    
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, margin + 12, 152);
    
    // Date
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    const dateText = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    pdf.text(dateText, margin, 178);
    
    // Footer
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI Generated Report | Confidential', margin, pageHeight - 15);
}

// ========== SLIDE HEADER ==========
function addSlideHeader(pdf, title, pageWidth, pageHeight, margin, rgb) {
    // Header background
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, 58, 'F');
    
    // Colored overlay
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.rect(0, 0, pageWidth, 58, 'F');
    
    // Bottom bar
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.rect(0, 53, pageWidth, 5, 'F');
    
    // Decorative circle
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth - 65, 29, 55, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, 38);
    
    // Underline
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.2);
    pdf.line(margin, 45, margin + 90, 45);
}

// ========== INSIGHT CARDS ==========
function addInsightCards(pdf, insights, margin, startY, pageWidth) {
    const cardWidth = 85;
    const cardHeight = 26;
    const spacing = 9;
    const cardsPerRow = 3;
    
    const colors = [
        [16, 185, 129],
        [245, 158, 11],
        [239, 68, 68],
        [239, 68, 68],
        [59, 130, 246],
        [245, 158, 11]
    ];
    
    insights.forEach((insight, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        // Shadow
        pdf.setFillColor(200, 200, 200);
        pdf.roundedRect(x + 2.5, y + 2.5, cardWidth, cardHeight, 4, 4, 'F');
        
        // Card background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
        
        // Colored border
        const color = colors[index];
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(1.5);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'S');
        
        // Top bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(x + 1, y + 1, cardWidth - 2, 7, 'F');
        
        // Number circle
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(x + 11, y + 4, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 10, y + 6);
        
        // Text
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        
        const textLines = pdf.splitTextToSize(insight, cardWidth - 12);
        textLines.slice(0, 2).forEach((line, lineIndex) => {
            pdf.text(line, x + 7, y + 15 + (lineIndex * 5.5));
        });
    });
}

// ========== CHARTS ==========
async function addChartsToSlide(pdf, margin, pageWidth, pageHeight) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const chartWidth = 84;
    const chartHeight = 72;
    const chartSpacing = 7;
    const startY = 60;
    
    for (let i = 0; i < charts.length; i++) {
        const chartElement = document.getElementById(charts[i]);
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                });
                
                const chartImg = canvas.toDataURL('image/png', 1.0);
                const x = margin + (i * (chartWidth + chartSpacing));
                
                addChartFrame(pdf, x, startY, chartWidth, chartHeight);
                pdf.addImage(chartImg, 'PNG', x + 3, startY + 3, chartWidth - 6, chartHeight - 6);
            } catch (err) {
                console.error('Chart error:', err);
            }
        }
    }
}

// ========== CHART FRAME ==========
function addChartFrame(pdf, x, y, width, height) {
    // Shadow
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(x + 3, y + 3, width, height, 6, 6, 'F');
    
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, height, 6, 6, 'F');
    
    // Border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(2);
    pdf.roundedRect(x, y, width, height, 6, 6, 'S');
}

// ========== METRICS CARDS ==========
function addMetricsCards(pdf, stats, margin, pageWidth, pageHeight) {
    const metricsY = 142;
    const cardWidth = 84;
    const cardHeight = 38;
    const cardSpacing = 7;
    
    const metrics = [
        {
            title: 'PRODUCTION',
            value: Math.round(stats.productionActual).toLocaleString(),
            target: Math.round(stats.productionTarget).toLocaleString(),
            color: [59, 130, 246]
        },
        {
            title: 'ENERGY',
            value: Math.round(stats.energyActual).toLocaleString(),
            target: Math.round(stats.energyTarget).toLocaleString(),
            color: [245, 158, 11]
        },
        {
            title: 'ACHIEVEMENT',
            value: Math.round(stats.productionAchievement) + '%',
            target: Math.round(stats.energyAchievement) + '%',
            color: [16, 185, 129]
        }
    ];
    
    metrics.forEach((metric, index) => {
        const x = margin + (index * (cardWidth + cardSpacing));
        
        // Shadow
        pdf.setFillColor(200, 200, 200);
        pdf.roundedRect(x + 3, metricsY + 3, cardWidth, cardHeight, 6, 6, 'F');
        
        // Colored background
        pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.roundedRect(x, metricsY, cardWidth, cardHeight, 6, 6, 'F');
        
        // Top bar lighter
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x + 1, metricsY + 1, cardWidth - 2, 13, 'F');
        
        // Title
        pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.title, x + 9, metricsY + 10);
        
        // Value
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.value, x + 9, metricsY + 25);
        
        // Target
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Target: ' + metric.target, x + 9, metricsY + 33);
    });
}

// ========== WARNING BOX ==========
function addWarningBox(pdf, text, x, y, width) {
    const boxHeight = 115;
    
    // Shadow
    pdf.setFillColor(220, 220, 220);
    pdf.roundedRect(x + 3, y + 3, width, boxHeight, 6, 6, 'F');
    
    // Background
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, width, boxHeight, 6, 6, 'F');
    
    // Border
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(3);
    pdf.roundedRect(x, y, width, boxHeight, 6, 6, 'S');
    
    // Side bar
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 7, boxHeight, 'F');
    
    // Warning icon
    pdf.setFontSize(36);
    pdf.text('⚠️', x + 18, y + 32);
    
    // Text
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, width - 40);
    const maxLines = Math.floor((boxHeight - 35) / 8);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x + 40, y + 20 + (index * 8));
    });
}

// ========== RECOMMENDATIONS ==========
function addRecommendations(pdf, text, margin, startY, pageWidth, pageHeight) {
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recommendations = cleanedText.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cardWidth = (pageWidth - (3 * margin)) / 2;
    const cardHeight = 45;
    const spacing = 13;
    
    const colors = [
        [59, 130, 246],
        [16, 185, 129],
        [245, 158, 11],
        [139, 92, 246],
        [236, 72, 153]
    ];
    
    recommendations.forEach((rec, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        if (y + cardHeight > pageHeight - 30) return;
        
        // Shadow
        pdf.setFillColor(220, 220, 220);
        pdf.roundedRect(x + 2.5, y + 2.5, cardWidth, cardHeight, 6, 6, 'F');
        
        // Background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'F');
        
        // Border
        const color = colors[index % colors.length];
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'S');
        
        // Top bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(x + 1, y + 1, cardWidth - 2, 11, 'F');
        
        // Number circle
        pdf.setFillColor(255, 255, 255);
        pdf.circle(x + 12, y + 6, 5, 'F');
        
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 11, y + 8.5);
        
        // Text
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(12.5);
        pdf.setFont('helvetica', 'normal');
        
        const textLines = pdf.splitTextToSize(rec.trim(), cardWidth - 16);
        const maxLines = Math.floor((cardHeight - 18) / 7);
        
        textLines.slice(0, maxLines).forEach((line, lineIndex) => {
            pdf.text(line, x + 9, y + 22 + (lineIndex * 7));
        });
    });
}

// ========== FOOTER ==========
function addSlideFooter(pdf, slideNumber, totalSlides, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 18;
    
    // Background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY, pageWidth, 18, 'F');
    
    // Line
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(1);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    // Left text
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', margin, pageHeight - 7);
    
    // Page number circle
    pdf.setFillColor(220, 230, 245);
    pdf.circle(pageWidth - margin - 20, pageHeight - 9, 6, 'F');
    
    // Page number
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${slideNumber}`, pageWidth - margin - 28, pageHeight - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`/ ${totalSlides}`, pageWidth - margin - 20, pageHeight - 6.5);
}

// ========== TEXT CONTENT ==========
function addTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    const lineHeight = 8;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    if (lines.length > maxLines) {
        pdf.setFontSize(13);
        pdf.setTextColor(148, 163, 184);
        pdf.text('...', x, y + (maxLines * lineHeight) + 5);
    }
}

// ========== MODERN COVER SLIDE ==========
function createModernCoverSlide(pdf, pageWidth, pageHeight, margin, quarter) {
    // Dark gradient background
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative circles
    pdf.setGState(new pdf.GState({opacity: 0.08}));
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 50, 50, 100, 'F');
    pdf.setFillColor(139, 92, 246);
    pdf.circle(pageWidth - 120, pageHeight - 30, 80, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(70, pageHeight - 40, 75, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Decorative line
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2.5);
    pdf.line(margin, 58, margin + 130, 58);
    
    // Main title - LARGE
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(68);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', margin, 88);
    
    // Subtitle - LARGE
    pdf.setFontSize(38);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', margin, 118);
    
    // Quarter badge - BIG
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.3}));
    pdf.roundedRect(margin + 3, 138, 120, 26, 6, 6, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin, 135, 120, 26, 6, 6, 'F');
    
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, margin + 12, 152);
    
    // Date - LARGE
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    const dateText = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    pdf.text(dateText, margin, 178);
    
    // Footer info
    pdf.setFontSize(14);
    pdf.setTextColor(100, 116, 139);
    pdf.text('AI Generated Report | Confidential', margin, pageHeight - 15);
}

// ========== MODERN SLIDE HEADER ==========
function addModernSlideHeader(pdf, title, pageWidth, pageHeight, margin, color) {
    const rgb = hexToRgb(color);
    
    // Header background
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, 58, 'F');
    
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.setGState(new pdf.GState({opacity: 0.3}));
    pdf.rect(0, 0, pageWidth, 58, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Bottom bar
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.rect(0, 53, pageWidth, 5, 'F');
    
    // Decorative circle
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth - 65, 29, 55, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Title - VERY LARGE
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, 38);
    
    // Underline
    pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
    pdf.setLineWidth(1.2);
    pdf.line(margin, 45, margin + 90, 45);
}

// ========== BIG INSIGHT CARDS ==========
function addBigInsightCards(pdf, insights, margin, startY, pageWidth) {
    const cardWidth = 85;
    const cardHeight = 26;
    const spacing = 9;
    const cardsPerRow = 3;
    
    const colors = [
        [16, 185, 129],   // Green
        [245, 158, 11],   // Orange
        [239, 68, 68],    // Red
        [239, 68, 68],    // Red
        [59, 130, 246],   // Blue
        [245, 158, 11]    // Orange
    ];
    
    insights.forEach((insight, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        // Shadow
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.15}));
        pdf.roundedRect(x + 2.5, y + 2.5, cardWidth, cardHeight, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Card background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
        
        // Colored border
        const color = colors[index];
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(1.5);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'S');
        
        // Top bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.12}));
        pdf.roundedRect(x, y, cardWidth, 7, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Number circle
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(x + 11, y + 3.5, 4.5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 10, y + 5.5);
        
        // Text - LARGE
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        
        const textLines = pdf.splitTextToSize(insight, cardWidth - 12);
        textLines.slice(0, 2).forEach((line, lineIndex) => {
            pdf.text(line, x + 7, y + 15 + (lineIndex * 5.5));
        });
    });
}

// ========== BIG CHARTS ==========
async function addBigChartsToSlide(pdf, margin, pageWidth, pageHeight) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const chartWidth = 84;
    const chartHeight = 72;
    const chartSpacing = 7;
    const startY = 60;
    
    for (let i = 0; i < charts.length; i++) {
        const chartElement = document.getElementById(charts[i]);
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 3.5,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                });
                
                const chartImg = canvas.toDataURL('image/png', 1.0);
                const x = margin + (i * (chartWidth + chartSpacing));
                
                addBigChartFrame(pdf, x, startY, chartWidth, chartHeight);
                pdf.addImage(chartImg, 'PNG', x + 3, startY + 3, chartWidth - 6, chartHeight - 6);
            } catch (err) {
                console.error(`Chart error:`, err);
            }
        }
    }
}

// ========== BIG CHART FRAME ==========
function addBigChartFrame(pdf, x, y, width, height) {
    // Shadow
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.15}));
    pdf.roundedRect(x + 3, y + 3, width, height, 6, 6, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, height, 6, 6, 'F');
    
    // Border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(2);
    pdf.roundedRect(x, y, width, height, 6, 6, 'S');
}

// ========== BIG METRICS CARDS ==========
function addBigMetricsCards(pdf, stats, margin, pageWidth, pageHeight) {
    const metricsY = 142;
    const cardWidth = 84;
    const cardHeight = 38;
    const cardSpacing = 7;
    
    const metrics = [
        {
            title: 'PRODUCTION',
            value: Math.round(stats.productionActual).toLocaleString(),
            target: Math.round(stats.productionTarget).toLocaleString(),
            color: [59, 130, 246]
        },
        {
            title: 'ENERGY',
            value: Math.round(stats.energyActual).toLocaleString(),
            target: Math.round(stats.energyTarget).toLocaleString(),
            color: [245, 158, 11]
        },
        {
            title: 'ACHIEVEMENT',
            value: Math.round(stats.productionAchievement) + '%',
            target: Math.round(stats.energyAchievement) + '%',
            color: [16, 185, 129]
        }
    ];
    
    metrics.forEach((metric, index) => {
        const x = margin + (index * (cardWidth + cardSpacing));
        
        // Shadow
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.18}));
        pdf.roundedRect(x + 3, metricsY + 3, cardWidth, cardHeight, 6, 6, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Colored background
        pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.roundedRect(x, metricsY, cardWidth, cardHeight, 6, 6, 'F');
        
        // Top bar light
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(new pdf.GState({opacity: 0.22}));
        pdf.roundedRect(x, metricsY, cardWidth, 13, 6, 6, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Title - LARGE
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.title, x + 9, metricsY + 10);
        
        // Value - VERY LARGE
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.value, x + 9, metricsY + 25);
        
        // Target - LARGE
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setGState(new pdf.GState({opacity: 0.95}));
        pdf.text('Target: ' + metric.target, x + 9, metricsY + 33);
        pdf.setGState(new pdf.GState({opacity: 1}));
    });
}

// ========== BIG WARNING BOX ==========
function addBigWarningBox(pdf, text, x, y, width) {
    const boxHeight = 115;
    
    // Shadow
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.15}));
    pdf.roundedRect(x + 3, y + 3, width, boxHeight, 6, 6, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Background
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, width, boxHeight, 6, 6, 'F');
    
    // Border
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(3);
    pdf.roundedRect(x, y, width, boxHeight, 6, 6, 'S');
    
    // Side bar
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 7, boxHeight, 'F');
    
    // Warning icon - LARGE
    pdf.setFontSize(36);
    pdf.text('⚠️', x + 18, y + 32);
    
    // Text - LARGE
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, width - 40);
    const maxLines = Math.floor((boxHeight - 35) / 8);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x + 40, y + 20 + (index * 8));
    });
}

// ========== BIG RECOMMENDATIONS ==========
function addBigRecommendations(pdf, text, margin, startY, pageWidth, pageHeight) {
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recommendations = cleanedText.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cardWidth = (pageWidth - (3 * margin)) / 2;
    const cardHeight = 45;
    const spacing = 13;
    
    const colors = [
        [59, 130, 246],
        [16, 185, 129],
        [245, 158, 11],
        [139, 92, 246],
        [236, 72, 153]
    ];
    
    recommendations.forEach((rec, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        if (y + cardHeight > pageHeight - 30) return;
        
        // Shadow
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.12}));
        pdf.roundedRect(x + 2.5, y + 2.5, cardWidth, cardHeight, 6, 6, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Background
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'F');
        
        // Border
        const color = colors[index % colors.length];
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(2);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'S');
        
        // Top bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.12}));
        pdf.roundedRect(x, y, cardWidth, 11, 6, 6, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // Number circle - BIG
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(x + 12, y + 5.5, 5, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 11, y + 8);
        
        // Text - LARGE
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(12.5);
        pdf.setFont('helvetica', 'normal');
        
        const textLines = pdf.splitTextToSize(rec.trim(), cardWidth - 16);
        const maxLines = Math.floor((cardHeight - 18) / 7);
        
        textLines.slice(0, maxLines).forEach((line, lineIndex) => {
            pdf.text(line, x + 9, y + 22 + (lineIndex * 7));
        });
    });
}

// ========== MODERN FOOTER ==========
function addModernSlideFooter(pdf, slideNumber, totalSlides, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 18;
    
    // Background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY, pageWidth, 18, 'F');
    
    // Line
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(1);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    // Left text - LARGE
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', margin, pageHeight - 7);
    
    // Page number circle
    pdf.setFillColor(59, 130, 246);
    pdf.setGState(new pdf.GState({opacity: 0.12}));
    pdf.circle(pageWidth - margin - 20, pageHeight - 9, 6, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Page number - LARGE
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${slideNumber}`, pageWidth - margin - 28, pageHeight - 6.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`/ ${totalSlides}`, pageWidth - margin - 20, pageHeight - 6.5);
}

// ========== LARGE TEXT CONTENT ==========
function addLargeTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    const lineHeight = 8;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    if (lines.length > maxLines) {
        pdf.setFontSize(13);
        pdf.setTextColor(148, 163, 184);
        pdf.text('...', x, y + (maxLines * lineHeight) + 5);
    }
}

// ========== HEX TO RGB ==========
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
}

// ========== صفحة الغلاف المحسنة ==========
function createEnhancedCoverSlide(pdf, pageWidth, pageHeight, margin, quarter) {
    // خلفية متدرجة
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // دوائر ديكورية شفافة
    pdf.setGState(new pdf.GState({opacity: 0.08}));
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 50, 50, 100, 'F');
    pdf.setFillColor(139, 92, 246);
    pdf.circle(pageWidth - 120, pageHeight - 30, 80, 'F');
    pdf.setFillColor(16, 185, 129);
    pdf.circle(70, pageHeight - 40, 75, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خط ديكوري
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(2);
    pdf.line(margin, 55, margin + 120, 55);
    
    // العنوان الرئيسي - حجم كبير جداً
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(64);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI GENERATED REPORT', margin, 85);
    
    // العنوان الفرعي - حجم كبير
    pdf.setFontSize(34);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', margin, 112);
    
    // بطاقة الربع بحجم أكبر
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.3}));
    pdf.roundedRect(margin + 3, 133, 110, 22, 6, 6, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin, 130, 110, 22, 6, 6, 'F');
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, margin + 10, 145);
    
    // التاريخ بخط كبير
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    const dateText = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });
    pdf.text(dateText, margin, 168);
    
    // معلومات إضافية
    pdf.setFontSize(13);
    pdf.setTextColor(100, 116, 139);
    pdf.text('تقرير تم إنشاؤه بواسطة الذكاء الاصطناعي | Confidential', margin, pageHeight - 15);
}

// ========== رأس الشريحة المحسن ==========
function addEnhancedSlideHeader(pdf, titleAr, titleEn, pageWidth, pageHeight, margin, color) {
    const rgb = hexToRgb(color);
    
    // خلفية متدرجة
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, 55, 'F');
    
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.setGState(new pdf.GState({opacity: 0.35}));
    pdf.rect(0, 0, pageWidth, 55, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // شريط ملون سفلي
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.rect(0, 50, pageWidth, 5, 'F');
    
    // دائرة ديكورية
    pdf.setGState(new pdf.GState({opacity: 0.12}));
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth - 60, 27, 50, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // العنوان بحجم كبير جداً
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titleEn, margin, 35);
    
    // خط فاصل
    pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
    pdf.setLineWidth(1);
    pdf.line(margin, 42, margin + 80, 42);
}

// ========== بطاقات الرؤى بحجم كبير ==========
function addLargeInsightCards(pdf, insights, margin, startY, pageWidth, pageHeight) {
    const cardWidth = 82;
    const cardHeight = 22;
    const spacing = 9;
    const cardsPerRow = 3;
    
    insights.forEach((insight, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        // ظل
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.12}));
        pdf.roundedRect(x + 2, y + 2, cardWidth, cardHeight, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
        
        // إطار ملون
        pdf.setDrawColor(insight.color[0], insight.color[1], insight.color[2]);
        pdf.setLineWidth(1.2);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'S');
        
        // شريط علوي
        pdf.setFillColor(insight.color[0], insight.color[1], insight.color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.15}));
        pdf.roundedRect(x, y, cardWidth, 6, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // رقم دائري
        pdf.setFillColor(insight.color[0], insight.color[1], insight.color[2]);
        pdf.circle(x + 10, y + 3, 4, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 9, y + 5);
        
        // النص بحجم كبير
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        
        const textLines = pdf.splitTextToSize(insight.text, cardWidth - 10);
        textLines.slice(0, 2).forEach((line, lineIndex) => {
            pdf.text(line, x + 6, y + 13 + (lineIndex * 5));
        });
    });
}

// ========== رسوم بيانية بحجم كبير ==========
async function addLargeChartsToSlide(pdf, margin, pageWidth, pageHeight) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const chartWidth = 80;
    const chartHeight = 70;
    const chartSpacing = 8;
    const startY = 58;
    
    for (let i = 0; i < charts.length; i++) {
        const chartElement = document.getElementById(charts[i]);
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                });
                
                const chartImg = canvas.toDataURL('image/png', 1.0);
                const x = margin + (i * (chartWidth + chartSpacing));
                
                addEnhancedChartFrame(pdf, x, startY, chartWidth, chartHeight);
                pdf.addImage(chartImg, 'PNG', x + 2, startY + 2, chartWidth - 4, chartHeight - 4);
            } catch (err) {
                console.error(`خطأ في ${charts[i]}:`, err);
            }
        }
    }
}

// ========== إطار محسن للرسوم البيانية ==========
function addEnhancedChartFrame(pdf, x, y, width, height) {
    // ظل
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.12}));
    pdf.roundedRect(x + 3, y + 3, width, height, 5, 5, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خلفية
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, height, 5, 5, 'F');
    
    // إطار
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(1.5);
    pdf.roundedRect(x, y, width, height, 5, 5, 'S');
}

// ========== بطاقات المقاييس بخطوط كبيرة ==========
function addLargeMetricsCards(pdf, stats, margin, pageWidth, pageHeight) {
    const metricsY = 138;
    const cardWidth = 80;
    const cardHeight = 35;
    const cardSpacing = 8;
    
    const metrics = [
        {
            titleEn: 'PRODUCTION',
            value: Math.round(stats.productionActual).toLocaleString(),
            target: Math.round(stats.productionTarget).toLocaleString(),
            color: [59, 130, 246]
        },
        {
            titleEn: 'ENERGY',
            value: Math.round(stats.energyActual).toLocaleString(),
            target: Math.round(stats.energyTarget).toLocaleString(),
            color: [245, 158, 11]
        },
        {
            titleEn: 'ACHIEVEMENT',
            value: Math.round(stats.productionAchievement) + '%',
            target: Math.round(stats.energyAchievement) + '%',
            color: [16, 185, 129]
        }
    ];
    
    metrics.forEach((metric, index) => {
        const x = margin + (index * (cardWidth + cardSpacing));
        
        // ظل
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.15}));
        pdf.roundedRect(x + 3, metricsY + 3, cardWidth, cardHeight, 5, 5, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية ملونة
        pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.roundedRect(x, metricsY, cardWidth, cardHeight, 5, 5, 'F');
        
        // شريط علوي شفاف
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(new pdf.GState({opacity: 0.25}));
        pdf.roundedRect(x, metricsY, cardWidth, 12, 5, 5, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // العنوان بخط كبير
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.titleEn, x + 8, metricsY + 9);
        
        // القيمة بخط كبير جداً
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.value, x + 8, metricsY + 22);
        
        // الهدف
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setGState(new pdf.GState({opacity: 0.95}));
        pdf.text('Target: ' + metric.target, x + 8, metricsY + 30);
        pdf.setGState(new pdf.GState({opacity: 1}));
    });
}

// ========== صندوق التحذير بخط كبير ==========
function addLargeWarningBox(pdf, text, x, y, width) {
    const boxHeight = 110;
    
    // ظل
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.12}));
    pdf.roundedRect(x + 3, y + 3, width, boxHeight, 5, 5, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خلفية
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, width, boxHeight, 5, 5, 'F');
    
    // إطار
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(2.5);
    pdf.roundedRect(x, y, width, boxHeight, 5, 5, 'S');
    
    // شريط جانبي
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 6, boxHeight, 'F');
    
    // رمز التحذير كبير
    pdf.setFontSize(32);
    pdf.text('⚠️', x + 15, y + 28);
    
    // النص بحجم كبير
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, width - 35);
    const maxLines = Math.floor((boxHeight - 30) / 7);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x + 35, y + 18 + (index * 7));
    });
}

// ========== قائمة التوصيات بخط كبير ==========
function addLargeRecommendationsList(pdf, text, margin, startY, pageWidth, pageHeight) {
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recommendations = cleanedText.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cardWidth = (pageWidth - (3 * margin)) / 2;
    const cardHeight = 42;
    const spacing = 12;
    
    recommendations.forEach((rec, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        if (y + cardHeight > pageHeight - 30) return;
        
        // ظل
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.1}));
        pdf.roundedRect(x + 2, y + 2, cardWidth, cardHeight, 5, 5, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'F');
        
        // إطار ملون
        const colors = [
            [59, 130, 246], [16, 185, 129], [245, 158, 11],
            [139, 92, 246], [236, 72, 153]
        ];
        const color = colors[index % colors.length];
        
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(1.5);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'S');
        
        // شريط علوي
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.12}));
        pdf.roundedRect(x, y, cardWidth, 10, 5, 5, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // رقم دائري كبير
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(x + 10, y + 5, 4, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 9, y + 7);
        
        // النص بحجم كبير
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(11.5);
        pdf.setFont('helvetica', 'normal');
        
        const textLines = pdf.splitTextToSize(rec.trim(), cardWidth - 14);
        const maxLines = Math.floor((cardHeight - 16) / 6);
        
        textLines.slice(0, maxLines).forEach((line, lineIndex) => {
            pdf.text(line, x + 8, y + 20 + (lineIndex * 6));
        });
    });
}

// ========== التذييل المحسن ==========
function addEnhancedSlideFooter(pdf, slideNumber, totalSlides, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 18;
    
    // خلفية
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY, pageWidth, 18, 'F');
    
    // خط فاصل
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.8);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    // النص بحجم كبير
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('عمليات المنبع | تقرير الذكاء الاصطناعي', margin, pageHeight - 8);
    
    // رقم الصفحة بتصميم دائري
    pdf.setFillColor(59, 130, 246);
    pdf.setGState(new pdf.GState({opacity: 0.12}));
    pdf.circle(pageWidth - margin - 18, pageHeight - 9, 5, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${slideNumber}`, pageWidth - margin - 25, pageHeight - 7.5);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`/ ${totalSlides}`, pageWidth - margin - 18, pageHeight - 7.5);
}

// ========== محتوى نصي بخط كبير ==========
function addLargeTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    const lineHeight = 7.5;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    lines.slice(0, maxLines).forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    if (lines.length > maxLines) {
        pdf.setFontSize(12);
        pdf.setTextColor(148, 163, 184);
        pdf.text('...', x, y + (maxLines * lineHeight) + 4);
    }
}

// ========== دالة تحويل hex إلى RGB ==========
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
}

// ========== دالة إنشاء صفحة الغلاف المحسنة ==========
function createCoverSlide(pdf, pageWidth, pageHeight, margin, quarter) {
    // خلفية متدرجة حديثة
    const gradient = pdf.internal.getDocument().addGState(new pdf.GState({opacity: 1}));
    
    // خلفية داكنة أساسية
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // عناصر ديكورية متعددة الطبقات
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    
    // دوائر ديكورية كبيرة
    pdf.setFillColor(59, 130, 246);
    pdf.circle(pageWidth - 40, 40, 90, 'F');
    
    pdf.setFillColor(139, 92, 246);
    pdf.circle(pageWidth - 110, pageHeight - 25, 70, 'F');
    
    pdf.setFillColor(16, 185, 129);
    pdf.circle(60, pageHeight - 40, 65, 'F');
    
    // أشكال هندسية إضافية
    pdf.setFillColor(236, 72, 153);
    pdf.circle(40, 50, 50, 'F');
    
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خط ديكوري علوي
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    pdf.line(margin, 50, margin + 100, 50);
    
    // العنوان الرئيسي مع تظليل
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(56);
    pdf.setFont('helvetica', 'bold');
    
    // تأثير الظل للنص
    pdf.setTextColor(59, 130, 246);
    pdf.text('AI GENERATED REPORT', margin + 1, 81);
    pdf.setTextColor(255, 255, 255);
    pdf.text('AI GENERATED REPORT', margin, 80);
    
    // العنوان الفرعي
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(203, 213, 225);
    pdf.text('Upstream Operations Analysis', margin, 105);
    
    // بطاقة الربع بتصميم حديث
    // الظل
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.3}));
    pdf.roundedRect(margin + 2, 122, 95, 18, 5, 5, 'F');
    
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // التدرج للبطاقة
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(margin, 120, 95, 18, 5, 5, 'F');
    
    // نص البطاقة
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(quarter, margin + 8, 132);
    
    // أيقونة التقويم
    pdf.setFontSize(16);
    pdf.text('📅', margin + 90, 132);
    
    // التاريخ بتنسيق جميل
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    const dateText = new Date().toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        calendar: 'gregory'
    });
    pdf.text(dateText, margin, 155);
    
    // معلومات إضافية في الأسفل
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.text('تقرير تم إنشاؤه بواسطة الذكاء الاصطناعي | Confidential', margin, pageHeight - 15);
    
    // شعار أو رمز (يمكن استبداله بشعار الشركة)
    pdf.setFillColor(59, 130, 246);
    pdf.setGState(new pdf.GState({opacity: 0.8}));
    pdf.circle(pageWidth - margin - 15, pageHeight - 15, 8, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
}

// ========== دالة إنشاء رأس الشريحة المحسن ==========
function addModernSlideHeader(pdf, titleAr, titleEn, pageWidth, pageHeight, margin, color) {
    // تحويل اللون من hex إلى RGB
    const rgb = hexToRgb(color);
    
    // خلفية متدرجة
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // طبقة اللون الشفافة
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.setGState(new pdf.GState({opacity: 0.4}));
    pdf.rect(0, 0, pageWidth, 50, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // شريط ديكوري ملون
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.rect(0, 45, pageWidth, 5, 'F');
    
    // شكل هندسي ديكوري
    pdf.setGState(new pdf.GState({opacity: 0.15}));
    pdf.setFillColor(255, 255, 255);
    pdf.circle(pageWidth - 50, 25, 40, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // العنوان باللغة الإنجليزية
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titleEn, margin, 32);
    
    // خط فاصل صغير
    pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 37, margin + 60, 37);
}

// ========== دالة إضافة بطاقات الرؤى ==========
function addInsightCards(pdf, insights, margin, startY, pageWidth, pageHeight) {
    const cardWidth = 80;
    const cardHeight = 18;
    const spacing = 8;
    const cardsPerRow = 3;
    
    insights.forEach((insight, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        // ظل البطاقة
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.1}));
        pdf.roundedRect(x + 1, y + 1, cardWidth, cardHeight, 3, 3, 'F');
        
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية البطاقة
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
        
        // إطار ملون
        pdf.setDrawColor(insight.color[0], insight.color[1], insight.color[2]);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');
        
        // شريط علوي ملون
        pdf.setFillColor(insight.color[0], insight.color[1], insight.color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.15}));
        pdf.roundedRect(x, y, cardWidth, 5, 3, 3, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // النص
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(51, 65, 85);
        
        const textLines = pdf.splitTextToSize(insight.text, cardWidth - 8);
        const textY = y + 10;
        textLines.forEach((line, lineIndex) => {
            pdf.text(line, x + 4, textY + (lineIndex * 4));
        });
    });
}

// ========== دالة إضافة الرسوم البيانية ==========
async function addChartsToSlide(pdf, margin, pageWidth, pageHeight) {
    const charts = ['productionChart', 'energyChart', 'achievementChart'];
    const chartWidth = 75;
    const chartHeight = 60;
    const chartSpacing = 10;
    const startY = 56;
    
    for (let i = 0; i < charts.length; i++) {
        const chartElement = document.getElementById(charts[i]);
        if (chartElement) {
            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 2.5,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true
                });
                
                const chartImg = canvas.toDataURL('image/png', 1.0);
                const x = margin + (i * (chartWidth + chartSpacing));
                
                // إطار للرسم البياني
                addChartFrame(pdf, x, startY, chartWidth, chartHeight);
                
                // الرسم البياني
                pdf.addImage(chartImg, 'PNG', x + 2, startY + 2, chartWidth - 4, chartHeight - 4);
            } catch (err) {
                console.error(`خطأ في التقاط ${charts[i]}:`, err);
            }
        }
    }
}

// ========== دالة إضافة إطار للرسوم البيانية ==========
function addChartFrame(pdf, x, y, width, height) {
    // ظل
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.roundedRect(x + 2, y + 2, width, height, 4, 4, 'F');
    
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خلفية بيضاء
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, height, 4, 4, 'F');
    
    // إطار رمادي خفيف
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, width, height, 4, 4, 'S');
}

// ========== دالة إضافة بطاقات المقاييس المحسنة ==========
function addEnhancedMetricsCards(pdf, stats, margin, pageWidth, pageHeight) {
    const metricsY = 130;
    const cardWidth = 78;
    const cardSpacing = 9;
    
    const metrics = [
        {
            title: 'الإنتاج',
            titleEn: 'PRODUCTION',
            value: Math.round(stats.productionActual).toLocaleString(),
            target: Math.round(stats.productionTarget).toLocaleString(),
            color: [59, 130, 246],
            icon: ''
        },
        {
            title: 'الطاقة',
            titleEn: 'ENERGY',
            value: Math.round(stats.energyActual).toLocaleString(),
            target: Math.round(stats.energyTarget).toLocaleString(),
            color: [245, 158, 11],
            icon: ''
        },
        {
            title: 'الإنجاز',
            titleEn: 'ACHIEVEMENT',
            value: Math.round(stats.productionAchievement) + '%',
            target: 'طاقة: ' + Math.round(stats.energyAchievement) + '%',
            color: [16, 185, 129],
            icon: ''
        }
    ];
    
    metrics.forEach((metric, index) => {
        const x = margin + (index * (cardWidth + cardSpacing));
        
        // ظل البطاقة
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.15}));
        pdf.roundedRect(x + 2, metricsY + 2, cardWidth, 32, 4, 4, 'F');
        
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية البطاقة بتدرج
        pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        pdf.roundedRect(x, metricsY, cardWidth, 32, 4, 4, 'F');
        
        // شريط علوي أفتح
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(new pdf.GState({opacity: 0.2}));
        pdf.roundedRect(x, metricsY, cardWidth, 10, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // العنوان
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.titleEn, x + 6, metricsY + 7);
        
        // القيمة الرئيسية
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.value, x + 6, metricsY + 18);
        
        // الهدف
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setGState(new pdf.GState({opacity: 0.9}));
        pdf.text('الهدف: ' + metric.target, x + 6, metricsY + 27);
        pdf.setGState(new pdf.GState({opacity: 1}));
    });
}

// ========== دالة إضافة صندوق التحذير ==========
function addWarningBox(pdf, text, x, y, width) {
    const boxHeight = 100;
    
    // ظل
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.roundedRect(x + 2, y + 2, width, boxHeight, 4, 4, 'F');
    
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // خلفية
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(x, y, width, boxHeight, 4, 4, 'F');
    
    // إطار
    pdf.setDrawColor(239, 68, 68);
    pdf.setLineWidth(2);
    pdf.roundedRect(x, y, width, boxHeight, 4, 4, 'S');
    
    // شريط جانبي
    pdf.setFillColor(239, 68, 68);
    pdf.rect(x, y, 5, boxHeight, 'F');
    
    // رمز التحذير
    pdf.setFontSize(24);
    pdf.text('⚠️', x + 12, y + 20);
    
    // النص
    pdf.setTextColor(127, 29, 29);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const lines = pdf.splitTextToSize(cleanedText, width - 30);
    const maxLines = Math.floor((boxHeight - 25) / 6);
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach((line, index) => {
        pdf.text(line, x + 30, y + 15 + (index * 6));
    });
}

// ========== دالة إضافة قائمة التوصيات ==========
function addRecommendationsList(pdf, text, margin, startY, pageWidth, pageHeight) {
    // تنظيف النص وتقسيمه
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const recommendations = cleanedText.split(/\d+\.\s+/).filter(r => r.trim());
    
    const cardWidth = (pageWidth - (3 * margin)) / 2;
    const cardHeight = 35;
    const spacing = 10;
    
    recommendations.forEach((rec, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        
        const x = margin + (col * (cardWidth + spacing));
        const y = startY + (row * (cardHeight + spacing));
        
        if (y + cardHeight > pageHeight - 30) return; // تجنب تجاوز حدود الصفحة
        
        // ظل البطاقة
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.08}));
        pdf.roundedRect(x + 1.5, y + 1.5, cardWidth, cardHeight, 4, 4, 'F');
        
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // خلفية البطاقة
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'F');
        
        // إطار
        const colors = [
            [59, 130, 246],
            [16, 185, 129],
            [245, 158, 11],
            [139, 92, 246],
            [236, 72, 153]
        ];
        const color = colors[index % colors.length];
        
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(1);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, 'S');
        
        // شريط علوي
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setGState(new pdf.GState({opacity: 0.1}));
        pdf.roundedRect(x, y, cardWidth, 8, 4, 4, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
        
        // رقم التوصية
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.circle(x + 8, y + 4, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text((index + 1).toString(), x + 7, y + 5.5);
        
        // نص التوصية
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        
        const textLines = pdf.splitTextToSize(rec.trim(), cardWidth - 12);
        const maxLines = Math.floor((cardHeight - 14) / 5);
        const displayLines = textLines.slice(0, maxLines);
        
        displayLines.forEach((line, lineIndex) => {
            pdf.text(line, x + 6, y + 16 + (lineIndex * 5));
        });
    });
}

// ========== دالة إضافة تذييل الشريحة المحسن ==========
function addModernSlideFooter(pdf, slideNumber, totalSlides, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 18;
    
    // خلفية التذييل بتدرج خفيف
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, footerY, pageWidth, 18, 'F');
    
    // خط فاصل بتدرج
    const gradient = pdf.linearGradient([0, footerY, pageWidth, footerY], [
        [203, 213, 225, 0],
        [203, 213, 225, 1],
        [203, 213, 225, 0]
    ]);
    
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    // نص التذييل الأيسر
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('عمليات المنبع | تقرير تم إنشاؤه بالذكاء الاصطناعي', margin, pageHeight - 8);
    
    // رقم الشريحة مع تصميم دائري
    const pageNumWidth = 28;
    const pageNumX = pageWidth - margin - pageNumWidth;
    
    // دائرة خلفية لرقم الصفحة
    pdf.setFillColor(59, 130, 246);
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.circle(pageWidth - margin - 14, pageHeight - 9, 4, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // نص رقم الصفحة
    pdf.setTextColor(59, 130, 246);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${slideNumber}`, pageWidth - margin - 20, pageHeight - 8);
    
    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`/ ${totalSlides}`, pageWidth - margin - 15, pageHeight - 8);
}

// ========== دالة إضافة محتوى نصي منسق ==========
function addStyledTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // تنظيف النص
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    
    // تقسيم النص إلى أسطر
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    const lineHeight = 6.5;
    const maxLines = Math.floor(maxHeight / lineHeight);
    const displayLines = lines.slice(0, maxLines);
    
    // عرض الأسطر مع تباعد محسن
    displayLines.forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    // مؤشر اقتطاع إذا كان النص طويلاً
    if (lines.length > maxLines) {
        pdf.setFontSize(10);
        pdf.setTextColor(148, 163, 184);
        pdf.text('...', x, y + (maxLines * lineHeight) + 3);
    }
}

// ========== دالة مساعدة لتحويل hex إلى RGB ==========
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
}

function addTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Clean and prepare text
    const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emojis
    
    // Split text into lines
    const lines = pdf.splitTextToSize(cleanedText, maxWidth);
    
    // Line spacing
    const lineHeight = 6;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    // Display lines
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    // Truncation indicator
    if (lines.length > maxLines) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text('...', x, y + (maxLines * lineHeight) + 2);
    }
}

function addSlideFooter(pdf, slideNumber, pageWidth, pageHeight, margin) {
    // Footer background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
    
    // Footer line
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.line(0, pageHeight - 18, pageWidth, pageHeight - 18);
    
    // Footer text
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Upstream Operations | AI Generated Report', margin, pageHeight - 8);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Slide ' + slideNumber + ' of 7', pageWidth - margin - 28, pageHeight - 8);
}

function addSlideHeader(pdf, title, icon, pageWidth, pageHeight, margin) {
    // Gradient header background
    pdf.setFillColor(30, 58, 138); // blue-900
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    pdf.setFillColor(59, 130, 246); // blue-500
    pdf.setGState(new pdf.GState({opacity: 0.5}));
    pdf.rect(0, 0, pageWidth, 45, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
    
    // Title with icon
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont(undefined, 'bold');
    pdf.text(`${icon} ${title}`, margin, 30);
}

function addTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    // Split text into lines
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Line spacing
    const lineHeight = 7;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    // Display lines
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    // Truncation indicator
    if (lines.length > maxLines) {
        pdf.setFontSize(11);
        pdf.setTextColor(100, 116, 139);
        pdf.text('...', x, y + (maxLines * lineHeight) + 3);
    }
}

function addSlideFooter(pdf, slideNumber, pageWidth, pageHeight, margin) {
    // Footer background
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(0, pageHeight - 18, pageWidth, 18, 'F');
    
    // Footer line
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.line(0, pageHeight - 18, pageWidth, pageHeight - 18);
    
    // Footer text
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Upstream Operations | AI Generated Report', margin, pageHeight - 7);
    
    pdf.setFont(undefined, 'bold');
    pdf.text(`Slide ${slideNumber} of 7`, pageWidth - margin - 25, pageHeight - 7);
}

function addSlideHeader(pdf, title, icon, pageWidth, margin) {
    // Header background
    pdf.setFillColor(59, 130, 246); // blue-500
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.text(`${icon} ${title}`, margin, 27);
}

function addTextContent(pdf, text, x, y, maxWidth, maxHeight) {
    pdf.setTextColor(51, 65, 85); // slate-700
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    // Split text into lines that fit within maxWidth
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Calculate how many lines can fit in maxHeight
    const lineHeight = 6;
    const maxLines = Math.floor(maxHeight / lineHeight);
    
    // Only show lines that fit
    const displayLines = lines.slice(0, maxLines);
    
    displayLines.forEach((line, index) => {
        pdf.text(line, x, y + (index * lineHeight));
    });
    
    // Add "..." if content was truncated
    if (lines.length > maxLines) {
        pdf.text('...', x, y + (maxLines * lineHeight));
    }
}

function addSlideFooter(pdf, slideNumber, pageWidth, pageHeight, margin) {
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    
    pdf.text('Upstream Operations | AI Report', margin, pageHeight - 6);
    pdf.text(`Slide ${slideNumber}`, pageWidth - margin - 15, pageHeight - 6);
}

function exportReportWord() {
    if (!currentReport) {
        showNotification('No report data available', 'error');
        return;
    }
    
    const quarter = document.getElementById('reportQuarter')?.value || 'full';
    const content = `
UPSTREAM OPERATIONS REPORT
Generated: ${new Date().toLocaleString()}
Quarter: ${quarter || 'Full Year'}

═══════════════════════════════════════════

EXECUTIVE SUMMARY
${currentReport.executive_summary}

KEY INSIGHTS
${currentReport.key_insights}

ANOMALIES
${currentReport.anomalies}

RECOMMENDATIONS
${currentReport.recommendations}
    `.trim();
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upstream_report_${quarter}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Word document downloaded!', 'success');
}

function saveCurrentReport() {
    if (!currentReport) {
        showNotification('No report data available', 'error');
        return;
    }
    // Use window.reportContext if available, otherwise fallback to empty object
    const context = window.reportContext || {};
    // Merge currentReport and context into a single object with context property
    const reportData = {
        ...currentReport,
        context: { ...context }
    };
    const quarter = document.getElementById('reportQuarter')?.value || null;
    const department = document.getElementById('reportDepartment')?.value || null;
    saveReport(reportData, quarter, department);
}

function copyReportText() {
    if (!currentReport) {
        showNotification('No report data available', 'error');
        return;
    }
    
    const text = `
UPSTREAM OPERATIONS REPORT
===========================

EXECUTIVE SUMMARY
${currentReport.executive_summary}

KEY INSIGHTS
${currentReport.key_insights}

ANOMALIES
${currentReport.anomalies}

RECOMMENDATIONS
${currentReport.recommendations}
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Report copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy text', 'error');
    });
}

// ========================================