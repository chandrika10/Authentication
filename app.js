const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log("DBError:${e.message}");
    process.exit(1);
  }
};

initializeDBAndServer();

//register API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `SELECT *
                          FROM user
                           WHERE username = '${username}'`;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    const addUserQuery = `INSERT INTO user
                                (username,name,password,gender,location)
                                Values('${username}',
                                '${name}',
                                '${hashedPassword}',
                                '${gender}',
                                '${location}')`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// login API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `SELECT *
                          FROM user
                          WHERE username = '${username}'`;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `SELECT *
                          FROM user
                          WHERE username = '${username}'`;
  const user = await db.get(getUserQuery);
  if (user === undefined) {
    response.status(400);
    response.send("User not register");
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (isPasswordMatched === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const upDatePassword = `UPDATE user
                                    set password = '${encryptedPassword}'
                                    WHERE username = '${username}'`;
        await db.run(upDatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
