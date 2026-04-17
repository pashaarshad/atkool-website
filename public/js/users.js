var viewIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
var resetIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
var leaveIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
var activateIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

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
    if (!dateString) return 'N/A';
    var date = new Date(dateString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '-' + month + '-' + year;
}

function getStatusBadge(status) {
    var colors = {
        'Active': 'background: #d1fae5; color: #059669;',
        'Inactive': 'background: #fee2e2; color: #dc2626;',
        'On Leave': 'background: #fef3c7; color: #d97706;'
    };
    var style = colors[status] || 'background: #e5e7eb; color: #374151;';
    return '<span style="' + style + ' padding: 4px 10px; border-radius: 4px; font-size: 12px;">' + status + '</span>';
}

document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    loadSchools();
    loadTeachers();
    setupEventListeners();
});

function setupEventListeners() {
    var filterSchool = document.getElementById('filterSchool');
    var filterStatus = document.getElementById('filterStatus');
    var searchName = document.getElementById('searchName');
    var exportBtn = document.getElementById('exportBtn');

    filterSchool.addEventListener('change', loadTeachers);
    filterStatus.addEventListener('change', loadTeachers);
    exportBtn.addEventListener('click', exportTeachers);

    var searchTimeout;
    searchName.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadTeachers, 300);
    });
}

async function loadSchools() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var schools = await response.json();
        var filterSchool = document.getElementById('filterSchool');

        schools.forEach(function (school) {
            var option = document.createElement('option');
            option.value = school._id;
            option.textContent = school.name + ' (' + school.city + ')';
            filterSchool.appendChild(option);
        });
    } catch (error) {
        console.error('Load schools error:', error);
    }
}

