const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const avatarsRouter = require("./routes/api/avatars");

const contactsRouter = require("./routes/api/contacts");

const app = express();

app.use("/avatars", express.static(path.join(__dirname, "public/avatars")));

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Database connection successful");
});

app.use("/api/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/avatars", avatarsRouter);

app.post("/users/verify", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.verify) {
    return res
      .status(400)
      .json({ message: "Verification has already been passed" });
  }

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

  user.verificationToken = verificationToken;
  await user.save();

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Email sending error:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });

  return res.status(200).json({ message: "Verification email sent" });
});

module.exports = app;
