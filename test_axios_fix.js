import axios from 'axios';
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});
const formData = new FormData();
formData.append('audio', new Blob(['test']), 'test.txt');

api.interceptors.request.use(req => {
  console.log('Request headers:', req.headers);
  return req;
});

api.post('http://localhost:9999/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
}).then(r => console.log('Response status:', r.status)).catch(e => console.log('Error:', e.response?.status, e.message));
