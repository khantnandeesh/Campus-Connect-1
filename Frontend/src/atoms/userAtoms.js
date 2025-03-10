import { atom } from "recoil";

export const userState = atom({
  key: "userState",
  default: {
    _id: null,
    username: "",
    email: "",
    role: "",
    collegename: ""
    // Add any other user fields you need
  }
});
