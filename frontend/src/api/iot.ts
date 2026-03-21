// Simulated Google Fit Data

export const getSimulatedHealthData = () => {
  return {
    heartRate: Math.floor(70 + Math.random() * 20),
    steps: Math.floor(3000 + Math.random() * 5000),
    oxygen: Math.floor(95 + Math.random() * 4),
    bloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 10)}`
  };
};