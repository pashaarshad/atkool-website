function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');

    var iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === 'error') {
        iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
        iconSvg = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = iconSvg +
        '<span class="toast-message">' + message + '</span>' +
        '<button class="toast-close" onclick="this.parentElement.remove()">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>' +
        '</button>';

    container.appendChild(toast);

    setTimeout(function () {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '-' + month + '-' + year;
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var day = String(date.getDate()).padStart(2, '0');
    var year = date.getFullYear();
    var hours = String(date.getHours()).padStart(2, '0');
    var mins = String(date.getMinutes()).padStart(2, '0');
    var secs = String(date.getSeconds()).padStart(2, '0');
    return months[date.getMonth()] + ',' + day + ',' + year + ' ' + hours + ':' + mins + ':' + secs;
}

document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    seedDummyPayment();
    loadPayments();
    setupEventListeners();
});

async function seedDummyPayment() {
    var token = localStorage.getItem('adminToken');
    try {
        await fetch('/api/payments/seed', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    } catch (error) {
        console.error('Seed error:', error);
    }
}

function setupEventListeners() {
    var fromDate = document.getElementById('fromDate');
    var toDate = document.getElementById('toDate');
    var searchQuery = document.getElementById('searchQuery');
    var statusFilter = document.getElementById('statusFilter');
    var exportBtn = document.getElementById('exportBtn');

    fromDate.addEventListener('change', loadPayments);
    toDate.addEventListener('change', loadPayments);
    statusFilter.addEventListener('change', loadPayments);
    exportBtn.addEventListener('click', exportPayments);

    var searchTimeout;
    searchQuery.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            loadPayments();
        }, 300);
    });
}

async function loadPayments() {
    var token = localStorage.getItem('adminToken');
    var tableBody = document.getElementById('paymentsTableBody');

    var fromDate = document.getElementById('fromDate').value;
    var toDate = document.getElementById('toDate').value;
    var searchQuery = document.getElementById('searchQuery').value;
    var statusFilter = document.getElementById('statusFilter').value;

    var queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('fromDate', fromDate);
    if (toDate) queryParams.append('toDate', toDate);
    if (searchQuery) queryParams.append('search', searchQuery);
    if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);

    try {
        var response = await fetch('/api/payments?' + queryParams.toString(), {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            return;
        }

        var payments = await response.json();

        if (payments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="loading">No payments found</td></tr>';
            return;
        }

        tableBody.innerHTML = payments.map(function (payment, index) {
            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + payment.schoolName + '</td>' +
                '<td>' + payment.userName + '</td>' +
                '<td>' + (payment.mobileNumber || '') + '</td>' +
                '<td>' + formatDateTime(payment.createdAt) + '</td>' +
                '<td>' + payment.amount + '</td>' +
                '<td>' + payment.status + '</td>' +
                '<td>' + formatDate(payment.endDate) + '</td>' +
                '<td>' + formatDate(payment.dueDate) + '</td>' +
                '</tr>';
        }).join('');

    } catch (error) {
        console.error('Load payments error:', error);
        tableBody.innerHTML = '<tr><td colspan="9" class="loading">Error loading payments</td></tr>';
        showToast('Error loading payments', 'error');
    }
}

function exportPayments() {
    showToast('Exporting payments...', 'info');

    // Get table data directly from DOM
    var table = document.querySelector('.data-table');
    var rows = table.querySelectorAll('tbody tr');

    if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('.loading'))) {
        showToast('No payments to export', 'error');
        return;
    }

    // Create CSV content
    var csvHeaders = ['S.No.', 'School Name', 'User Name', 'Mobile Number', 'Created On', 'Amount', 'Status', 'End Date', 'Due Date'];
    var csvRows = [csvHeaders.join(',')];

    rows.forEach(function (row) {
        var cells = row.querySelectorAll('td');
        if (cells.length >= 9) {
            var rowData = [
                '"' + (cells[0].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[1].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[2].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[3].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[4].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[5].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[6].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[7].textContent || '').replace(/"/g, '""') + '"',
                '"' + (cells[8].textContent || '').replace(/"/g, '""') + '"'
            ];
            csvRows.push(rowData.join(','));
        }
    });

    var csvContent = csvRows.join('\n');

    // Create and download file
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'payments_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Exported ' + (rows.length) + ' payments successfully!', 'success');
}
