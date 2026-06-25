export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: `
          linear-gradient(
            rgba(15,23,42,0.82),
            rgba(15,23,42,0.82)
          ),
          url('/banner-admin.png')
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <section>
        <img
          src="/icon-192.png"
          alt="Winmex"
          style={{
            width: 110,
            height: 110,
            borderRadius: 24,
            marginBottom: 18,
            boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
          }}
        />

        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>
          Asistencia Winmex
        </h1>

        <p style={{ color: "#facc15", fontWeight: "bold" }}>
          Cargando sistema...
        </p>
      </section>
    </main>
  );
}