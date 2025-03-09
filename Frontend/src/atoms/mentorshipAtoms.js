import { atom } from "recoil";

export const darkModeState = atom({
  key: "darkModeState",
  default: true
});

export const usersState = atom({
  key: "usersState",
  default: []
});

export const searchTermState = atom({
  key: "searchTermState",
  default: ""
});

export const loadingState = atom({
  key: "loadingState",
  default: true
});

export const errorState = atom({
  key: "errorState",
  default: ""
});

export const successState = atom({
  key: "successState",
  default: ""
});
