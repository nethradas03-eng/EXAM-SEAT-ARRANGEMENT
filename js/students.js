/**
 * Student Management Module
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    renderStudentsTable();

    // Event listeners
    const searchInput = document.getElementById('studentSearch');
    const deptFilter = document.getElementById('deptFilter');
    const addStudentForm = document.getElementById('addStudentForm');

    if (searchInput) searchInput.addEventListener('input', filterStudents);
    if (deptFilter) deptFilter.addEventListener('change', filterStudents);
    if (addStudentForm) addStudentForm.addEventListener('submit', handleAddStudent);
});

function renderStudentsTable(studentsToRender = null) {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;

    const students = studentsToRender || getStudents();
    
    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="ri-user-search-line"></i>
                    <p>No student records found.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = students.map((s, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td><code style="font-weight:700; color:var(--primary);">${s.register}</code></td>
            <td><strong>${s.name}</strong></td>
            <td><span class="badge dept-${s.department}">${s.department}</span></td>
            <td>${s.semester}</td>
            <td>${s.email || 'N/A'}</td>
            <td style="text-align:right;">
                <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function filterStudents() {
    const query = document.getElementById('studentSearch').value.toLowerCase().trim();
    const dept = document.getElementById('deptFilter').value;

    let students = getStudents();

    if (dept !== 'ALL') {
        students = students.filter(s => s.department === dept);
    }

    if (query) {
        students = students.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.register.toLowerCase().includes(query)
        );
    }

    renderStudentsTable(students);
}

function handleAddStudent(e) {
    e.preventDefault();

    const register = document.getElementById('newRegister').value.trim().toUpperCase();
    const name = document.getElementById('newName').value.trim();
    const department = document.getElementById('newDept').value;
    const semester = document.getElementById('newSemester').value;
    const email = document.getElementById('newEmail').value.trim();

    if (!register || !name || !department) {
        alert('Please fill in all required fields.');
        return;
    }

    const students = getStudents();

    // Check duplicate register number
    if (students.some(s => s.register === register)) {
        alert('A student with this Register Number already exists!');
        return;
    }

    const newStudent = {
        id: 'S' + Date.now(),
        register,
        name,
        department,
        semester,
        email: email || `${register.toLowerCase()}@example.com`,
        password: '123'
    };

    students.push(newStudent);
    saveStudents(students);

    closeModal('addStudentModal');
    document.getElementById('addStudentForm').reset();
    renderStudentsTable();
    showAlert('studentAlertContainer', 'Student added successfully!', 'success');
}

function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student record?')) return;

    let students = getStudents();
    students = students.filter(s => s.id !== id);
    saveStudents(students);

    renderStudentsTable();
    showAlert('studentAlertContainer', 'Student deleted successfully.', 'danger');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
