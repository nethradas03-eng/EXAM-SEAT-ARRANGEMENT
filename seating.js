/**
 * Automatic Seating Allocation Engine & Grid Renderer
 * Supports Multi-Department Interleaving in Examination Halls
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if on Generate page
    const generateForm = document.getElementById('generateSeatingForm');
    if (generateForm) {
        checkAdminAuth();
        populateGenerateDropdowns();
        generateForm.addEventListener('submit', handleGenerateAllocation);
    }

    // Check if on Arrangement View page
    const arrangementExamSelect = document.getElementById('arrangementExamSelect');
    if (arrangementExamSelect) {
        checkAdminAuth();
        populateArrangementDropdowns();
        arrangementExamSelect.addEventListener('change', renderArrangementView);
        document.getElementById('arrangementRoomSelect').addEventListener('change', renderArrangementView);
    }

    // Check if on Student Dashboard
    const studentSearchForm = document.getElementById('studentLookupForm');
    if (studentSearchForm) {
        const studentReg = checkStudentAuth();
        if (studentReg) {
            document.getElementById('lookupRegisterNo').value = studentReg;
            lookupStudentSeat(studentReg);
        }
        studentSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const reg = document.getElementById('lookupRegisterNo').value.trim().toUpperCase();
            lookupStudentSeat(reg);
        });
    }

    // Check if on Reports page
    const reportExamSelect = document.getElementById('reportExamSelect');
    if (reportExamSelect) {
        checkAdminAuth();
        populateReportDropdowns();
    }
});

// Dropdown Populate Helpers
function populateGenerateDropdowns() {
    const examContainer = document.getElementById('selectExamsContainer');
    const roomContainer = document.getElementById('selectRoomsContainer');
    
    if (!examContainer || !roomContainer) return;

    const exams = getExams();
    const rooms = getRooms().filter(r => r.status === 'Active');

    if (exams.length === 0) {
        examContainer.innerHTML = `
            <div class="alert alert-warning" style="margin:0;">
                ⚠️ No scheduled exams found. Please add exams under <a href="exams.html"><strong>Exams</strong></a> page first.
            </div>
        `;
    } else {
        examContainer.innerHTML = exams.map(e => `
            <label class="checkbox-label" style="display:flex; align-items:center; gap:10px; margin-bottom:8px; cursor:pointer;">
                <input type="checkbox" name="selectedExams" value="${e.id}" checked>
                <span><strong>${e.subjectCode} - ${e.subjectName}</strong> (${e.department}) — ${e.date} [${e.timeSlot}]</span>
            </label>
        `).join('');
    }

    if (rooms.length === 0) {
        roomContainer.innerHTML = `
            <div class="alert alert-warning" style="margin:0;">
                ⚠️ No active examination halls found. Please configure halls under <a href="rooms.html"><strong>Halls & Rooms</strong></a> page first.
            </div>
        `;
    } else {
        roomContainer.innerHTML = rooms.map(r => `
            <label class="checkbox-label" style="display:flex; align-items:center; gap:10px; margin-bottom:8px; cursor:pointer;">
                <input type="checkbox" name="selectedRooms" value="${r.id}" checked>
                <span><strong>${r.roomNo}</strong> (${r.block}) — Capacity: ${r.capacity} seats (${r.rows} rows × ${r.cols} cols)</span>
            </label>
        `).join('');
    }
}

function populateArrangementDropdowns() {
    const examSelect = document.getElementById('arrangementExamSelect');
    const roomSelect = document.getElementById('arrangementRoomSelect');

    if (!examSelect || !roomSelect) return;

    const exams = getExams();
    const rooms = getRooms();

    examSelect.innerHTML = '<option value="ALL">All Scheduled Exams</option>' + 
        exams.map(e => `<option value="${e.id}">${e.subjectCode} - ${e.subjectName} (${e.department})</option>`).join('');

    roomSelect.innerHTML = '<option value="ALL">All Examination Halls</option>' + 
        rooms.map(r => `<option value="${r.id}">${r.roomNo} (${r.block})</option>`).join('');

    renderArrangementView();
}

function populateReportDropdowns() {
    const examSelect = document.getElementById('reportExamSelect');
    if (!examSelect) return;

    const exams = getExams();
    if (exams.length === 0) {
        examSelect.innerHTML = '<option value="">No scheduled exams found</option>';
        return;
    }

    examSelect.innerHTML = '<option value="">-- Select Examination for Attendance Sheet --</option>' +
        exams.map(e => `<option value="${e.id}">${e.subjectCode} - ${e.subjectName} (${e.department}) — ${e.date}</option>`).join('');

    examSelect.addEventListener('change', renderAttendanceReport);
}

/**
 * AUTOMATIC ALLOCATION ALGORITHM
 * Interleaves candidates from different departments writing different exams into selected halls.
 */
