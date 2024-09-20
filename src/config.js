// src/config.js
import axios from 'axios';
const config = {
    API_BASE_URL: 'https://localhost:7122',
  };
  
  axios.defaults.baseURL = config.API_BASE_URL;
  export default config;
  