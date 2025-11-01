const User = require('../../models/User');
const mongoose = require('mongoose');

const addCompletedQuestion = async (req, res) => {
  const { userId, questionId } = req.body;

  if (!userId || !questionId) {
    return res.status(400).json({ message: 'Both userId and questionId are required.' });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.questionsCompleted.includes(questionId)) {
      user.questionsCompleted.push(questionId);
      await user.save();
    }

    res.status(200).json({
      message: 'Question history updated successfully.',
      questionsCompleted: user.questionsCompleted, 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
module.exports = addCompletedQuestion;
