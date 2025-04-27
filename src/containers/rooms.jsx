import React, { useState, useEffect } from 'react';
import { baseUrl } from '../helpers/https';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [error, setError] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [pendinPay, setPendinPay] = useState(0);

    useEffect(() => {
        function handleOnline() {
            setOnline(true);
            synchronizeData()
        }
        function handleOffline() {
            setOnline(false);
            fetchOfflineRooms()
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (online) {
            synchronizeData()
        } else {
            fetchOfflineRooms()
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [online]);

    const synchronizeData = async () => {
        try {
            const response = await fetch(`${baseUrl}/rooms`);
            const onlineRooms = await response.json();
            setRooms(onlineRooms);
            const result = await window.electronAPI.saveRoomsOffline(onlineRooms)
            if(!result.success) console.error(result.error)
        } catch (error) {
            console.error('Error fetching rooms:', error);
            fetchOfflineRooms()
        }
    }

    const fetchOfflineRooms = async () => {
        try {
            const rooms = await window.electronAPI.getRoomsOffline()
            console.log('offf', rooms);
            // alert(JSON.stringify(rooms));
            setRooms(rooms)
        } catch (error) {
            console.error("Error fetching rooms offline:", error);
        }
    }

    useEffect(() => {
        if (!checkIn || !checkOut) return;
        const fetchRooms = async () => {
            try {
                const response = await fetch(`${baseUrl}/rooms/${checkIn}/${checkOut}`);
                const data = await response.json();
                setAvailableRooms(data.data);
                setPendinPay(data.pendPayment);
                console.log({ data });
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };

        fetchRooms();
    }, [checkIn, checkOut]);
    return (
       <>
       <h1>rooms Availability check</h1>
       <div className="mb-4">
          <div className="form-group">
            <h2 className='text-lg font-semibold mb-2' htmlFor="checkIn">Check-in Date:</h2>
            <input
                type="date"
                id="checkIn"
                name="checkIn"
                className='w-full p-2 border rounded-md'
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value)
                }}
                required
                min={new Date().toISOString().split('T')[0]} // Disable past dates
                // disabled
            />
        </div>
        <div className="mb-4">
            <h2 className='text-lg font-semibold mb-2' htmlFor="checkOut">Check-out Date:</h2>
            <input
                type="date"
                id="checkOut"
                name="checkOut"
                className='w-full p-2 border rounded-md'
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value)
                }}
                required
                min={checkIn || new Date().toISOString().split('T')[0]}
                // disabled
            />
        </div>
          {/* <input type="text" id="date" className="w-full p-2 border rounded-md" defaultValue={new Date().toLocaleDateString()} readOnly /> */}
        <div className="mb-4">
            The following rooms are available between {checkIn} and {checkOut}:
            <ul className="list-disc pl-5">
                {availableRooms?.length >0 && availableRooms?.map((room) => (
                    <li key={room.id} className="mb-2">
                        {room.name} - {room.price} NGN
                    </li>
                ))}
            </ul>
            </div>
            {pendinPay.length > 0 && (
                <div className="mb-4">
                    <h2 className='text-lg font-semibold mb-2'>The following room(s) have been reserved between {checkIn} and {checkOut} but payments is still pending:</h2>
                    <ul className="list-disc pl-5">
                        {pendinPay?.map((room) => (
                            <li key={room.id} className="mb-2">
                                {room.name} - {room.price} NGN
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
       </>
    );
};

export default Rooms;