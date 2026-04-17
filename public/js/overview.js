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

    loadStats();
    loadChartData();
});

async function loadStats() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/overview/stats', {
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

        document.getElementById('totalRevenue').textContent = formatNumber(data.totalRevenue || 0);
        document.getElementById('activePlans').textContent = data.activePlans || 0;
        document.getElementById('growth').textContent = (data.growth || 0) + '%';

        document.getElementById('summarySchools').textContent = data.totalSchools || 0;
        document.getElementById('summaryUsers').textContent = data.totalUsers || 0;
        document.getElementById('summaryPayments').textContent = data.totalPayments || 0;
        document.getElementById('summaryAvgPayment').textContent = formatNumber(data.avgPayment || 0);

    } catch (error) {
        console.error('Load stats error:', error);
        showToast('Error loading statistics', 'error');
    }
}

function formatNumber(num) {
    if (num >= 100000) {
        return (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

async function loadChartData() {
    var token = localStorage.getItem('adminToken');

    try {
        var response = await fetch('/api/overview/chart-data', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        var data = await response.json();
        renderCharts(data);

    } catch (error) {
        console.error('Load chart data error:', error);
        showToast('Error loading chart data', 'error');
    }
}

function renderCharts(data) {
    renderStatusChart(data.statusData);
    renderRevenueChart(data);
    renderRegistrationsChart(data);
    renderRolesChart(data.rolesData);
}

function renderStatusChart(statusData) {
    var ctx = document.getElementById('statusChart').getContext('2d');
    var colors = ['#000', '#444', '#777', '#aaa'];

    if (statusData.labels.length === 0) {
        statusData.labels = ['No Data'];
        statusData.values = [1];
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.labels,
            datasets: [{
                data: statusData.values,
                backgroundColor: colors.slice(0, statusData.labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            cutout: '50%'
        }
    });

    var legendHtml = '';
    for (var i = 0; i < statusData.labels.length; i++) {
        legendHtml += '<div class="legend-item">' +
            '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
            '<span class="legend-label">' + statusData.labels[i] + '</span>' +
            '<span class="legend-value">' + statusData.values[i] + '</span>' +
            '</div>';
    }
    document.getElementById('statusLegend').innerHTML = legendHtml;
}

function renderRevenueChart(data) {
    var ctx = document.getElementById('revenueChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Revenue (INR)',
                data: data.revenueData,
                borderColor: '#333',
                backgroundColor: 'rgba(51, 51, 51, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#333',
                pointBorderWidth: 2,
                pointRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'INR ' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#333',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#333',
                        callback: function (value) {
                            return 'INR ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    var dataRowHtml = '';
    for (var i = 0; i < data.labels.length; i++) {
        dataRowHtml += '<div class="data-item">' +
            '<span class="data-label">' + data.labels[i].split(' ')[0] + '</span>' +
            '<span class="data-value">INR ' + data.revenueData[i].toLocaleString() + '</span>' +
            '</div>';
    }
    document.getElementById('revenueDataRow').innerHTML = dataRowHtml;
}

function renderRegistrationsChart(data) {
    var ctx = document.getElementById('registrationsChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Schools',
                    data: data.schoolsData,
                    backgroundColor: '#333',
                    borderRadius: 5
                },
                {
                    label: 'Users',
                    data: data.usersData,
                    backgroundColor: '#888',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333',
                        usePointStyle: true,
                        pointStyle: 'rect'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#333'
                    }
                },
                y: {
                    grid: {
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#333',
                        stepSize: 1
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderRolesChart(rolesData) {
    var ctx = document.getElementById('rolesChart').getContext('2d');
    var colors = ['#000', '#444', '#777', '#aaa'];

    if (rolesData.labels.length === 0) {
        rolesData.labels = ['No Data'];
        rolesData.values = [1];
    }

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: rolesData.labels,
            datasets: [{
                data: rolesData.values,
                backgroundColor: colors.slice(0, rolesData.labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    var legendHtml = '';
    for (var i = 0; i < rolesData.labels.length; i++) {
        legendHtml += '<div class="legend-item">' +
            '<span class="legend-color" style="background:' + colors[i] + '"></span>' +
            '<span class="legend-label">' + rolesData.labels[i] + '</span>' +
            '<span class="legend-value">' + rolesData.values[i] + '</span>' +
            '</div>';
    }
    document.getElementById('rolesLegend').innerHTML = legendHtml;
}
