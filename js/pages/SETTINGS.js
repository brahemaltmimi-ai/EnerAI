// SETTINGS PAGE
// ========================================
function renderSettingsPage() {
    document.getElementById('pageTitle').textContent = 'Settings';
    
    const departments = [...new Set(metricsData.map(d => d.Department))].length;
    const streams = [...new Set(metricsData.map(d => d.Stream))].length;
    const dates = [...new Set(metricsData.map(d => d.Date))].length;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page-animated">
        <style>
            .settings-container {
                font-family: 'IBM Plex Sans', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 1400px;
                margin: 0 auto;
                padding: 32px;
                background: #f9fafb;
                min-height: 100vh;
            }
            
            .settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 32px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
                animation: fadeInDown 0.5s ease-out;
            }
            
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-15px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .settings-header-content h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #0f2342;
                margin: 0 0 4px 0;
                letter-spacing: -0.5px;
            }
            
            .settings-header-content p {
                font-size: 0.95rem;
                color: #6b7280;
                margin: 0;
            }
            
            .settings-badge {
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
                padding: 10px 20px;
                border-radius: 50px;
                box-shadow: 0 4px 15px rgba(132, 204, 22, 0.3);
            }
            
            .settings-badge-dot {
                width: 8px;
                height: 8px;
                background: #fff;
                border-radius: 50%;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .settings-badge-text {
                font-size: 0.8rem;
                font-weight: 600;
                color: #fff;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .settings-stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 28px;
            }
            
            .settings-stat-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 22px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
                animation: fadeInUp 0.5s ease-out backwards;
            }
            
            .settings-stat-card:nth-child(1) { animation-delay: 0.1s; }
            .settings-stat-card:nth-child(2) { animation-delay: 0.15s; }
            .settings-stat-card:nth-child(3) { animation-delay: 0.2s; }
            .settings-stat-card:nth-child(4) { animation-delay: 0.25s; }
            
            .settings-stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #1a365d 0%, #84cc16 100%);
            }
            
            .settings-stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 30px rgba(26, 54, 93, 0.1);
                border-color: #4299e1;
            }
            
            .settings-stat-icon {
                width: 46px;
                height: 46px;
                background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 14px;
                box-shadow: 0 4px 12px rgba(26, 54, 93, 0.2);
            }
            
            .settings-stat-icon svg {
                width: 22px;
                height: 22px;
                color: #fff;
            }
            
            .settings-stat-label {
                font-size: 0.7rem;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
            }
            
            .settings-stat-value {
                font-size: 1.75rem;
                font-weight: 700;
                color: #0f2342;
            }
            
            .settings-info-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 28px;
            }
            
            .settings-info-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
                animation: fadeInUp 0.5s ease-out backwards;
                animation-delay: 0.3s;
            }
            
            .settings-info-card:nth-child(2) {
                animation-delay: 0.35s;
            }
            
            .settings-info-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 18px;
                padding-bottom: 14px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .settings-info-icon {
                width: 42px;
                height: 42px;
                background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
            }
            
            .settings-info-icon svg {
                width: 20px;
                height: 20px;
                color: #fff;
            }
            
            .settings-info-title {
                font-size: 1.05rem;
                font-weight: 600;
                color: #0f2342;
                margin: 0;
            }
            
            .settings-info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            
            .settings-info-row:last-child {
                border-bottom: none;
            }
            
            .settings-info-label {
                font-size: 0.875rem;
                color: #4b5563;
                font-weight: 500;
            }
            
            .settings-info-value {
                font-size: 0.8rem;
                color: #0f2342;
                font-weight: 600;
                font-family: 'Courier New', monospace;
                background: #f3f4f6;
                padding: 6px 12px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            
            .settings-status-section {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
            }
            
            .settings-status-card {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 22px;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
                overflow: hidden;
                animation: fadeInUp 0.5s ease-out backwards;
                animation-delay: 0.4s;
                transition: all 0.3s ease;
            }
            
            .settings-status-card:nth-child(2) {
                animation-delay: 0.45s;
            }
            
            .settings-status-card:hover {
                border-color: #10b981;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.1);
            }
            
            .settings-status-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                width: 4px;
                background: linear-gradient(180deg, #10b981 0%, #84cc16 100%);
            }
            
            .settings-status-icon {
                width: 50px;
                height: 50px;
                background: rgba(16, 185, 129, 0.1);
                border: 2px solid #10b981;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .settings-status-icon svg {
                width: 24px;
                height: 24px;
                color: #10b981;
            }
            
            .settings-status-content h3 {
                font-size: 1rem;
                font-weight: 700;
                color: #10b981;
                margin: 0 0 2px 0;
            }
            
            .settings-status-content p {
                font-size: 0.8rem;
                color: #6b7280;
                margin: 0;
            }
            
            @media (max-width: 1200px) {
                .settings-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media (max-width: 768px) {
                .settings-container {
                    padding: 16px;
                }
                .settings-header {
                    flex-direction: column;
                    gap: 16px;
                    text-align: center;
                }
                .settings-stats-grid,
                .settings-info-section,
                .settings-status-section {
                    grid-template-columns: 1fr;
                }
                .settings-header-content h1 {
                    font-size: 1.5rem;
                }
            }
        </style>
        
        <div class="settings-container">
            <!-- Header -->
            <header class="settings-header">
                <div class="settings-header-content">
                    <h1>Settings</h1>
                    <p>System configuration and status overview</p>
                </div>
                <div class="settings-badge">
                    <span class="settings-badge-dot"></span>
                    <span class="settings-badge-text">System Active</span>
                </div>
            </header>
            
            <!-- Stats Grid -->
            <div class="settings-stats-grid">
                <div class="settings-stat-card">
                    <div class="settings-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <div class="settings-stat-label">Total Records</div>
                    <div class="settings-stat-value">${metricsData.length.toLocaleString()}</div>
                </div>
                
                <div class="settings-stat-card">
                    <div class="settings-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div class="settings-stat-label">Departments</div>
                    <div class="settings-stat-value">${departments}</div>
                </div>
                
                <div class="settings-stat-card">
                    <div class="settings-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="settings-stat-label">Streams</div>
                    <div class="settings-stat-value">${streams}</div>
                </div>
                
                <div class="settings-stat-card">
                    <div class="settings-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="settings-stat-label">Date Range</div>
                    <div class="settings-stat-value">${dates} days</div>
                </div>
            </div>
            
            <!-- Info Section -->
            <div class="settings-info-section">
                <div class="settings-info-card">
                    <div class="settings-info-header">
                        <div class="settings-info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <h2 class="settings-info-title">API Configuration</h2>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">API URL</span>
                        <span class="settings-info-value">${API_BASE}</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Version</span>
                        <span class="settings-info-value">v2.4.1</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Region</span>
                        <span class="settings-info-value">ME-EAST-1</span>
                    </div>
                </div>
                
                <div class="settings-info-card">
                    <div class="settings-info-header">
                        <div class="settings-info-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 class="settings-info-title">System Settings</h2>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Environment</span>
                        <span class="settings-info-value">Production</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Cache</span>
                        <span class="settings-info-value">Enabled</span>
                    </div>
                    <div class="settings-info-row">
                        <span class="settings-info-label">Last Updated</span>
                        <span class="settings-info-value">${new Date().toISOString().split('T')[0]}</span>
                    </div>
                </div>
            </div>
            
            <!-- Status Section -->
            <div class="settings-status-section">
                <div class="settings-status-card">
                    <div class="settings-status-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="settings-status-content">
                        <h3>Connected</h3>
                        <p>API connection is working properly</p>
                    </div>
                </div>
                
                <div class="settings-status-card">
                    <div class="settings-status-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div class="settings-status-content">
                        <h3>System Ready</h3>
                        <p>All systems operational</p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    `;
}
// ========================================