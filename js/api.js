        // DATA LOADING
        // ========================================
        async function loadMetricsData(quarter = null) {
            try {
                // First, check if we have saved data in localStorage
                if (typeof loadFromLocalStorage === 'function') {
                    const savedData = loadFromLocalStorage();
                    if (savedData && savedData.length > 0) {
                        metricsData = savedData;
                        console.log('✅ Using saved data from localStorage:', metricsData.length, 'records');
                        if (typeof document !== 'undefined' && document.getElementById('recordCount')) {
                            document.getElementById('recordCount').textContent = `${metricsData.length} records loaded (from cache)`;
                        }
                        return metricsData;
                    }
                }
                
                // If no saved data, fetch from API
                const apiBase = window.API_BASE || 'http://localhost:8001';
                const url = quarter ? `${apiBase}/api/metrics?quarter=${quarter}` : `${apiBase}/api/metrics`;
                console.log('📡 Fetching fresh data from API:', url);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Raw API response received');
                
                if (Array.isArray(data)) {
                    metricsData = data;
                } else if (data.records && Array.isArray(data.records)) {
                    metricsData = data.records;
                } else if (data.timeseries && Array.isArray(data.timeseries)) {
                    metricsData = data.timeseries;
                } else if (data.data && Array.isArray(data.data)) {
                    metricsData = data.data;
                } else {
                    console.error('Unexpected data format:', data);
                    throw new Error('Unexpected data format from API');
                }
                
                // Save to localStorage for next time
                if (typeof saveToLocalStorage === 'function') {
                    saveToLocalStorage(metricsData);
                }
                
                console.log(`✅ Loaded ${metricsData.length} records from API and cached them`);
                console.log('Sample record:', metricsData[0]);
                
                if (typeof document !== 'undefined' && document.getElementById('recordCount')) {
                    document.getElementById('recordCount').textContent = `${metricsData.length} records loaded`;
                }
                return metricsData;
            } catch (error) {
                console.error('Error loading data:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Error loading data: ' + error.message, 'error');
                }
                if (typeof document !== 'undefined' && document.getElementById('recordCount')) {
                    document.getElementById('recordCount').textContent = 'Error loading data';
                }
                return [];
            }
        }

        // ========================================