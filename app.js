const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
const accountSid = "AC3afece6c20e877e5ab7b42f23da3b9ad";
const authToken = "34766a6eaa7ed86a1ab3cec4623d4f2f";

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

let messageSchema = new mongoose.Schema({
  phoneNumber: String,
  groupName: String,
  totalAdults: String,
  totalKids: String,
});
let Message = mongoose.model("Message", messageSchema);

app.post("/inbound", (req, res) => {
  let from = req.body.From;
  let to = req.body.To;
  let body = req.body.Body;

  console.log(req.body.Body);

  let newMessage = new Message();
  newMessage.save(() => {
    client.messages.create({
      to: "${from}",
      from: "${to}",
      body: "What is your group name?",
    });
    res.end();
  });
});

/*

  Message.find({ phoneNumber: req.body.From }, (err, message) => {
    if (message.length !== 0) {
      //continue conversation
    } else {
      if (body === "RSVP") {


        let newMessage = new Message();
        newMessage.phoneNumber = from;
        newMessage.save(() => {
          client.messages.create({
            to: "${from}",
            from: "${to}",
            body: "What is your group name?",
          });
          res.end();

        });
      }
    }
    res.end();
  });
});
*/
