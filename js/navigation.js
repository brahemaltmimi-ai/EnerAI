// ==================== تعريف الدوال المفقودة مؤقتاً ====================

// تعريف مؤقت للدوال المفقودة حتى يتم تحميل الملف الرئيسي
window.renderReportNowPage = window.renderReportNowPage || function() {
    console.warn('renderReportNowPage not fully loaded yet, redirecting to home...');
    if (window.renderHomePage) {
        window.renderHomePage();
    } else {
        location.reload();
    }
};

window.renderReportsArchivePage = window.renderReportsArchivePage || function() {
    console.warn('renderReportsArchivePage not loaded yet');
    alert('Reports archive page is loading...');
};

window.renderPerformancePage = window.renderPerformancePage || function() {
    console.warn('renderPerformancePage not loaded yet');
    alert('Performance page is loading...');
};

window.renderSettingsPage = window.renderSettingsPage || function() {
    console.warn('renderSettingsPage not loaded yet');
    alert('Settings page is loading...');
};

// ==================== تحميل الدوال الحقيقية عند توفرها ====================

// هذه الدالة تنتظر حتى يتم تحميل الدوال الحقيقية
function initializeNavigation() {
    // تحديث pageMap بالدوال الحقيقية إذا كانت موجودة
    const pageMap = {
        'home': window.renderHomePage || function() {
            document.getElementById('mainContent').innerHTML = '<h2>Loading...</h2>';
        },
        'reportnow': window.renderReportNowPage || function() {
            document.getElementById('mainContent').innerHTML = '<h2>Loading Report Page...</h2>';
        },
                'dataMangmint': window.renderDataManagementSystem || function() {
            document.getElementById('mainContent').innerHTML = '<h2>Loading Data Management...</h2>';
        },
        'reports': window.renderReportsArchivePage || function() {
            document.getElementById('mainContent').innerHTML = '<h2>Loading Reports Archive...</h2>';
        },
        'performance': window.renderPerformancePage || function() {
            document.getElementById('mainContent').innerHTML = '<h2>Loading Performance...</h2>';
        }
    };
    
    // استبدال دالة navigateTo الأصلية بالإصدار المحدث
    window.navigateTo = function(page) {
        console.log(`Navigating to: ${page}`);
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'bg-blue-600/50');
            if (item.dataset.page === page) {
                item.classList.add('active', 'bg-blue-600/50');
            }
        });
        
        // تدمير الرسوم البيانية إذا كانت موجودة
        if (window.chartInstances) {
            Object.keys(window.chartInstances).forEach(key => {
                if (window.chartInstances[key] && window.chartInstances[key].destroy) {
                    window.chartInstances[key].destroy();
                }
            });
            window.chartInstances = {};
        }
        
        if (pageMap[page]) {
            pageMap[page]();
        } else {
            console.error(`Page ${page} not found in pageMap`);
            if (pageMap['home']) {
                pageMap['home']();
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

// ==================== تشغيل التهيئة عند تحميل الصفحة ====================

// الطريقة 1: انتظر حتى يتم تحميل الصفحة بالكامل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}

// الطريقة 2: تحقق بشكل دوري من توفر الدوال الرئيسية
let checkCount = 0;
const maxChecks = 50; // 5 ثواني كحد أقصى (100ms * 50)

const checkForMainFunctions = setInterval(() => {
    checkCount++;
    
    // إذا تم تحميل الدوال الرئيسية
    if (window.renderHomePage && window.renderReportNowPage) {
        clearInterval(checkForMainFunctions);
        console.log('Main functions loaded, initializing navigation...');
        initializeNavigation();
    }
    
    // إذا تجاوزنا الحد الأقصى للتجارب
    if (checkCount >= maxChecks) {
        clearInterval(checkForMainFunctions);
        console.warn('Main functions not loaded after timeout, using fallbacks');
        initializeNavigation();
    }
}, 100);

