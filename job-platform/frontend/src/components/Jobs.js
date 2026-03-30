import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function Jobs({ token }) {
  const [jobs, setJobs] = useState([]);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Load jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch(`${API_URL}/jobs`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch comments for a job
  async function fetchComments(jobId) {
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/comments`);
      const data = await res.json();
      setComments((prev) => ({ ...prev, [jobId]: data }));
    } catch (err) {
      console.error(err);
    }
  }

  // Post job
  async function handlePostJob(e) {
    e.preventDefault();
    if (!token) return alert("Login required");

    const res = await fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });

    const newJob = await res.json();
    setJobs([newJob, ...jobs]);
    setTitle("");
    setDescription("");
  }

  // Post comment
  async function handlePostComment(jobId) {
    if (!token) return alert("Login required");

    const text = newComments[jobId];
    if (!text) return;

    const res = await fetch(`${API_URL}/jobs/${jobId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    const comment = await res.json();

    setComments((prev) => ({
      ...prev,
      [jobId]: [...(prev[jobId] || []), comment],
    }));

    setNewComments((prev) => ({ ...prev, [jobId]: "" }));
  }

  return (
    <div>
      <h2>Available Jobs</h2>

      {/* Post Job */}
      <form onSubmit={handlePostJob}>
        <input
          type="text"
          placeholder="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <textarea
          placeholder="Job Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br />
        <button type="submit">Post Job</button>
      </form>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <p>Loading jobs...</p>
      ) : (
        jobs.map((job) => (
          <div key={job._id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h3>{job.title}</h3>
            <p>{job.description}</p>

            {/* Load comments */}
            <button onClick={() => fetchComments(job._id)}>
              Show Comments
            </button>

            {/* Comments */}
            <div>
              {(comments[job._id] || []).map((c, index) => (
                <p key={index}>
                  <strong>{c.user?.name || "User"}:</strong> {c.text}
                </p>
              ))}
            </div>

            {/* Add comment */}
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComments[job._id] || ""}
              onChange={(e) =>
                setNewComments({
                  ...newComments,
                  [job._id]: e.target.value,
                })
              }
            />
            <button onClick={() => handlePostComment(job._id)}>
              Comment
            </button>
          </div>
        ))
      )}
    </div>
  );
}