var viewIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
var editIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
var deleteIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
var renewIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
var loginIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>';

function formatDate(dateString) {
    if (!dateString) return '<span style="color: #999;">N/A</span>';
    var date = new Date(dateString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '-' + month + '-' + year;
}

function getDateBadge(dateString, type) {
    if (!dateString) return '<span style="color: #999;">No Subscription</span>';
    var date = new Date(dateString);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var formattedDate = formatDate(dateString);
    var daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    var style = '';
    if (type === 'end') {
        if (daysUntil < 0) {
            style = 'background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        } else if (daysUntil <= 7) {
            style = 'background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        } else {
            style = 'background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        }
    } else if (type === 'due') {
        if (daysUntil < 0) {
            style = 'background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        } else if (daysUntil <= 3) {
            style = 'background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        } else {
            style = 'background: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
        }
    }

    return '<span style="' + style + '">' + formattedDate + '</span>';
}

var schoolLogoBase64 = '';

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

document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadSchools();
    setupEventListeners();
});

function setupEventListeners() {
    var addSchoolBtn = document.getElementById('addSchoolBtn');
    var exportBtn = document.getElementById('exportBtn');
    var cancelBtn = document.getElementById('cancelBtn');
    var schoolForm = document.getElementById('schoolForm');
    var searchName = document.getElementById('searchName');
    var searchId = document.getElementById('searchId');
    var searchMobile = document.getElementById('searchMobile');

    addSchoolBtn.addEventListener('click', function () {
        window.location.href = 'add-school.html';
    });

    exportBtn.addEventListener('click', function () {
        exportSchools();
    });

    cancelBtn.addEventListener('click', function () {
        closeModal();
    });

    schoolForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveSchool();
    });

    var searchTimeout;
    function debounceSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            loadSchools();
        }, 300);
    }

    searchName.addEventListener('input', debounceSearch);
    searchId.addEventListener('input', debounceSearch);
    searchMobile.addEventListener('input', debounceSearch);

    var schoolLogoFile = document.getElementById('schoolLogoFile');
    if (schoolLogoFile) {
        schoolLogoFile.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function (e) {
                schoolLogoBase64 = e.target.result;
                document.getElementById('schoolLogoPreview').innerHTML = '<img src="' + schoolLogoBase64 + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">';
                showToast('Logo uploaded!', 'success');
            };
            reader.readAsDataURL(file);
        });
    }
}

