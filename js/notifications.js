function showNotification(message, type = 'info') {
    const toast = document.createElement("div");

    toast.className = `
        fixed top-6 right-6 z-[9999]
        px-5 py-3 rounded-xl shadow-xl text-white text-sm
        transition-all duration-300 opacity-0 translate-y-[-10px]
    `;

    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-amber-500'
    };

    toast.classList.add(colors[type] || colors.info);

    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
