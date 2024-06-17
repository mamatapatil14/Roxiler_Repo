// models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Number,
  dateOfSale: Date
});

module.exports = mongoose.model('Product', productSchema);

