const User = require('../../models/User');

const addCompletedQuestion = async (req, res) => {
  const { questionId } = req.body;

  if (!questionId) {
    return res.status(400).json({ message: 'Question ID is required.' });
  }

  try {
    const user = await User.findById(req.user.id);

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