function handleGenerateAllocation(e) {
    e.preventDefault();

    const examCheckboxes = document.querySelectorAll('input[name="selectedExams"]:checked');
    const roomCheckboxes = document.querySelectorAll('input[name="selectedRooms"]:checked');
    
    const selectedExamIds = Array.from(examCheckboxes).map(cb => cb.value);
    const selectedRoomIds = Array.from(roomCheckboxes).map(cb => cb.value);
    const strategy = document.getElementById('allocationStrategy').value;

    if (selectedExamIds.length === 0) {
        alert('Please select at least one scheduled examination for this session.');
        return;
    }
    if (selectedRoomIds.length === 0) {
        alert('Please select at least one active examination hall.');
        return;
    }

    const allExams = getExams().filter(e => selectedExamIds.includes(e.id));
    const allStudents = getStudents();
    const rooms = getRooms().filter(r => selectedRoomIds.includes(r.id));

    if (allStudents.length === 0) {
        alert('No students registered in system! Please add students under "Students" page first.');
        return;
    }

    // Filter candidate students taking the selected exams (matched by Department/Branch or all students)
    const targetDeptList = allExams.map(e => e.department);
    let candidateStudents = allStudents.filter(s => targetDeptList.includes(s.department));

    // Fallback if department matching returns 0, use all students
    if (candidateStudents.length === 0) {
        candidateStudents = [...allStudents];
    }

    // Map candidates to their respective exam subject details
    let candidatePool = candidateStudents.map(s => {
        const matchingExam = allExams.find(e => e.department === s.department) || allExams[0];
        return {
            ...s,
            examId: matchingExam.id,
            subjectCode: matchingExam.subjectCode,
            subjectName: matchingExam.subjectName,
            examDate: matchingExam.date,
            examTimeSlot: matchingExam.timeSlot
        };
    });

    // Order candidates according to strategy
    let orderedCandidates = [];
    if (strategy === 'ALTERNATING') {
        const deptGroups = {};
        candidatePool.forEach(s => {
            if (!deptGroups[s.department]) deptGroups[s.department] = [];
            deptGroups[s.department].push(s);
        });

        const depts = Object.keys(deptGroups);
        let maxLen = Math.max(...depts.map(d => deptGroups[d].length));

        for (let i = 0; i < maxLen; i++) {
            depts.forEach(d => {
                if (deptGroups[d][i]) {
                    orderedCandidates.push(deptGroups[d][i]);
                }
            });
        }
    } else {
        orderedCandidates = [...candidatePool];
    }

    // Save allocation results
    let arrangements = getArrangements();

    // Clear existing arrangements for these selected exams
    arrangements = arrangements.filter(a => !selectedExamIds.includes(a.examId));

    let candidateIndex = 0;
    let roomAllocations = [];

    for (let room of rooms) {
        if (candidateIndex >= orderedCandidates.length) break;

        let seatMatrix = [];
        let seatNum = 1;

        for (let r = 1; r <= room.rows; r++) {
            for (let c = 1; c <= room.cols; c++) {
                if (candidateIndex < orderedCandidates.length) {
                    const cand = orderedCandidates[candidateIndex];
                    seatMatrix.push({
                        seatNo: seatNum,
                        row: r,
                        col: c,
                        studentId: cand.id,
                        register: cand.register,
                        studentName: cand.name,
                        department: cand.department,
                        examId: cand.examId,
                        subjectCode: cand.subjectCode,
                        subjectName: cand.subjectName,
                        examDate: cand.examDate,
                        examTimeSlot: cand.examTimeSlot
                    });
                    candidateIndex++;
                } else {
                    // Vacant Seat
                    seatMatrix.push({
                        seatNo: seatNum,
                        row: r,
                        col: c,
                        studentId: null,
                        register: null,
                        studentName: null,
                        department: null,
                        examId: null,
                        subjectCode: null,
                        subjectName: null,
                        examDate: null,
                        examTimeSlot: null
                    });
                }
                seatNum++;
            }
        }

        roomAllocations.push({
            id: 'ARR_' + Date.now() + '_' + room.id,
            roomId: room.id,
            roomNo: room.roomNo,
            block: room.block,
            rows: room.rows,
            cols: room.cols,
            seats: seatMatrix
        });
    }

    arrangements.push(...roomAllocations);
    saveArrangements(arrangements);

    alert(`Successfully generated seating plan for ${candidateIndex} candidates across ${roomAllocations.length} examination halls!`);
    window.location.href = 'arrangement.html';
}

