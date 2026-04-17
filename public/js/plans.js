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

function incrementValue(id) {
    var input = document.getElementById(id);
    input.value = parseInt(input.value || 0) + 100;
}

function decrementValue(id) {
    var input = document.getElementById(id);
    var newVal = parseInt(input.value || 0) - 100;
    input.value = newVal >= 0 ? newVal : 0;
}

document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    seedPlan();
    loadStats();
    loadPlan();
});

async function seedPlan() {
    var token = localStorage.getItem('adminToken');
    try {
        await fetch('/api/plans/seed', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    } catch (error) {
        console.error('Seed error:', error);
    }
}

async function loadStats() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/plans/stats', {
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

        document.getElementById('totalSchools').textContent = data.totalSchools || 0;
        document.getElementById('activePlans').textContent = data.activePlans || 0;
        document.getElementById('systemUse').textContent = (data.systemUse || 0) + '%';

    } catch (error) {
        console.error('Load stats error:', error);
    }
}

async function loadPlan() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/plans', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var plans = await response.json();

        if (plans.length > 0) {
            var plan = plans[0];
            document.getElementById('planId').value = plan._id;
            document.getElementById('ownBrandingSetup').value = plan.ownBrandingSetup;
            document.getElementById('perYearSubscription').value = plan.perYearSubscription;
            document.getElementById('perStudentSubscription').value = plan.perStudentSubscription;
            document.getElementById('teachersLimit').value = plan.teachersLimit;
            document.getElementById('classLimit').value = plan.classLimit;
            document.getElementById('studentsLimit').value = plan.studentsLimit;
        }

    } catch (error) {
        console.error('Load plan error:', error);
    }
}

async function savePlan() {
    var token = localStorage.getItem('adminToken');
    var planId = document.getElementById('planId').value;

    if (!planId) {
        showToast('No plan found to update', 'error');
        return;
    }

    var planData = {
        ownBrandingSetup: parseInt(document.getElementById('ownBrandingSetup').value) || 0,
        perYearSubscription: parseInt(document.getElementById('perYearSubscription').value) || 0,
        perStudentSubscription: parseInt(document.getElementById('perStudentSubscription').value) || 0,
        teachersLimit: parseInt(document.getElementById('teachersLimit').value) || 50,
        classLimit: parseInt(document.getElementById('classLimit').value) || 50,
        studentsLimit: parseInt(document.getElementById('studentsLimit').value) || 500
    };

    try {
        var response = await fetch('/api/plans/' + planId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(planData)
        });

        if (response.ok) {
            showToast('Plan saved successfully!', 'success');
        } else {
            var data = await response.json();
            showToast(data.message || 'Error saving plan', 'error');
        }
    } catch (error) {
        console.error('Save plan error:', error);
        showToast('Error saving plan', 'error');
    }
}
