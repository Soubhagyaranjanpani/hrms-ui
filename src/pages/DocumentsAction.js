import React from "react";
import {
  FaDownload,
  FaPrint,
  FaFileAlt,
  FaArrowLeft,
} from "react-icons/fa";

const DocumentActions = ({
  documentName = "",
  documentData = null,
  onGenerate = null,
  onBack = null,
  title = "Document",
  generateLabel = "Generate",
  themeColor = "#9d174d",
}) => {
  // Print
  const handlePrint = () => {
  if (!documentData) {
    alert("Please generate the document first.");
    return;
  }

  window.open(documentData, "_blank");
};
 const handleDownload = () => {
  if (!documentData) {
    alert("Please generate the document first.");
    return;
  }

  const link = document.createElement("a");
  link.href = documentData;
  link.download = documentName || "document.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    transition: "all .25s ease",
    boxShadow: "0 3px 10px rgba(0,0,0,.15)",
  };

 
   return (
  <div
    style={{
      width: "100%",
      minHeight: "100vh",
      background: "#ffffff",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Header */}
    <div
      style={{
        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
        padding: "18px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FaFileAlt size={20} />
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,.15)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.3)",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <FaArrowLeft />
          Back
        </button>
      )}
    </div>

    {/* Action Buttons */}
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "18px 30px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
     <button
  onClick={() => onGenerate && onGenerate()}
  style={{
    ...buttonStyle,
    background: "#f59e0b",
  }}
>
  <FaFileAlt />
  {generateLabel}
</button>
       
     <button
  onClick={handlePrint}
  style={{
    ...buttonStyle,
    background: "#2563eb",
  }}
>
  <FaPrint />
  Print
</button>

     <button
  onClick={handleDownload}
  style={{
    ...buttonStyle,
    background: "#16a34a",
  }}
>
  <FaDownload />
  Download
</button>
    </div>

    {/* White Content Area */}
    <div
      style={{
        flex: 1,
        background: "#ffffff",
      }}
    />
  </div>
  );
};

export default DocumentActions;