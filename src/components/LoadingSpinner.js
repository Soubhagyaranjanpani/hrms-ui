import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-core"></div>
      </div>
      <p className="loading-message">{message}</p>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: transparent;
          border-radius: 20px;
        }
        
        .loading-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
        }
        
        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid transparent;
          animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }
        
        .spinner-ring:nth-child(1) {
          border-top-color: #2d9c7c;
          border-right-color: #2d9c7c;
          animation-delay: 0s;
        }
        
        .spinner-ring:nth-child(2) {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-bottom-color: #f4b942;
          border-left-color: #f4b942;
          animation-delay: 0.3s;
        }
        
        .spinner-ring:nth-child(3) {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 30%;
          border-top-color: #e74c3c;
          border-right-color: #e74c3c;
          animation-delay: 0.6s;
        }
        
        .spinner-core {
          position: absolute;
          width: 20%;
          height: 20%;
          top: 40%;
          left: 40%;
          background: linear-gradient(135deg, #2d9c7c, #f4b942);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .loading-message {
          color: var(--text-muted);
          font-size: 16px;
          margin: 0;
          animation: fadeInOut 1.5s ease-in-out infinite;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;