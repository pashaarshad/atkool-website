function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

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

var logoBase64 = '';
var gstFileBase64 = '';
var schoolImagesBase64 = [];
var tempVerificationToken = '';
var emailVerifiedSignature = '';


document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Attach OTP click event listeners
    document.getElementById('btnSendOtp').addEventListener('click', sendEmailOtp);
    document.getElementById('btnVerifyOtp').addEventListener('click', verifyEmailOtp);

    var addSchoolForm = document.getElementById('addSchoolForm');

    addSchoolForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveSchool();
    });

    var logoFile = document.getElementById('logoFile');
    logoFile.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;

        var img = new Image();
        img.onload = function () {
            var width = img.width;
            var height = img.height;
            var ratio = width / height;

            if (ratio < 0.8 || ratio > 1.2) {
                showToast('Logo should be square (1:1 ratio) for circular display. Current ratio: ' + ratio.toFixed(2) + ':1', 'error');
                logoFile.value = '';
                logoBase64 = '';
                document.getElementById('logoFileName').textContent = '';
                return;
            }

            if (width < 50 || width > 500) {
                showToast('Logo size should be between 50px and 500px. Current: ' + width + 'px', 'error');
                logoFile.value = '';
                logoBase64 = '';
                document.getElementById('logoFileName').textContent = '';
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                logoBase64 = e.target.result;
                document.getElementById('logoFileName').textContent = file.name + ' (' + width + 'x' + height + ')';
                showToast('Logo uploaded successfully!', 'success');
            };
            reader.readAsDataURL(file);
        };

        img.onerror = function () {
            showToast('Invalid image file', 'error');
            logoFile.value = '';
            logoBase64 = '';
            document.getElementById('logoFileName').textContent = '';
        };

        img.src = URL.createObjectURL(file);
    });

    var gstFile = document.getElementById('gstFile');
    gstFile.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            gstFileBase64 = e.target.result;
            showToast('GST file uploaded: ' + file.name, 'success');
        };
        reader.readAsDataURL(file);
    });

    // School Images (Multiple Upload)
    var schoolImagesInput = document.getElementById('schoolImages');
    schoolImagesInput.addEventListener('change', function () {
        var files = Array.from(this.files);
        if (schoolImagesBase64.length + files.length > 6) {
            showToast('Maximum 6 images allowed. You already have ' + schoolImagesBase64.length + ' images.', 'error');
            this.value = '';
            return;
        }

        var loadedCount = 0;
        files.forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var base64 = e.target.result;
                schoolImagesBase64.push(base64);
                loadedCount++;
                if (loadedCount === files.length) {
                    renderImagePreviews();
                    showToast(files.length + ' images added successfully!', 'success');
                }
            };
            reader.readAsDataURL(file);
        });

        this.value = '';
    });

    // Setup Password Toggles
    const eyeOpenSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        if (!input || !button) return;
        
        button.addEventListener('click', function () {
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = eyeClosedSvg;
            } else {
                input.type = 'password';
                button.innerHTML = eyeOpenSvg;
            }
        });
    }

    setupPasswordToggle('password', 'togglePassword');
    setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

    // Real-time password match border check
    var passwordInput = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirmPassword');

    function checkPasswordMatch() {
        var password = passwordInput.value;
        var confirmPassword = confirmPasswordInput.value;
        var feedbackRow = document.getElementById('passwordFeedbackRow');
        var feedbackDiv = document.getElementById('passwordFeedback');

        if (!confirmPassword) {
            confirmPasswordInput.style.borderColor = '';
            if (feedbackRow) feedbackRow.style.display = 'none';
            return;
        }

        if (password === confirmPassword) {
            confirmPasswordInput.style.borderColor = '#10b981'; // Green matching
            if (feedbackDiv) {
                feedbackDiv.style.color = '#10b981';
                feedbackDiv.textContent = 'Passwords match!';
            }
            if (feedbackRow) feedbackRow.style.display = 'flex';
        } else {
            confirmPasswordInput.style.borderColor = '#ef4444'; // Red mismatching
            if (feedbackDiv) {
                feedbackDiv.style.color = '#ef4444';
                feedbackDiv.textContent = 'Passwords do not match!';
            }
            if (feedbackRow) feedbackRow.style.display = 'flex';
        }
    }

    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
});

