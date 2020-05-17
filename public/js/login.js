/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `http://localhost:8000/api/v1/users/login`,
      data: {
        email,
        password,
      },
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const response = await axios({
      method: 'GET',
      url: `http://localhost:8000/api/v1/users/logout`,
    });
    if (response.data.status === 'success') {
      showAlert('success', 'Logged out successfully');
      location.assign('/');
      // this will reload the page and override cookie will be sent from user
      //which will not match with DB cookie and user will logout
    }
  } catch (error) {
    showAlert('error', 'Error logging out! Please Try again');
  }
};
