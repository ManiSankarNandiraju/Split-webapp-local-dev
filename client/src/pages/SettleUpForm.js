import { useState } from 'react';
import axios from 'axios';

function SettleUpForm() {
  const [payerPhone, setPayerPhone] = useState('');
  const [payeePhone, setPayeePhone] = useState('');
  const [amount, setAmount] = useState('');

  const handleSettleUp = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/expenses/settle-up', {
        payerPhone,
        payeePhone,
        amount,
      });
      if (response.data.success) {
        alert('Balance settled successfully');
      } else {
        alert('Failed to settle balance');
      }
    } catch (error) {
      console.error('Error settling balances', error);
    }
  };

  return (
    <div>
      <h3>Settle Up</h3>
      <input
        type="text"
        placeholder="Your Phone"
        value={payerPhone}
        onChange={(e) => setPayerPhone(e.target.value)}
      />
      <input
        type="text"
        placeholder="Payee Phone"
        value={payeePhone}
        onChange={(e) => setPayeePhone(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSettleUp}>Settle</button>
    </div>
  );
}

export default SettleUpForm;
