import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { CSVLink } from 'react-csv'; // For CSV export
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For Excel export
import config from '../config'; // Import the config file

// Styled Components
const PatientManagementContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const Dropdown = styled.select`
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  background-color: #343a40;
  color: white;
  padding: 10px;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

const TableData = styled.td`
  padding: 10px;
  text-align: center;
`;

const Button = styled.button.attrs(props => ({
  // Filter out hoverColor so it doesn't get passed to the DOM element
  hoverColor: undefined,
}))`
  padding: 10px 20px;
  background-color: ${(props) => props.bgColor || '#007bff'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;

  &:hover {
    background-color: ${(props) => props.hoverColor || '#0056b3'};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  margin: 0 5px;
  background-color: ${(props) => props.bgColor || '#007bff'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.hoverColor || '#0056b3'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const AddButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const ModalBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  padding: 10px;
  margin-bottom: 10px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const CloseButton = styled(Button)`
  background-color: #dc3545;
  margin-top: 20px;
`;

const exportToExcel = (patients) => {
  const worksheet = XLSX.utils.json_to_sheet(patients);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, 'Patient_Report.xlsx');
};
// Component
const PatientPage = () => {
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(6); // Set number of patients per page
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [healthFacilities, setHealthFacilities] = useState([]);
  
  // Fetch permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  
  // Get permissions for the 'Patient' activity
  const patientPermissions = permissions.find(perm => perm.activityName === 'Patient') || {};
  
  // Fetch all patients on page load
  useEffect(() => {
    if (patientPermissions.canView === "True") {
      fetchAllPatients();
    }
    fetchHealthFacilities(); // Fetch health facilities for the dropdown
  }, []);
  
  const fetchAllPatients = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/Patient/GetPatientData`, {});
      setPatients(response.data.data); 
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchHealthFacilities = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/User/GetDropdownData`);
      setHealthFacilities(response.data.data.healthFacilityDropdown); 
    } catch (error) {
      console.error('Error fetching health facilities:', error);
    }
  };

  // Add Patient button handler
  const handleAddNewPatient = () => {
    setSelectedPatient({ name: '', gender: '', address: '', healthFacilityId: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient({
      id: patient.id,
      name: patient.name,
      gender: patient.gender,
      address: patient.address,
      healthFacilityId: patient.healthFacilityId || ''
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDeletePatient = (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      const apiData = {
        id: id,
        isDeleted: '1',
        modifiedBy: 'admin'
      };

      axios.post(`${config.API_BASE_URL}/api/Patient/InsertUpdateDeletePatient`, apiData)
        .then(response => {
          if (response.status === 200) {
            fetchAllPatients();
            alert('Patient deleted successfully!');
          } else {
            alert('Failed to delete patient.');
          }
        })
        .catch(error => {
          console.error('Error deleting patient:', error);
          alert('Error deleting patient.');
        });
    }
  };

  const handleSaveChanges = async () => {
    const apiData = {
      id: selectedPatient.id,
      name: selectedPatient.name,
      gender: selectedPatient.gender,
      address: selectedPatient.address,
      healthFacilityId: selectedPatient.healthFacilityId
    };

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/Patient/InsertUpdateDeletePatient`, apiData);
      if (response.data.statusCode === '00') {
        fetchAllPatients(); // Refetch patients to update the table
        setShowModal(false);
      } else {
        alert(response.data.data);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error saving patient.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  // Pagination logic
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = patients.slice(indexOfFirstPatient, indexOfLastPatient);
  
  const totalPages = Math.ceil(patients.length / patientsPerPage);

  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <PatientManagementContainer>
      <h2>Patient Management</h2>

      {/* Conditionally show the Add button based on canCreate permission */}
      
        <AddButtonContainer>
        {patientPermissions.canCreate === "True" && (
          <Button onClick={handleAddNewPatient} bgColor="#28a745" hoverColor="#218838">
            Add New Patient
          </Button>
        )}
        {/* Excel Export */}
        <Button onClick={() => exportToExcel(patients)} bgColor="#17a2b8" hoverColor="#138496" style={{ marginLeft: '10px' }}>
          Export to Excel
        </Button>
      </AddButtonContainer>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>ID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Gender</TableHeader>
              <TableHeader>Address</TableHeader>
              <TableHeader>Health Facility</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {currentPatients.length > 0 ? (
              currentPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableData>{patient.id}</TableData>
                  <TableData>{patient.name}</TableData>
                  <TableData>{patient.gender}</TableData>
                  <TableData>{patient.address}</TableData>
                  <TableData>{patient.healthFacilityName || 'N/A'}</TableData>
                  <TableData>
                    {/* Conditionally render the Edit and Delete buttons based on permissions */}
                    {patientPermissions.canUpdate === "True" && (
                      <Button onClick={() => handleEditPatient(patient)} bgColor="#ffc107" hoverColor="#e0a800">
                        Edit
                      </Button>
                    )}
                    {patientPermissions.canDelete === "True" && (
                      <Button onClick={() => handleDeletePatient(patient.id)} bgColor="#dc3545" hoverColor="#c82333">
                        Delete
                      </Button>
                    )}
                  </TableData>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableData colSpan="6">No patients found</TableData>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>

      <PaginationContainer>
        <PaginationButton onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </PaginationButton>
        <PaginationButton onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </PaginationButton>
      </PaginationContainer>

      {/* Modal for adding/editing patients */}
      {showModal && (
        <ModalBackground>
          <ModalContent>
            <h3>{isEdit ? 'Edit Patient' : 'Add New Patient'}</h3>
            <Input
              type="text"
              placeholder="Name"
              value={selectedPatient?.name || ''}
              onChange={(e) => setSelectedPatient({ ...selectedPatient, name: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Gender"
              value={selectedPatient?.gender || ''}
              onChange={(e) => setSelectedPatient({ ...selectedPatient, gender: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Address"
              value={selectedPatient?.address || ''}
              onChange={(e) => setSelectedPatient({ ...selectedPatient, address: e.target.value })}
            />
            <Dropdown
              value={selectedPatient?.healthFacilityId || ''}
              onChange={(e) => setSelectedPatient({ ...selectedPatient, healthFacilityId: e.target.value })}
            >
              <option value="">Select Health Facility</option>
              {healthFacilities.map((facility) => (
                <option key={facility.healthFacilityId} value={facility.healthFacilityId}>
                  {facility.healthFacilityName}
                </option>
              ))}
            </Dropdown>

            <Button onClick={handleSaveChanges}>Save Changes</Button>
            <CloseButton onClick={handleCloseModal}>Cancel</CloseButton>
          </ModalContent>
        </ModalBackground>
      )}
    </PatientManagementContainer>
  );
};

export default PatientPage;
