import axios from 'axios';
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});
const formData = new FormData();
formData.append('audio', new Blob(['test']), 'test.txt');

api.post('http://localhost:9999/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' } // No boundary
}).catch(e => console.log(e.message, e.response?.status, e.response?.data));