async function loadTeachers() {
    var token = localStorage.getItem('adminToken');
    var tableBody = document.getElementById('teachersTableBody');

    var school = document.getElementById('filterSchool').value;
    var status = document.getElementById('filterStatus').value;
    var name = document.getElementById('searchName').value;

    var queryParams = new URLSearchParams();
    if (school) queryParams.append('school', school);
    if (status) queryParams.append('status', status);
    if (name) queryParams.append('name', name);

    try {
        var response = await fetch('/api/users?' + queryParams.toString(), {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            return;
        }

        var teachers = await response.json();

        if (teachers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="loading">No teachers found</td></tr>';
            return;
        }

        tableBody.innerHTML = teachers.map(function (teacher, index) {
            var schoolName = teacher.schoolId ? teacher.schoolId.name : 'N/A';
            var deviceInfo = teacher.deviceId ?
                '<span style="color: #059669; font-size: 12px;">' + (teacher.deviceName || 'Locked') + '</span>' :
                '<span style="color: #9ca3af; font-size: 12px;">Not Set</span>';
            var resetBtn = teacher.deviceId ?
                '<button class="action-btn" onclick="resetDevice(\'' + teacher._id + '\', \'' + teacher.name.replace(/'/g, "\\'") + '\')" title="Reset Device" style="background: #fee2e2;">' + resetIcon + '</button>' : '';

            var isOnLeave = teacher.status === 'On Leave';
            var leaveBtn = '<button class="action-btn" onclick="toggleLeave(\'' + teacher._id + '\', \'' + teacher.name.replace(/'/g, "\\'") + '\', ' + isOnLeave + ')" title="' + (isOnLeave ? 'Mark Active' : 'Mark On Leave') + '" style="background: ' + (isOnLeave ? '#d1fae5' : '#fef3c7') + ';">' + (isOnLeave ? activateIcon : leaveIcon) + '</button>';

            // Format Class
            var classDisplay = '<span style="color: #999;">N/A</span>';
            if (teacher.classAssignments && teacher.classAssignments.length > 0) {
                classDisplay = teacher.classAssignments.map(function (ca) {
                    return '<span class="class-badge">' + ca.className + '-' + ca.section + '</span>';
                }).join('');
            } else if (teacher.className) {
                classDisplay = teacher.className;
            }

            return '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + teacher.name + '</td>' +
                '<td>' + schoolName + '</td>' +
                '<td>' + (teacher.email || 'N/A') + '</td>' +
                '<td>' + (teacher.mobileNo || 'N/A') + '</td>' +
                '<td>' + classDisplay + '</td>' +
                '<td>' + (teacher.subject || 'N/A') + '</td>' +
                '<td>' + getStatusBadge(teacher.status) + '</td>' +
                '<td>' + deviceInfo + '</td>' +
                '<td>' + formatDate(teacher.joiningDate) + '</td>' +
                '<td>' +
                '<button class="action-btn" onclick="viewTeacher(\'' + teacher._id + '\')" title="View">' + viewIcon + '</button>' +
                leaveBtn +
                resetBtn +
                '</td>' +
                '</tr>';
        }).join('');

    } catch (error) {
        console.error('Load teachers error:', error);
        tableBody.innerHTML = '<tr><td colspan="11" class="loading">Error loading teachers</td></tr>';
        showToast('Error loading teachers', 'error');
    }
}

async function viewTeacher(id) {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/users/' + id, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var teacher = await response.json();
        var schoolName = teacher.schoolId ? teacher.schoolId.name : 'N/A';
        var schoolCity = teacher.schoolId ? teacher.schoolId.city : '';

        var photoHtml = teacher.photo ? '<div style="text-align: center; margin-bottom: 15px;"><img src="' + teacher.photo + '" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;"></div>' : '';

        var content = document.getElementById('viewModalContent');
        content.innerHTML = photoHtml +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Name:</span>' +
            '<span class="view-detail-value">' + teacher.name + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">School:</span>' +
            '<span class="view-detail-value">' + schoolName + (schoolCity ? ' (' + schoolCity + ')' : '') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Email:</span>' +
            '<span class="view-detail-value">' + (teacher.email || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Mobile:</span>' +
            '<span class="view-detail-value">' + (teacher.mobileNo || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Class:</span>' +
            '<span class="view-detail-value">' + (teacher.className || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Subject:</span>' +
            '<span class="view-detail-value">' + (teacher.subject || 'N/A') + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Salary:</span>' +
            '<span class="view-detail-value">₹' + (teacher.salary || 0) + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Status:</span>' +
            '<span class="view-detail-value">' + getStatusBadge(teacher.status) + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Joining Date:</span>' +
            '<span class="view-detail-value">' + formatDate(teacher.joiningDate) + '</span>' +
            '</div>' +
            '<div class="view-detail-row">' +
            '<span class="view-detail-label">Address:</span>' +
            '<span class="view-detail-value">' + (teacher.address || 'N/A') + '</span>' +
            '</div>';

        var modal = document.getElementById('viewModal');
        modal.classList.add('show');

    } catch (error) {
        console.error('View teacher error:', error);
        showToast('Error loading teacher details', 'error');
    }
}

function closeViewModal() {
    var modal = document.getElementById('viewModal');
    modal.classList.remove('show');
}

async function exportTeachers() {
    var token = localStorage.getItem('adminToken');

    var school = document.getElementById('filterSchool').value;
    var status = document.getElementById('filterStatus').value;
    var name = document.getElementById('searchName').value;

    var queryParams = new URLSearchParams();
    if (school) queryParams.append('school', school);
    if (status) queryParams.append('status', status);
    if (name) queryParams.append('name', name);

    try {
        showToast('Exporting teachers...', 'info');

        var response = await fetch('/api/users?' + queryParams.toString(), {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var teachers = await response.json();

        if (teachers.length === 0) {
            showToast('No teachers to export', 'error');
            return;
        }

        // Create CSV content (only columns shown in table)
        var csvHeaders = ['S.No.', 'Name', 'School', 'Email', 'Mobile', 'Class', 'Subject', 'Status', 'Joining Date'];
        var csvRows = [csvHeaders.join(',')];

        teachers.forEach(function (teacher, index) {
            var schoolName = teacher.schoolId ? teacher.schoolId.name : 'N/A';
            // Format date for Excel (using month name to prevent Excel conversion)
            var joiningDate = 'N/A';
            if (teacher.joiningDate) {
                var d = new Date(teacher.joiningDate);
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var day = String(d.getDate()).padStart(2, '0');
                var month = months[d.getMonth()];
                var year = d.getFullYear();
                joiningDate = day + ' ' + month + ' ' + year;
            }
            var row = [
                index + 1,
                '"' + (teacher.name || '').replace(/"/g, '""') + '"',
                '"' + (schoolName || '').replace(/"/g, '""') + '"',
                '"' + (teacher.email || 'N/A').replace(/"/g, '""') + '"',
                '"' + (teacher.mobileNo || 'N/A').replace(/"/g, '""') + '"',
                '"' + classDisplay.replace(/"/g, '""') + '"',
                '"' + (teacher.subject || 'N/A').replace(/"/g, '""') + '"',
                '"' + (teacher.status || 'N/A').replace(/"/g, '""') + '"',
                '"' + joiningDate + '"'
            ];
            csvRows.push(row.join(','));
        });

        var csvContent = csvRows.join('\n');

        // Create and download file
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'all_teachers_' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Exported ' + teachers.length + ' teachers successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting teachers', 'error');
    }
}

var resetTargetTeacherId = null;

function openResetModal(teacherId, teacherName) {
    resetTargetTeacherId = teacherId;
    document.getElementById('resetConfirmMsg').textContent = 'Are you sure you want to reset the device for "' + teacherName + '"?';
    document.getElementById('resetConfirmModal').classList.add('show');
}

function closeResetModal() {
    resetTargetTeacherId = null;
    document.getElementById('resetConfirmModal').classList.remove('show');
}

document.getElementById('confirmResetBtn').addEventListener('click', function () {
    if (resetTargetTeacherId) {
        performDeviceReset(resetTargetTeacherId);
    }
});

// Wrapper to call from button
function resetDevice(teacherId, teacherName) {
    openResetModal(teacherId, teacherName);
}
async function performDeviceReset(teacherId) {
    closeResetModal();
    var token = localStorage.getItem('adminToken');

    try {
        showToast('Resetting device...', 'info');

        var response = await fetch('/api/users/' + teacherId + '/reset-device', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json();

        if (response.ok) {
            showToast('Device reset successfully!', 'success');
            loadTeachers();
        } else {
            showToast(data.message || 'Error resetting device', 'error');
        }
    } catch (error) {
        console.error('Reset device error:', error);
        showToast('Error resetting device', 'error');
    }
}

var leaveTargetTeacherId = null;
var leaveTargetIsOnLeave = false;

function toggleLeave(teacherId, teacherName, isOnLeave) {
    leaveTargetTeacherId = teacherId;
    leaveTargetIsOnLeave = isOnLeave;
    var msg = isOnLeave
        ? 'Mark "' + teacherName + '" as Active? They will be able to login again.'
        : 'Mark "' + teacherName + '" as On Leave? They will not be able to login until restored.';
    document.getElementById('leaveConfirmMsg').textContent = msg;
    document.getElementById('confirmLeaveBtn').textContent = isOnLeave ? 'Mark Active' : 'Mark On Leave';
    document.getElementById('confirmLeaveBtn').style.background = isOnLeave ? '#059669' : '#d97706';
    document.getElementById('leaveConfirmModal').classList.add('show');
}

function closeLeaveModal() {
    leaveTargetTeacherId = null;
    document.getElementById('leaveConfirmModal').classList.remove('show');
}

document.getElementById('confirmLeaveBtn').addEventListener('click', function () {
    if (leaveTargetTeacherId) {
        performToggleLeave(leaveTargetTeacherId);
    }
});

async function performToggleLeave(teacherId) {
    closeLeaveModal();
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/users/' + teacherId + '/mark-leave', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        var data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            loadTeachers();
        } else {
            showToast(data.message || 'Error updating status', 'error');
        }
    } catch (error) {
        console.error('Toggle leave error:', error);
        showToast('Error updating teacher status', 'error');
    }
}
