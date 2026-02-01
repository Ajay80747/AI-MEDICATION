const API_URL = "/api";

// --- Navigation ---
function showSection(id) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active-section'));
    document.getElementById(id).classList.add('active-section');
    
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (id === 'dashboard') loadStats();
    if (id === 'patients') loadPatients();
    if (id === 'doctors') loadDoctors();
    if (id === 'appointments') loadAppointments();
    if (id === 'pharmacy') loadInventory();
    if (id === 'consultation') loadConsultationOptions();
}

function toggleModal(id) {
    document.getElementById(id).classList.toggle('hidden');
}

// --- Data Loading Functions ---

async function loadStats() {
    const res = await fetch(`${API_URL}/dashboard/stats`);
    const data = await res.json();
    document.getElementById('statPatients').innerText = data.patients;
    document.getElementById('statDoctors').innerText = data.doctors;
    document.getElementById('statMedicines').innerText = data.medicines;
    document.getElementById('statAppointments').innerText = data.active_appointments;
}

async function loadPatients() {
    const res = await fetch(`${API_URL}/patients`);
    const data = await res.json();
    const tbody = document.querySelector("#patientTable tbody");
    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.age} / ${p.gender}</td>
            <td>${p.contact}</td>
            <td>${p.history || 'N/A'}</td>
        </tr>
    `).join('');
}

async function loadDoctors() {
    const res = await fetch(`${API_URL}/doctors`);
    const data = await res.json();
    const grid = document.getElementById("doctorGrid");
    grid.innerHTML = data.map(d => `
        <div class="card">
            <h3>Dr. ${d.name}</h3>
            <p style="color:var(--primary)">${d.specialization}</p>
            <p><small>${d.availability}</small></p>
        </div>
    `).join('');
}

async function loadInventory() {
    const res = await fetch(`${API_URL}/inventory`);
    const data = await res.json();
    const tbody = document.querySelector("#pharmacyTable tbody");
    tbody.innerHTML = data.map(m => `
        <tr>
            <td>${m.name}</td>
            <td><span style="background:#eee; padding:2px 6px; border-radius:4px">${m.category}</span></td>
            <td>${m.stock}</td>
            <td>$${m.price}</td>
        </tr>
    `).join('');
}

async function loadAppointments() {
    const res = await fetch(`${API_URL}/appointments`);
    const data = await res.json();
    const tbody = document.querySelector("#appointmentTable tbody");
    tbody.innerHTML = data.map(a => `
        <tr>
            <td>${a.date}</td>
            <td>${a.patient_id}</td>
            <td>${a.doctor_id}</td>
            <td>${a.status}</td>
        </tr>
    `).join('');
    
    // Also load dropdowns for modal
    loadConsultationOptions(true);
}

async function loadConsultationOptions(forModal = false) {
    const [pRes, dRes] = await Promise.all([
        fetch(`${API_URL}/patients`),
        fetch(`${API_URL}/doctors`)
    ]);
    const patients = await pRes.json();
    const doctors = await dRes.json();

    const populate = (pSelect, dSelect) => {
        if(pSelect) pSelect.innerHTML = patients.map(p => `<option value="${p._id}">${p.name} (ID: ${p._id.substr(-4)})</option>`).join('');
        if(dSelect) dSelect.innerHTML = doctors.map(d => `<option value="${d._id}">Dr. ${d.name}</option>`).join('');
    };

    if (forModal) {
        populate(document.getElementById('aPatientId'), document.getElementById('aDoctorId'));
    } else {
        populate(document.getElementById('consultPatientId'), document.getElementById('consultDoctorId'));
    }
}

// --- Action Functions (Create) ---

async function addPatient() {
    const payload = {
        name: document.getElementById('pName').value,
        age: parseInt(document.getElementById('pAge').value),
        gender: document.getElementById('pGender').value,
        contact: document.getElementById('pContact').value,
        weight: parseFloat(document.getElementById('pWeight').value),
        allergies: document.getElementById('pAllergies').value,
    };
    await fetch(`${API_URL}/patients`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    toggleModal('patientModal');
    loadPatients();
}

async function addDoctor() {
    const payload = {
        name: document.getElementById('dName').value,
        specialization: document.getElementById('dSpec').value,
        availability: document.getElementById('dAvail').value
    };
    await fetch(`${API_URL}/doctors`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    toggleModal('doctorModal');
    loadDoctors();
}

async function addMedicine() {
    const payload = {
        name: document.getElementById('mName').value,
        category: document.getElementById('mCat').value,
        stock: parseInt(document.getElementById('mStock').value),
        price: parseFloat(document.getElementById('mPrice').value),
        description: document.getElementById('mDesc').value
    };
    await fetch(`${API_URL}/inventory`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    toggleModal('medicineModal');
    loadInventory();
}

async function addAppointment() {
    const payload = {
        patient_id: document.getElementById('aPatientId').value,
        doctor_id: document.getElementById('aDoctorId').value,
        date: document.getElementById('aDate').value
    };
    await fetch(`${API_URL}/appointments`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    toggleModal('appointmentModal');
    loadAppointments();
}

// --- AI Logic ---

async function runAIConsultation() {
    const pId = document.getElementById('consultPatientId').value;
    const dId = document.getElementById('consultDoctorId').value;
    const fileInput = document.getElementById('consultImage');

    if (!pId || !dId || fileInput.files.length === 0) {
        alert("Please select Patient, Doctor and upload an Image.");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('patient_id', pId);
    formData.append('doctor_id', dId);

    const btn = document.querySelector('#consultation button');
    btn.innerText = "Analyzing...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/consultation/ai-assist`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        document.getElementById('aiCondition').innerText = data.condition_detected;
        document.getElementById('aiConfidence').innerText = data.confidence;
        document.getElementById('aiPlanContent').innerHTML = marked.parse(data.ai_treatment_plan);
        document.getElementById('aiResultBox').classList.remove('hidden');
    } catch (e) {
        console.error(e);
        alert("AI Analysis Failed");
    } finally {
        btn.innerText = "Analyze & Prescribe";
        btn.disabled = false;
    }
}

// Init
loadStats();
