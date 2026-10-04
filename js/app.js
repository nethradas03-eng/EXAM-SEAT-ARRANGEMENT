/**
 * Main Application Central Data Store & Storage Utilities
 * Empty initial storage - Admin enters all Students, Rooms/Halls, and Exams.
 */

const STORAGE_KEYS = {
    STUDENTS: 'exam_seating_students',
    ROOMS: 'exam_seating_rooms',
    EXAMS: 'exam_seating_exams',
    ARRANGEMENTS: 'exam_seating_arrangements'
};

// Initialize Storage with empty arrays (No default/dummy records forced)
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ARRANGEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ARRANGEMENTS, JSON.stringify([]));
    }
}

// Data Getters & Setters
function getStudents() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
}
function saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

function getRooms() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS)) || [];
}
function saveRooms(rooms) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
}

function getExams() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS)) || [];
}
function saveExams(exams) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

function getArrangements() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ARRANGEMENTS)) || [];
}
function saveArrangements(arrangements) {
    localStorage.setItem(STORAGE_KEYS.ARRANGEMENTS, JSON.stringify(arrangements));
}

// Function to clear all system data (Reset database)
function resetSystemData() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ARRANGEMENTS, JSON.stringify([]));
}

// Global UI Alert Helper
function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="alert alert-${type}">
            <span>${message}</span>
        </div>
    `;
    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

// Execute auto initialization
initializeStorage();
