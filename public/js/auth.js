document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = '/dashboard';
        return;
    }

    var loginForm = document.getElementById('loginForm');
    var errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        try {
            var response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username, password: password })
            });

            var data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.admin));
                window.location.href = '/dashboard';
            } else {
                errorMessage.textContent = data.message || 'Login failed';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Connection error. Please try again.';
            errorMessage.style.display = 'block';
        }
    });
});
