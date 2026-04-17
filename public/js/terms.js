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

    loadTerms();
});

async function loadTerms() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/terms', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = '/';
            return;
        }

        var data = await response.json();
        var content = data.content || '';

        var formattedContent = formatTermsContent(content);
        document.getElementById('termsContent').innerHTML = formattedContent;

    } catch (error) {
        console.error('Load terms error:', error);
        showToast('Error loading terms', 'error');
    }
}

function formatTermsContent(content) {
    var lines = content.split('\n');
    var html = '';
    var inList = false;

    var headings = [
        'Terms and Conditions',
        'About School Management System',
        'Ownership and Head Office',
        'User Responsibilities',
        'Data Protection',
        'Limitation of Liability',
        'Modifications to Terms',
        'Contact Information'
    ];

    lines.forEach(function (line) {
        line = line.trim();
        if (!line) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            return;
        }

        if (line === 'Terms and Conditions') {
            html += '<h2 class="terms-title">' + line + '</h2>';
        } else if (headings.indexOf(line) !== -1) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<h3 class="terms-heading">' + line + '</h3>';
        } else if (line.startsWith('- ')) {
            if (!inList) {
                html += '<ul class="terms-list">';
                inList = true;
            }
            html += '<li>' + line.substring(2) + '</li>';
        } else if (line.startsWith('Last Updated:')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<p class="terms-updated">' + line + '</p>';
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<p class="terms-paragraph">' + line + '</p>';
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return html;
}
