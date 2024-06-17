// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors=require("cors")
const productRoutes = require('./Routes/ProductRoutes');

//create an app

const app = express();

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/products', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', productRoutes);
// require("./Routes/ProductRoutes")(app)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
