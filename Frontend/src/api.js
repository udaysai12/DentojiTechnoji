import axios from "axios";
const API =axios.create({
    baseURL :import.meta.env.BACKEND_URL,
});
export default API;