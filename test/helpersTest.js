const { assert } = require('chai');
const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.isUndefined(user);
  });
});

describe('urlsForUser', function() {
  it('should return only the URLs belonging to the specified user', function() {
    // Mock urlDatabase with some data
    const urlDatabase = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'i3BoGp': { longURL: 'http://www.youtube.com', userID: 'user456' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    // Expected result: Only URLs with userID 'user123' should be returned
    const userId = 'user123';
    const expectedUrls = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    // Call the helper function
    const result = urlsForUser(userId, urlDatabase);

    // Assert that the result matches the expected URLs
    assert.deepEqual(result, expectedUrls, 'The returned URLs should belong to the specified user');
  });

  // The function returns URLs that belong to the specified user
  it('should return only the URLs belonging to the specified user', function() {
    const urlDatabase = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'i3BoGp': { longURL: 'http://www.youtube.com', userID: 'user456' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    const userId = 'user123';
    const expectedUrls = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    const result = urlsForUser(userId, urlDatabase);
    assert.deepEqual(result, expectedUrls, 'The returned URLs should belong to the specified user');
  });

  // The function returns an empty object if no URLs belong to the specified user
  it('should return an empty object if the specified user does not own any URLs', function() {
    const urlDatabase = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'i3BoGp': { longURL: 'http://www.youtube.com', userID: 'user456' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    const userId = 'user999'; // User with no URLs
    const expectedUrls = {};

    const result = urlsForUser(userId, urlDatabase);
    assert.deepEqual(result, expectedUrls, 'The returned result should be an empty object for a user with no URLs');
  });

  // The function returns an empty object if the urlDatabase is empty
  it('should return an empty object if the urlDatabase is empty', function() {
    const urlDatabase = {}; // Empty database
    const userId = 'user123';
    const expectedUrls = {};

    const result = urlsForUser(userId, urlDatabase);
    assert.deepEqual(result, expectedUrls, 'The returned result should be an empty object when the database is empty');
  });

  // The function should not return URLs that do not belong to the specified user
  it('should not return any URLs that do not belong to the specified user', function() {
    const urlDatabase = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'i3BoGp': { longURL: 'http://www.youtube.com', userID: 'user456' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    const userId = 'user123';
    const expectedUrls = {
      'b6UTxQ': { longURL: 'http://www.google.com', userID: 'user123' },
      'y7Vb1F': { longURL: 'http://www.twitch.tv', userID: 'user123' }
    };

    const result = urlsForUser(userId, urlDatabase);

    // Ensure that a URL that does not belong to the user (e.g. 'i3BoGp') is not included
    assert.deepEqual(result, expectedUrls, 'The returned URLs should not include those not owned by the specified user');
  });

});