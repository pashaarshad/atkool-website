var viewIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
var editIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
var deleteIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

var idCardBase64 = '';

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

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    var hours = String(date.getHours()).padStart(2, '0');
    var minutes = String(date.getMinutes()).padStart(2, '0');
    return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
}

document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadStaff();
    setupEventListeners();
});

function setupEventListeners() {
    var addStaffBtn = document.getElementById('addStaffBtn');
    var staffForm = document.getElementById('staffForm');
    var searchName = document.getElementById('searchName');
    var searchPhone = document.getElementById('searchPhone');
    var idCardInput = document.getElementById('idCard');

    addStaffBtn.addEventListener('click', function () {
        openModal();
    });

    staffForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveStaff();
    });

    var searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            loadStaff();
        }, 300);
    }

    searchName.addEventListener('input', debounceSearch);
    searchPhone.addEventListener('input', debounceSearch);

    idCardInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            idCardBase64 = e.target.result;
            document.getElementById('idCardPreview').innerHTML = '<img src="' + idCardBase64 + '" style="max-width: 150px; max-height: 100px; border-radius: 5px; border: 1px solid #ddd;">';
            showToast('ID Card uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    });
}

async function loadStaff() {
    var token = localStorage.getItem('adminToken');
    var tableBody = document.getElementById('staffTableBody');

    var name = document.getElementById('searchName').value;
    var phone = document.getElementById('searchPhone').value;

    var queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    if (phone) queryParams.append('phone', phone);

    try {
        var response = await fetch('/api/office-staff?' + queryParams.toString(), {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            return;
        }

        var staff = await response.json();

        if (staff.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="loading">No staff found</td></tr>';
            return;
        }

        tableBody.innerHTML = staff.map(function (member, index) {
            var fullName = member.firstName + ' ' + member.lastName;
            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + fullName + '</td>' +
                '<td>' + member.phone + '</td>' +
                '<td>' + (member.email || 'N/A') + '</td>' +
                '<td>' + (member.age || 'N/A') + '</td>' +
                '<td>' + (member.address || 'N/A') + '</td>' +
                '<td>' + formatDateTime(member.updatedAt) + '</td>' +
                '<td>' +
                '<button class="action-btn" onclick="viewStaff(\'' + member._id + '\')" title="View">' + viewIcon + '</button>' +
                '<button class="action-btn" onclick="editStaff(\'' + member._id + '\')" title="Edit">' + editIcon + '</button>' +
                '<button class="action-btn" onclick="deleteStaff(\'' + member._id + '\')" title="Delete">' + deleteIcon + '</button>' +
                '</td>' +
                '</tr>';
        }).join('');

    } catch (error) {
        console.error('Load staff error:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Error loading staff</td></tr>';
        showToast('Error loading staff', 'error');
    }
}

function openModal(staff) {
    var modal = document.getElementById('staffModal');
    var modalTitle = document.getElementById('modalTitle');

    if (staff) {
        modalTitle.textContent = 'Edit Staff';
        document.getElementById('staffId').value = staff._id;
        document.getElementById('firstName').value = staff.firstName;
        document.getElementById('lastName').value = staff.lastName;
        document.getElementById('phone').value = staff.phone;
        document.getElementById('email').value = staff.email || '';
        document.getElementById('age').value = staff.age || '';
        document.getElementById('address').value = staff.address || '';
        idCardBase64 = staff.idCard || '';
        document.getElementById('idCardPreview').innerHTML = staff.idCard ? '<img src="' + staff.idCard + '" style="max-width: 150px; max-height: 100px; border-radius: 5px; border: 1px solid #ddd;">' : '';
        document.getElementById('idCard').value = '';
    } else {
        modalTitle.textContent = 'Add Staff';
        document.getElementById('staffForm').reset();
        document.getElementById('staffId').value = '';
        idCardBase64 = '';
        document.getElementById('idCardPreview').innerHTML = '';
    }

    modal.classList.add('show');
}

function closeModal() {
    var modal = document.getElementById('staffModal');
    modal.classList.remove('show');
}

function closeViewModal() {
    var modal = document.getElementById('viewModal');
    modal.classList.remove('show');
}

async function saveStaff() {
    var token = localStorage.getItem('adminToken');
    var staffId = document.getElementById('staffId').value;

    var staffData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : null,
        address: document.getElementById('address').value,
        idCard: idCardBase64
    };

    try {
        var url = staffId ? '/api/office-staff/' + staffId : '/api/office-staff';
        var method = staffId ? 'PUT' : 'POST';

        var response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(staffData)
        });

        if (response.ok) {
            closeModal();
            loadStaff();
            showToast('Staff saved successfully!', 'success');
        } else {
            var data = await response.json();
            showToast(data.message || 'Error saving staff', 'error');
        }
    } catch (error) {
        console.error('Save staff error:', error);
        showToast('Error saving staff', 'error');
    }
}

async function viewStaff(id) {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/office-staff/' + id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var staff = await response.json();

        var content = document.getElementById('viewModalContent');
        var idCardHtml = staff.idCard ? '<div style="margin-top: 15px;"><strong>ID Card:</strong><br><img src="' + staff.idCard + '" style="max-width: 200px; max-height: 150px; border-radius: 5px; margin-top: 10px; border: 1px solid #ddd;"></div>' : '';

        content.innerHTML =
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Name:</span>' +
            '<span class="view-detail-value">' + staff.firstName + ' ' + staff.lastName + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Phone:</span>' +
            '<span class="view-detail-value">' + staff.phone + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Email:</span>' +
            '<span class="view-detail-value">' + (staff.email || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Age:</span>' +
            '<span class="view-detail-value">' + (staff.age || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Address:</span>' +
            '<span class="view-detail-value">' + (staff.address || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Created:</span>' +
            '<span class="view-detail-value">' + formatDateTime(staff.createdAt) + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Last Updated:</span>' +
            '<span class="view-detail-value">' + formatDateTime(staff.updatedAt) + '</span>' +
            '</div>' +
            idCardHtml;

        var modal = document.getElementById('viewModal');
        modal.classList.add('show');

    } catch (error) {
        console.error('View staff error:', error);
        showToast('Error loading staff details', 'error');
    }
}

async function editStaff(id) {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/office-staff/' + id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var staff = await response.json();
        openModal(staff);
    } catch (error) {
        console.error('Edit staff error:', error);
        showToast('Error loading staff for editing', 'error');
    }
}

async function deleteStaff(id) {
    var confirmDelete = confirm('Are you sure you want to delete this staff member?');
    if (!confirmDelete) {
        return;
    }

    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/office-staff/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            loadStaff();
            showToast('Staff deleted successfully!', 'success');
        } else {
            var data = await response.json();
            showToast(data.message || 'Error deleting staff', 'error');
        }
    } catch (error) {
        console.error('Delete staff error:', error);
        showToast('Error deleting staff', 'error');
    }
}
