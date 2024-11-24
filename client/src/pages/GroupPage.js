import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isSettlingUp, setIsSettlingUp] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitAmong: [],
    splitType: 'equal',
    splitDetails: {},
  });
  const [settleDetails, setSettleDetails] = useState({
    to: '',
    amount: '',
  });

  // Fetch group details, expenses, and balances
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const groupResponse = await axios.get(`http://localhost:5000/api/groups/${groupId}`);
        setGroup(groupResponse.data.group);

        const expenseResponse = await axios.get(`http://localhost:5000/api/expenses/group-expenses/${groupId}`);
        setExpenses(expenseResponse.data.expenses);

        // Assuming you have a way to get the user's phone, otherwise you'd need to use context or authentication
        const userPhone = 'user_phone_here';  // Replace with dynamic phone number

        const balanceResponse = await axios.get(`http://localhost:5000/api/expenses/user-balance/${userPhone}`);
        setBalances(balanceResponse.data.balances);

      } catch (error) {
        console.error('Error fetching group data', error);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleAddExpense = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/expenses/add-expense', {
        groupId,
        description: newExpense.description,
        amount: newExpense.amount,
        paidBy: newExpense.paidBy,
        splitBetween: newExpense.splitAmong.map(phone => {
          // Ensure member exists before accessing name
          const member = group.members.find((m) => m.phone === phone);
          return {
            phone,
            username: member ? member.name : 'Unknown', // Fallback in case member is not found
            amount: newExpense.splitDetails[phone] || 0,  // for unequal split
          };
        }),
        splitType: newExpense.splitType,
      });
  
      if (response.data.success) {
        setExpenses((prevExpenses) => [...prevExpenses, response.data.expense]);
        setIsAddingExpense(false);
        setNewExpense({
          description: '',
          amount: '',
          paidBy: '',
          splitAmong: [],
          splitType: 'equal',
          splitDetails: {},
        });
      } else {
        alert('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense', error);
    }
  };
  

  const handleSettleUp = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/expenses/settle', {
        groupId,
        to: settleDetails.to,
        amount: settleDetails.amount,
      });

      if (response.data.success) {
        setBalances(response.data.updatedBalances);
        setIsSettlingUp(false);
        setSettleDetails({ to: '', amount: '' });
      } else {
        alert('Failed to settle up');
      }
    } catch (error) {
      console.error('Error settling up', error);
    }
  };

  const handleSplitTypeChange = (type) => {
    setNewExpense((prev) => ({
      ...prev,
      splitType: type,
      splitDetails: type === 'unequal' ? {} : null,
    }));
  };

  // Check if group and group.members are loaded before rendering
  if (!group || !group.members) return <div>Loading...</div>;

  return (
    <div>
      <h2>{group.name}</h2>
      <h3>Members</h3>
      <ul>
        {group.members && group.members.map((member) => (
          <li key={member.phone}>
            {member.name} - {member.phone}
          </li>
        ))}
      </ul>

      <h3>Balances</h3>
      {Object.keys(balances).length > 0 ? (
        <ul>
          {Object.entries(balances).map(([phone, balance]) => (
            <li key={phone}>
              {/* Ensure member exists before accessing their name */}
              {group.members.find((m) => m.phone === phone)?.name}:
              {balance > 0 ? ` Owes You ₹${balance}` : ` You Owe ₹${-balance}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No balances yet</p>
      )}

      <h3>Expenses</h3>
      {expenses.length > 0 ? (
        expenses.map((expense) => (
          <div key={expense._id}>
            <p>
              <strong>{expense.description}</strong>
            </p>
            <p>Paid by: {expense.paidBy?.name || 'Unknown'}</p>
            <p>Amount: {expense.amount}</p>
            <p>Split among:</p>
            <ul>
              {(expense.splitDetails || []).map((split) => (
                <li key={split.phone}>
                  {split.name} owes {split.amount}
                </li>
              ))}
            </ul>
          </div>
        ))
        
      ) : (
        <p>No expenses recorded yet</p>
      )}

      {/* Add New Expense Form */}
      <button onClick={() => setIsAddingExpense(!isAddingExpense)}>
        {isAddingExpense ? 'Cancel' : 'Add Expense'}
      </button>
      {isAddingExpense && (
        <div>
          <h3>Add New Expense</h3>
          <input
            type="text"
            placeholder="Description"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          />
          <select
            value={newExpense.paidBy}
            onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
          >
            <option value="">Select Who Paid</option>
            {group.members.map((member) => (
              <option key={member.phone} value={member.phone}>
                {member.name}
              </option>
            ))}
          </select>
          <h4>Select Members to Split</h4>
          {group.members.map((member) => (
            <div key={member.phone}>
              <label>
                <input
                  type="checkbox"
                  value={member.phone}
                  checked={newExpense.splitAmong.includes(member.phone)}
                  onChange={(e) => {
                    const phone = e.target.value;
                    setNewExpense((prev) => ({
                      ...prev,
                      splitAmong: prev.splitAmong.includes(phone)
                        ? prev.splitAmong.filter((p) => p !== phone)
                        : [...prev.splitAmong, phone],
                    }));
                  }}
                />
                {member.name}
              </label>
            </div>
          ))}

          <h4>Split Type</h4>
          <select value={newExpense.splitType} onChange={(e) => handleSplitTypeChange(e.target.value)}>
            <option value="equal">Equal</option>
            <option value="unequal">Unequal</option>
          </select>

          {newExpense.splitType === 'unequal' &&
            newExpense.splitAmong.map((phone) => (
              <div key={phone}>
                <label>
                  {group.members.find((m) => m.phone === phone)?.name}: ₹
                  <input
                    type="number"
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setNewExpense((prev) => ({
                        ...prev,
                        splitDetails: { ...prev.splitDetails, [phone]: amount },
                      }));
                    }}
                  />
                </label>
              </div>
            ))}

          <button onClick={handleAddExpense}>Add Expense</button>
        </div>
      )}

      <button onClick={() => setIsSettlingUp(!isSettlingUp)}>
        {isSettlingUp ? 'Cancel' : 'Settle Up'}
      </button>
      {isSettlingUp && (
        <div>
          <h3>Settle Up</h3>
          <select
            value={settleDetails.to}
            onChange={(e) => setSettleDetails({ ...settleDetails, to: e.target.value })}
          >
            <option value="">Select Member</option>
            {group.members.map((member) => (
              <option key={member.phone} value={member.phone}>
                {member.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={settleDetails.amount}
            onChange={(e) => setSettleDetails({ ...settleDetails, amount: e.target.value })}
          />
          <button onClick={handleSettleUp}>Settle</button>
        </div>
      )}
      
    </div>
  );
}

export default GroupPage;
