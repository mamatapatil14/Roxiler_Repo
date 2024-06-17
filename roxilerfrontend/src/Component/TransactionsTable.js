import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Col, Row } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './TransactionTable.css';

const TransactionsTable = () => {
  const [data, setData] = useState({ transactions: [], statistics: {}, barchart: [] });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('March');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);

  const [totalSales, setTotalSales] = useState(0);
  const [totalSoldItems, setTotalSoldItems] = useState(0);
  const [totalNotSoldItems, setTotalNotSoldItems] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [month, currentPage, searchText]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/combinedata', {
        params: { month, search: searchText, page: currentPage }
      });
      console.log('Combined API response:', response.data);
      setData(response.data);
      setLoading(false);
      setTotalPages(Math.ceil(response.data.transactions.totalItems / response.data.transactions.itemsPerPage));

      const items = response.data.transactions.items;
      const totalSales = items.reduce((sum, item) => sum + (item.sold ? item.price : 0), 0);
      const totalSoldItems = items.filter(item => item.sold).length;
      const totalNotSoldItems = items.length - totalSoldItems;

      setTotalSales(totalSales);
      setTotalSoldItems(totalSoldItems);
      setTotalNotSoldItems(totalNotSoldItems);

      const chartData = response.data.barchart.map(item => ({
        range: item.range,
        count: item.count
      }));

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    setShowSearch(true);
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 100);
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => (prevPage > 1 ? prevPage - 1 : 1));
  };

  return (
    <div className='Maindiv'>
      {showSearch ? (
        <input
          className='btn1'
          type="text"
          placeholder="Type to search..."
          value={searchText}
          onChange={handleSearchChange}
          ref={inputRef}
        />
      ) : (
        <Button className='btn1' onClick={handleButtonClick}>Search transaction</Button>
      )}

      <select className='btn2' onChange={handleMonthChange} value={month}>
        <option value='January'>January</option>
        <option value='February'>February</option>
        <option value='March'>March</option>
        <option value='April'>April</option>
        <option value='May'>May</option>
        <option value='June'>June</option>
        <option value='July'>July</option>
        <option value='August'>August</option>
        <option value='September'>September</option>
        <option value='October'>October</option>
        <option value='November'>November</option>
        <option value='December'>December</option>
      </select>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table className='maintable'>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Price</th>
              <th>Category</th>
              <th>Sold</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.items.map((transaction) => (
              <tr key={transaction._id}>
                <td>{transaction._id}</td>
                <td>{transaction.title}</td>
                <td>{transaction.description}</td>
                <td>{transaction.price}</td>
                <td>{transaction.category}</td>
                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                <td><img src={transaction.image} alt={transaction.title} width="50" height="50" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div>
        <span>Page No: {data.transactions.currentPage}</span>
        <Button
          className={currentPage === 1 ? 'pre disabled' : 'pre'}
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          className={currentPage === totalPages ? 'next disabled' : 'next'}
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
        <span className='perpage'>Per Page: 10</span>
      </div>

      <div className="chart-container">
        <Row>
          <Col sm={12} md={6} lg={3}>
            <span className='statistics'>
              <h3>Statistic&nbsp;-&nbsp;{month}</h3>
              <div className='stattotal'>
                <h4 className='stat-box'>Total Sales: {totalSales} Rs</h4>
                <h4 className='stat-box'>Total Sold Items: {totalSoldItems}</h4>
                <h4 className='stat-box'>Total Not Sold Items: {totalNotSoldItems}</h4>
              </div>
            </span>
          </Col>
          <Col sm={12} md={6} lg={7} >
            
            <ResponsiveContainer width="50%" height={400} className='barchart' >
            <h3>Bar  Chart Status:&nbsp;&nbsp;{month}</h3>
              <BarChart data={chartData} >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey='range' />
                <YAxis ticks={[0, 20, 40, 60, 80]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ffffff" />
              </BarChart>
            </ResponsiveContainer>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TransactionsTable;
