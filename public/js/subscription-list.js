var token = localStorage.getItem('adminToken');
if (!token) {
    window.location.href = 'index.html';
}

var subscriptions = [];
var schools = [];

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
    if (!dateString) return '-';
    var date = new Date(dateString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '-' + month + '-' + year;
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function getStatusBadge(status) {
    var colors = {
        'Active': '#2e7d32',
        'Expired': '#c62828',
        'Pending': '#f57c00',
        'Cancelled': '#757575'
    };
    var color = colors[status] || '#333';
    return '<span style="background-color: ' + color + '; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">' + status + '</span>';
}

async function loadSchools() {
    try {
        var response = await fetch('/api/schools', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        schools = await response.json();

        // Populate filter dropdown
        var filterSchool = document.getElementById('filterSchool');
        filterSchool.innerHTML = '<option value="">All Schools</option>';
        schools.forEach(function (school) {
            filterSchool.innerHTML += '<option value="' + school._id + '">' + school.name + '</option>';
        });

        // Populate form dropdown
        var schoolSelect = document.getElementById('schoolId');
        schoolSelect.innerHTML = '<option value="">--Select School--</option>';
        schools.forEach(function (school) {
            schoolSelect.innerHTML += '<option value="' + school._id + '">' + school.name + '</option>';
        });
    } catch (error) {
        console.error('Error loading schools:', error);
        showToast('Error loading schools', 'error');
    }
}

async function loadSubscriptions() {
    try {
        var schoolId = document.getElementById('filterSchool').value;
        var status = document.getElementById('filterStatus').value;

        var url = '/api/subscriptions?';
        if (schoolId) url += 'schoolId=' + schoolId + '&';
        if (status && status !== 'all') url += 'status=' + status;

        var response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        subscriptions = await response.json();
        renderSubscriptions();
    } catch (error) {
        console.error('Error loading subscriptions:', error);
        showToast('Error loading subscriptions', 'error');
    }
}

function renderSubscriptions() {
    var tbody = document.getElementById('subscriptionsTableBody');

    if (subscriptions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">No subscriptions found</td></tr>';
        return;
    }

    tbody.innerHTML = subscriptions.map(function (sub, index) {
        var schoolName = sub.schoolId ? sub.schoolId.name : 'Unknown';
        return '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td>' + schoolName + '</td>' +
            '<td>' + formatDate(sub.startDate) + '</td>' +
            '<td>' + formatDate(sub.endDate) + '</td>' +
            '<td>' + formatDate(sub.dueDate) + '</td>' +
            '<td>₹' + (sub.amount || 0) + '</td>' +
            '<td>' + (sub.numberOfTeachers || 0) + '</td>' +
            '<td>' + (sub.numberOfStudents || 0) + '</td>' +
            '<td>' + getStatusBadge(sub.status) + '</td>' +
            '<td>' +
            '<button class="action-btn" onclick="viewSubscription(\'' + sub._id + '\')" title="View">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
            '</button>' +
            '<button class="action-btn" onclick="editSubscription(\'' + sub._id + '\')" title="Edit">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
            '</button>' +
            '<button class="action-btn" onclick="deleteSubscription(\'' + sub._id + '\')" title="Delete">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
            '</button>' +
            '</td>' +
            '</tr>';
    }).join('');
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Agency Subscription';
    document.getElementById('subscriptionId').value = '';
    document.getElementById('subscriptionForm').reset();
    document.getElementById('subscriptionModal').classList.add('show');
}

function closeModal() {
    document.getElementById('subscriptionModal').classList.remove('show');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('show');
}

function viewSubscription(id) {
    var sub = subscriptions.find(function (s) { return s._id === id; });
    if (!sub) return;

    var schoolName = sub.schoolId ? sub.schoolId.name : 'Unknown';
    var schoolEmail = sub.schoolId ? sub.schoolId.email : '-';
    var schoolMobile = sub.schoolId ? sub.schoolId.mobileNo : '-';

    document.getElementById('viewModalContent').innerHTML =
        '<div class="view-detail-row"><span class="view-detail-label">School Name:</span><span class="view-detail-value">' + schoolName + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">School Email:</span><span class="view-detail-value">' + (schoolEmail || '-') + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">School Mobile:</span><span class="view-detail-value">' + (schoolMobile || '-') + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Start Date:</span><span class="view-detail-value">' + formatDate(sub.startDate) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">End Date:</span><span class="view-detail-value">' + formatDate(sub.endDate) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Due Date:</span><span class="view-detail-value">' + formatDate(sub.dueDate) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Amount:</span><span class="view-detail-value">₹' + (sub.amount || 0) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Teachers:</span><span class="view-detail-value">' + (sub.numberOfTeachers || 0) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Students:</span><span class="view-detail-value">' + (sub.numberOfStudents || 0) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Status:</span><span class="view-detail-value">' + getStatusBadge(sub.status) + '</span></div>' +
        '<div class="view-detail-row"><span class="view-detail-label">Created:</span><span class="view-detail-value">' + formatDate(sub.createdAt) + '</span></div>';

    document.getElementById('viewModal').classList.add('show');
}

function editSubscription(id) {
    var sub = subscriptions.find(function (s) { return s._id === id; });
    if (!sub) return;

    document.getElementById('modalTitle').textContent = 'Edit Subscription';
    document.getElementById('subscriptionId').value = sub._id;
    document.getElementById('schoolId').value = sub.schoolId ? sub.schoolId._id : '';
    document.getElementById('startDate').value = formatDateForInput(sub.startDate);
    document.getElementById('endDate').value = formatDateForInput(sub.endDate);
    document.getElementById('dueDate').value = formatDateForInput(sub.dueDate);
    document.getElementById('amount').value = sub.amount || '';
    document.getElementById('numberOfTeachers').value = sub.numberOfTeachers || '';
    document.getElementById('numberOfStudents').value = sub.numberOfStudents || '';
    document.getElementById('status').value = sub.status || '';

    document.getElementById('subscriptionModal').classList.add('show');
}

async function deleteSubscription(id) {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
        var response = await fetch('/api/subscriptions/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            showToast('Subscription deleted successfully', 'success');
            loadSubscriptions();
        } else {
            var data = await response.json();
            showToast(data.message || 'Error deleting subscription', 'error');
        }
    } catch (error) {
        console.error('Error deleting subscription:', error);
        showToast('Error deleting subscription', 'error');
    }
}

document.getElementById('subscriptionForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    var id = document.getElementById('subscriptionId').value;
    var formData = {
        schoolId: document.getElementById('schoolId').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        dueDate: document.getElementById('dueDate').value,
        amount: parseFloat(document.getElementById('amount').value) || 0,
        numberOfTeachers: parseInt(document.getElementById('numberOfTeachers').value) || 0,
        numberOfStudents: parseInt(document.getElementById('numberOfStudents').value) || 0,
        status: document.getElementById('status').value
    };

    try {
        var url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
        var method = id ? 'PUT' : 'POST';

        var response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        });

        var data = await response.json();

        if (response.ok) {
            showToast(id ? 'Subscription updated successfully' : 'Subscription created successfully', 'success');
            closeModal();
            loadSubscriptions();
        } else {
            showToast(data.message || 'Error saving subscription', 'error');
        }
    } catch (error) {
        console.error('Error saving subscription:', error);
        showToast('Error saving subscription', 'error');
    }
});

// Event listeners
document.getElementById('addSubscriptionBtn').addEventListener('click', openAddModal);
document.getElementById('filterSchool').addEventListener('change', loadSubscriptions);
document.getElementById('filterStatus').addEventListener('change', loadSubscriptions);

// Initialize
loadSchools();
loadSubscriptions();
