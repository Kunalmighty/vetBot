const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
const accountSid = "AC3afece6c20e877e5ab7b42f23da3b9ad";
const authToken = "e92d52ac4ca61508d763aba2f2419f60";

const client = new twilio(accountSid, authToken);
app.use(bodyParser.urlencoded({ extended: false }));
mongoose
  .connect(
    "mongodb+srv://kunal:123@cluster0.bmecr.mongodb.net/Cluster0?retryWrites=true&w=majority",
    { useMongoClient: true, useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("db connected"));

app.get("/", (req, res) => {
  res.end();
});

app.listen(3000, () => {
  console.log("server connected");
});

//New message schema for MongoDB database
let MessageSchema = new mongoose.Schema({
  phoneNumber: String,
  groupName: String,
  totalAdults: String,
  totalKids: String,
});
let Message = mongoose.model("Message", MessageSchema);

//Whenever a message comes in to the Twilo number
app.post("/inbound", (req, res) => {
  let from = req.body.From;
  let to = req.body.To;
  let body = req.body.Body;

  console.log(req.body.From);
  console.log(req.body.To);
  console.log(req.body.Body);

  //Check if previous conversation has happened with this number
  Message.find({ phoneNumber: req.body.From }, (err, message) => {
    if (message.length !== 0) {
    } else {
      if (body === "RSVP") {
        let newMessage = new Message();
        newMessage.phoneNumber = from;
        newMessage.save(() => {
          client.messages
            .create({
              to: `${from}`,
              from: `${to}`,
              body: "What is your group name?",
            })
            .then((message) => console.log(message.sid));
          res.end();
        });
      }
    }

    res.end();
  });
});
