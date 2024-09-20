import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { CSVLink } from 'react-csv'; // For CSV export
import config from '../config'; // Import the config file

// Styled Components
const ActivityLogContainer = styled.div`
  padding: 20px;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 24px;
  color: #007bff;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  padding: 10px;
  margin: 0 5px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &:hover:enabled {
    background-color: #0056b3;
  }
`;

const ExportButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const Button = styled.button.attrs((props) => ({
  // Filter out props so it doesn't get passed to the DOM element
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

const ActivityLogPage = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(8); // Display 8 records per page
  const [loading, setLoading] = useState(true); // Loader state

  // Fetch all activity logs on page load
  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    setLoading(true); // Set loading to true before fetching data
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/ActivityLog/GetActivityLogData?RoleId=1`);
      setActivityLogs(response.data.data); // Assuming the API returns logs in response.data.data
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  };

  const csvHeaders = [
    { label: 'LogID', key: 'logID' },
    { label: 'UserID', key: 'userID' },
    { label: 'Action', key: 'action' },
    { label: 'Endpoint', key: 'endpoint' },
    { label: 'Method', key: 'method' },
    { label: 'Request Data', key: 'requestData' },
    { label: 'Response Data', key: 'responseData' },
    { label: 'Status Code', key: 'statusCode' },
    { label: 'Timestamp', key: 'timestamp' },
  ];

  const csvReport = {
    data: activityLogs,
    headers: csvHeaders,
    filename: 'ActivityLog_Report.csv',
  };

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = activityLogs.slice(indexOfFirstLog, indexOfLastLog);

  const totalPages = Math.ceil(activityLogs.length / logsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Function to truncate request/response data
  const truncateText = (text, maxLength = 20) => {
    return text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <ActivityLogContainer>
      <h2>Activity Log</h2>

      {/* Export Button */}
      <ExportButtonContainer>
        <CSVLink {...csvReport}>
          <Button bgColor="#17a2b8" hoverColor="#138496">
            Export to CSV
          </Button>
        </CSVLink>
      </ExportButtonContainer>

      {/* Loader or Activity Logs Table */}
      {loading ? (
        <Loader>Loading...</Loader>
      ) : (
        <>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHeader>LogID</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Endpoint</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Request Data</TableHeader>
                  <TableHeader>Response Data</TableHeader>
                  <TableHeader>Status Code</TableHeader>
                  <TableHeader>Timestamp</TableHeader>
                </tr>
              </thead>
              <tbody>
                {currentLogs.length > 0 ? (
                  currentLogs.map((log) => (
                    <TableRow key={log.logID}>
                      <TableData>{log.logID}</TableData>
                      <TableData>{log.action}</TableData>
                      <TableData>{truncateText(log.endpoint)}</TableData>
                      <TableData>{log.method}</TableData>
                      <TableData>{truncateText(log.requestData)}</TableData>
                      <TableData>{truncateText(log.responseData)}</TableData>
                      <TableData>{log.statusCode}</TableData>
                      <TableData>{log.timestamp}</TableData>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableData colSpan="9">No activity logs found</TableData>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <PaginationContainer>
            <PaginationButton onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </PaginationButton>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <PaginationButton onClick={nextPage} disabled={currentPage === totalPages}>
              Next
            </PaginationButton>
          </PaginationContainer>
        </>
      )}
    </ActivityLogContainer>
  );
};

export default ActivityLogPage;
