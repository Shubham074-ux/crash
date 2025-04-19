const express = require('express');
const twilio = require('twilio');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Connect to MongoDB
mongoose.connect('mongodb+srv://tiwarishubham1607074:5n9kRDvHYuwgNWpD@soscontacts.w5bxl.mongodb.net/?retryWrites=true&w=majority&appName=sosContacts')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

const contactSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  alias: { type: String, required: true },
  isEnabled: { type: Boolean, default: true } // Added toggle field
});

const Contact = mongoose.model('Contact', contactSchema);

const userInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alternatePhone: { type: String, required: true },
  address: { type: String, required: true },
  bloodGroup: { type: String, required: true },
});

const UserInfo = mongoose.model('UserInfo', userInfoSchema);

app.use(bodyParser.json());

// Route to add a contact (Default toggle ON)
app.post('/add-contact', async (req, res) => {
  const { phoneNumber, alias } = req.body;

  if (!phoneNumber || !alias) {
    return res.status(400).send('Phone number and alias are required.');
  }

  const newContact = new Contact({ phoneNumber, alias, isEnabled: true });

  try {
    await newContact.save();
    res.status(200).send('Contact added successfully');
  } catch (error) {
    res.status(500).send(`Error adding contact: ${error.message}`);
  }
});
//to get user-info
app.post('/add-user-info', async (req, res) => {
  const { name, alternatePhone, address, bloodGroup } = req.body;

  if (!name || !alternatePhone || !address || !bloodGroup) {
    return res.status(400).send('All fields are required.');
  }

  const newUserInfo = new UserInfo({ name, alternatePhone, address, bloodGroup });

  try {
    await newUserInfo.save();
    res.status(200).send('User info added successfully');
  } catch (error) {
    res.status(500).send(`Error adding user info: ${error.message}`);
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

// Route to toggle contact status
app.put('/toggle-contact/:id', async (req, res) => {
  const { id } = req.params; // Get the ID from the URL

  try {
    const contact = await Contact.findById(id); // Find the contact by _id

    if (!contact) {
      return res.status(404).send('Contact not found.');
    }

    contact.isEnabled = !contact.isEnabled; // Toggle the isEnabled value
    await contact.save();

    res.status(200).json({ 
      message: 'Contact status updated', 
      isEnabled: contact.isEnabled 
    });
  } catch (error) {
    res.status(500).send(`Error toggling contact: ${error.message}`);
  }
});

// Route to send SMS (Only to enabled contacts)
app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).send('Phone number and message are required.');
  }

  try {
    const contact = await Contact.findOne({ phoneNumber: to });

    if (!contact || !contact.isEnabled) {
      return res.status(400).json({ error: 'SMS not sent. Contact is disabled.' });
    }

    const sentMessage = await client.messages.create({
      body: message,
      from: '+15077095057', // Replace with your Twilio number
      to: to,
    });

    res.status(200).json({ message: 'Message sent', sid: sentMessage.sid });
  } catch (error) {
    res.status(500).send(`Error sending message: ${error.message}`);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
