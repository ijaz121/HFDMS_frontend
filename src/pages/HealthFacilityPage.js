import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { CSVLink } from 'react-csv'; // For CSV export
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For Excel export

import config from '../config'; // Import the config file

// Styled Components
const HealthFacilityManagementContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
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

// Export to Excel function
const exportToExcel = (facilities) => {
  const worksheet = XLSX.utils.json_to_sheet(facilities);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "HealthFacilities");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, 'HealthFacility_Report.xlsx');
};

const HealthFacilityPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Fetch permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  // Get permissions for the 'Health Facility' activity
  const healthFacilityPermissions = permissions.find(perm => perm.activityName === 'Health Facility') || {};

  // Fetch all health facilities on page load
  useEffect(() => {
    if (healthFacilityPermissions.canView === "True") {
      fetchAllHealthFacilities();
    }
  }, []);

  const fetchAllHealthFacilities = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/HealthFacility/GetHealthFacilityData`, {});
      setFacilities(response.data.data); // Assuming the API returns facilities in response.data.data
    } catch (error) {
      console.error('Error fetching health facilities:', error);
    }
  };

  const csvHeaders = [
    { label: "FacilityID", key: "id" },
    { label: "Name", key: "name" },
    { label: "District", key: "district" },
    { label: "Region", key: "region" },
    { label: "State", key: "state" },
    { label: "Country", key: "country" }
  ];

  const csvReport = {
    data: facilities,
    headers: csvHeaders,
    filename: 'HealthFacility_Report.csv'
  };

  const handleDeleteFacility = (id) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      const apiData = {
        id: id,
        isDeleted: '1',
        modifiedBy: 'admin'
      };

      axios.post(`${config.API_BASE_URL}/api/HealthFacility/InsertUpdateDeleteHealthFacility`, apiData)
        .then(response => {
          if (response.status === 200) {
            fetchAllHealthFacilities();
            alert('Facility deleted successfully!');
          } else {
            alert('Failed to delete facility.');
          }
        })
        .catch(error => {
          console.error('Error deleting facility:', error);
          alert('Error deleting facility.');
        });
    }
  };

  const handleEditFacility = (facility) => {
    setSelectedFacility({
      id: facility.id,
      name: facility.name,
      district: facility.district,
      region: facility.region,
      state: facility.state,
      country: facility.country
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAddNewFacility = () => {
    setSelectedFacility({ name: '', district: '', region: '', state: '', country: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    const apiData = {
      id: selectedFacility.id,
      name: selectedFacility.name,
      district: selectedFacility.district,
      region: selectedFacility.region,
      state: selectedFacility.state,
      country: selectedFacility.country,
      createdBy: isEdit ? '' : 'admin',
      modifiedBy: isEdit ? 'admin' : ''
    };

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/HealthFacility/InsertUpdateDeleteHealthFacility`, apiData);
      
      if (response.data.statusCode === '00') {
        fetchAllHealthFacilities();
        setShowModal(false);
      } else {
        alert(response.data.data);
      }
    } catch (error) {
      console.error('Error saving facility:', error);
      alert('Error saving facility.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFacility(null);
  };

  return (
    <HealthFacilityManagementContainer>
      <h2>Health Facility Management</h2>

      {/* Conditionally show the Add New Facility, Export CSV, and Export Excel buttons based on canCreate permission */}
      
        <AddButtonContainer>
           {healthFacilityPermissions.canCreate === "True" && (
          <Button onClick={handleAddNewFacility} bgColor="#28a745" hoverColor="#218838">
            Add New Facility
          </Button>
           )}
          {/* Excel Export */}
          <Button onClick={() => exportToExcel(facilities)} bgColor="#17a2b8" hoverColor="#138496" style={{ marginLeft: '10px' }}>
            Export to Excel
          </Button>
        </AddButtonContainer>
      

      {/* Health Facilities Table */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>FacilityID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>District</TableHeader>
              <TableHeader>Region</TableHeader>
              <TableHeader>State</TableHeader>
              <TableHeader>Country</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableData>{facility.id}</TableData>
                  <TableData>{facility.name}</TableData>
                  <TableData>{facility.district}</TableData>
                  <TableData>{facility.region}</TableData>
                  <TableData>{facility.state}</TableData>
                  <TableData>{facility.country}</TableData>
                  <TableData>
                    {/* Conditionally show the Edit button based on canUpdate permission */}
                    {healthFacilityPermissions.canUpdate === "True" && (
                      <Button onClick={() => handleEditFacility(facility)} bgColor="#ffc107" hoverColor="#e0a800">
                        Edit
                      </Button>
                    )}
                    {/* Conditionally show the Delete button based on canDelete permission */}
                    {healthFacilityPermissions.canDelete === "True" && (
                      <Button onClick={() => handleDeleteFacility(facility.id)} bgColor="#dc3545" hoverColor="#c82333">
                        Delete
                      </Button>
                    )}
                  </TableData>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableData colSpan="7">No facilities found</TableData>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modal for Adding/Editing Facility */}
      {showModal && (
        <ModalBackground>
          <ModalContent>
            <h3>{isEdit ? 'Edit Facility' : 'Add New Facility'}</h3>
            <Input
              type="text"
              placeholder="Name"
              value={selectedFacility?.name || ''}
              onChange={(e) => setSelectedFacility({ ...selectedFacility, name: e.target.value })}
            />
            <Input
              type="text"
              placeholder="District"
              value={selectedFacility?.district || ''}
              onChange={(e) => setSelectedFacility({ ...selectedFacility, district: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Region"
              value={selectedFacility?.region || ''}
              onChange={(e) => setSelectedFacility({ ...selectedFacility, region: e.target.value })}
            />
            <Input
              type="text"
              placeholder="State"
              value={selectedFacility?.state || ''}
              onChange={(e) => setSelectedFacility({ ...selectedFacility, state: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Country"
              value={selectedFacility?.country || ''}
              onChange={(e) => setSelectedFacility({ ...selectedFacility, country: e.target.value })}
            />

            <Button onClick={handleSaveChanges}>Save Changes</Button>
            <CloseButton onClick={handleCloseModal}>Cancel</CloseButton>
          </ModalContent>
        </ModalBackground>
      )}
    </HealthFacilityManagementContainer>
  );
};

export default HealthFacilityPage;
