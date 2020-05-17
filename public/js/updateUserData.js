import axios from 'axios';
import { showAlert } from './alert';

const BASE_URL = 'http://localhost:8000/';
const UPDATE_DATA_END_POINT = `${BASE_URL}api/v1/users/updateMe`;
const UPDATE_PASSWORD_END_POINT = `${BASE_URL}api/v1/users/updatePassword`;

//type is either data(name,email) or password
export const updateUserDataAndPassword = async (data, type) => {
  try {
    const url =
      type === 'password' ? UPDATE_PASSWORD_END_POINT : UPDATE_DATA_END_POINT;
    const response = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (response.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
