import React, { useContext, useState, useEffect } from 'react';
import { Route, Routes, NavLink } from 'react-router-dom';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext'; 

import UserManagementPage from './UserManagementPage'; 
import RoleManagementPage from './RoleManagementPage';
import HealthFacilityPage from './HealthFacilityPage';
import HealthWorkerPage from './HealthWorkerPage';
import PatientPage from './PatientPage';
import ActivityLogPage from './ActivityLogPage';
import config from '../config'; // Import the config file

// Register necessary components for Chart.js
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: #343a40;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
`;

const SidebarItem = styled(NavLink)`
  padding: 15px 20px;
  cursor: pointer;
  text-decoration: none;
  color: white;
  font-size: 16px;
  border-radius: 4px;
  margin-bottom: 10px;

  &.active {
    background-color: #1abc9c;
    color: white;
  }

  &:hover {
    background-color: #1abc9c;
    color: white;
  }
`;

const Header = styled.div`
  background-color: #343a40;
  color: white;
  padding: 15px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
`;

const Content = styled.div`
  flex: 1;
  background-color: #ecf0f1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ChartsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const ChartWrapper = styled.div`
  width: 30%;
  max-width: 300px;
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

// Render sidebar menu items dynamically based on user permissions
const renderMenuItems = (permissions) => {
  const routeMap = {
    "Home": "/dashboard/",
    "User Management": "/dashboard/user-management",
    "Role Management": "/dashboard/role-management",
    "Health Facility": "/dashboard/health-facility",
    "Health Worker": "/dashboard/health-worker",
    "Patient": "/dashboard/patient",
    "Activity Log": "/dashboard/activity-log"
  };

  if (!permissions || permissions.length === 0) {
    return <div>No menu items available</div>;
  }

  return permissions
    .filter((perm) => perm.canView === "True")
    .map((perm) => (
      <SidebarItem
        key={perm.activityId}
        to={routeMap[perm.activityName]}
        end={perm.activityName === "Home"}
      >
        {perm.activityName}
      </SidebarItem>
    ));
};

const handleLogout = () => {
  // Clear local storage to log the user out
  localStorage.clear();

  // Redirect to the login page (assuming you have a login route set up)
  window.location.href = '/';  // Or use a navigation hook if you're using react-router-dom v6
};

// Component for Dashboard Home (Fetching and displaying charts)
const DashboardHome = () => {
  const [patientsPerFacilityData, setPatientsPerFacilityData] = useState({
    labels: [],
    datasets: [],
  });
  const [workersPerRegionData, setWorkersPerRegionData] = useState({
    labels: [],
    datasets: [],
  });
  const [genderDistributionData, setGenderDistributionData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    axios.get(`${config.API_BASE_URL}/api/Dashboard/GetPatientPerHealthFacility`)
      .then(response => {
        const facilities = response.data.data.map(item => item.facilityName);
        const counts = response.data.data.map(item => item.patientCount);

        setPatientsPerFacilityData({
          labels: facilities,
          datasets: [{
            label: 'Number of Patients',
            data: counts,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }]
        });
      });

    axios.get(`${config.API_BASE_URL}/api/Dashboard/GetHealthWorkersPerRegion`)
      .then(response => {
        const regions = response.data.data.map(item => item.region);
        const counts = response.data.data.map(item => item.workerCount);

        setWorkersPerRegionData({
          labels: regions,
          datasets: [{
            label: 'Health Workers',
            data: counts,
            backgroundColor: ['rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(75, 192, 192, 1)'],
            borderWidth: 1,
          }]
        });
      });

    axios.get(`${config.API_BASE_URL}/api/Dashboard/GenderDistribution`)
      .then(response => {
        const genders = response.data.data.map(item => item.gender);
        const counts = response.data.data.map(item => item.patientCount);

        setGenderDistributionData({
          labels: genders,
          datasets: [{
            data: counts,
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
            hoverBackgroundColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
          }]
        });
      });
  }, []);

  return (
    <ChartsContainer>
      <ChartWrapper>
        <h4>Patients</h4>
        <Bar data={patientsPerFacilityData} options={{ maintainAspectRatio: true }} width={450} height={350} />
      </ChartWrapper>
      <ChartWrapper>
        <h4>Workers</h4>
        <Pie data={workersPerRegionData} options={{ maintainAspectRatio: true }} />
      </ChartWrapper>
      <ChartWrapper>
        <h4>Gender</h4>
        <Pie data={genderDistributionData} options={{ maintainAspectRatio: true }} />
      </ChartWrapper>
    </ChartsContainer>
  );
};

// Main Layout Component
const DashboardPage = () => {
  const { user } = useContext(AuthContext); // Access the user from AuthContext

  // Fetch permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  // Get user info from localStorage
  const UserInfo = JSON.parse(localStorage.getItem('UserInfo') || '[]');
  const UserName = UserInfo.name;

  return (
    <DashboardContainer>
      <Sidebar>
        <br></br>
        <br></br>
        <br></br>
        <h2 style={{ color: '#1abc9c' }}>{UserName || 'User'}</h2> {/* Display logged-in user's name */}
        {renderMenuItems(permissions)} {/* Render dynamic sidebar items based on permissions */}

        <Button
          bgColor="#dc3545" 
          hoverColor="#c82333"
          onClick={handleLogout}  // Call the logout function on click
          style={{ marginTop: '20px' }}
        >
          Logout
        </Button>

      </Sidebar>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header>
          <h2>Health Facility Data Management System</h2>
        </Header>
        <Content>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            {/* Conditionally render other routes based on permissions */}
            {permissions.find(perm => perm.activityName === 'User Management' && perm.canView === "True") && (
              <Route path="user-management" element={<UserManagementPage />} />
            )}
            {permissions.find(perm => perm.activityName === 'Role Management' && perm.canView === "True") && (
              <Route path="role-management" element={<RoleManagementPage />} />
            )}
            {permissions.find(perm => perm.activityName === 'Health Facility' && perm.canView === "True") && (
              <Route path="health-facility" element={<HealthFacilityPage />} />
            )}
            {permissions.find(perm => perm.activityName === 'Health Worker' && perm.canView === "True") && (
              <Route path="health-worker" element={<HealthWorkerPage />} />
            )}
            {permissions.find(perm => perm.activityName === 'Patient' && perm.canView === "True") && (
              <Route path="patient" element={<PatientPage />} />
            )}
            {permissions.find(perm => perm.activityName === 'Activity Log' && perm.canView === "True") && (
              <Route path="activity-log" element={<ActivityLogPage />} />
            )}
          </Routes>
        </Content>
      </div>
    </DashboardContainer>
  );
};

export default DashboardPage;