async function loadSchools() {
    var token = localStorage.getItem('adminToken');
    var tableBody = document.getElementById('schoolsTableBody');

    var name = document.getElementById('searchName').value;
    var id = document.getElementById('searchId').value;
    var mobileNo = document.getElementById('searchMobile').value;

    var queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    if (id) queryParams.append('id', id);
    if (mobileNo) queryParams.append('mobileNo', mobileNo);

    try {
        var response = await fetch('/api/schools?' + queryParams.toString(), {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            return;
        }

        var schools = await response.json();

        if (schools.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10" class="loading">No schools found</td></tr>';
            return;
        }

        tableBody.innerHTML = schools.map(function (school, index) {
            var renewButton = school.subscriptionEndDate ?
                '<button class="action-btn" onclick="renewSubscription(\'' + school._id + '\', \'' + school.name + '\')" title="Renew (+1 Month)" style="background: #d1fae5;">' + renewIcon + '</button>' :
                '';

            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + school.name + '</td>' +
                '<td>' + school.teachers + '</td>' +
                '<td>' + school.students + '</td>' +
                '<td>' + school.city + '</td>' +
                '<td>' + school.status + '</td>' +
                '<td>INR. ' + school.amount + '</td>' +
                '<td>' + getDateBadge(school.subscriptionEndDate, 'end') + '</td>' +
                '<td>' + getDateBadge(school.subscriptionDueDate, 'due') + '</td>' +
                '<td>' +
                '<button class="action-btn" onclick="loginAsSchool(\'' + school._id + '\', \'' + school.name.replace(/'/g, "\\'") + '\')" title="Login as School" style="background: #dbeafe;">' + loginIcon + '</button>' +
                '<button class="action-btn" onclick="viewSchool(\'' + school._id + '\')" title="View">' + viewIcon + '</button>' +
                '<button class="action-btn" onclick="editSchool(\'' + school._id + '\')" title="Edit">' + editIcon + '</button>' +
                '<button class="action-btn" onclick="deleteSchool(\'' + school._id + '\')" title="Delete">' + deleteIcon + '</button>' +
                renewButton +
                '</td>' +
                '</tr>';
        }).join('');

    } catch (error) {
        console.error('Load schools error:', error);
        tableBody.innerHTML = '<tr><td colspan="10" class="loading">Error loading schools</td></tr>';
        showToast('Error loading schools', 'error');
    }
}

function openModal(school) {
    var modal = document.getElementById('schoolModal');
    var modalTitle = document.getElementById('modalTitle');

    if (school) {
        modalTitle.textContent = 'Edit School';
        document.getElementById('schoolId').value = school._id;
        document.getElementById('schoolName').value = school.name;
        document.getElementById('schoolOwner').value = school.ownerName || '';
        document.getElementById('schoolMobile').value = school.mobileNo || '';
        document.getElementById('schoolEmail').value = school.email || '';
        document.getElementById('schoolAddress').value = school.address || '';
        document.getElementById('schoolState').value = school.state || '';
        document.getElementById('schoolCity').value = school.city;
        document.getElementById('schoolZipCode').value = school.zipCode || '';
        document.getElementById('schoolGstNo').value = school.gstNo || '';
        document.getElementById('schoolPassword').value = school.password || '';
        document.getElementById('schoolTeachers').value = school.teachers;
        document.getElementById('schoolStudents').value = school.students;
        document.getElementById('schoolStatus').value = school.status;
        document.getElementById('schoolAmount').value = school.amount;
        schoolLogoBase64 = school.logo || '';
        document.getElementById('schoolLogoPreview').innerHTML = school.logo ? '<img src="' + school.logo + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">' : '';
        document.getElementById('schoolLogoFile').value = '';
    } else {
        modalTitle.textContent = 'Add School';
        document.getElementById('schoolForm').reset();
        document.getElementById('schoolId').value = '';
        schoolLogoBase64 = '';
        document.getElementById('schoolLogoPreview').innerHTML = '';
    }

    modal.classList.add('show');
}

function closeModal() {
    var modal = document.getElementById('schoolModal');
    modal.classList.remove('show');
}

function closeViewModal() {
    var modal = document.getElementById('viewModal');
    modal.classList.remove('show');
}

async function saveSchool() {
    var token = localStorage.getItem('adminToken');
    var schoolId = document.getElementById('schoolId').value;

    var schoolData = {
        name: document.getElementById('schoolName').value,
        ownerName: document.getElementById('schoolOwner').value,
        mobileNo: document.getElementById('schoolMobile').value,
        email: document.getElementById('schoolEmail').value,
        address: document.getElementById('schoolAddress').value,
        state: document.getElementById('schoolState').value,
        city: document.getElementById('schoolCity').value,
        zipCode: document.getElementById('schoolZipCode').value,
        gstNo: document.getElementById('schoolGstNo').value,
        password: document.getElementById('schoolPassword').value,
        teachers: parseInt(document.getElementById('schoolTeachers').value) || 0,
        students: parseInt(document.getElementById('schoolStudents').value) || 0,
        status: document.getElementById('schoolStatus').value,
        amount: parseInt(document.getElementById('schoolAmount').value) || 0,
        logo: schoolLogoBase64
    };

    try {
        var url = schoolId ? '/api/schools/' + schoolId : '/api/schools';
        var method = schoolId ? 'PUT' : 'POST';

        var response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(schoolData)
        });

        if (response.ok) {
            closeModal();
            loadSchools();
            showToast('School saved successfully!', 'success');
        } else {
            var data = await response.json();
            showToast(data.message || 'Error saving school', 'error');
        }
    } catch (error) {
        console.error('Save school error:', error);
        showToast('Error saving school', 'error');
    }
}

