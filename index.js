const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const shortid = require("shortid");
const bodyParser = require("body-parser");
const { AsyncLocalStorage } = require("async_hooks");

const app = express();
const port = 3000;

//connecting mongoose

mongoose
  .connect("mongodb://127.0.0.1:27017/short-url")
  .then(() => console.log("MongoDB connected"))
  .catch(() => console.log("MongoDB connection failed"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));

//model
const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    redirectURL: {
      type: String,
      required: true,
    },
    visitHistory: [{ timestamp: { timestamp: Number } }],
  },
  { timestamps: true }
);

const URL = mongoose.model("url", urlSchema);

app.get("/", async (req, res) => {
  const allUrls = await URL.find({});
  return res.render("home", {
    urls: allUrls,
  });
});

app.delete("/dell", async (req, res) => {
  console.log(req);
  const deleteEntry = await URL.findByIdAndDelete({});
  console.log(deleteEntry);
  res.redirect("http://localhost:3000/");
});
app.post("/url", async (req, res) => {
  const body = req.body;
  if (!body.url) return res.status(400).json({ Error: "URL is required" });
  const shortID = shortid.generate();
  const result = await URL.create({
    shortId: shortID,
    redirectURL: body.url,
    visitHistory: [],
  });
  console.log(result);
  return res.render("home", {
    id: shortID,
  });
});

app.get("/url/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );

  res.redirect(entry.redirectURL);
});

app.get("/status/:shortId", async (req, res) => {
  console.log("status route was hit");
  const shortId = req.params.shortId;
  const result = await URL.findOne({ shortId });
  return res.json({
    totalclicks: result.visitHistory.length,
    analytics: result.visitHistory,
  });
});

app.listen(port, () => console.log(`Server listening to the Port : ${port}`));
