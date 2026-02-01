# Comprehensive AI Hospital Management System

A full-stack Hospital Management System with integrated Deep Learning diagnostics, powered by **FastAPI** and **MongoDB**.

## 🏥 Key Features

-   **Dashboard**: Real-time overview of hospital statistics (Patients, Doctors, Appointments, Inventory).
-   **Patient Management**: Complete registration and history tracking.
-   **Doctor Directory**: Manage medical staff and their availability.
-   **Pharmacy & Inventory**: Track medicine stock and prices.
-   **Appointment Scheduling**: Link patients with doctors.
-   **AI Consultation**:
    -   Upload patient X-rays/MRIs during a consultation.
    -   **ResNet-18** analysis for condition detection.
    -   **GenAI** simulation for personalized dosage plans based on patient weight/age/allergies.

## 🛠️ Tech Stack

-   **Backend**: Python (FastAPI), Uvicorn
-   **Database**: MongoDB (Motor Async Driver)
-   **AI**: PyTorch, Torchvision
-   **Frontend**: HTML5, CSS3, JavaScript (Single Page Application structure)

## 📋 Requirements

-   Python 3.8+
-   MongoDB running at `mongodb://localhost:27017/`

## 🚀 Quick Start

1.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```

2.  **Ensure MongoDB is Running**:
    Make sure your local MongoDB instance is active.

3.  **Start the Server**:
    ```bash
    python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
    ```

4.  **Open Application**:
    Navigate to `http://localhost:8000`

## 🧠 Workflow Example

1.  **Register a Patient**: Go to the "Patients" tab and add a new patient (e.g., "John Doe", Age 45, Allergy "Penicillin").
2.  **Add a Doctor**: Go to "Doctors" and add a specialist.
3.  **Schedule**: Create an appointment linking John Doe to the Doctor.
4.  **Consultation**:
    -   Go to "AI Consultation".
    -   Select "John Doe" and the Doctor.
    -   Upload an X-Ray.
    -   Click "Analyze".
    -   *Result*: The AI detects the condition and prescribes medication *excluding* Penicillin due to the patient's allergy record.
