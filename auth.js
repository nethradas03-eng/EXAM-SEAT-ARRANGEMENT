/**
 * Authentication & Route Protection Service
 */

function checkAdminAuth() {
    const isAdmin = sessionStorage.getItem('adminLoggedIn');
    if (!isAdmin || isAdmin !== 'true') {
        window.location.href = '../index.html';
    }
}

function checkStudentAuth() {
    const studentRegister = sessionStorage.getItem('studentRegister');
    if (!studentRegister) {
        window.location.href = '../index.html';
    }
    return studentRegister;
}

function logout() {
    sessionStorage.clear();
    // Path calculation depending on current folder depth
    if (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Attach event handlers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Logout button binding
    const logoutBtns = document.querySelectorAll('.btn-logout, #logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});
