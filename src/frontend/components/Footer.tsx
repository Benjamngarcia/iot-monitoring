import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const projectName = "IoT Network Monitor";
  const developerName = "Benjamín García";
  const portfolioUrl = "https://github.com/benjamngarcia";

  return (
    <footer style={{
      padding: "20px",
      backgroundColor: "#f5f5f5",
      borderTop: "1px solid #ddd",
      marginTop: "20px",
      textAlign: "center",
      fontSize: "14px",
      color: "#666"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p style={{ margin: "0" }}>
          {projectName} © {currentYear} | Desarrollado por{" "}
          <a 
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#007bff",
              textDecoration: "none",
              fontWeight: "500"
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}
          >
            {developerName}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
