import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { CSVLink } from 'react-csv'; // For CSV export
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For Excel export
import config from '../config'; // Import the config file

// Styled Components
const UserManagementContainer = styled.div`
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

// Export to Excel function
const exportToExcel = (users) => {
  const worksheet = XLSX.utils.json_to_sheet(users);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, 'User_Report.xlsx');
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [roles, setRoles] = useState([]);
  const [healthFacilities, setHealthFacilities] = useState([]);

  // Fetch permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const UserInfo = JSON.parse(localStorage.getItem('UserInfo') || '{}');
  const UserName = UserInfo.name;
  // Get permissions for 'User Management'
  const userManagementPermissions = permissions.find(perm => perm.activityName === 'User Management') || {};

  // Fetch all users on page load
  useEffect(() => {
    if (userManagementPermissions.canView === "True") {
      fetchAllUsers();
      fetchDropdownData();
    }
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/User/GetUserData`, {});
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/User/GetDropdownData`);
      const dropdownData = response.data.data;
      setRoles(dropdownData.roleDropdown);
      setHealthFacilities(dropdownData.healthFacilityDropdown);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const csvHeaders = [
    { label: "UserID", key: "userID" },
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phoneNumber" },
    { label: "Role", key: "roleName" },
    { label: "Health Facility", key: "healthFacilityName" }
  ];

  const csvReport = {
    data: users,
    headers: csvHeaders,
    filename: 'User_Report.csv'
  };

  const handleDeleteUser = (userID) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const apiData = {
        userID: userID,
        isDeleted: '1',
        modifiedBy: UserName
      };
  
      axios.post(`${config.API_BASE_URL}/api/User/InsertUpdateDeleteUser`, apiData)
        .then(response => {
          if (response.status === 200) {
            fetchAllUsers();
            alert('User deleted successfully!');
          } else {
            alert('Failed to delete user.');
          }
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          alert('Error deleting user.');
        });
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({
      userID: user.userID,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role || '',
      healthFacilityId: user.healthFacilityId || ''
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAddNewUser = () => {
    setSelectedUser({ name: '', email: '', phoneNumber: '', role: '', healthFacilityId: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    const apiData = {
      userID: selectedUser.userID,
      name: selectedUser.name,
      email: selectedUser.email,
      address: selectedUser.address,
      phoneNumber: selectedUser.phoneNumber,
      role: selectedUser.role,
      healthFacilityId: selectedUser.healthFacilityId,
      createdBy: isEdit ? '' : 'admin',
      modifiedBy: isEdit ? 'admin' : ''
    };
  
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/User/InsertUpdateDeleteUser`, apiData);
      if (response.data.statusCode === '00') {
        fetchAllUsers();
        setShowModal(false);
      } else {
        alert(response.data.data);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <UserManagementContainer>
      <h2>User Management</h2>

      {/* Conditionally show the Add New User, Export CSV, and Export Excel buttons based on canCreate permission */}
      <AddButtonContainer>
        {userManagementPermissions.canCreate === "True" && (
          <Button onClick={handleAddNewUser} bgColor="#28a745" hoverColor="#218838">
            Add New User
          </Button>
        )}
        {/* Excel Export */}
        <Button onClick={() => exportToExcel(users)} bgColor="#17a2b8" hoverColor="#138496" style={{ marginLeft: '10px' }}>
          Export to Excel
        </Button>
      </AddButtonContainer>

      {/* Users Table */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>UserID</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Phone Number</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Health Facility</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.userID}>
                  <TableData>{user.userID}</TableData>
                  <TableData>{user.name}</TableData>
                  <TableData>{user.email}</TableData>
                  <TableData>{user.phoneNumber}</TableData>
                  <TableData>{user.roleName || 'N/A'}</TableData>
                  <TableData>{user.healthFacilityName || 'N/A'}</TableData>
                  <TableData>
                    {/* Conditionally show the Edit button based on canUpdate permission */}
                    {userManagementPermissions.canUpdate === "True" && (
                      <Button onClick={() => handleEditUser(user)} bgColor="#ffc107" hoverColor="#e0a800">
                        Edit
                      </Button>
                    )}
                    {/* Conditionally show the Delete button based on canDelete permission */}
                    {userManagementPermissions.canDelete === "True" && (
                      <Button onClick={() => handleDeleteUser(user.userID)} bgColor="#dc3545" hoverColor="#c82333">
                        Delete
                      </Button>
                    )}
                  </TableData>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableData colSpan="7">No users found</TableData>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* Modal for Adding/Editing User */}
      {showModal && (
        <ModalBackground>
          <ModalContent>
            <h3>{isEdit ? 'Edit User' : 'Add New User'}</h3>
            <Input
              type="text"
              placeholder="Name"
              value={selectedUser?.name || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={selectedUser?.email || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
            />
            <Input
              type="address"
              placeholder="Address"
              value={selectedUser?.address || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, address: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Phone Number"
              value={selectedUser?.phoneNumber || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
            />
            <Dropdown
              value={selectedUser?.role || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </option>
              ))}
            </Dropdown>
            <Dropdown
              value={selectedUser?.healthFacilityId || ''}
              onChange={(e) => setSelectedUser({ ...selectedUser, healthFacilityId: e.target.value })}
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
    </UserManagementContainer>
  );
};

export default UserManagementPage;
