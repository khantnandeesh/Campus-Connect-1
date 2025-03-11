import { atom } from "recoil";

export const onlineStatusState = atom({
  key: "onlineStatusState",
  default: {
    users: [],
    mentors: []
  }
});
