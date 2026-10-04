/**
 * Examination Hall & Room Layout Management
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    renderRoomsTable();

    const addRoomForm = document.getElementById('addRoomForm');
    const rowsInput = document.getElementById('newRows');
    const colsInput = document.getElementById('newCols');

    if (addRoomForm) addRoomForm.addEventListener('submit', handleAddRoom);
    if (rowsInput && colsInput) {
        rowsInput.addEventListener('input', updateSeatPreview);
        colsInput.addEventListener('input', updateSeatPreview);
    }
});

function renderRoomsTable() {
    const tableBody = document.getElementById('roomsTableBody');
    if (!tableBody) return;

    const rooms = getRooms();

    if (rooms.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="ri-community-line"></i>
                    <p>No examination rooms added yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = rooms.map((r, index) => `
        <tr>
            <td><strong>${index + 1}</strong></td>
            <td><strong style="font-size:15px;">${r.roomNo}</strong></td>
            <td>${r.block}</td>
            <td>${r.rows} × ${r.cols}</td>
            <td><span class="badge badge-primary">${r.capacity} Seats</span></td>
            <td>
                <span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                    ${r.status}
                </span>
            </td>
            <td style="text-align:right;">
                <button class="btn btn-secondary btn-sm" onclick="previewRoomLayout('${r.id}')">
                    Preview Layout
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function updateSeatPreview() {
    const rows = parseInt(document.getElementById('newRows').value) || 0;
    const cols = parseInt(document.getElementById('newCols').value) || 0;
    const capacityNotice = document.getElementById('capacityNotice');
    
    if (capacityNotice) {
        capacityNotice.textContent = `Calculated Capacity: ${rows * cols} seats (${rows} rows × ${cols} columns)`;
    }
}

function handleAddRoom(e) {
    e.preventDefault();

    const roomNo = document.getElementById('newRoomNo').value.trim();
    const block = document.getElementById('newBlock').value.trim();
    const rows = parseInt(document.getElementById('newRows').value);
    const cols = parseInt(document.getElementById('newCols').value);
    const status = document.getElementById('newStatus').value;

    if (!roomNo || !block || !rows || !cols) {
        alert('Please fill in all room dimensions.');
        return;
    }

    const rooms = getRooms();
    if (rooms.some(r => r.roomNo.toLowerCase() === roomNo.toLowerCase())) {
        alert('A room with this name or number already exists!');
        return;
    }

    const newRoom = {
        id: 'R' + Date.now(),
        roomNo,
        block,
        rows,
        cols,
        capacity: rows * cols,
        status
    };

    rooms.push(newRoom);
    saveRooms(rooms);

    closeModal('addRoomModal');
    document.getElementById('addRoomForm').reset();
    renderRoomsTable();
    showAlert('roomAlertContainer', 'Room layout added successfully!', 'success');
}

function previewRoomLayout(roomId) {
    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const modalTitle = document.getElementById('previewModalTitle');
    const previewGrid = document.getElementById('roomPreviewGrid');

    if (modalTitle) modalTitle.textContent = `${room.roomNo} - Visual Grid Layout (${room.capacity} Seats)`;

    if (previewGrid) {
        previewGrid.style.gridTemplateColumns = `repeat(${room.cols}, 1fr)`;
        
        let gridHtml = '';
        let seatNum = 1;
        for (let r = 1; r <= room.rows; r++) {
            for (let c = 1; c <= room.cols; c++) {
                gridHtml += `
                    <div class="seat-item empty">
                        <span class="seat-no">Seat ${seatNum}</span>
                        <small class="text-muted">R${r}-C${c}</small>
                    </div>
                `;
                seatNum++;
            }
        }
        previewGrid.innerHTML = gridHtml;
    }

    openModal('previewRoomModal');
}

function deleteRoom(id) {
    if (!confirm('Are you sure you want to delete this hall room layout?')) return;

    let rooms = getRooms();
    rooms = rooms.filter(r => r.id !== id);
    saveRooms(rooms);

    renderRoomsTable();
    showAlert('roomAlertContainer', 'Room deleted.', 'danger');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
