import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { CSVLink } from 'react-csv'; // For CSV export
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For Excel export
import config from '../config'; // Import the config file

// Styled Components
const HealthWorkerManagementContainer = styled.div`
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

const SuccessMessage = styled.div`
  background-color: #28a745;
  color: white;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 10px;
`;

const exportToExcel = (workers) => {
  const worksheet = XLSX.utils.json_to_sheet(workers);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HealthWorkers");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, 'HealthWorker_Report.xlsx');
};

const HealthWorkerPage = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [healthFacilities, setHealthFacilities] = useState([]);

  // Fetch permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  // Get permissions for the 'Health Worker' activity
  const healthWorkerPermissions = permissions.find(perm => perm.activityName === 'Health Worker') || {};

  // Fetch all health workers on page load
  useEffect(() => {
    if (healthWorkerPermissions.canView === "True") {
      fetchAllHealthWorkers();
    }
    fetchHealthFacilities();
  }, []);

  const fetchAllHealthWorkers = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/HealthWorker/GetHealthWorkerData`, {});
      setWorkers(response.data.data); // Assuming the API returns health workers in response.data.data
    } catch (error) {
      console.error('Error fetching health workers:', error);
    }
  };

  const fetchHealthFacilities = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/User/GetDropdownData`);
      setHealthFacilities(response.data.data.healthFacilityDropdown); // Assuming API returns health facilities dropdown
    } catch (error) {
      console.error('Error fetching health facilities:', error);
    }
  };

  const handleDeleteWorker = (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      const apiData = {
        id: id,
        isDeleted: '1',
        modifiedBy: 'admin'
      };

      axios.post(`${config.API_BASE_URL}/api/HealthWorker/InsertUpdateDeleteHealthWorker`, apiData)
        .then(response => {
          if (response.status === 200) {
            fetchAllHealthWorkers();
            alert('Worker deleted successfully!');
          } else {
            alert('Failed to delete worker.');
          }
        })
        .catch(error => {
          console.error('Error deleting worker:', error);
          alert('Error deleting worker.');
        });
    }
  };

  const handleEditWorker = (worker) => {
    debugger;
    setSelectedWorker({
      id: worker.id,
      name: worker.name,
      designation: worker.designation,
      email: worker.email,
      phoneNumber: worker.phoneNumber,
      healthFacilityId: worker.healthFacilityID // Make sure this exists
    });
    setIsEdit(true);
    setShowModal(true);
  };
  
  

  const handleAddNewWorker = () => {
    setSelectedWorker({ name: '', designation: '', email: '', phoneNumber: '', healthFacilityId: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    const apiData = {
      id: selectedWorker.id,
      name: selectedWorker.name,
      designation: selectedWorker.designation,
      email: selectedWorker.email,
      phoneNumber: selectedWorker.phoneNumber,
      healthFacilityId: selectedWorker.healthFacilityId,
      createdBy: isEdit ? '' : 'admin',
      modifiedBy: isEdit ? 'admin' : ''
    };

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/HealthWorker/InsertUpdateDeleteHealthWorker`, apiData);
      if (response.data.statusCode === '00') {
        fetchAllHealthWorkers();
        setShowModal(false);
      } else {
        alert(response.data.data);
      }
    } catch (error) {
      console.error('Error saving worker:', error);
      alert('Error saving worker.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWorker(null);
  };

  const csvHeaders = [
    { label: "WorkerID", key: "id" },
    { label: "Name", key: "name" },
    { label: "Designation", key: "designation" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phoneNumber" },
    { label: "Health Facility", key: "healthFacilityName" }
  ];

  const csvReport = {
    data: workers,
    headers: csvHeaders,
    filename: 'HealthWorker_Report.csv'
  };

  return (
    <HealthWorkerManagementContainer>
      <h2>Health Worker Management</h2>

      {/* Conditionally show the Add New Worker, Export CSV, and Export Excel buttons based on canCreate permission */}
      
        <AddButtonContainer>
        {healthWorkerPermissions.canCreate === "True" && (
          <Button onClick={handleAddNewWorker} bgColor="#28a745" hoverColor="#218838">
            Add New Worker
          </Button>
        )}
        {/* Excel Export */}
        <Button onClick={() => exportToExcel(workers)} bgColor="#17a2b8" hoverColor="#138496" style={{ marginLeft: '10px' }}>
          Export to Excel
        </Button>
      </AddButtonContainer>
      
      {/* Health Workers Table */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>WorkerID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Designation</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Phone Number</TableHeader>
              <TableHeader>Health Facility</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {workers.length > 0 ? (
              workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableData>{worker.id}</TableData>
                  <TableData>{worker.name}</TableData>
                  <TableData>{worker.designation}</TableData>
                  <TableData>{worker.email}</TableData>
                  <TableData>{worker.phoneNumber}</TableData>
                  <TableData>{worker.healthFacilityName || 'N/A'}</TableData>
                  <TableData>
                    {/* Conditionally show the Edit button based on canUpdate permission */}
                    {healthWorkerPermissions.canUpdate === "True" && (
                      <Button onClick={() => handleEditWorker(worker)} bgColor="#ffc107" hoverColor="#e0a800">
                        Edit
                      </Button>
                    )}
                    {/* Conditionally show the Delete button based on canDelete permission */}
                    {healthWorkerPermissions.canDelete === "True" && (
                      <Button onClick={() => handleDeleteWorker(worker.id)} bgColor="#dc3545" hoverColor="#c82333">
                        Delete
                      </Button>
                    )}
                  </TableData>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableData colSpan="7">No workers found</TableData>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modal for Adding/Editing Worker */}
      {showModal && (
        <ModalBackground>
          <ModalContent>
            <h3>{isEdit ? 'Edit Worker' : 'Add New Worker'}</h3>
            <Input
              type="text"
              placeholder="Name"
              length = "10"
              value={selectedWorker?.name || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, name: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Designation"
              value={selectedWorker?.designation || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, designation: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={selectedWorker?.email || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, email: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Phone Number"
              value={selectedWorker?.phoneNumber || ''}
              onChange={(e) => setSelectedWorker({ ...selectedWorker, phoneNumber: e.target.value })}
            />
            <Dropdown
              value={selectedWorker?.healthFacilityId || ''} // Ensure healthFacilityId is set correctly
              onChange={(e) => setSelectedWorker({ ...selectedWorker, healthFacilityId: e.target.value })}
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
    </HealthWorkerManagementContainer>
  );
};

export default HealthWorkerPage;
