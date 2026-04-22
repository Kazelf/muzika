import axios from 'axios';
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});
const formData = new FormData();
formData.append('audio', new Blob(['test']), 'test.txt');

api.interceptors.request.use(req => {
  console.log(req.headers);
  return req;
});

api.post('http://localhost:9999/upload', formData).catch(e => console.log(e.response?.status));
