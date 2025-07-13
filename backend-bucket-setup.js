// Add this to your backend signup endpoint
const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Signup endpoint handler
app.post(
  'https://api.mantahq.com/api/workflow/olaleye/mantadrive/userauthflow/signup',
  async (req, res) => {
    const { firstName, lastName, username, password } = req.body;

    try {
      // 1. Create user in database first
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser({
        firstName,
        lastName,
        username,
        password: hashedPassword,
      });

      // 2. Create user folder in S3 bucket
      await createUserFolder(username);

      res.status(201).json({
        message: 'User created successfully',
        userId: user.id,
        bucketPath: `${username}/`,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Function to create user folder in S3
async function createUserFolder(username) {
  const params = {
    Bucket: 'mantadrive-users',
    Key: `${username}/welcome.txt`,
    Body: `Welcome to MantaDrive, ${username}!\nYour personal storage is ready.`,
    ContentType: 'text/plain',
  };

  return s3.upload(params).promise();
}
