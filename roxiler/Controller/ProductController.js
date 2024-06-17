// controllers/productController.js
const Product = require('../Model/Product');
const axios = require('axios');

// Utility function to get month index from month name
const getMonthIndex = (monthName) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.indexOf(monthName)+1;
};

// Initialize the database
exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const products = response.data;

    await Product.deleteMany(); // Clear existing data
    await Product.insertMany(products); // Seed new data

    res.status(200).send('Database initialized with seed data');
  } catch (error) {
    res.status(500).send('Error initializing database: ' + error.message);
  }
};

// exports.getTransactionsByMonth = async (req, res) => {
//   try {
//     const { month } = req.query;
//     const monthIndex = getMonthIndex(month);
//     console.log(monthIndex)
    

//     if (monthIndex === 0) {
//       return res.status(400).send('Invalid month');
//     }

//     // Find transactions where the month of dateOfSale matches the provided month
//     const transactions = await Product.find({
//       $expr: { $eq: [{ $month: '$dateOfSale' },monthIndex] }
//     });

//     res.status(200).json(transactions);
//   } catch (error) {
//     res.status(500).send('Error fetching transactions: ' + error.message);
//   }
// };

exports.getTransactions = async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;
    const monthIndex = month ? getMonthIndex(month) : null;

    // Construct the query object
    const query = {};
    if (monthIndex) {
      query.$expr = { $eq: [{ $month: '$dateOfSale' }, monthIndex] };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: parseFloat(search) || 0 } // Parse search as float for price comparison
      ];
    }

    // Execute query with pagination
    const transactions = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage))
      .exec();

    // Get total count of records (without pagination)
    const totalCount = await Product.countDocuments(query);

    res.status(200).json({
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / perPage),
      currentPage: parseInt(page),
      items: transactions
    });
  } catch (error) {
    res.status(500).send('Error fetching transactions: ' + error.message);
  }
};


//get statistic by month
exports.getStatisticsByMonth = async (req, res) => {
  try {
    const { month } = req.query;
    const monthIndex = getMonthIndex(month);

    if (monthIndex === 0) {
      return res.status(400).send('Invalid month');
    }

    // Calculate total sale amount
    const totalSaleAmount = await Product.aggregate([
      {
        $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthIndex] } }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$price' }
        }
      }
    ]);

    // Calculate total number of sold items
    const totalSoldItems = await Product.countDocuments({
      $expr: { $eq: [{ $month: '$dateOfSale' }, monthIndex] }
    });

    // Calculate total number of not sold items
    const totalNotSoldItems = await Product.countDocuments({
      $expr: { $and: [{ $eq: [{ $month: '$dateOfSale' }, monthIndex] }, { $eq: ['$sold', false] }] }
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount.length ? totalSaleAmount[0].totalAmount : 0,
      totalSoldItems,
      totalNotSoldItems
    });
  } catch (error) {
    res.status(500).send('Error fetching statistics: ' + error.message);
  }
};

//bar chart
exports.getBarChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const monthIndex = getMonthIndex(month);

    if (monthIndex === 0) {
      return res.status(400).send('Invalid month');
    }

    // Define price ranges
    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
    ];

    // Aggregate data for each price range
    const barChartData = await Promise.all(priceRanges.map(async (range) => {
      const count = await Product.countDocuments({
        $expr: {
          $and: [
            { $eq: [{ $month: '$dateOfSale' }, monthIndex] },
            { $gte: ['$price', range.min] },
            { $lte: ['$price', range.max] }
          ]
        }
      });
      return {
        range: `${range.min}-${range.max}`,
        count
      };
    }));

    res.status(200).json(barChartData);
  } catch (error) {
    res.status(500).send('Error fetching bar chart data: ' + error.message);
  }
};

//pie chart
exports.getPieChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const monthIndex = getMonthIndex(month);

    if (monthIndex === 0) {
      return res.status(400).send('Invalid month');
    }

    // Aggregate data for unique categories and their counts
    const pieChartData = await Product.aggregate([
      {
        $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthIndex] } }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the data for response
    const formattedData = pieChartData.map(item => ({
      category: item._id,
      count: item.count
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).send('Error fetching pie chart data: ' + error.message);
  }
};


exports.getCombinedData = async (req, res) => {
  try {
    console.log('Fetching combined data with query:', req.query);

    const { month } = req.query;
    if (!month) {
      return res.status(400).send('Missing required query parameter: month');
    }

    // Making parallel requests to multiple endpoints
    const transactionsPromise = axios.get('http://localhost:3000/api/transactions', { params: req.query });
    const statisticsPromise = axios.get('http://localhost:3000/api/statistics', { params: req.query });
    const barchartPromise = axios.get('http://localhost:3000/api/barchart', { params: req.query });

    // Wait for all promises to resolve
    const [transactionsResponse, statisticsResponse, barchartResponse] = await Promise.all([
      transactionsPromise,
      statisticsPromise,
      barchartPromise
    ]);

    // Extract data from each response
    const transactionsData = transactionsResponse.data;
    const statisticsData = statisticsResponse.data;
    const barchartData = barchartResponse.data;

    // Combine data into a single response object
    const combinedData = {
      transactions: transactionsData,
      statistics: statisticsData,
      barchart: barchartData
    };

    // Send combined data in the response
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching combined data:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    res.status(500).send('Error fetching combined data: ' + error.message);
  }
};
