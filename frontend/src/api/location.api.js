// Vietnam administrative divisions - public API, no key needed.
// https://provinces.open-api.vn/

import axios from "axios";

// Vietnam administrative divisions — API v2
const locationClient = axios.create({
  baseURL: "https://provinces.open-api.vn/api/v2",
});

export const getProvinces = () => locationClient.get("/p");

export const getWardsByProvince = (provinceCode) =>
  locationClient.get(`/w/?province=${provinceCode}`);
