/**
 * Examination Timetable & Schedule Management
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    renderExamsTable();

    const searchInput = document.getElementById('examSearch');
    const deptFilter = document.getElementById('examDeptFilter');
    const addExamForm = document.getElementById('addExamForm');

    if (searchInput) searchInput.addEventListener('input', filterExams);
    if (deptFilter) deptFilter.addEventListener('change', filterExams);
    if (addExamForm) addExamForm.addEventListener('submit', handleAddExam);
});

function renderExamsTable(examsToRender = null) {
    const tableBody = document.getElementById('examsTableBody');
    if (!tableBody) return;

    const exams = examsToRender || getExams();

    if (exams.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="ri-calendar-event-line"></i>
                    <p>No exams scheduled yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = exams.map((e, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td><code style="font-weight:700; color:var(--primary);">${e.subjectCode}</code></td>
            <td><strong>${e.subjectName}</strong></td>
            <td><span class="badge dept-${e.department}">${e.department}</span></td>
            <td><strong>${e.date}</strong> <br><small class="text-muted">${e.timeSlot}</small></td>
            <td style="text-align:right;">
                <button class="btn btn-danger btn-sm" onclick="deleteExam('${e.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function filterExams() {
    const query = document.getElementById('examSearch').value.toLowerCase().trim();
    const dept = document.getElementById('examDeptFilter').value;

    let exams = getExams();

    if (dept !== 'ALL') {
        exams = exams.filter(e => e.department === dept);
    }

    if (query) {
        exams = exams.filter(e => 
            e.subjectCode.toLowerCase().includes(query) || 
            e.subjectName.toLowerCase().includes(query)
        );
    }

    renderExamsTable(exams);
}

function handleAddExam(e) {
    e.preventDefault();

    const subjectCode = document.getElementById('newSubjectCode').value.trim().toUpperCase();
    const subjectName = document.getElementById('newSubjectName').value.trim();
    const date = document.getElementById('newExamDate').value;
    const timeSlot = document.getElementById('newTimeSlot').value;
    const department = document.getElementById('newExamDept').value;

    if (!subjectCode || !subjectName || !date || !timeSlot) {
        alert('Please fill in all required fields.');
        return;
    }

    const exams = getExams();

    const newExam = {
        id: 'E' + Date.now(),
        subjectCode,
        subjectName,
        date,
        timeSlot,
        department
    };

    exams.push(newExam);
    saveExams(exams);

    closeModal('addExamModal');
    document.getElementById('addExamForm').reset();
    renderExamsTable();
    showAlert('examAlertContainer', 'Exam scheduled successfully!', 'success');
}

function deleteExam(id) {
    if (!confirm('Are you sure you want to cancel this scheduled exam?')) return;

    let exams = getExams();
    exams = exams.filter(e => e.id !== id);
    saveExams(exams);

    renderExamsTable();
    showAlert('examAlertContainer', 'Exam record deleted.', 'danger');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
