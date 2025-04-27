import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Invoice = () => {
    const [invoice, setInvoice] = useState({
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        customerAddress: '',
        items: [{ id: uuidv4(), description: '', quantity: 1, unitPrice: 0 }],
        notes: '',
    });

    const handleChange = (e) => {
        setInvoice({ ...invoice, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, e) => {
        const updatedItems = [...invoice.items];
        updatedItems[index][e.target.name] = e.target.value;
        setInvoice({ ...invoice, items: updatedItems });
    };

    const addItem = () => {
        setInvoice({
            ...invoice,
            items: [...invoice.items, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0 }],
        });
    };

    const removeItem = (index) => {
        const updatedItems = [...invoice.items];
        updatedItems.splice(index, 1);
        setInvoice({ ...invoice, items: updatedItems });
    };

    const calculateTotal = () => {
        return invoice.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        doc.text(`Invoice #${invoice.id}`, 10, 10);
        doc.text(`Date: ${invoice.date}`, 10, 20);
        doc.text(`Customer: ${invoice.customerName}`, 10, 30);
        doc.text(`Address: ${invoice.customerAddress}`, 10, 40);

        const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
        const tableRows = invoice.items.map(item => [item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice]);

        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 50 });

        const total = calculateTotal();
        doc.text(`Total: $${total}`, 10, doc.lastAutoTable.finalY + 10);
        doc.text(`Notes: ${invoice.notes}`, 10, doc.lastAutoTable.finalY + 20);

        doc.save(`invoice_${invoice.id}.pdf`);
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Create Invoice</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                    <label htmlFor="date" className="block text-gray-700 font-bold mb-2">Date:</label>
                    <input type="date" id="date" name="date" value={invoice.date} onChange={handleChange} className="border rounded w-full py-2 px-3" />
                </div>
                <div className="mb-4">
                    <label htmlFor="customerName" className="block text-gray-700 font-bold mb-2">Customer Name:</label>
                    <input type="text" id="customerName" name="customerName" value={invoice.customerName} onChange={handleChange} className="border rounded w-full py-2 px-3" />
                </div>
                <div className="mb-4">
                    <label htmlFor="customerAddress" className="block text-gray-700 font-bold mb-2">Customer Address:</label>
                    <textarea id="customerAddress" name="customerAddress" value={invoice.customerAddress} onChange={handleChange} className="border rounded w-full py-2 px-3"></textarea>
                </div>

                <h3 className="text-lg font-semibold mb-2">Items:</h3>
                {invoice.items.map((item, index) => (
                    <div key={item.id} className="mb-4 border rounded p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor={`description-${index}`} className="block text-gray-700 font-bold mb-2">Description:</label>
                                <input type="text" id={`description-${index}`} name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} className="border rounded w-full py-2 px-3" />
                            </div>
                            <div>
                                <label htmlFor={`quantity-${index}`} className="block text-gray-700 font-bold mb-2">Quantity:</label>
                                <input type="number" id={`quantity-${index}`} name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} className="border rounded w-full py-2 px-3" />
                            </div>
                            <div>
                                <label htmlFor={`unitPrice-${index}`} className="block text-gray-700 font-bold mb-2">Unit Price:</label>
                                <input type="number" id={`unitPrice-${index}`} name="unitPrice" value={item.unitPrice} onChange={(e) => handleItemChange(index, e)} className="border rounded w-full py-2 px-3" />
                            </div>
                        </div>
                        <button type="button" onClick={() => removeItem(index)} className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addItem} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Add Item</button>

                <div className="mt-4">
                    <label htmlFor="notes" className="block text-gray-700 font-bold mb-2">Notes:</label>
                    <textarea id="notes" name="notes" value={invoice.notes} onChange={handleChange} className="border rounded w-full py-2 px-3"></textarea>
                </div>

                <div className="mt-6">
                    <p className="text-lg font-bold">Total: ${calculateTotal()}</p>
                    <button onClick={generatePDF} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Generate PDF</button>
                </div>
            </div>
        </div>
    );
};

export default Invoice;