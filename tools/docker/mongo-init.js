// MongoDB init script
db = db.getSiblingDB("say2hand");

db.createUser({
  user: "say2hand_user",
  pwd: "say2hand_password",
  roles: [
    {
      role: "readWrite",
      db: "say2hand",
    },
  ],
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ category: 1 });
db.posts.createIndex({ "location.coordinates": "2dsphere" });
