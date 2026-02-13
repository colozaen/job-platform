import axios from "axios";
const API = axios.create({
    baseURL: "http://localhost:50000"
});
export default API;