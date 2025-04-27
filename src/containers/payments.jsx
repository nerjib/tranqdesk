import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment'; // For date formatting and calculations
import { baseUrl } from '../helpers/https';
import { currencyFormatter } from '../helpers/utils';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isPaidFilter, setIsPaidFilter] = useState('all');
    const [analytics, setAnalytics] = useState({ totalRevenue: 0, paidCount: 0, unpaidCount: 0, period: "All Time" });
    const [currentPage, setCurrentPage] = useState(1);
    const [paymentsPerPage] = useState(10);
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        function handleOnline() {
            setOnline(true);
            synchronizeData();
        }

        function handleOffline() {
            setOnline(false);
            fetchOfflinePayments();
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (online) {
            synchronizeData();
        } else {
            fetchOfflinePayments();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [online]);

    const synchronizeData = async () => {
        try {
            const response = await fetch(`${baseUrl}/payments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const onlinePayments = await response.json();
            setPayments(onlinePayments);
            const result = await window.electronAPI.savePaymentsOffline(onlinePayments);
            if (!result.success) console.error(result.error);
        } catch (error) {
            console.error('Error fetching/saving payments:', error);
            fetchOfflinePayments();
        } finally {
            setLoading(false);
        }
    };

    const fetchOfflinePayments = async () => {
        try {
            const offlinePayments = await window.electronAPI.getPaymentsOffline();
            setPayments(offlinePayments);
        } catch (error) {
            console.error('Error fetching offline payments:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateAnalytics();
    }, [payments, startDate, endDate, isPaidFilter]);

    const calculateAnalytics = () => {
        let filteredPayments = [...payments];

        if (startDate && endDate) {
            filteredPayments = filteredPayments.filter(payment =>
                moment(payment.created_at).isBetween(startDate, endDate, null, '[]')
            );
        }

        if (isPaidFilter !== 'all') {
            const isPaid = isPaidFilter === 'success';
            filteredPayments = filteredPayments.filter(payment => payment.status === isPaidFilter);
        }

        const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const paidCount = filteredPayments.filter(payment => payment.status === 'success').length;
        const unpaidCount = filteredPayments.filter(payment => !payment.status === 'success').length;

        let periodLabel = "All Time";
        if (startDate && endDate) {
            periodLabel = `${moment(startDate).format('YYYY-MM-DD')} - ${moment(endDate).format('YYYY-MM-DD')}`;
        } else if (startDate) {
            periodLabel = `From ${moment(startDate).format('YYYY-MM-DD')} Onwards`;
        } else if (endDate) {
            periodLabel = `Up to ${moment(endDate).format('YYYY-MM-DD')}`;
        }

        setAnalytics({ ...analytics, totalRevenue, paidCount, unpaidCount, period: periodLabel });
    };

    const handleFilter = () => {
        calculateAnalytics();
    };

    const handleClearFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setIsPaidFilter('all');
    };

    const formatDate = (dateString) => {
        return moment(dateString).format('YYYY-MM-DD');
    };

    const filteredPayments = payments.filter(payment => {
        let dateFilter = true;
        if (startDate && endDate) {
            const paymentDate = moment(payment.created_at);
            dateFilter = paymentDate.isBetween(startDate, endDate, null, '[]');
        }

        let paidFilter = true;
        if (isPaidFilter !== 'all') {
            const isPaid = isPaidFilter === 'paid';
            paidFilter = payment.status === isPaidFilter;
        }

        return dateFilter && paidFilter;
    });

    const indexOfLastPayment = currentPage * paymentsPerPage;
    const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredPayments.length / paymentsPerPage); i++) {
        pageNumbers.push(i);
    }


    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Payments</h2>

            {/* Filters */}
            <div className="mb-6 flex space-x-4 items-center">
                <div>
                    <label htmlFor="startDate" className="block text-gray-700 font-bold mb-2">Start Date:</label>
                    <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} dateFormat="yyyy-MM-dd" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-gray-700 font-bold mb-2">End Date:</label>
                    <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} dateFormat="yyyy-MM-dd" minDate={startDate} />
                </div>
                <div>
                    <label htmlFor="isPaidFilter" className="block text-gray-700 font-bold mb-2">Payment Status:</label>
                    <select value={isPaidFilter} onChange={(e) => setIsPaidFilter(e.target.value)} className="border rounded p-2">
                        <option value="all">All</option>
                        <option value="success">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
                <button onClick={handleFilter} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Filter</button>
                <button onClick={handleClearFilter} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Clear Filter</button>
            </div>

            {/* Analytics */}
            <div className="mb-6 bg-gray-100 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p>Period: {analytics.period}</p> {/* Display the period */}
                <p>Total Revenue: {currencyFormatter(analytics.totalRevenue)}</p>
                <p>Paid Payments: {analytics.paidCount}</p>
                <p>Unpaid Payments: {analytics.unpaidCount}</p>
            </div>

            {/* Payments Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        {/* <th className="border p-2">ID</th> */}
                        <th className="border p-2">Payment Reference</th>
                        <th className="border p-2">Customer Name</th>
                        <th className="border p-2">Customer Email</th>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Amount</th>
                        <th className="border p-2">Status</th>
                        
                    </tr>
                </thead>
                    <tbody>
                        {/* ... table data using filteredPayments */}
                         {currentPayments.filter(payment => {
                            let dateFilter = true;
                            if (startDate && endDate) {
                                const paymentDate = moment(payment.created_at);
                                dateFilter = paymentDate.isBetween(startDate, endDate, null, '[]');
                            }

                            let paidFilter = true;
                            if (isPaidFilter !== 'all') {
                                const isPaid = isPaidFilter === 'success';
                                paidFilter = payment.status === isPaidFilter;
                            }

                            return dateFilter && paidFilter
                        }).map(payment => (
                            <tr key={payment.id}>
                                <td className="border p-2">{payment.payment_id}</td>
                                <td className="border p-2">{payment.book_data?.name}</td>
                                <td className="border p-2">{payment.book_data?.email}</td>
                                <td className="border p-2">{formatDate(payment.created_at)}</td>
                                <td className="border p-2">{currencyFormatter(payment.amount)}</td>
                                <td className="border p-2">{payment.status === 'success' ? 'Paid' : 'Unpaid'}</td>
                                {/* Add other payment data */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <nav className="mt-4 flex justify-center">
                <ul className="flex space-x-2">
                    {pageNumbers.map(number => (
                        <li key={number}>
                            <button
                                onClick={() => paginate(number)}
                                className={`px-3 py-1 rounded ${currentPage === number ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {number}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Payments;