
// Function to get user by email
const getUserByEmail = (email, users) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
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

const urlsForUser = (userId, urlDatabase) => {
  let userUrls = {};
  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === userId) {
      userUrls[urlId] = urlDatabase[urlId];
    }
  }
  return userUrls;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};