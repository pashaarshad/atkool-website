var schoolsList = [];

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
    var date = new Date(dateString);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
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

async function loadSchools() {
    var token = localStorage.getItem('adminToken');
    try {
        var response = await fetch('/api/schools', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            schoolsList = await response.json();
            var select = document.getElementById('targetSchool');
            select.innerHTML = '<option value="">-- Select a School --</option>';
            schoolsList.forEach(function (school) {
                select.innerHTML += '<option value="' + school._id + '">' + school.name + '</option>';
            });
        }
    } catch (error) {
        console.error('Load schools error:', error);
    }
}

function toggleSchoolSelect() {
    var sendTo = document.getElementById('sendTo').value;
    var schoolGroup = document.getElementById('schoolSelectGroup');
    if (sendTo === 'SpecificSchool') {
        schoolGroup.style.display = 'block';
    } else {
        schoolGroup.style.display = 'none';
    }
}

function setupEventListeners() {
    var headingInput = document.getElementById('heading');
    var messageInput = document.getElementById('message');
    var messageForm = document.getElementById('messageForm');
    var viewHistoryBtn = document.getElementById('viewHistoryBtn');

    headingInput.addEventListener('input', function () {
        document.getElementById('headingCount').textContent = this.value.length;
    });

    messageInput.addEventListener('input', function () {
        document.getElementById('messageCount').textContent = this.value.length;
    });

    messageForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendMessage();
    });

    viewHistoryBtn.addEventListener('click', function () {
        loadHistory();
    });
}

async function sendMessage() {
    var token = localStorage.getItem('adminToken');

    var sendTo = document.getElementById('sendTo').value;
    var heading = document.getElementById('heading').value;
    var message = document.getElementById('message').value;

    if (!heading.trim()) {
        showToast('Please enter a heading', 'error');
        return;
    }

    if (!message.trim()) {
        showToast('Please enter a message', 'error');
        return;
    }

    var body = { sendTo: sendTo, heading: heading, message: message };

    // If specific school selected
    if (sendTo === 'SpecificSchool') {
        var targetSchoolId = document.getElementById('targetSchool').value;
        if (!targetSchoolId) {
            showToast('Please select a school', 'error');
            return;
        }
        var selectedSchool = schoolsList.find(function (s) { return s._id === targetSchoolId; });
        body.targetSchoolId = targetSchoolId;
        body.targetSchoolName = selectedSchool ? selectedSchool.name : '';
    }

    try {
        var response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            showToast('Message sent successfully!', 'success');
            document.getElementById('messageForm').reset();
            document.getElementById('headingCount').textContent = '0';
            document.getElementById('messageCount').textContent = '0';
            document.getElementById('schoolSelectGroup').style.display = 'none';
        } else {
            var data = await response.json();
            showToast(data.message || 'Error sending message', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showToast('Error sending message', 'error');
    }
}

async function loadHistory() {
    var token = localStorage.getItem('adminToken');
    var historyContent = document.getElementById('historyContent');

    try {
        var response = await fetch('/api/messages', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var messages = await response.json();

        if (messages.length === 0) {
            historyContent.innerHTML = '<p style="text-align: center; color: #666;">No messages sent yet</p>';
        } else {
            var html = '<div class="history-list">';
            messages.forEach(function (msg) {
                var recipient = msg.sendTo;
                if (msg.targetSchoolName) {
                    recipient = 'Specific: ' + msg.targetSchoolName;
                }
                var readCount = msg.readBy ? msg.readBy.length : 0;
                var readStatus = readCount > 0 ?
                    '<span style="background: #4caf50; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 10px;">Read by ' + readCount + '</span>' :
                    '<span style="background: #ff9800; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 10px;">Unread</span>';
                html += '<div class="history-item">' +
                    '<div class="history-header">' +
                    '<strong>' + msg.heading + '</strong>' + readStatus +
                    '<span class="history-date">' + formatDate(msg.createdAt) + '</span>' +
                    '</div>' +
                    '<div class="history-meta">Sent to: ' + recipient + '</div>' +
                    '<div class="history-message">' + msg.message + '</div>' +
                    '</div>';
            });
            html += '</div>';
            historyContent.innerHTML = html;
        }

        document.getElementById('historyModal').classList.add('show');

    } catch (error) {
        console.error('Load history error:', error);
        showToast('Error loading message history', 'error');
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
}
