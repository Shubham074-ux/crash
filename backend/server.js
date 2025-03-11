const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Twilio credentials
const accountSid = 'AC9035648ae1b7ae50351d8ff859495736';
const authToken = '11567b218e833a9852ff3c79101a2a32';
const client = twilio(accountSid, authToken);

// Connect to MongoDB
mongoose.connect('mongodb+srv://tiwarishubham1607074:5n9kRDvHYuwgNWpD@soscontacts.w5bxl.mongodb.net/?retryWrites=true&w=majority&appName=sosContacts')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

const contactSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  alias: { type: String, required: true },
});

const Contact = mongoose.model('Contact', contactSchema);

app.use(bodyParser.json());

// Route to add a contact
app.post('/add-contact', async (req, res) => {
  const { phoneNumber, alias } = req.body;

  if (!phoneNumber || !alias) {
    return res.status(400).send('Phone number and alias are required.');
  }

  const newContact = new Contact({ phoneNumber, alias });

  try {
    await newContact.save();
    res.status(200).send('Contact added successfully');
  } catch (error) {
    res.status(500).send(`Error adding contact: ${error.message}`);
  }
});

// Route to fetch contacts
app.get('/get-contacts', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).send(`Error fetching contacts: ${error.message}`);
  }
});

// Route to send an SMS
app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).send('Phone number and message are required.');
  }

  try {
    const sentMessage = await client.messages.create({
      body: message,
      from: '+15077095057', // Replace with your Twilio number
      to: to,
    });
    res.status(200).send(`Message sent: ${sentMessage.sid}`);
  } catch (error) {
    res.status(500).send(`Error sending message: ${error.message}`);
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
