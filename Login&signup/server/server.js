const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
//const bcrypt = require("bcrypt");
// const jwt = require("jwt");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8082;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "register",
});

db.connect((err) => {
  if (err) {
    // If there's an error connecting to the database, throw it
    throw err;
  }
  console.log("Connected to database");
});

db.on("error", (err) => {
  // Log database errors
  console.error("Database error: " + err);
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
 // const handlePassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO login (name, email, password) VALUES (?,?,?)";
  const values = [name, email, password];
  // const result = await db.query(sql, values);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database error: " + err);
      return res.status(500).json({ error: "Internal server error" });
    } else {
      return res.status(201).json({
        message: "User registered successfully",
        isRegistered: true,
      });
    }
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Query the database to find a matching email and password
  const sql = "SELECT * FROM login WHERE `email` = ? AND `password` = ?";
  const values = [email, password];
  db.query(sql, values, (err, result) => {
    if (result.length > 0) {
      // If a row is returned, login is successful
      return res
        .status(200)
        .json({ success: true, message: "Login successful",
        isAuthenticated: true });
    }
    // Handle database errors
    else if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
    // If no rows returned, email and password combination is incorrect
    else {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect email or password" });
    }
  });
});

app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
