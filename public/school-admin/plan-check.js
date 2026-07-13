
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
            
            var ay = school.currentAcademicYear || '2026-2027';
            localStorage.setItem('academicYear', ay);

            // Dynamically inject academic year badge into the header
            var header = document.querySelector('.school-header');
            if (header && !document.getElementById('staticAYBadge')) {
                var badgeWrapper = document.createElement('div');
                badgeWrapper.id = 'staticAYBadge';
                badgeWrapper.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 14px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:10px; margin-left:15px; color:#fff; margin-right:auto;';
                
                badgeWrapper.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; stroke:#c7d2fe;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <div style="text-align:left;">
                        <div style="font-size:8px; color:rgba(255,255,255,0.6); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; line-height:1; margin-bottom:2px;">Academic Year</div>
                        <div style="font-size:12px; color:#fff; font-weight:700; line-height:1;">${ay}</div>
                    </div>
                `;
                
                var headerLeft = document.querySelector('.school-header-left');
                if (headerLeft) {
                    headerLeft.appendChild(badgeWrapper);
                } else {
                    header.insertBefore(badgeWrapper, header.firstChild);
                }
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
