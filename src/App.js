import React, { useState } from "react";
import "./App.css";
import SpfRecord from "./components/SpfRecord";

function App() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [spfRecords, setSpfRecords] = useState([]);
  const [error, setError] = useState("");

  const checkSPF = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain name.");
      return;
    }

    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setError("Please enter a valid domain name.");
      return;
    }

    setLoading(true);
    setError("");
    setSpfRecords([]);

    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`
      );
      const data = await response.json();
      // console.log(data);

      if (data.Status !== 0) {
        throw new Error("Domain not found or DNS error.");
      }
      let txtRecords = [];

      if (data.Answer) {
        txtRecords = data.Answer.map(function (ans) {
          return ans.data.replace(/"/g, "");
        });
      }
      // console.log(txtRecords);
      const spf = txtRecords.filter((record) => record.startsWith("v=spf1"));

      if (spf.length === 0) {
        setError("No SPF record found.");
      } else {
        setSpfRecords(spf);
      }
    } catch (err) {
      setError(
        "Failed to fetch DNS records."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    checkSPF();
  };

  const clearResults = () => {
    setDomain("");
    setSpfRecords([]);
    setError("");
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SPF Checker</h1>
        <p>Enter a domain to check SPF</p>
      </header>
      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., example.com"
            className="domain-input"
          />
          <button type="submit" disabled={loading} className="check-button">
            {loading ? "Checking..." : "Check SPF"}
          </button>
          <button type="button" onClick={clearResults} className="clear-button">
            Clear
          </button>
        </div>
      </form>
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Fetching DNS records...
        </div>
      )}
      {error && (
        <div className="error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      {spfRecords.length > 0 && (
        <div className="results">
          <h2>SPF Records Found ({spfRecords.length})</h2>
          <ul className="spf-list">
            {spfRecords.map((record, index) => (
              <li key={index} className="spf-item">
                <SpfRecord record={record} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
