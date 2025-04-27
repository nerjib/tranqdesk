import React, { useState, useEffect } from 'react';
import { baseUrl } from '../helpers/https';
import AntDropdown from '../components/DropDown/antDropDown';
import { Modal } from 'antd';
import axios from 'axios';
import Swal from 'sweetalert2';
import { hideLoader, showLoader } from '../utils/loader';

const ReservationRecords = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [online, setOnline] = useState(navigator.onLine);
    const [showOn, setShowOn] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [reservationsPerPage] = useState(10); // Number of reservations per page
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('id'); // 'id' or 'email'
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [selectedRow, setSelectedRow] = useState([]);
    const [amount, setAmount] = useState(0);
    const [showManualModal, setShowManualModal] = useState(false);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        function handleOnline() {
            setOnline(true);
            synchronizeData();
        }

        function handleOffline() {
            setOnline(false);
            fetchOfflineReservations();
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (online) {
            synchronizeData();
        } else {
            fetchOfflineReservations();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [online, reload]);

    const synchronizeData = async () => {
        try {
            const response = await fetch(`${baseUrl}/bookings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const onlineReservations = await response.json();
            console.log('onlineReservations', onlineReservations);
            setReservations(onlineReservations);
            setShowOn(true);
            const result = await window.electronAPI.saveReservationsOffline(onlineReservations);
            if (!result.success) console.error(result.error);
        } catch (error) {
            console.error('Error fetching/saving reservations:', error);
            fetchOfflineReservations();
        } finally {
            setLoading(false);
        }
    };

    const fetchOfflineReservations = async () => {
        try {
            const offlineReservations = await window.electronAPI.getReservationsOffline();
            console.log('offlineReservations', offlineReservations);
            setShowOn(false);
            setReservations(offlineReservations);
        } catch (error) {
            console.error('Error fetching offline reservations:', error);
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDiscount = async () => {
        const data ={
            discount,
            book_data: selectedRow
        }
        try {
            // showLoader();
        const res = await axios.put(`${baseUrl}/booking/discount/${selectedRow?.booking_id}`, data);

        if(res?.data?.status) {
            setReload(!reload);
            Swal.fire('done', 'Discount applied successfully');
            setDiscount(0);
            setShowDiscountModal(false);
        }
    }catch(e){
        console.log(e)
    } finally{
        hideLoader();
    }
    }

    const handleManualPayment = async () => {
        const data ={
            booking_id: selectedRow?.booking_id,
            amount,
            book_data: selectedRow
        }
        try{
            // showLoader();
        const res = await axios.post(`${baseUrl}/manual/payment`, data);

        if(res?.data?.status) {
            setReload(!reload);
            Swal.fire('done', 'Record updated successfully');
            setAmount(0);
            setShowManualModal(false);
        }
        }catch(e){
            console.log(e)
        } finally{
            // hideLoader()
        }
    }
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    const filteredReservations = reservations.filter(reservation => {
        if (searchType === 'id') {
            return String(reservation.booking_id).includes(searchTerm); // Convert ID to string for comparison
        } else if (searchType === 'email') {
            return reservation?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
        }
        return true; // Return all reservations if no search term
    });
    const indexOfLastReservation = currentPage * reservationsPerPage;
    const indexOfFirstReservation = indexOfLastReservation - reservationsPerPage;
    // const currentReservations = reservations.slice(indexOfFirstReservation, indexOfLastReservation);
    const currentReservations = filteredReservations.slice(indexOfFirstReservation, indexOfLastReservation)
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(reservations.length / reservationsPerPage); i++) {
        pageNumbers.push(i);
    }

    const dropDownOptions = ["Add discount", "Manual payment"];
  const handleDropdownAction = (item, row) => {
    setSelectedRow(row)
    if (item === "Add discount") setShowDiscountModal(true);
    if (item === "Manual payment") setShowManualModal(true);
  };
    return (
        <div className="container mx-auto p-4">
            <Modal
            open={showDiscountModal}
            closable={false}
            footer={null}
            centered
            onCancel={() => {
                setShowDiscountModal(false);
            }}
            bodyStyle={{
                padding: "23px 73px 44px 73px",
                borderRadius: "12px",
            }}
            >
                <div className='mt-4'>Discount for {selectedRow.name}</div>
                <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="border rounded p-2 flex-grow"
                />
                <div className='row' style={{ display: 'flex', flexDirection: 'row'}}>
                <div className="mt-6">
                    <button onClick={()=> {
                        setShowDiscountModal(false);
                        setDiscount(0);
                    }}
                className="bg-red-700 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Cancel
                </button>
                </div> 
                <div className="mt-6">
                  <button onClick={handleAddDiscount} className="bg-[#ff6700] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add Discount
                </button>
                </div> 

                </div>
            </Modal>
            <Modal
            open={showManualModal}
            closable={false}
            footer={null}
            centered
            onCancel={() => {
                setShowManualModal(false);
            }}
            bodyStyle={{
                padding: "23px 73px 44px 73px",
                borderRadius: "12px",
            }}
            >
                <div className='my-4'>Manual payments</div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border rounded p-2 flex-grow"
                />
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                <div className="mt-6">
                    <button onClick={()=> {
                        setShowManualModal(false);
                        setAmount(0);
                    }}
                className="bg-red-700 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Cancel
                </button>
                </div> 
                <div className="mt-6">
                  <button onClick={handleManualPayment} className="bg-[#ff6700] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Pay
                </button>
                </div> 

                </div>
            </Modal>
            <div className="flex justify-end items-center mb-4">
                <button
                    onClick={() => {
                        setReload(!reload);
                        setCurrentPage(1);
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Refresh
                </button>
            </div>
        <h2 className="text-2xl font-bold mb-4">Reservation Records</h2>
        <div className="mb-4 flex space-x-2">
                <input
                    type="text"
                    placeholder={`Search by ${searchType === 'id' ? 'ID' : 'Email'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded p-2 flex-grow"
                />
                <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="border rounded p-2"
                >
                    <option value="id">ID</option>
                    <option value="email">Email</option>
                </select>
            </div>

        <div className="overflow-x-auto"> {/* Added for horizontal scrolling on smaller screens */}
            <table className="min-w-full border border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        {/* <th className="border p-2">ID</th> */}
                        <th className="border p-2">Booking ID</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Amount</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Booking Status</th>
                        <th className="border p-2">Discount</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Phone</th>
                        <th className="border p-2">Room Types</th>
                        <th className="border p-2">Check-in</th>
                        <th className="border p-2">Check-out</th>
                        <th className="border p-2">Guests</th>
                        <th className="border p-2">Special Requests</th>
                        <th className="border p-2">Payment Method ID</th>
                        <th className="border p-2">Action</th>

                        {/* Add more columns as needed */}
                    </tr>
                </thead>
                <tbody>
                    {currentReservations.length > 0 && currentReservations?.map((reservation) => (
                        console.log('reservation', JSON.stringify(reservation.room_types)),
                        <tr key={reservation.id}>
                            {/* <td className="border p-2">{reservation.id}</td> */}
                            <td className="border p-2">{reservation.booking_id}</td>
                            <td className="border p-2">{reservation.name}</td>
                            <td className="border p-2">{reservation.amount}</td>
                            <td className="border p-2">{reservation.status}</td>
                            <td className="border p-2">{reservation.booking_status}</td>
                            <td className="border p-2">{reservation.discount}</td>
                            <td className="border p-2">{reservation.email}</td>
                            <td className="border p-2">{reservation.phone}</td>
                            <td className="border p-2">{showOn ? reservation?.room_types?.join(', ') : JSON.parse(reservation?.room_types)?.join(', ')}</td> {/*Display room types as a comma-separated string*/}
                            <td className="border p-2">{formatDate(reservation.check_in)}</td>
                            <td className="border p-2">{formatDate(reservation.check_out)}</td>
                            <td className="border p-2">{reservation.guests}</td>
                            <td className="border p-2">{reservation.special_requests}</td>
                            <td className="border p-2">{reservation.payment_method_id}</td>
                            <td className="border p-2"><AntDropdown
                                dropDownOptions={dropDownOptions}
                                handleDropdownAction={(item) => handleDropdownAction(item, reservation)}
                                userId={reservation}
                                isArrow
                                /></td>
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

export default ReservationRecords;