import express from "express";
import CollegeDomain from "../models/collegeDomain.js";

const router = express.Router();

router.get("/colleges", async (req, res) => {
  try {
    const colleges = await CollegeDomain.find({});
    // console.dir(colleges);

    const collegeNames = colleges.map((college) => college.collegename);

    // console.log(collegeNames);

    res.status(200).json({ colleges: collegeNames });
  } catch (error) {
    res.status(500).json({ message: "Error fetching college names", error });
  }
});

export default router;
