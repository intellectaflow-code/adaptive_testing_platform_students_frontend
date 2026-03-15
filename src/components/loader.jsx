export default function Loader() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(12,14,20,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 500
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "4px solid var(--border2)",
        borderTop: "4px solid var(--amber)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}