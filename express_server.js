const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

const users = {};

// Function to get user by email
const getUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Function to generate a random string for URLs and user IDs
let generateRandomString = () => {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomChar = Math.floor(Math.random() * characters.length);
    result += characters[randomChar];
  }
  return result;
};

// Setting EJS as the templating engine
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

const urlsForUser = (id) => {
  const userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

// Home route
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Route to display the URLs
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send("<h2>Please log in or register to view URLs</h2>");
  }
  const user = users[userId];
  const templateVars = { user, urls: urlsForUser(userId) };
  res.render("urls_index", templateVars);
});


// Route to handle creation of new URL
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.status(403).send("<h2>You must be logged in to shorten URLs.</h2>");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: userId};
  res.redirect(`/urls/${shortURL}`);
});


// Route to display the form for creating a new URL
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// Route to display a specific URL and its details
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const userID = req.cookies["user_id"];
  if (!urlDatabase[urlID]) {
    return res.status(404).send("Error: URL ID does not exist");
  } if (!userID) {
    return res.status(401).send("Error: User not logged in");
  } if (urlDatabase[urlID].userID !== userID) {
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
  const userID = req.cookies["user_id"];

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
  const userId = req.cookies["user_id"];
  if (userId) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  const templateVars = { user };
  res.render("register", templateVars);
});

// Route to display the login form
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
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

  if (user.password !== password) {
    // If the password is incorrect
    return res.status(403).send("Error: Incorrect password. Please try again.");
  }

  // If login is successful, set a cookie and redirect
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});


// Route to handle login
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
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
  res.clearCookie("user_id");
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

  users[userId] = {
    id: userId,
    email: email,
    password: password,
  };

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});