// src/api.js

export const fetchDashboardData = async (commodity = 'onion') => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const response = await fetch(`http://localhost:8000/api/dashboard-data?commodity=${commodity}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard data from backend API:", error);
    throw error;
  }
};
