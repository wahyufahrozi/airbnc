const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./model/User");
const Place = require("./model/Place");
const Booking = require("./model/Booking");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");
const morgan = require("morgan");
require("dotenv").config();
app.use(express.json());
app.use(morgan("tiny"));

app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
//memanggil file upload
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);

mongoose.set("strictQuery", true);
// console.log("coba :", process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL);

app.get("/", (req, res) => {
  res.json("text ok");
});

/*function untuk ambil userdata dari token */
const getUserDataFromReq = (req) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      req.cookies.token,
      process.env.JWT_SECRET_KEY,
      {},
      async (err, userData) => {
        if (err) throw err;
        resolve(userData);
      }
    );
  });
};

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const bcryptSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, bcryptSalt);
    const user = await User.create({
      name,
      email,
      password: passwordHash,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const isMatch = bcrypt.compareSync(password, user.password);
      if (isMatch) {
        jwt.sign(
          { email: user.email, id: user._id },
          process.env.JWT_SECRET_KEY,
          {},
          (err, token) => {
            if (err) throw err;
            res.cookie("token", token).json(user);
          }
        );
      } else {
        res.status(422).json("pass not ok");
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_KEY, {}, async (err, user) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(user.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
  // res.cookie("token", "").json(true);// menghapus token pada cookies
});

app.post("/upload-by-link", async (req, res) => {
  try {
    const { link } = req.body;
    const newName = "photo" + Date.now() + ".jpg";
    await imageDownloader.image({
      url: link,
      dest: __dirname + "/uploads/" + newName,
    });
    res.json(newName);
  } catch (error) {
    res.status(404).json({ message: error });
  }
});

const photosMiddleware = multer({ dest: "uploads/" });

app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  try {
    const uploadedFile = [];
    for (let i = 0; i < req.files.length; i++) {
      const { path, originalname } = req.files[i];
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      // console.log(ext);
      const newPath = path + "." + ext;
      fs.renameSync(path, newPath);
      uploadedFile.push(newPath.replace("uploads\\", ""));
    }
    res.json(uploadedFile);
  } catch (error) {
    res.status(404).json({ message: error });
  }
});

app.post("/places", (req, res) => {
  try {
    const { token } = req.cookies;
    const {
      title,
      address,
      addedPhotos,
      description,
      price,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    } = req.body;
    jwt.verify(token, process.env.JWT_SECRET_KEY, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.create({
        owner: userData.id,
        price,
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
      });
      res.json(placeDoc);
    });
  } catch (error) {
    res.status(402).json({ message: error.message });
  }
});

/* GET PLACE YANG USER BIKIN */
app.get("/places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.JWT_SECRET_KEY, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

/*EDIT DATA */
app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, process.env.JWT_SECRET_KEY, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

/*GET DATA UNTUK HALAMAN DEPAN */
app.get("/place", async (req, res) => {
  const data = await Place.find();
  res.json(data);
});

/*PROSES BOOKING */
app.post("/bookings", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

/*GET BOOKINGS */
app.get("/bookings", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const data = await Booking.find({ user: userData.id }).populate("place");
  res.json(data);
});
const PORT = 4000;
app.listen(PORT, console.log(`Server Port: ${PORT}`));

//
