import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { baseUrl } from '../helpers/https';
import axios from 'axios';

const RoomList = ({onModify }) => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [reload, setReload] = useState(false);

    const handleModifyClick = (room) => {
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedRoom(null);
        setIsModalOpen(false);
    };

    const handleSaveChanges = async () => {
    // return console.log('save changes', selectedRoom);
        if (selectedRoom) {
              
                try {
                    // showLoader();
                const res = await axios.put(`${baseUrl}/rooms/${selectedRoom?.id}`, selectedRoom);
        
                if(res?.data?.status) {

                    setReload(!reload);
                    Swal.fire('done', 'Room modified successfully', 'success');
                    setSelectedRoom(null);
                    setIsModalOpen(false);
                }
            }catch(e){
                console.log(e)
            } finally{
                // hideLoader();
            }

        }
        setReload(!reload);
        handleCloseModal();
    };

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
      }, [online, reload]);
    
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
              setRooms(rooms)
          } catch (error) {
              console.error("Error fetching rooms offline:", error);
          }
      }
    return (
        <div>
            <h1>Room List</h1>
            <table className="table">
                <thead>
                    <tr>
                        {/* <th>Image</th> */}
                        <th>Name</th>
                        <th>Price</th>
                        <th>Description</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map((room) => (
                        <tr key={room.id}>
                            {/* <td>
                                <img src={room.image} alt={room.name} className="room-image" style={{ width: '100px' }} />
                            </td> */}
                            <td>{room.name}</td>
                            <td>NGN{room.price}</td>
                            <td>{room.description}</td>
                            <td>
                                <button
                                    className="bg-[#A86A00] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => handleModifyClick(room)}>Modify</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <Modal
                    title={`Modify Room ${selectedRoom.name}`}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    // width={600}
                    // style={{ top: 20 }}
                >
                <div className="modal-overlay" onClick={handleCloseModal} />
                <div className='card' >
                    <div>
                        <label className='m-2'>
                            Name:
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md" 
                                value={selectedRoom.name}
                                onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
                            />
                        </label>
                        <label className='m-2'>
                            Price:
                            <input
                                type="number"
                                className="w-full p-2 border rounded-md" 
                                value={selectedRoom.price}
                                onChange={(e) => setSelectedRoom({ ...selectedRoom, price: e.target.value })}
                            />
                        </label>
                        <label className='m-2'>
                            Description:
                            <textarea
                                value={selectedRoom.description}
                                className="w-full p-2 border rounded-md" 
                                style={{ height: '100px' }}
                                onChange={(e) => setSelectedRoom({ ...selectedRoom, description: e.target.value })}
                            />
                        </label>
                        <div className="modal-actions">
                            <button
                                className="m-2 bg-[#A86A00] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={handleSaveChanges}>Save</button>
                            <button 
                            className="m-2 bg-[#ff0000] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={handleCloseModal}>Cancel</button>
                        </div>
                    </div>
                </div>
                </Modal>
            )}
        </div>
    );
};

export default RoomList;