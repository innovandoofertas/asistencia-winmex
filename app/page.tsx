"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sucursal = {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
};

type Empleado = {
  id: string;
  nombre: string;
  telefono: string | null;
  sucursal_id: string;
  pin: string | null;
  rol: string | null;
  sucursales_asistencia: Sucursal | null;
};

function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const rad = (v: number) => (v * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calcularPuntualidad(
  nombreEmpleado: string,
  nombreSucursal: string,
  tipo: "entrada" | "salida"
) {
  const ahora = new Date();
  const dia = ahora.getDay();
  const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes();

  const especialesSabado = ["Poncho", "Juan", "Donovan"];
  const esSabado = dia === 6;
  const esDomingo = dia === 0;
  const esEspecial = especialesSabado.includes(nombreEmpleado);
  const esHidalgo = nombreSucursal.toLowerCase().includes("hidalgo");

  let horaObjetivo = 9 * 60;

  if (esDomingo) return "domingo";

  if (tipo === "entrada") {
    if (esHidalgo) {
      horaObjetivo = esSabado ? 10 * 60 : 9 * 60;
    } else {
      horaObjetivo = esSabado ? (esEspecial ? 9 * 60 : 10 * 60) : 9 * 60;
    }

    if (totalMinutos <= horaObjetivo) return "puntual";
    if (totalMinutos <= horaObjetivo + 15) return "retardo";
    return "retardo_grave";
  }

  if (tipo === "salida") {
    if (esHidalgo) {
      horaObjetivo = esSabado ? 15 * 60 : 17 * 60;
    } else {
      horaObjetivo = esSabado ? (esEspecial ? 14 * 60 : 15 * 60) : 18 * 60;
    }

    if (totalMinutos < horaObjetivo) return "salida_anticipada";
    return "salida_correcta";
  }

  return null;
}

function mensajePuntualidad(puntualidad: string | null) {
  if (puntualidad === "puntual") return "✅ Puntual";
  if (puntualidad === "retardo") return "⏰ Retardo";
  if (puntualidad === "retardo_grave") return "🚨 Retardo grave";
  if (puntualidad === "salida_correcta") return "✅ Salida correcta";
  if (puntualidad === "salida_anticipada") return "⚠️ Salida anticipada";
  if (puntualidad === "domingo") return "📅 Registro en domingo";
  return "";
}

function esMismoDia(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-MX") === new Date().toLocaleDateString("es-MX");
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoId, setEmpleadoId] = useState("");
  const [pin, setPin] = useState("");
  const [empleadoLogueado, setEmpleadoLogueado] = useState<Empleado | null>(null);
  const [mensaje, setMensaje] = useState("Cargando empleados...");
  const [cargando, setCargando] = useState(false);

  const [pantallaLista, setPantallaLista] = useState(false);
  const [tituloListo, setTituloListo] = useState("");
  const [detalleListo, setDetalleListo] = useState("");

  useEffect(() => {
    cargarEmpleados();
    iniciarCamara();

    const guardado = localStorage.getItem("empleadoWinmexId");
    if (guardado) {
      setEmpleadoId(guardado);
    }
  }, []);

  useEffect(() => {
    if (empleados.length > 0 && empleadoId) {
      const empleado = empleados.find((e) => e.id === empleadoId);
      const sesionActiva = localStorage.getItem("sesionWinmexActiva");

      if (empleado && sesionActiva === "true") {
        setEmpleadoLogueado(empleado);
      }
    }
  }, [empleados, empleadoId]);

  async function cargarEmpleados() {
    const { data, error } = await supabase
      .from("empleados_asistencia")
      .select(`
        id,
        nombre,
        telefono,
        sucursal_id,
        pin,
        rol,
        sucursales_asistencia (
          id,
          nombre,
          latitud,
          longitud,
          radio_metros
        )
      `)
      .eq("activo", true)
      .order("nombre");

    if (error) {
      console.error(error);
      setMensaje("Error al cargar empleados.");
      return;
    }

    setEmpleados((data || []) as unknown as Empleado[]);
    setMensaje("");
  }

  function iniciarSesion() {
    const empleado = empleados.find((e) => e.id === empleadoId);

    if (!empleado) {
      setMensaje("Selecciona tu nombre.");
      return;
    }

    if (!pin.trim()) {
      setMensaje("Escribe tu PIN.");
      return;
    }

    if (empleado.pin !== pin.trim()) {
      setMensaje("PIN incorrecto. Intenta de nuevo.");
      return;
    }

    setEmpleadoLogueado(empleado);
    localStorage.setItem("empleadoWinmexId", empleado.id);
    localStorage.setItem("sesionWinmexActiva", "true");
    setMensaje(`Bienvenido, ${empleado.nombre}.`);
  }

  function cerrarSesion() {
    setEmpleadoLogueado(null);
    setPin("");
    localStorage.removeItem("sesionWinmexActiva");
    setMensaje("Sesión cerrada.");
  }

  function sacarEmpleadoConMensaje(titulo: string, detalle: string) {
    setTituloListo(titulo);
    setDetalleListo(detalle);
    setPantallaLista(true);

    localStorage.removeItem("sesionWinmexActiva");

    setTimeout(() => {
      setPantallaLista(false);
      setEmpleadoLogueado(null);
      setPin("");
      setMensaje("Selecciona tu nombre e inicia sesión.");
    }, 2500);
  }

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo abrir la cámara. Revisa permisos.");
    }
  }

  function obtenerGPS(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  async function tomarYSubirSelfie(empleadoId: string) {
    const video = videoRef.current;

    if (!video) {
      throw new Error("No hay cámara activa.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No se pudo preparar la selfie.");
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (archivo) => {
          if (!archivo) {
            reject(new Error("No se pudo capturar la selfie."));
            return;
          }

          resolve(archivo);
        },
        "image/jpeg",
        0.85
      );
    });

    const nombreArchivo = `${empleadoId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from("selfies-asistencia")
      .upload(nombreArchivo, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("selfies-asistencia")
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

  async function yaRegistroHoy(empleadoId: string, tipo: "entrada" | "salida") {
    const { data, error } = await supabase
      .from("asistencias")
      .select("id, created_at")
      .eq("empleado_id", empleadoId)
      .eq("tipo", tipo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      throw new Error("No se pudo validar el registro del día.");
    }

    return (data || []).some((registro) => esMismoDia(registro.created_at));
  }

  async function registrar(tipo: "entrada" | "salida") {
    try {
      setCargando(true);
      setMensaje("📍 Validando registro del día...");

      const empleado = empleadoLogueado;

      if (!empleado) {
        setMensaje("Primero inicia sesión con tu PIN.");
        return;
      }

      const yaExiste = await yaRegistroHoy(empleado.id, tipo);

      if (yaExiste) {
        sacarEmpleadoConMensaje(
          "⚠️ Ya registrado",
          `Ya tienes una ${tipo} registrada el día de hoy.`
        );
        return;
      }

      setMensaje("📍 Obteniendo ubicación y tomando selfie...");

      const sucursal = empleado.sucursales_asistencia;

      if (!sucursal) {
        setMensaje("Este empleado no tiene sucursal asignada.");
        return;
      }

      const posicion = await obtenerGPS();

      const latitud = posicion.coords.latitude;
      const longitud = posicion.coords.longitude;

      const distancia = calcularDistanciaMetros(
        latitud,
        longitud,
        sucursal.latitud,
        sucursal.longitud
      );

      const dentroDeZona = distancia <= sucursal.radio_metros;
      const fotoUrl = await tomarYSubirSelfie(empleado.id);

      const puntualidad = calcularPuntualidad(
        empleado.nombre,
        sucursal.nombre,
        tipo
      );

      const { error } = await supabase.from("asistencias").insert({
        empleado_id: empleado.id,
        sucursal_id: sucursal.id,
        tipo,
        latitud,
        longitud,
        distancia_metros: distancia,
        foto_url: fotoUrl,
        estado: dentroDeZona ? "registrado" : "fuera_de_zona",
        puntualidad,
      });

      if (error) {
        console.error(error);
        setMensaje("No se pudo guardar la asistencia.");
        return;
      }

      sacarEmpleadoConMensaje(
        "✅ Listo",
        `${tipo === "entrada" ? "Entrada" : "Salida"} registrada correctamente. ${mensajePuntualidad(
          puntualidad
        )}.`
      );
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo registrar. Revisa permisos de cámara y GPS.");
    } finally {
      setCargando(false);
    }
  }

  const empleadoSeleccionado = empleados.find((e) => e.id === empleadoId);

  if (pantallaLista) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #16a34a, #0f172a)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 25,
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <section
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.35)",
            borderRadius: 28,
            padding: 35,
            maxWidth: 420,
            width: "100%",
            boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ fontSize: 82, marginBottom: 15 }}>✅</div>

          <h1 style={{ fontSize: 42, margin: "0 0 12px 0" }}>
            {tituloListo}
          </h1>

          <p style={{ fontSize: 20, lineHeight: 1.4 }}>{detalleListo}</p>

          <p style={{ marginTop: 22, opacity: 0.85 }}>
            Cerrando sesión automáticamente...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #dc2626 100%)",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <section
          style={{ textAlign: "center", marginBottom: 18, paddingTop: 10 }}
        >
          <h1
            style={{
              fontSize: 34,
              margin: 0,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            Asistencia Winmex
          </h1>

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "#e2e8f0",
              fontSize: 15,
            }}
          >
            GPS + Selfie + Sucursal
          </p>
        </section>

        <section
          style={{
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          }}
        >
          {!empleadoLogueado && (
            <>
              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                Empleado
              </label>

              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                style={{
                  padding: 14,
                  width: "100%",
                  fontSize: 17,
                  borderRadius: 12,
                  border: "2px solid #cbd5e1",
                  color: "#000000",
                  background: "#ffffff",
                  marginBottom: 14,
                }}
              >
                <option value="">Selecciona empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre}
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: "block",
                  fontWeight: "bold",
                  marginBottom: 8,
                  fontSize: 15,
                }}
              >
                PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Escribe tu PIN"
                style={{
                  padding: 14,
                  width: "100%",
                  fontSize: 20,
                  borderRadius: 12,
                  border: "2px solid #cbd5e1",
                  color: "#000000",
                  background: "#ffffff",
                  marginBottom: 16,
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: 4,
                }}
              />

              <button
                onClick={iniciarSesion}
                style={{
                  width: "100%",
                  padding: 16,
                  fontSize: 18,
                  borderRadius: 14,
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🔐 Iniciar sesión
              </button>

              {empleadoSeleccionado && (
                <p
                  style={{
                    marginTop: 14,
                    textAlign: "center",
                    color: "#475569",
                  }}
                >
                  Usuario seleccionado: <b>{empleadoSeleccionado.nombre}</b>
                </p>
              )}
            </>
          )}

          {empleadoLogueado && (
            <>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <p style={{ margin: "0 0 8px 0", fontSize: 16 }}>
                  👤 Empleado: <b>{empleadoLogueado.nombre}</b>
                </p>

                <p style={{ margin: 0, fontSize: 16 }}>
                  🏢 Sucursal:{" "}
                  <b>
                    {empleadoLogueado.sucursales_asistencia?.nombre ||
                      "Sin sucursal"}
                  </b>
                </p>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#111827",
                  border: "4px solid #0f172a",
                  marginBottom: 18,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    display: "block",
                    minHeight: 260,
                    objectFit: "cover",
                  }}
                />
              </div>

              <button
                onClick={() => registrar("entrada")}
                disabled={cargando}
                style={{
                  width: "100%",
                  padding: 16,
                  marginTop: 5,
                  fontSize: 18,
                  borderRadius: 14,
                  border: "none",
                  background: cargando ? "#94a3b8" : "#16a34a",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: cargando ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 16px rgba(22,163,74,0.35)",
                }}
              >
                ✅ Registrar entrada
              </button>

              <button
                onClick={() => registrar("salida")}
                disabled={cargando}
                style={{
                  width: "100%",
                  padding: 16,
                  marginTop: 12,
                  fontSize: 18,
                  borderRadius: 14,
                  border: "none",
                  background: cargando ? "#94a3b8" : "#dc2626",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: cargando ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 16px rgba(220,38,38,0.35)",
                }}
              >
                🚪 Registrar salida
              </button>

              <button
                onClick={cerrarSesion}
                disabled={cargando}
                style={{
                  width: "100%",
                  padding: 13,
                  marginTop: 12,
                  fontSize: 16,
                  borderRadius: 14,
                  border: "none",
                  background: "#334155",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </>
          )}

          {mensaje && (
            <div
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                background: mensaje.includes("registrada")
                  ? "#dcfce7"
                  : mensaje.includes("incorrecto") ||
                    mensaje.includes("No se pudo") ||
                    mensaje.includes("Error") ||
                    mensaje.includes("Ya tienes")
                  ? "#fee2e2"
                  : "#e0f2fe",
                color: mensaje.includes("registrada")
                  ? "#166534"
                  : mensaje.includes("incorrecto") ||
                    mensaje.includes("No se pudo") ||
                    mensaje.includes("Error") ||
                    mensaje.includes("Ya tienes")
                  ? "#991b1b"
                  : "#075985",
                fontWeight: "bold",
                lineHeight: 1.4,
              }}
            >
              {mensaje}
            </div>
          )}
        </section>

        <p
          style={{
            textAlign: "center",
            color: "#e2e8f0",
            fontSize: 12,
            marginTop: 16,
          }}
        >
          Permite cámara y ubicación para registrar asistencia.
        </p>
      </div>
    </main>
  );
}