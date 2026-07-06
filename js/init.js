        // INITIALIZATION
        // ========================================
        window.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, checking Chart.js...');
            
            setTimeout(function() {
                if (typeof Chart === 'undefined') {
                    console.error('hart.js failed to load!');
                    showNotification('Chart library failed to load. Please refresh the page.', 'error');
                    document.getElementById('chartStatus').textContent = 'Charts: Failed to load';
                } else {
                    console.log('Chart.js loaded successfully');
                    document.getElementById('chartStatus').textContent = 'Charts: Ready';
                    init();
                }
            }, 500);
        });

        async function init() {
            console.log('Initializing application...');
            updateDateTime();
            setInterval(updateDateTime, 60000);
            
            const data = await loadMetricsData();
            if (data && data.length > 0) {
                console.log('✅ Data loaded successfully, rendering home page...');
                navigateTo('home');
            } else {
                console.error('❌ No data loaded');
                showNotification('No data available. Please check API connection.', 'warning');
                document.getElementById('recordCount').textContent = '0 records - Check API';
                renderHomePage();
            }
        }

        function updateDateTime() {
            document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // ========================================