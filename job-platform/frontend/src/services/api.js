import axios from "axios";
const API = axios.create({
    baseURL: "https://job-platform-server.onrender.com/api",
});
export default API;