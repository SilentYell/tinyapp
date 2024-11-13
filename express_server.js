const bcrypt = require("bcryptjs");
const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080;
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// Setting EJS as the templating engine
app.set("view engine", "ejs");

// Users and URL database objects
const users = {};
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

// Route for root. Redirects based on login status
app.get("/", (req, res) => {
  if (req.session.user_id) {
    // If the user is logged in, redirect to /urls
    res.redirect("/urls");
  } else {
    // If the user is not logged in, redirect to /login
    res.redirect("/login");
  }
});

// Route to display all URLs for a logged-in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // Use urlsForUser to get only the URLs created by the logged-in user
  const userUrls = urlsForUser(userId, urlDatabase);

  const templateVars = {
    user,
    // Only the logged-in user's URLs will be displayed
    urls: userUrls,
    error: null
  };
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
    // Redirect if not logged in
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Route to display a specific URL and its details
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id; // ID of the logged-in user
  const urlId = req.params.id; // ID of the URL being accessed
  const url = urlDatabase[urlId]; // Retrieve URL details from the database

  // Check if the URL exists in the database
  if (!url) {
    const templateVars = { user: users[userId], urls: {}, error: "Error: URL not found." };
    return res.status(404).render("urls_index", templateVars);
  }

  // Check if user is not logged in
  if (!userId) {
    const templateVars = { user: null, urls: {}, error: "Error: Please log in to view URL details." };
    return res.status(403).render("urls_index", templateVars);
  }

  // Check if the logged-in user does not own the URL
  if (url.userID !== userId) {
    const templateVars = { user: users[userId], urls: {}, error: "Error: You do not have permission to view this URL." };
    return res.status(403).render("urls_index", templateVars);
  }

  // If all checks pass, render the URL details for the owner
  const templateVars = { user: users[userId], id: urlId, longURL: url.longURL };
  res.render("urls_show", templateVars);
});


// Route to handle deletion of a URL
app.post("/urls/:id/delete", (req, res) => {
  const urlID = req.params.id;
  const userID = req.session.user_id;

  if (!userID) {
    const templateVars = { user: null, urls: urlDatabase, error: "Please log in to delete URLs." };
    return res.render("urls_index", templateVars);
  }

  if (!urlDatabase[urlID]) {
    const templateVars = { user: users[userID], urls: urlDatabase, error: "URL ID does not exist." };
    return res.render("urls_index", templateVars);
  }

  if (urlDatabase[urlID].userID !== userID) {
    const templateVars = { user: users[userID], urls: urlDatabase, error: "You do not have permission to delete this URL." };
    return res.render("urls_index", templateVars);
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
  res.redirect("/urls");
});

// Route to display the registration form
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[userId], error: null }; // Set error to null by default
  res.render("register", templateVars);
});

// Route to display the login form
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[userId], error: null };
  res.render("login", templateVars);
});


// Route to handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user) {
    // If no user with the provided email exists
    const templateVars = { user: null, error: "Error: Email not found. Please register first." };
    return res.status(403).render("login", templateVars); // Render the login page with error
  }

  if (!bcrypt.compareSync(password, user.password)) {
    // If the password is incorrect
    const templateVars = { user: null, error: "Error: Incorrect password. Please try again." };
    return res.status(403).render("login", templateVars); // Render the login page with error
  }

  // Successful login: Set session and redirect to /urls
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

  // Save to database
  urlDatabase[shortURL] = { longURL: longURL, userID: userId };
  res.redirect(`/urls/${shortURL}`);
});


// Route to handle logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Route to handle user registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    // If email or password is missing
    const templateVars = { user: null, error: "Error: Email and password cannot be empty." };
    // Render registration page with error
    return res.status(400).render("register", templateVars);
  }

  if (getUserByEmail(email, users)) {
    // If the email is already registered
    const templateVars = { user: null, error: "Error: Email is already registered." };
    // Render registration page with error
    return res.status(400).render("register", templateVars);
  }

  // Proceed with registration
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userId] = { id: userId, email, password: hashedPassword };

  // Set session cookie and redirect to /urls
  req.session.user_id = userId;
  res.redirect("/urls");
});



// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});