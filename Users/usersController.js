const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  createContactSchema,
  updateContactSchema,
} = require("../path-to-schemas");
const nodemailer = require("nodemailer");

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword });

    await user.save();
    res
      .status(201)
      .json({ user: { email: user.email, subscription: user.subscription } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ userId: user._id }, "h1cfODLSMos12", {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: { email: user.email, subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const currentUser = async (req, res, next) => {
  res
    .status(200)
    .json({ email: req.user.email, subscription: req.user.subscription });
};

const gravatar = require("gravatar");

const { email } = req.body;
const avatarURL = gravatar.url(email, { s: "250", d: "retro" });

const user = new User({ email, password, avatarURL, subscription });
await user.save();

const createContact = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const verificationToken = uuidv4();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "your-email@gmail.com",
        pass: "your-password",
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Email Verification",
      text: `Please verify your email by clicking this link: http://your-app-url.com/users/verify/${verificationToken}`,
    };

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      verificationToken,
    });

    await user.save();

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res
      .status(201)
      .json({ user: { email: user.email, subscription: user.subscription } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, currentUser, gravatar, nodemailer };
