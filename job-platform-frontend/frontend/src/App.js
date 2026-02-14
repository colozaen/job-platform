import { useEffect, useState } from "react";

function App() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/jobs`)
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.log("Failed to fetch", err));
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>JOB PLATFORM</h1>
      <h2>Available Jobs</h2>

      {jobs.length === 0 ? (
        <p>Loading jobs...</p>
      ) : (
        <ul>
          {jobs.map(job => (
            <li key={job.id}>{job.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;