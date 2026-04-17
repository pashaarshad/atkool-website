
(function () {
    var token = localStorage.getItem('schoolToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }


    checkSubscriptionStatus();

    async function checkSubscriptionStatus() {
        try {
            var response = await fetch('/api/school-auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                localStorage.removeItem('schoolToken');
                localStorage.removeItem('schoolData');
                window.location.href = 'index.html';
                return;
            }

            var school = await response.json();


            localStorage.setItem('schoolHasActivePlan', school.hasActivePlan ? 'true' : 'false');
            if (school.subscription) {
                localStorage.setItem('schoolSubscription', JSON.stringify(school.subscription));
            }


            if (!school.hasActivePlan) {
                showPlanExpiredToast();
                setTimeout(function () {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Subscription check error:', error);
            window.location.href = 'index.html';
        }
    }

    function showPlanExpiredToast() {
        var container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = '<span class="toast-message">Your subscription has expired. Redirecting to dashboard...</span>';
        container.appendChild(toast);
    }
})();
