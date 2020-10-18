const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
const accountSid = "AC3afece6c20e877e5ab7b42f23da3b9ad";
const authToken = "8aeed477332a4564801224423822ba2b";

const client = new twilio(accountSid, authToken);
app.use(bodyParser.urlencoded({ extended: false }));
mongoose
  .connect(
    "mongodb+srv://kunal:123@cluster0.bmecr.mongodb.net/Cluster0?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("db connected"));

app.get("/", (req, res) => {
  res.end();
});

app.listen(3000, () => {
  console.log("server connected");
});

//New message schema for MongoDB database
let CustomerSchema = new mongoose.Schema({
  phoneNumber: String,
  nextAppointment: Number,
  lastVaccination: Number,
  inConversation1: Boolean,
  inConversation2: Boolean,
});
let Customer = mongoose.model("Customer", CustomerSchema);

//Whenever a message comes in to the Twilo number
app.post("/inbound", (req, res) => {
  let from = req.body.From;
  let to = req.body.To;
  let body = req.body.Body;

  console.log(req.body.From);
  console.log(req.body.To);
  console.log(req.body.Body);

  //Check if customer with this number exists
  Customer.find({ phoneNumber: req.body.From }, (err, customers) => {

    //If the number does not exist and the body is Hello, RSVP, Woof or Meow
    if (
      customers.length === 0 &&
      (body === "Hello" ||
        body === "RSVP" ||
        body === "Woof" ||
        body === "Meow")
    ) {
      let newCustomer = new Customer();
      newCustomer.phoneNumber = from;
      newCustomer.nextAppointment = null;
      newCustomer.lastVaccination = null;
      newCustomer.inConversation1 = true;
      newCustomer.inConversation2 = false;
      newCustomer.save(() => {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Welcome to VCA Animal Hospitals!\nText 1 to schedule a new appointment",
          })
          .then((message) => console.log(message.sid));
        res.end();
      });
    }
    //If the number does not exist and the body is not Hello, RSVP, Woof or Meow
    else if (
      customers.length === 0 &&
      !(
        body === "Hello" ||
        body === "RSVP" ||
        body === "Woof" ||
        body === "Meow"
      )
    ) {
      client.messages
        .create({
          to: `${from}`,
          from: `${to}`,
          body:
            "Invalid text. If you are a customer of VCA Animal Hospitals, please text the word Hello, RSVP, Woof or Meow",
        })
        .then((message) => console.log(message.sid));
      res.end();
    }

    //If the number exists and the body is Hello, RSVP, Woof or Meow (set inConversation1 to true) -> false on success
    else if (
      customers.length !== 0 &&
      (body === "Hello" ||
        body === "RSVP" ||
        body === "Woof" ||
        body === "Meow")
    ) {

      Customer.findByIdAndUpdate(
        customers[0]._id,
        { "$set": { "inConversation1": true, "inConversation2": false } },
        { "new": true, "upsert": true },
        function(err, result) {
          if (err) {
            console.log("Database update NOT successful!\n")
            console.log(err);
          } else {
            console.log("Database update successful!\n")
            console.log(result);
          }
        }
      );
      client.messages
        .create({
          to: `${from}`,
          from: `${to}`,
          body:
            "Welcome back to VCA Animal Hospitals. Please select one of these options:\nText 1 to create a new appointment or update existing appointment.\nText 2 to delete appointment.",
        })
        .then((message) => console.log(message.sid));
      res.end();
    }

    //If the number exists and the body is not Hello, RSVP, Woof or Meow
    else if (
      customers.length !== 0 &&
      customers[0].inConversation1 === false &&
      customers[0].inConversation2 === false &&
      !(
        body === "Hello" ||
        body === "RSVP" ||
        body === "Woof" ||
        body === "Meow"
      )
    ) {

      client.messages
        .create({
          to: `${from}`,
          from: `${to}`,
          body:
            "Invalid message. Please text the word Hello, RSVP, Woof or Meow!",
        })
        .then((message) => console.log(message.sid));
      res.end();
    }

    //If the number exists and we are inConversation1 and the body is 1 or 2 (set inConversation2 to true) -> (set inConversation1 to false)
    else if (
      customers.length !== 0 &&
      customers[0].inConversation1 === true &&
      (body === "1" || body === "2")
    ) {
      if (body === "1") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Here are your available time slots:\n1. Monday October 26th, 6 PM\n2. Tuesday October 27th, 5 PM\n3. Wednesday October 28th, 2:30 PM\nPlease text 1, 2 or 3 for which time slot you would like to reserve, or text 4 to go back to the previous menu.",
          })
          .then((message) => console.log(message.sid));
          console.log(customers[0]._id);
        Customer.findByIdAndUpdate(
          customers[0]._id,
          { "$set": { "inConversation1": false, "inConversation2": true } },
          { "new": true, "upsert": true },
          function(err, result) {
            if (err) {
              console.log("Database update NOT successful!\n")
              console.log(err);
            } else {
              console.log("Database update successful!\n")
              console.log(result);
            }
          }
        );
        res.end();
      } else if (body === "2") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Your appointment has been deleted. Thank you for reaching out!",
          })
          .then((message) => console.log(message.sid));
          Customer.findByIdAndUpdate(
            customers[0]._id,
            { "$set": { "nextAppointment": null, "inConversation1": false, "inConversation2": false } },
            { "new": true, "upsert": true },
            function(err, result) {
              if (err) {
                console.log("Database update NOT successful!\n")
                console.log(err);
              } else {
                console.log("Database update successful!\n")
                console.log(result);
              }
            }
          );
        res.end();
      }
    }

    //If the number exists and we are inConversation1 and the body is not 1 or 2
    else if (
      customers.length !== 0 &&
      customers[0].inConversation1 === true &&
      !(
        body === "1" ||
        body === "2"
      )
    ) {
      client.messages
        .create({
          to: `${from}`,
          from: `${to}`,
          body:
            "Invalid message. Please text the number 1 or 2 to select your option!",
        })
        .then((message) => console.log(message.sid));
      res.end();
    }

    //If the number exists and we are inConversation2 and the body is 1, 2 or 3 (set inConversation2 to false)
    else if (
      customers.length !== 0 &&
      customers[0].inConversation2 === true &&
      (body === "1" || body === "2" || body === "3")
    ) {
      if (body === "1") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Your appointment is scheduled for Monday October 26th at 6 PM. We'll see you then!",
          })
          .then((message) => console.log(message.sid));
        Customer.findByIdAndUpdate(
          customers[0]._id,
          { "$set": { "nextAppointment": new Date('2020-10-26T18:00:00.001Z').getTime(), "inConversation1": false, "inConversation2": false } },
          { "new": true, "upsert": true },
          function(err, result) {
            if (err) {
              console.log("Database update NOT successful!\n")
              console.log(err);
            } else {
              console.log("Database update successful!\n")
              console.log(result);
            }
          }
        );
        res.end();
      } else if (body === "2") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Your appointment is scheduled for Tuesday October 27th at 5 PM. We'll see you then!",
          })
          .then((message) => console.log(message.sid));
          Customer.findByIdAndUpdate(
            customers[0]._id,
            { "$set": { "nextAppointment": new Date('2020-10-27T17:00:00.001Z').getTime(), "inConversation1": false, "inConversation2": false } },
            { "new": true, "upsert": true },
            function(err, result) {
              if (err) {
                console.log("Database update NOT successful!\n")
                console.log(err);
              } else {
                console.log("Database update successful!\n")
                console.log(result);
              }
            }
          );
        res.end();
      } else if (body === "3") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Your appointment is scheduled for Wednesday October 28th at 2:30 PM. We'll see you then!",
          })
          .then((message) => console.log(message.sid));
          Customer.findByIdAndUpdate(
            customers[0]._id,
            { "$set": { "nextAppointment": new Date('2020-10-28T14:30:00.001Z').getTime(), "inConversation1": false, "inConversation2": false } },
            { "new": true, "upsert": true },
            function(err, result) {
              if (err) {
                console.log("Database update NOT successful!\n")
                console.log(err);
              } else {
                console.log("Database update successful!\n")
                console.log(result);
              }
            }
          );
        res.end();
      }
      else if (body === "4") {
        client.messages
          .create({
            to: `${from}`,
            from: `${to}`,
            body:
              "Welcome back to VCA Animal Hospitals. Please select one of these options:\nText 1 to create a new appointment or update existing appointment.\nText 2 to delete appointment.",
          })
          .then((message) => console.log(message.sid));
          Customer.findByIdAndUpdate(
            customers[0]._id,
            { "$set": { "inConversation1": true, "inConversation2": false } },
            { "new": true, "upsert": true },
            function(err, result) {
              if (err) {
                console.log("Database update NOT successful!\n")
                console.log(err);
              } else {
                console.log("Database update successful!\n")
                console.log(result);
              }
            }
          );
        res.end();
      }
    }

    //If the number exists and we are inConversation2 and the body is not 1, 2 or 3
    else if (  customers.length !== 0 && customers[0].inConversation2 === true && !(body === "1" || body === "2" || body === "3" || body === "4")) {
      client.messages
        .create({
          to: `${from}`,
          from: `${to}`,
          body:
            "Invalid message. Please text the number 1, 2, 3 or 4 to select your option!",
        })
        .then((message) => console.log(message.sid));
      res.end();
    }

    res.end();
  });
});
