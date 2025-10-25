const User = require('../../models/User');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage();
const bucketName = 'your-gcs-bucket-name';
const bucket = storage.bucket(bucketName);

const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const blobName = `${req.user.id}-${Date.now()}${path.extname(req.file.originalname)}`;
    const blob = bucket.file(blobName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
    });

    blobStream.on('error', (err) => {
      console.error(err);
      res.status(500).send('Error uploading image.');
    });

    blobStream.on('finish', async () => {
      // Construct the public URL (ensure your bucket has public access configured)
      const publicUrl = `https://storage.googleapis.com/${peerprep-user-service}/${blobName}`;

      // Update the user's profilePictureUrl in the database
      user.profilePictureUrl = publicUrl;
      await user.save();

      res.json({
        message: 'Profile picture updated successfully',
        profilePictureUrl: user.profilePictureUrl,
      });
    });

    blobStream.end(req.file.buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadProfilePicture;