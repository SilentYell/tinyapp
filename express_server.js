const bcrypt = require("bcryptjs");
const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080;
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

const users = {};

// Setting EJS as the templating engine
app.set("view engine", "ejs");

const urlDatabase = {};

// Middleware to encrypt the session
app.use(
  cookieSession({
    name: "session",
    keys: ["ci5#$RTgL0xcjJdfFDGF78hye8w"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Home route
app.get("/", (req, res) => {
  if (req.session.user_id) {
    // If the user is logged in, redirect to /urls
    res.redirect("/urls");
  } else {
    // If the user is not logged in, redirect to /login
    res.redirect("/login");
  }
});

// Route to display the URLs
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("<h2>Please log in or register to view URLs</h2>");
  }
  const user = users[userId];
  const templateVars = { user, urls: urlsForUser(userId, urlDatabase) };
  res.render("urls_index", templateVars);
});


// Route to handle creation of new URL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("<h2>You must be logged in to shorten URLs.</h2>");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: userId};
  res.redirect(`/urls/${shortURL}`);
});


// Route to display the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Route to display a specific URL and its details
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;
  console.log("Request for short URL ID:", id);

  if (!userId) {
    return res.status(403).send("<h2>Log in to view this URL</h2>");
  }

  const user = users[userId];
  const url = urlDatabase[id];
  console.log("Retrieved URL data:", url);

  if (!url) {
    return res.status(404).send("<h2>URL not found</h2>");
  }
  if (url.userID !== userId) {
    return res.status(403).send("<h2>You do not have permission to view this URL</h2>");
  }

  const templateVars = {
    user,
    id: id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});



// Route to return URL database as JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to handle deletion of a URL
app.post("/urls/:id/delete", (req, res) => {
  const urlID = req.params.id;
  const userID = req.session.user_id;

  // Check if the user is logged in
  if (!userID) {
    return res.status(401).send("Error: User not logged in");
  }
  // Check if URL exists in the database
  if (!urlDatabase[urlID]) {
    return res.status(404).send("Error: URL ID does not exist");
  }
  // Check if the user owns the URL
  if (urlDatabase[urlID].userID !== userID) {
    return res.status(403).send("Error: User does not own the URL");
  }

  delete urlDatabase[urlID];
  res.redirect("/urls");
});

// Route to redirect short URL to its long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    return res.status(404).send("<h2>Short URL not found. Please check the URL and try again.</h2>");
  }

  res.redirect(url.longURL);
});

// Update the edit endpoint
app.post("/urls/:id", (req, res) => {
  const urlID = req.params.id;
  const userID = req.session.user_id;

  if (!urlDatabase[urlID]) {
    return res.status(404).send("Error: URL ID does not exist");
  }

  if (!userID) {
    return res.status(401).send("Error: User not logged in");
  }

  if (urlDatabase[urlID].userID !== userID) {
    return res.status(403).send("Error: User does not own the URL");
  }

  // Proceed with updating the URL
  urlDatabase[urlID].longURL = req.body.longURL;
  console.log("Updated URL database:", urlDatabase);

  res.redirect("/urls");
});

// Route to display the registration form
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("register", templateVars);
});

// Route to display the login form
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("login", templateVars);
});

// Route to handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!user) {
    // If no user with the provided email exists
    return res.status(403).send("Error: Email not found. Please register first.");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    // If the password is incorrect
    return res.status(403).send("Error: Incorrect password. Please try again.");
  }

  // If login is successful, set a cookie and redirect
  req.session.user_id = user.id;
  res.redirect("/urls");
});


// Route to handle login
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("<h2>You must be logged in to shorten URLs.</h2>");
  }
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  // Log to check values
  console.log("New short URL created:", shortURL);
  console.log("Long URL:", longURL);
  console.log("User ID:", userId);

  // Save to database
  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
  console.log("Updated urlDatabase:", urlDatabase);

  res.redirect(`/urls/${shortURL}`);
});


// Route to handle logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Route to handle user registration
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Error: Email and password cannot be empty.");
  }

  if (getUserByEmail(email)) {
    return res.status(400).send("Error: Email is already registered.");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
  };

  req.session.user_id = userId;
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});