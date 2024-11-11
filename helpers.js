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


module.exports = {
  getUserByEmail,
  generateRandomString
};