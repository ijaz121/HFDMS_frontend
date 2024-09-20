import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For Excel export
import config from '../config'; // Import the config file

/// Styled Components
const RoleManagementContainer = styled.div`
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

const PermissionsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
`;

// Export to Excel function
const exportToExcel = (roles) => {
  const worksheet = XLSX.utils.json_to_sheet(roles);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Roles");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  saveAs(data, 'Role_Report.xlsx');
};

const Checkbox = styled.input.attrs({ type: 'checkbox' })``;

const RoleManagementPage = () => {
  
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [permissions, setPermissions] = useState({});

  const UserInfo = JSON.parse(localStorage.getItem('UserInfo') || '{}');
  const UserName = UserInfo.name;
  const UserID = UserInfo.userId;

  const actWithIds = [
    { id: 1, name: 'Home' },
    { id: 2, name: 'User Management' },
    { id: 3, name: 'Role Management' },
    { id: 4, name: 'Health Facility' },
    { id: 5, name: 'Health Worker' },
    { id: 6, name: 'Patient' },
    { id: 7, name: 'Activity Log' },
  ];
  
  useEffect(() => {
    fetchAllRoles();
  }, []);

  const fetchAllRoles = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/Role/GetRoleData`, {});
      setRoles(response.data.data); // Assuming the API returns roles in response.data.data
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleEditRole = async (role) => {
    try {
      debugger;
      const apiData = {
        roleId: role.roleID,  // Use the roleId passed from the button click
        userId: UserID // Pass userId or retrieve it from your local storage
      };
      
      const response = await axios.post(`${config.API_BASE_URL}/api/Role/GetMappedData`, apiData);
      
      if (response.data.statusCode === "00") {
        const fetchedPermissions = response.data.data;
        
        // Create a permissions object based on the API response
        const formattedPermissions = fetchedPermissions.reduce((acc, activity) => {
          acc[activity.activityId] = {
            view: activity.canView === "True",
            add: activity.canCreate === "True",
            update: activity.canUpdate === "True",
            delete: activity.canDelete === "True"
          };
          return acc;
        }, {});
  
        // Set the fetched permissions in state
        setPermissions(formattedPermissions);
  
        setSelectedRole({
          roleId: role.roleID, 
          roleName: role.roleName,
        });
        setIsEdit(true);
        setShowModal(true);
      } else {
        alert('Failed to fetch role data.');
      }
    } catch (error) {
      console.error('Error fetching role data:', error);
      alert('Error fetching role data.');
    }
  };
  

  const handlePermissionChange = (activityId, permissionType, isChecked) => {
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [activityId]: {
        ...prevPermissions[activityId],
        [permissionType]: isChecked,
      },
    }));
  };

  const handleDeleteRole = (roleID) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      const apiData = {
        roleId: roleID,
        isDeleted: '1',
        modifiedBy: UserName
      };
      axios.post(`${config.API_BASE_URL}/api/Role/InsertUpdateDeleteRole`, apiData)
        .then(response => {
          if (response.data.statusCode === "00") {
            fetchAllRoles();
            alert('Role deleted successfully!');
          } else {
            alert('Failed to delete role.');
          }
        })
        .catch(error => {
          console.error('Error deleting role:', error);
          alert('Error deleting role.');
        });
    }
  };

  const handleSaveChanges = async () => {

    const roleMappings = actWithIds.map((activity) => ({
      activityId: activity.id,
      canView: permissions[activity.id]?.view || false,
      canUpdate: permissions[activity.id]?.update || false,
      canDelete: permissions[activity.id]?.delete || false,
      canCreate: permissions[activity.id]?.add || false,
    })).filter(mapping => 
      mapping.canView || mapping.canUpdate || mapping.canDelete || mapping.canCreate
    ); // Only include mappings with at least one true permission

    const apiData = {
      roleId: selectedRole?.roleId || null,
      roleName: selectedRole?.roleName || '',
      isDeleted: '0',
      userName: UserName,
      roleMappings: roleMappings,
    };

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/Role/MapRole`, apiData);
      if (response.data.statusCode === "00") {
        fetchAllRoles();
        setShowModal(false);
        alert('Role saved successfully!');
      } else {
        alert('Failed to save role.');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const handleAddNewRole = () => {
    setSelectedRole({ roleName: '', permissions: {} });
    setPermissions({});
    setIsEdit(false);
    setShowModal(true);
  };

  return (
    <RoleManagementContainer>
      <h2>Role Management</h2>

      <AddButtonContainer>
        <Button onClick={handleAddNewRole} bgColor="#28a745" hoverColor="#218838">
          Add New Role
        </Button>
        <Button onClick={() => exportToExcel(roles)} bgColor="#17a2b8" hoverColor="#138496" style={{ marginLeft: '10px' }}>
          Export to Excel
        </Button>
      </AddButtonContainer>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>RoleID</TableHeader>
              <TableHeader>Role Name</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.roleID}>
                  <TableData>{role.roleID}</TableData>
                  <TableData>{role.roleName}</TableData>
                  <TableData>
                    <Button onClick={() => handleEditRole(role)} bgColor="#ffc107" hoverColor="#e0a800">
                      Edit
                    </Button>
                    <Button onClick={() => handleDeleteRole(role.roleID)} bgColor="#dc3545" hoverColor="#c82333">
                      Delete
                    </Button>
                  </TableData>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableData colSpan="4">No roles found</TableData>
              </TableRow>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {showModal && (
        <ModalBackground>
          <ModalContent>
            <h3>{isEdit ? 'Edit Role' : 'Add New Role'}</h3>
            <Input
              type="text"
              placeholder="Role Name"
              value={selectedRole?.roleName || ''}
              onChange={(e) => setSelectedRole({ ...selectedRole, roleName: e.target.value })}
            />

            {/* Permissions Table */}
            <PermissionsTable>
              <thead>
                <tr>
                  <th>Activity Name</th>
                  <th>View</th>
                  <th>Add</th>
                  <th>Update</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {actWithIds.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.name}</td>
                    <td>
                      <Checkbox
                        checked={permissions[activity.id]?.view || false}
                        onChange={(e) => handlePermissionChange(activity.id, 'view', e.target.checked)}
                      />
                    </td>
                    <td>
                      <Checkbox
                        checked={permissions[activity.id]?.add || false}
                        onChange={(e) => handlePermissionChange(activity.id, 'add', e.target.checked)}
                      />
                    </td>
                    <td>
                      <Checkbox
                        checked={permissions[activity.id]?.update || false}
                        onChange={(e) => handlePermissionChange(activity.id, 'update', e.target.checked)}
                      />
                    </td>
                    <td>
                      <Checkbox
                        checked={permissions[activity.id]?.delete || false}
                        onChange={(e) => handlePermissionChange(activity.id, 'delete', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </PermissionsTable>

            <Button onClick={handleSaveChanges}>Save Changes</Button>
            <CloseButton onClick={handleCloseModal}>Cancel</CloseButton>
          </ModalContent>
        </ModalBackground>
      )}
    </RoleManagementContainer>
  );
};

export default RoleManagementPage;