function renderImagePreviews() {
    var previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    schoolImagesBase64.forEach(function (base64, index) {
        var previewDiv = document.createElement('div');
        previewDiv.style.position = 'relative';
        previewDiv.style.width = '80px';
        previewDiv.style.height = '100px';

        previewDiv.innerHTML = `
            <img src="${base64}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
            <button type="button" class="remove-image-btn" onclick="removeSchoolImage(${index})" style="position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: #fff; border: none; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">×</button>
            <div style="font-size: 10px; color: #666; text-align: center; margin-top: 5px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Image ${index + 1}</div>
        `;
        previewContainer.appendChild(previewDiv);
    });
}

window.removeSchoolImage = function (index) {
    schoolImagesBase64.splice(index, 1);
    renderImagePreviews();
    showToast('Image removed', 'info');
};

function setupFileUpload(inputId, nameSpanId, callback) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            callback(e.target.result);
            document.getElementById(nameSpanId).textContent = file.name;
            showToast('File uploaded: ' + file.name, 'success');
        };
        reader.readAsDataURL(file);
    });
}

async function saveSchool() {
    var token = localStorage.getItem('adminToken');
    
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (!emailVerifiedSignature) {
        showToast('Please verify the school email address first!', 'error');
        return;
    }

    var schoolData = {
        name: document.getElementById('schoolName').value,
        ownerName: document.getElementById('ownerName').value,
        mobileNo: document.getElementById('mobile').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        state: document.getElementById('state').value,
        city: document.getElementById('city').value,
        zipCode: document.getElementById('zipCode').value,
        gstNo: document.getElementById('gstNo').value,
        password: document.getElementById('password').value,
        logo: logoBase64,
        gstFile: gstFileBase64,
        schoolImages: schoolImagesBase64,
        verificationSignature: emailVerifiedSignature,

        teachers: 0,
        students: 0,
        status: 'Pending',
        amount: 0
    };

    try {
        var response = await fetch('/api/schools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(schoolData)
        });

        if (response.ok) {
            showToast('School created successfully!', 'success');
            setTimeout(function () {
                window.location.href = 'schools.html';
            }, 1000);
        } else {
            var data = await response.json();
            showToast(data.message || 'Error creating school', 'error');
        }
    } catch (error) {
        console.error('Save school error:', error);
        showToast('Error creating school', 'error');
    }
}

async function sendEmailOtp() {
    var email = document.getElementById('email').value.trim();
    if (!email) {
        showToast('Please enter a Gmail address first.', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid Gmail address.', 'error');
        return;
    }

    var btn = document.getElementById('btnSendOtp');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/send-email-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ email: email })
        });

        var data = await response.json();
        if (response.ok) {
            tempVerificationToken = data.token;
            document.getElementById('email').disabled = true;
            document.getElementById('otpVerificationRow').style.display = 'flex';
            btn.textContent = 'Sent';
            showToast('Verification OTP sent successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to send OTP', 'error');
            btn.disabled = false;
            btn.textContent = 'Verify';
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        showToast('Error sending verification OTP', 'error');
        btn.disabled = false;
        btn.textContent = 'Verify';
    }
}

async function verifyEmailOtp() {
    var otp = document.getElementById('emailOtp').value.trim();
    var email = document.getElementById('email').value.trim();
    if (!otp || otp.length !== 6) {
        showToast('Please enter a 6-digit verification code.', 'error');
        return;
    }

    var btn = document.getElementById('btnVerifyOtp');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/schools/verify-email-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                email: email,
                otp: otp,
                token: tempVerificationToken
            })
        });

        var data = await response.json();
        if (response.ok) {
            emailVerifiedSignature = data.signature;
            document.getElementById('otpVerificationRow').style.display = 'none';
            
            var statusRow = document.getElementById('otpStatusRow');
            var statusMsg = document.getElementById('otpStatusMessage');
            statusRow.style.display = 'flex';
            statusMsg.style.color = '#10b981';
            statusMsg.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Email Verified Successfully';
            
            document.getElementById('btnSendOtp').style.display = 'none';
            showToast('Email verified successfully!', 'success');
        } else {
            showToast(data.message || 'OTP verification failed', 'error');
            btn.disabled = false;
            btn.textContent = 'Confirm';
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        showToast('Error verifying OTP', 'error');
        btn.disabled = false;
        btn.textContent = 'Confirm';
    }
}
