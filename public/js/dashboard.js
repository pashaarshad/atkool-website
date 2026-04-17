document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadDashboardStats();

    var schoolListMenu = document.getElementById('schoolListMenu');
    var schoolSubmenu = document.getElementById('schoolSubmenu');

    schoolListMenu.addEventListener('click', function (e) {
        if (e.target.classList.contains('submenu-item')) {
            return;
        }
        schoolSubmenu.classList.toggle('show');
    });
});

async function loadDashboardStats() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/';
            return;
        }

        var data = await response.json();

        document.getElementById('totalSchools').textContent = data.totalSchools || 0;
        document.getElementById('activePlans').textContent = data.activePlans || 0;
        document.getElementById('systemUse').textContent = (data.systemUse || 0) + '%';
        document.getElementById('officeStaff').textContent = data.managers?.officeStaff || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;

    } catch (error) {
        console.error('Dashboard error:', error);
    }
}
