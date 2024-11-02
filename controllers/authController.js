const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const url = `http://${req.headers.host}/auth/verify/${token}`;
    await sendEmail(user.email, 'Verify Email', `Click this link to verify: ${url}`);

    res.status(201).json({ msg: 'User registered, verify your email' });
  } catch (error) {
    console.error('Error during registration:', error); // Log the error message
    res.status(500).json({ msg: 'Server error', error: error.message }); // Include error message in response
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Email not verified' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, { httpOnly: true });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error); // Log the error
    res.status(500).json({ msg: 'Server error' });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid verification token' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ msg: 'User already verified' });
    }
    
    user.isVerified = true;
    await user.save();
    
    res.status(200).json({ msg: 'Email verified successfully' });
  } catch (error) {
    console.error('Error during email verification:', error);
    res.status(500).json({ msg: 'Email verification failed' });
  }
};