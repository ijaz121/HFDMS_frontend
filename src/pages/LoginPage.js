// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import config from '../config'; // Import the config file

const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
`;

const LoginForm = styled.form`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); // Access the setUser from AuthContext

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      ///const response = await axios.post('${config.API_BASE_URL}/api/Auth/Login', { email, password });
      const response = await axios.post(`${config.API_BASE_URL}/api/Auth/Login`, { email, password });

      if (response.status === 200 && response.data.statusCode === "00") {
        localStorage.setItem('permissions', JSON.stringify(response.data.data.permission));
        localStorage.setItem('UserInfo', JSON.stringify(response.data.data));
        // Store user info in the context
        setUser(response.data.data);
        // Navigate to the dashboard page upon successful login
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid email or password');
    }
  };

  return (
    <LoginPageContainer>
      <LoginForm onSubmit={handleLogin}>
        <h2>Login</h2>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Login</Button>
      </LoginForm>
    </LoginPageContainer>
  );
}

export default LoginPage;