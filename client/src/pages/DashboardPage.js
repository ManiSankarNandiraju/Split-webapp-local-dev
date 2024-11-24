import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([{ name: '', phone: '' }]);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const [balances, setBalances] = useState({});
  const userPhone = localStorage.getItem('userPhone'); // Assuming phone is stored after login

  useEffect(() => {
    const fetchUserGroups = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert('User not logged in');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/groups/all/${user.id}`);
        if (response.data.success) {
          setGroups(response.data.groups);
        }
      } catch (error) {
        console.error('Error fetching groups', error);
      }
    };

    fetchUserGroups();
  }, [navigate]);

useEffect(() => {
  const fetchGroups = async () => {
    const user = JSON.parse(localStorage.getItem('user')); // Get the user data from localStorage (or context)
    if (!user) {
      alert('User not logged in');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/groups/all/${user.id}`);
      if (response.data.success) {
        setGroups(response.data.groups); // Update state with fetched groups
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  fetchGroups();
}, [navigate]);

useEffect(() => {
  const fetchUserBalances = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/expenses/user-balance/${userPhone}`);
      setBalances(response.data.balances);
    } catch (error) {
      console.error('Error fetching user balances', error);
    }
  };

  fetchUserBalances();
}, [userPhone]);
  

  const handleGroupChange = (index, event) => {
    const values = [...members];
    values[index][event.target.name] = event.target.value;
    setMembers(values);
  };

  const handleAddMember = () => {
    setMembers([...members, { name: '', phone: '' }]);
  };

  const handleRemoveMember = (index) => {
    const values = [...members];
    values.splice(index, 1);
    setMembers(values);
  };

  const handleCreateGroup = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert('User not logged in');
        return;
      }
  
      // Add logged-in user as a member and creator
      const response = await axios.post('http://localhost:5000/api/groups/create', {
        name: groupName,
        members: [...members, { _id: user.id, name: user.username, phone: user.phone }],
        createdBy: { _id: user.id, name: user.username, email: user.email },
      });
  
      if (response.data.success) {
        // Clear form inputs
        setGroupName('');
        setMembers([{ name: '', phone: '' }]);
  
        // Fetch the updated list of groups
        const groupsResponse = await axios.get(`http://localhost:5000/api/groups/all/${user.id}`);
        if (groupsResponse.data.success) {
          setGroups(groupsResponse.data.groups); // Update the state with new groups
        }
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  
  

  return (
    <div>
      <h2>Welcome to the Dashboard</h2>
      <div>
      <h2>Your Balances</h2>
      {Object.keys(balances).length > 0 ? (
        <ul>
          {Object.entries(balances).map(([phone, balance]) => (
            <li key={phone}>
              {phone}: {balance > 0 ? `You owe ₹${balance}` : `You are owed ₹${-balance}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No balances to show</p>
      )}
    </div>
      <div>
        <h3>Create New Group</h3>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <h4>Members</h4>
        {members.map((member, index) => (
          <div key={index}>
            <input
              type="text"
              name="name"
              placeholder="Member Name"
              value={member.name}
              onChange={(e) => handleGroupChange(index, e)}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={member.phone}
              onChange={(e) => handleGroupChange(index, e)}
            />
            {members.length > 1 && (
              <button onClick={() => handleRemoveMember(index)}>Remove Member</button>
            )}
          </div>
        ))}
        <button onClick={handleAddMember}>Add Another Member</button>
        <button onClick={handleCreateGroup}>Create Group</button>
      </div>

      <div>
        <h3>Your Groups</h3>
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group._id}>
              <h4>{group.name}</h4>
              <p><strong>Members:</strong></p>
              <ul>
                {group.members.map((member, index) => (
                  <li key={index}>{member.name} - {member.phone}</li>
                ))}
              </ul>
              <p><em>Created on: {new Date(group.createdAt).toLocaleString()}</em></p>
              <button onClick={() => navigate(`/group/${group._id}`)}>Go to Group</button>
            </div>
          ))
        ) : (
          <p>You are not part of any groups yet.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
