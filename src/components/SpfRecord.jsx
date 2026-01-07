import React, { useState } from 'react';

function SpfRecord({ record }) {
    const [expanded, setExpanded] = useState({});

    const parseSPF = (spf) => {
        const parts = spf.split(' ');
        return parts.map((part, index) => {
            if (part.startsWith('include:') || part.startsWith('redirect=')) {
                const domain = part.split(':')[1] || part.split('=')[1];
                const key = `${index}-${domain}`;
                return (
                    <span key={index} className="spf-mechanism">
                        <span
                            className="expandable"
                            onClick={() => toggleExpand(key, domain)}
                        >
                            {part} {expanded[key] ? '▼' : '▶'}
                        </span>
                        {expanded[key] && (
                            <div className="expanded">
                                {typeof expanded[key] === 'string' ? (
                                    <div className="nested-record">{expanded[key]}</div>
                                ) : (
                                    <SpfRecord record={expanded[key]} />
                                )}
                            </div>
                        )}
                    </span>
                );
            }
            return <span key={index} className="spf-part">{part} </span>;
        });
    };

    const toggleExpand = async (key, domain) => {
        if (expanded[key]) {
            setExpanded(prev => ({ ...prev, [key]: null }));
            return;
        }

        setExpanded(prev => ({ ...prev, [key]: 'Loading...' }));

        try {
            const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`);
            const data = await response.json();
            let txtRecords = [];

            if (data.Answer) {
                txtRecords = data.Answer.map(function (ans) {
                    return ans.data.replace(/"/g, "");
                });
            }
            const spf = txtRecords.find(record => record.startsWith('v=spf1'));
            setExpanded(prev => ({ ...prev, [key]: spf || 'No SPF record found.' }));
        } catch (err) {
            setExpanded(prev => ({ ...prev, [key]: 'Failed to fetch.' }));
        }
    };

    return (
        <div className="spf-record">
            {parseSPF(record)}
        </div>
    );
}

export default SpfRecord;