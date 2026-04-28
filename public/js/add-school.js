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


document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

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
        if (files.length > 6) {
            showToast('You can only upload a maximum of 6 images', 'error');
            this.value = '';
            return;
        }

        schoolImagesBase64 = [];
        var previewContainer = document.getElementById('imagePreviewContainer');
        previewContainer.innerHTML = '';

        files.forEach(function(file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var base64 = e.target.result;
                schoolImagesBase64.push(base64);
                
                // Add preview
                var previewDiv = document.createElement('div');
                previewDiv.style.position = 'relative';
                previewDiv.innerHTML = `
                    <img src="${base64}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
                    <div style="font-size: 10px; color: #666; text-align: center; margin-top: 5px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</div>
                `;
                previewContainer.appendChild(previewDiv);
            };
            reader.readAsDataURL(file);
        });
        
        if (files.length > 0) {
            showToast(files.length + ' images selected', 'success');
        }
    });

});

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