/**
 * Renders seating grid in admin/arrangement.html
 */
function renderArrangementView() {
    const container = document.getElementById('arrangementGridContainer');
    if (!container) return;

    const selectedExamId = document.getElementById('arrangementExamSelect').value;
    const selectedRoomId = document.getElementById('arrangementRoomSelect').value;

    let arrangements = getArrangements();

    if (selectedRoomId !== 'ALL') {
        arrangements = arrangements.filter(a => a.roomId === selectedRoomId);
    }

    if (arrangements.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="background:#fff; border-radius:12px; padding:40px; border:1px solid var(--border-color);">
                <i class="ri-grid-line"></i>
                <h3>No Seating Allocations Generated Yet</h3>
                <p class="text-muted">Enter students, rooms, and exams, then run the seating generator tool.</p>
                <br>
                <a href="generate.html" class="btn btn-primary"><i class="ri-magic-line"></i> Go to Generate Seating</a>
            </div>
        `;
        return;
    }

    container.innerHTML = arrangements.map(arr => {
        let displaySeats = arr.seats;
        if (selectedExamId !== 'ALL') {
            displaySeats = arr.seats.map(s => s.examId === selectedExamId ? s : { ...s, studentId: null });
        }

        const allocatedCount = displaySeats.filter(s => s.studentId).length;

        return `
            <div class="hall-container">
                <div class="hall-header">
                    <div class="hall-title">
                        <h3>${arr.roomNo} <small class="text-muted">(${arr.block})</small></h3>
                        <p>Capacity: <strong>${arr.rows} Rows × ${arr.cols} Cols (${arr.seats.length} Desks)</strong></p>
                    </div>
                    <div class="hall-meta">
                        <span class="badge badge-primary">${allocatedCount} Candidates Seated</span>
                        <button class="btn btn-secondary btn-sm no-print" onclick="window.print()">
                            <i class="ri-printer-line"></i> Print Hall Plan
                        </button>
                    </div>
                </div>

                <div class="blackboard-banner">
                    --- FRONT / INVIGILATOR DESK / STAGE ---
                </div>

                <div class="seat-grid" style="grid-template-columns: repeat(${arr.cols}, 1fr);">
                    ${arr.seats.map(s => s.studentId ? `
                        <div class="seat-item occupied">
                            <span class="seat-no">Seat ${s.seatNo}</span>
                            <span class="seat-student-name" title="${s.studentName}">${s.studentName}</span>
                            <span class="seat-reg">${s.register}</span>
                            <div style="display:flex; justify-content:center; gap:4px; margin-top:2px; flex-wrap:wrap;">
                                <span class="badge seat-dept-badge dept-${s.department}">${s.department}</span>
                                <span class="badge badge-secondary" style="font-size:9px;">${s.subjectCode || ''}</span>
                            </div>
                        </div>
                    ` : `
                        <div class="seat-item empty">
                            <span class="seat-no">Seat ${s.seatNo}</span>
                            <small class="text-muted">Vacant</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Student Seat Lookup logic for student/dashboard.html
 */
function lookupStudentSeat(registerNo) {
    const cardContainer = document.getElementById('studentSeatResult');
    const miniGridContainer = document.getElementById('studentMiniGridContainer');
    
    if (!cardContainer || !registerNo) return;

    const arrangements = getArrangements();
    let foundMatch = null;
    let foundSeat = null;

    for (let arr of arrangements) {
        const seat = arr.seats.find(s => s.register && s.register.toUpperCase() === registerNo.toUpperCase());
        if (seat) {
            foundMatch = arr;
            foundSeat = seat;
            break;
        }
    }

    if (!foundMatch || !foundSeat) {
        cardContainer.innerHTML = `
            <div class="alert alert-info">
                <strong>No Seating Record Found:</strong> Seating arrangement for register number <code>${registerNo}</code> has not been generated by the administrator yet.
            </div>
        `;
        if (miniGridContainer) miniGridContainer.innerHTML = '';
        return;
    }

    cardContainer.innerHTML = `
        <div class="result-card">
            <div class="result-card-header">
                <div>
                    <h3 style="font-size:22px; font-weight:800;">${foundSeat.subjectCode || 'EXAM'} - ${foundSeat.subjectName || 'Examination'}</h3>
                    <p class="text-muted">${foundSeat.examDate || ''} | ${foundSeat.examTimeSlot || ''}</p>
                </div>
                <div class="result-badge">
                    CONFIRMED SEAT
                </div>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <label>Assigned Hall</label>
                    <p style="color:var(--primary);">${foundMatch.roomNo}</p>
                    <small class="text-muted">${foundMatch.block}</small>
                </div>
                <div class="detail-item">
                    <label>Seat Number</label>
                    <p style="font-size:26px; color:var(--success);">Seat #${foundSeat.seatNo}</p>
                </div>
                <div class="detail-item">
                    <label>Row & Column</label>
                    <p>Row ${foundSeat.row}, Col ${foundSeat.col}</p>
                </div>
                <div class="detail-item">
                    <label>Student Register No</label>
                    <p><code>${foundSeat.register}</code></p>
                </div>
            </div>
        </div>
    `;

    // Render interactive mini-grid highlighting candidate seat
    if (miniGridContainer) {
        miniGridContainer.innerHTML = `
            <div class="hall-container" style="margin-top:20px;">
                <div class="hall-title" style="margin-bottom:16px;">
                    <h3>${foundMatch.roomNo} Hall Seating Plan</h3>
                    <p>Your allocated seat (Seat #${foundSeat.seatNo}) is highlighted in gold below.</p>
                </div>

                <div class="blackboard-banner">
                    --- FRONT / INVIGILATOR STAGE ---
                </div>

                <div class="seat-grid" style="grid-template-columns: repeat(${foundMatch.cols}, 1fr);">
                    ${foundMatch.seats.map(s => {
                        const isTarget = s.register && s.register.toUpperCase() === registerNo.toUpperCase();
                        return `
                            <div class="seat-item ${isTarget ? 'highlighted' : (s.studentId ? 'occupied' : 'empty')}">
                                <span class="seat-no">Seat ${s.seatNo}</span>
                                <span class="seat-student-name">${isTarget ? 'YOU HERE' : (s.studentName || 'Vacant')}</span>
                                ${isTarget ? `<span class="badge badge-warning" style="font-size:9px;">YOUR SEAT</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

/**
 * Attendance sheet generator for admin/reports.html
 */
function renderAttendanceReport() {
    const examId = document.getElementById('reportExamSelect').value;
    const container = document.getElementById('attendanceReportContainer');

    if (!container || !examId) {
        container.innerHTML = '';
        return;
    }

    const arrangements = getArrangements();
    const examObj = getExams().find(e => e.id === examId);

    let matchingSheets = [];

    arrangements.forEach(arr => {
        const studentSeats = arr.seats.filter(s => s.examId === examId || (s.department === examObj?.department));
        if (studentSeats.length > 0) {
            matchingSheets.push({
                roomNo: arr.roomNo,
                block: arr.block,
                seats: studentSeats
            });
        }
    });

    if (matchingSheets.length === 0) {
        container.innerHTML = `
            <div class="alert alert-danger" style="margin-top:20px;">
                No seating allocation generated for this examination yet.
            </div>
        `;
        return;
    }

    container.innerHTML = matchingSheets.map(sheet => `
        <div class="table-card" style="margin-top:24px; padding:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
                <div>
                    <h2>${examObj?.subjectCode || 'EXAM'} Attendance Sheet - ${sheet.roomNo}</h2>
                    <p class="text-muted">Subject: ${examObj?.subjectName || ''} | Date: ${examObj?.date || ''} | Session: ${examObj?.timeSlot || ''} | Building: ${sheet.block}</p>
                </div>
                <button class="btn btn-secondary btn-sm no-print" onclick="window.print()">
                    <i class="ri-printer-line"></i> Print Attendance Sheet
                </button>
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Seat #</th>
                        <th>Register No</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>Candidate Signature</th>
                    </tr>
                </thead>
                <tbody>
                    ${sheet.seats.map(s => `
                        <tr>
                            <td><strong>Seat ${s.seatNo}</strong></td>
                            <td><code>${s.register}</code></td>
                            <td><strong>${s.studentName}</strong></td>
                            <td><span class="badge dept-${s.department}">${s.department}</span></td>
                            <td style="border-bottom:1px solid #000; width:200px;"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('');
}