async function viewSchool(id) {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/' + id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var school = await response.json();

        var content = document.getElementById('viewModalContent');
        content.innerHTML =
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">School Name:</span>' +
            '<span class="view-detail-value">' + school.name + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Owner Name:</span>' +
            '<span class="view-detail-value">' + (school.ownerName || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Mobile:</span>' +
            '<span class="view-detail-value">' + (school.mobileNo || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Email:</span>' +
            '<span class="view-detail-value">' + (school.email || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Address:</span>' +
            '<span class="view-detail-value">' + (school.address || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">State:</span>' +
            '<span class="view-detail-value">' + (school.state || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">City:</span>' +
            '<span class="view-detail-value">' + school.city + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Zip Code:</span>' +
            '<span class="view-detail-value">' + (school.zipCode || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">GST No:</span>' +
            '<span class="view-detail-value">' + (school.gstNo || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Password:</span>' +
            '<span class="view-detail-value">' + (school.password || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Teachers:</span>' +
            '<span class="view-detail-value">' + school.teachers + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Students:</span>' +
            '<span class="view-detail-value">' + school.students + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Status:</span>' +
            '<span class="view-detail-value">' + school.status + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Amount:</span>' +
            '<span class="view-detail-value">INR ' + school.amount + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">PAN Card No:</span>' +
            '<span class="view-detail-value">' + (school.panCardNo || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Aadhar Card No:</span>' +
            '<span class="view-detail-value">' + (school.aadharCardNo || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-documents-section">' +
            '<h4 style="margin: 15px 0 10px; color: #333;">Documents</h4>' +
            '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">' +
            (school.panCardFront ? '<div class="doc-item"><p style="font-size: 12px; margin-bottom: 5px;">PAN Front</p><img src="' + school.panCardFront + '" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open(this.src)"></div>' : '') +
            (school.panCardBack ? '<div class="doc-item"><p style="font-size: 12px; margin-bottom: 5px;">PAN Back</p><img src="' + school.panCardBack + '" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open(this.src)"></div>' : '') +
            (school.aadharCardFront ? '<div class="doc-item"><p style="font-size: 12px; margin-bottom: 5px;">Aadhar Front</p><img src="' + school.aadharCardFront + '" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open(this.src)"></div>' : '') +
            (school.aadharCardBack ? '<div class="doc-item"><p style="font-size: 12px; margin-bottom: 5px;">Aadhar Back</p><img src="' + school.aadharCardBack + '" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open(this.src)"></div>' : '') +
            '</div>' +
            '</div>';

        var modal = document.getElementById('viewModal');
        modal.classList.add('show');

    } catch (error) {
        console.error('View school error:', error);
        showToast('Error loading school details', 'error');
    }
}

async function editSchool(id) {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/' + id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var school = await response.json();
        openModal(school);
    } catch (error) {
        console.error('Edit school error:', error);
        showToast('Error loading school for editing', 'error');
    }
}

async function deleteSchool(id) {
    var confirmDelete = confirm('Are you sure you want to delete this school?');
    if (!confirmDelete) {
        return;
    }

    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            loadSchools();
            showToast('School deleted successfully!', 'success');
        } else {
            var data = await response.json();
            showToast(data.message || 'Error deleting school', 'error');
        }
    } catch (error) {
        console.error('Delete school error:', error);
        showToast('Error deleting school', 'error');
    }
}

async function exportSchools() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/export/all', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var blob = await response.blob();
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'schools.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('Schools exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting schools', 'error');
    }
}

async function renewSubscription(schoolId, schoolName) {
    // Open the custom modal instead of browser confirm
    document.getElementById('renewSchoolId').value = schoolId;
    document.getElementById('renewSchoolName').textContent = '"' + schoolName + '"';
    document.getElementById('renewModal').classList.add('show');
}

function closeRenewModal() {
    document.getElementById('renewModal').classList.remove('show');
    document.getElementById('renewSchoolId').value = '';
    document.getElementById('renewSchoolName').textContent = '';
}

async function confirmRenew() {
    var schoolId = document.getElementById('renewSchoolId').value;
    var token = localStorage.getItem('adminToken');

    // Close the modal
    closeRenewModal();

    try {
        var response = await fetch('/api/subscriptions/renew/' + schoolId, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json();

        if (response.ok) {
            showToast('Subscription renewed! New end date: ' + formatDate(data.newEndDate), 'success');
            loadSchools();
        } else {
            showToast(data.message || 'Error renewing subscription', 'error');
        }
    } catch (error) {
        console.error('Renew subscription error:', error);
        showToast('Error renewing subscription', 'error');
    }
}

async function loginAsSchool(schoolId, schoolName) {
    var token = localStorage.getItem('adminToken');

    try {
        showToast('Logging in as ' + schoolName + '...', 'info');

        var response = await fetch('/api/school-auth/admin-login/' + schoolId, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json();

        if (response.ok) {
            // Store the school token
            localStorage.setItem('schoolToken', data.token);
            localStorage.setItem('schoolData', JSON.stringify(data.school));

            showToast('Logged in as ' + data.school.name + '! Redirecting...', 'success');

            // Redirect to school admin panel after a short delay
            setTimeout(function () {
                window.open('/school-admin/dashboard.html', '_blank');
            }, 500);
        } else {
            showToast(data.message || 'Error logging in as school', 'error');
        }
    } catch (error) {
        console.error('Login as school error:', error);
        showToast('Error logging in as school', 'error');
    }
}

